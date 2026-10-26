import { useEffect, useState } from 'react';
import type { Credito } from '../types/Credito';
import type { MetodoPago, Pago } from '../types/Pago';
import RegistrarPagoModal from './RegistrarPagoModal';
import AnularAbonoModal from './AnularAbonoModal';
import { reporteService } from '../services/reporteService';
import { formatoMoneda } from '../utils/formato';
import MoraMovimientoModal from './MoraMovimientoModal';
import { moraService } from '../services/moraService';
import type { ResumenMora, TipoMovimientoMora } from '../types/Mora';
import CobradorCredito from './CobradorCredito';



interface CreditoDetalleModalProps {
  credito: Credito;
  onClose: () => void;
  onPagoRegistrado: () => void;
  // Solo true para el rol ADMIN. El backend lo vuelve a validar (403), esto
  // solo decide si se muestra el botón.
  puedeAnular?: boolean;
}

const TEAL = '#0F766E';
const DANGER = '#B91C1C';
const EPSILON = 0.01; // tolerancia de redondeo para comparar contra cuotaMensual

const ETIQUETAS_METODO: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  DEPOSITO: 'Depósito',
};

interface FilaAmortizacion {
  mes: number;
  cuota: number;
  interes: number;
  capital: number;
  saldo: number;
  fechaVencimiento: string;
  abonos: Pago[];
  totalAbonado: number;
  saldoPendienteCuota: number;
  completa: boolean;
  huboAtraso: boolean;
}

// Un abono = todas las filas de Pago que nacieron de un mismo registro de pago
// (un abono con derrame crea varias). Los pagos anteriores a la migración V2
// no tienen abonoRef, así que cada uno cuenta como un abono de una sola fila.
interface AbonoAgrupado {
  clave: string;
  pagoId: number; // id de la primera fila: sirve para ordenar y para llamar a anular
  monto: number;
  primeraCuota: number;
  ultimaCuota: number;
  fechaPago: string;
  anulado: boolean;
  motivoAnulacion: string | null;
  fechaAnulacion: string | null;
  // Desde V4: todas las filas de un abono comparten método y referencia.
  metodoPago: MetodoPago;
  referenciaPago: string | null;
}

// Los cálculos de amortización en JS acumulan residuos de coma flotante
// (ej. 350.14 - 300 = 50.139999999999986). Se redondea a 2 decimales en
// cada valor monetario derivado, para que coincida con lo que el backend
// ya normaliza al guardar.
function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// 'YYYY-MM-DD' -> 'DD/MM/YYYY' sin pasar por Date, para evitar el corrimiento
// de un día por zona horaria.
function formatearFecha(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-');
  return `${dia}/${mes}/${anio}`;
}


// 'YYYY-MM-DD' + n meses -> 'YYYY-MM-DD', con el mismo recorte de fin de mes
// que LocalDate.plusMonths() (31 de oct + 1 mes = 30 de nov).
function sumarMeses(fechaIso: string, meses: number): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const total = mes - 1 + meses;
  const anioFinal = anio + Math.floor(total / 12);
  const mesFinal = total % 12; // 0 a 11
  const ultimoDia = new Date(Date.UTC(anioFinal, mesFinal + 1, 0)).getUTCDate();
  const diaFinal = Math.min(dia, ultimoDia);
  return `${anioFinal}-${String(mesFinal + 1).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;
}


function generarTablaAmortizacion(credito: Credito): FilaAmortizacion[] {
  const i = credito.tasaInteresMensual / 100;
  const pagos = credito.pagos ?? [];

  // Pagos que ya fueron anulados: su atraso original no debe seguir contando
  // (igual que en CronogramaService.generarCronograma del backend).
  const idsAnulados = new Set<number>();
  pagos.forEach((p) => {
    if (p.pagoOriginalId != null) idsAnulados.add(p.pagoOriginalId);
  });

  // Las filas de anulación (monto negativo) se agrupan con su cuota, así que
  // las sumas por cuota ya quedan compensadas sin lógica adicional.
  const abonosPorCuota = new Map<number, Pago[]>();
  pagos.forEach((p) => {
    const lista = abonosPorCuota.get(p.numeroCuota) ?? [];
    lista.push(p);
    abonosPorCuota.set(p.numeroCuota, lista);
  });

  let saldo = credito.montoSolicitado;
  const filas: FilaAmortizacion[] = [];

  for (let mes = 1; mes <= credito.plazoMeses; mes++) {
    const interes = redondear2(saldo * i);
    let capital = redondear2(credito.cuotaMensual - interes);
    if (mes === credito.plazoMeses || capital > saldo) {
      capital = saldo;
    }
    saldo = redondear2(Math.max(saldo - capital, 0));

    const fechaVencimiento = sumarMeses(credito.fechaInicio, mes);

    const abonos = abonosPorCuota.get(mes) ?? [];
    const totalAbonado = redondear2(abonos.reduce((sum, p) => sum + p.montoPagado, 0));
    const saldoPendienteCuota = redondear2(Math.max(credito.cuotaMensual - totalAbonado, 0));
    const completa = saldoPendienteCuota <= EPSILON;
    const huboAtraso = abonos.some((p) => p.estado === 'ATRASADO' && !idsAnulados.has(p.id));

    filas.push({
      mes,
      cuota: credito.cuotaMensual,
      interes,
      capital,
      saldo,
      fechaVencimiento,
      abonos,
      totalAbonado,
      saldoPendienteCuota,
      completa,
      huboAtraso,
    });
  }

  return filas;
}

// Agrupa los pagos en abonos y marca cuáles fueron anulados. Devuelve el más
// reciente primero. Las filas ANULACION no se listan: se reflejan como el
// estado "Anulado" del abono que revierten.
function agruparAbonos(pagos: Pago[]): AbonoAgrupado[] {
  const reversoPorOriginal = new Map<number, Pago>();
  pagos.forEach((p) => {
    if (p.pagoOriginalId != null) reversoPorOriginal.set(p.pagoOriginalId, p);
  });

  const filasPorClave = new Map<string, Pago[]>();
  pagos
    .filter((p) => p.estado !== 'ANULACION')
    .forEach((p) => {
      const clave = p.abonoRef ?? `sin-ref-${p.id}`;
      const lista = filasPorClave.get(clave) ?? [];
      lista.push(p);
      filasPorClave.set(clave, lista);
    });

  const abonos: AbonoAgrupado[] = [];
  filasPorClave.forEach((filas, clave) => {
    filas.sort((a, b) => a.id - b.id);
    const reversos = filas
      .map((f) => reversoPorOriginal.get(f.id))
      .filter((r): r is Pago => r !== undefined);
    const anulado = reversos.length === filas.length;
    const cuotas = filas.map((f) => f.numeroCuota);

    abonos.push({
      clave,
      pagoId: filas[0].id,
      monto: redondear2(filas.reduce((sum, f) => sum + f.montoPagado, 0)),
      primeraCuota: Math.min(...cuotas),
      ultimaCuota: Math.max(...cuotas),
      fechaPago: filas[0].fechaPago,
      anulado,
      motivoAnulacion: anulado ? reversos[0].motivoAnulacion : null,
      fechaAnulacion: anulado ? reversos[0].fechaPago : null,
      metodoPago: filas[0].metodoPago ?? 'EFECTIVO',
      referenciaPago: filas[0].referenciaPago ?? null,
    });
  });

  return abonos.sort((a, b) => b.pagoId - a.pagoId);
}

function badgeEstadoCuota(fila: FilaAmortizacion) {
  if (fila.totalAbonado === 0) {
    return <span className="text-xs font-medium text-[#6B7280]">Pendiente</span>;
  }
  if (!fila.completa) {
    return (
      <span className="text-xs font-medium text-[#B45309]">
        Parcial ({formatoMoneda(fila.totalAbonado)} de {formatoMoneda(fila.cuota)})
      </span>
    );
  }
  return (
    <span className="text-xs font-medium" style={{ color: fila.huboAtraso ? '#B45309' : TEAL }}>
      {fila.huboAtraso ? 'Pagado (con atraso)' : 'Pagado'}
    </span>
  );
}

export default function CreditoDetalleModal({
  credito,
  onClose,
  onPagoRegistrado,
  puedeAnular = false,
}: CreditoDetalleModalProps) {
  const [cuotaParaPagar, setCuotaParaPagar] = useState<FilaAmortizacion | null>(null);
  const [abonoParaAnular, setAbonoParaAnular] = useState<AbonoAgrupado | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const [mensajeDerrame, setMensajeDerrame] = useState<string | null>(null);
  const [reciboEnCurso, setReciboEnCurso] = useState<string | null>(null);
  const [mora, setMora] = useState<ResumenMora | null>(null);
  const [modalMora, setModalMora] = useState<TipoMovimientoMora | null>(null);
  const [reciboMoraEnCurso, setReciboMoraEnCurso] = useState<number | null>(null);

  const filas = generarTablaAmortizacion(credito);
  const abonos = agruparAbonos(credito.pagos ?? []);
  const totalPagado = redondear2((credito.pagos ?? []).reduce((sum, p) => sum + p.montoPagado, 0));
  const totalCredito = credito.cuotaMensual * credito.plazoMeses;

  // La primera fila incompleta es la única que se puede abonar ahora (regla FIFO).
  const siguienteCuotaPagable = filas.find((f) => !f.completa)?.mes ?? null;

  // Solo el último abono activo se puede anular (el backend aplica la misma regla),
  // para no dejar cuotas posteriores pagadas con anteriores abiertas.
  const ultimoAbonoActivo = abonos.find((a) => !a.anulado) ?? null;

  // Saldo pendiente de TODO el crédito (suma de todas las cuotas no completas),
  // necesario para el límite de validación del derrame en RegistrarPagoModal.
  const saldoTotalPendiente = redondear2(
    filas.filter((f) => !f.completa).reduce((sum, f) => sum + f.saldoPendienteCuota, 0)
  );

  // El interés moratorio lo calcula el backend a partir de las cuotas y los pagos, por eso se
  // vuelve a pedir cuando cambian los pagos del crédito (nuevo abono o anulación).
  useEffect(() => {
    let cancelado = false;
    moraService
      .obtener(credito.id)
      .then((resumen) => {
        if (!cancelado) setMora(resumen);
      })
      .catch(() => {
        if (!cancelado) setMora(null);
      });
    return () => {
      cancelado = true;
    };
  }, [credito.id, credito.pagos]);

  async function handleDescargarReporte() {
    setDescargando(true);
    setErrorDescarga(null);
    try {
      await reporteService.descargarPagos(credito.id);
    } catch {
      setErrorDescarga('No se pudo generar el reporte. Intenta de nuevo.');
    } finally {
      setDescargando(false);
    }
  }

  async function handleDescargarReporteExcel() {
    setDescargandoExcel(true);
    setErrorDescarga(null);
    try {
      await reporteService.descargarPagosExcel(credito.id);
    } catch {
      setErrorDescarga('No se pudo generar el reporte. Intenta de nuevo.');
    } finally {
      setDescargandoExcel(false);
    }
  }


  async function handleDescargarRecibo(abono: AbonoAgrupado) {
    setReciboEnCurso(abono.clave);
    setErrorDescarga(null);
    try {
      await reporteService.descargarRecibo(abono.pagoId);
    } catch {
      setErrorDescarga('No se pudo generar el recibo. Intenta de nuevo.');
    } finally {
      setReciboEnCurso(null);
    }
  }


  async function handleDescargarReciboMora(movimientoId: number) {
    setReciboMoraEnCurso(movimientoId);
    setErrorDescarga(null);
    try {
      await reporteService.descargarReciboMora(movimientoId);
    } catch {
      setErrorDescarga('No se pudo generar el recibo de mora. Intenta de nuevo.');
    } finally {
      setReciboMoraEnCurso(null);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E4E9]">
          <div>
            <h2 className="text-lg font-semibold text-[#1B1F2A]">
              Crédito #{credito.id} — Tabla de amortización
            </h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {formatoMoneda(credito.montoSolicitado)} a {credito.plazoMeses} meses, {credito.tasaInteresMensual}% mensual
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1B1F2A] text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <CobradorCredito credito={credito} puedeAsignar={puedeAnular} onCambiado={onPagoRegistrado} />

        <div className="px-6 py-3 border-b border-[#E2E4E9] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-[#6B7280]">Pagado hasta ahora: </span>
              <span className="font-medium text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatoMoneda(totalPagado)}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280]">Total del crédito (con interés): </span>
              <span className="font-medium text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatoMoneda(totalCredito)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDescargarReporte}
              disabled={descargando}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: TEAL }}
            >
              {descargando ? 'Generando…' : 'Descargar reporte (PDF)'}
            </button>
            <button
              type="button"
              onClick={handleDescargarReporteExcel}
              disabled={descargandoExcel}
              className="rounded-md px-3 py-1.5 text-xs font-medium border border-[#E2E4E9] text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors disabled:opacity-60"
            >
              {descargandoExcel ? 'Generando…' : 'Descargar (Excel)'}
            </button>
          </div>
        </div>

        {errorDescarga && (
          <div className="mx-6 mt-3 rounded-md border border-[#F3D7C4] bg-[#FFF7ED] px-4 py-2 text-sm text-[#9A3412]">
            {errorDescarga}
          </div>
        )}

        {mensajeDerrame && (
          <div className="mx-6 mt-3 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-2 text-sm text-[#166534]">
            {mensajeDerrame}
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-[#E2E4E9] text-[#6B7280]">
                <th className="px-5 py-2.5 font-medium">Mes</th>
                <th className="px-5 py-2.5 font-medium whitespace-nowrap">Vence</th>
                <th className="px-5 py-2.5 font-medium text-right">Cuota</th>
                <th className="px-5 py-2.5 font-medium text-right">Interés</th>
                <th className="px-5 py-2.5 font-medium text-right">Capital</th>
                <th className="px-5 py-2.5 font-medium text-right">Saldo de capital</th>
                <th className="px-5 py-2.5 font-medium text-right">Estado</th>
                <th className="px-5 py-2.5 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.mes} className="border-b border-[#EEF0F3]">
                  <td className="px-5 py-2.5 text-[#1B1F2A]">{fila.mes}</td>
                  <td className="px-5 py-2.5 text-[#6B7280] whitespace-nowrap">
                    {formatearFecha(fila.fechaVencimiento)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatoMoneda(fila.cuota)}
                  </td>

                  <td className="px-5 py-2.5 text-right text-[#6B7280]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatoMoneda(fila.interes)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-[#6B7280]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatoMoneda(fila.capital)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatoMoneda(fila.saldo)}
                  </td>
                  <td className="px-5 py-2.5 text-right">{badgeEstadoCuota(fila)}</td>
                  <td className="px-5 py-2.5 text-right">
                    {!fila.completa && fila.mes === siguienteCuotaPagable && (
                      <button
                        type="button"
                        onClick={() => setCuotaParaPagar(fila)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: TEAL }}
                      >
                        Registrar abono
                      </button>
                    )}
                  </td>


                </tr>
              ))}
            </tbody>
          </table>

          {mora && (mora.devengado > 0 || mora.movimientos.length > 0) && (
            <div className="pt-4">
              <h3 className="px-5 pb-2 text-sm font-semibold text-[#1B1F2A]">Interés moratorio</h3>

              <div className="px-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-[#6B7280]">Devengado</div>
                  <div className="font-medium text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatoMoneda(mora.devengado)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Cobrado</div>
                  <div className="font-medium text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatoMoneda(mora.cobrado)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Condonado</div>
                  <div className="font-medium text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatoMoneda(mora.condonado)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Interés por cobrar</div>
                  <div
                    className="font-semibold"
                    style={{ fontVariantNumeric: 'tabular-nums', color: mora.saldo > 0 ? '#B45309' : TEAL }}
                  >
                    {formatoMoneda(mora.saldo)}
                  </div>
                </div>
              </div>

              {mora.cuotas.length > 0 && (
                <p className="px-5 pt-2 text-xs text-[#6B7280]">
                  {mora.cuotas
                    .map((c) => `Cuota ${c.numeroCuota}: ${c.diasCobrados} días, ${formatoMoneda(c.interes)}`)
                    .join(' · ')}
                </p>
              )}

              {mora.saldo > 0 && (
                <div className="px-5 pt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setModalMora('COBRO')}
                    className="text-sm font-medium hover:underline"
                    style={{ color: TEAL }}
                  >
                    Cobrar mora
                  </button>
                  {puedeAnular && (
                    <button
                      type="button"
                      onClick={() => setModalMora('CONDONACION')}
                      className="text-sm font-medium hover:underline"
                      style={{ color: DANGER }}
                    >
                      Condonar
                    </button>
                  )}
                </div>
              )}

              {mora.movimientos.length > 0 && (
                <table className="mt-3 w-full text-left text-sm">
                  <thead>
                    <tr className="border-y border-[#E2E4E9] text-[#6B7280]">
                      <th className="px-5 py-2 font-medium">Fecha</th>
                      <th className="px-5 py-2 font-medium">Movimiento</th>
                      <th className="px-5 py-2 font-medium text-right">Monto</th>
                      <th className="px-5 py-2 font-medium">Usuario</th>
                      <th className="px-5 py-2 font-medium text-right">Recibo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mora.movimientos.map((m) => (
                      <tr key={m.id} className="border-b border-[#EEF0F3] align-top">
                        <td className="px-5 py-2 text-[#1B1F2A]">{formatearFecha(m.fecha)}</td>
                        <td className="px-5 py-2 text-[#6B7280]">
                          {m.tipo === 'COBRO' ? 'Cobro' : 'Condonación'}
                          {m.motivo && <div className="text-xs break-words">Motivo: {m.motivo}</div>}
                        </td>
                        <td className="px-5 py-2 text-right text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatoMoneda(m.monto)}
                        </td>
                        <td className="px-5 py-2 text-[#6B7280]">{m.usuario}</td>
                        <td className="px-5 py-2 text-right">
                          {m.tipo === 'COBRO' && (
                            <button
                              type="button"
                              onClick={() => handleDescargarReciboMora(m.id)}
                              disabled={reciboMoraEnCurso === m.id}
                              className="text-sm font-medium hover:underline disabled:opacity-60"
                              style={{ color: TEAL }}
                            >
                              {reciboMoraEnCurso === m.id ? 'Generando…' : 'Recibo'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {abonos.length > 0 && (
            <div className="pt-4 pb-3">
              <h3 className="px-5 pb-2 text-sm font-semibold text-[#1B1F2A]">Historial de abonos</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-[#E2E4E9] text-[#6B7280]">
                    <th className="px-5 py-2.5 font-medium">Fecha</th>
                    <th className="px-5 py-2.5 font-medium">Cuotas</th>
                    <th className="px-5 py-2.5 font-medium text-right">Monto</th>
                    <th className="px-5 py-2.5 font-medium">Método</th>
                    <th className="px-5 py-2.5 font-medium text-right">Estado</th>
                    <th className="px-5 py-2.5 font-medium text-right">Recibo</th>
                    {puedeAnular && <th className="px-5 py-2.5 font-medium text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {abonos.map((abono) => (
                    <tr key={abono.clave} className="border-b border-[#EEF0F3] align-top">
                      <td className="px-5 py-2.5 text-[#1B1F2A]">{formatearFecha(abono.fechaPago)}</td>
                      <td className="px-5 py-2.5 text-[#6B7280]">
                        {abono.primeraCuota === abono.ultimaCuota
                          ? `Cuota ${abono.primeraCuota}`
                          : `Cuotas ${abono.primeraCuota} a ${abono.ultimaCuota}`}
                      </td>
                      <td
                        className={`px-5 py-2.5 text-right ${abono.anulado ? 'text-[#9CA3AF] line-through' : 'text-[#1B1F2A]'
                          }`}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatoMoneda(abono.monto)}
                      </td>
                      <td className="px-5 py-2.5 text-[#6B7280]">
                        {ETIQUETAS_METODO[abono.metodoPago]}
                        {abono.referenciaPago && (
                          <div className="text-xs break-words">Ref. {abono.referenciaPago}</div>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {abono.anulado ? (
                          <div className="ml-auto max-w-[220px]">
                            <span className="text-xs font-medium" style={{ color: DANGER }}>
                              Anulado
                            </span>
                            {abono.fechaAnulacion && (
                              <div className="text-xs text-[#6B7280]">
                                el {formatearFecha(abono.fechaAnulacion)}
                              </div>
                            )}
                            {abono.motivoAnulacion && (
                              <div className="text-xs text-[#6B7280] break-words">
                                Motivo: {abono.motivoAnulacion}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium" style={{ color: TEAL }}>
                            Aplicado
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {!abono.anulado && (
                          <button
                            type="button"
                            onClick={() => handleDescargarRecibo(abono)}
                            disabled={reciboEnCurso === abono.clave}
                            className="text-sm font-medium hover:underline disabled:opacity-60"
                            style={{ color: TEAL }}
                          >
                            {reciboEnCurso === abono.clave ? 'Generando…' : 'Recibo'}
                          </button>
                        )}
                      </td>
                      {puedeAnular && (
                        <td className="px-5 py-2.5 text-right">
                          {ultimoAbonoActivo?.clave === abono.clave && (
                            <button
                              type="button"
                              onClick={() => setAbonoParaAnular(abono)}
                              className="text-sm font-medium hover:underline"
                              style={{ color: DANGER }}
                            >
                              Anular
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {cuotaParaPagar && (
        <RegistrarPagoModal
          creditoId={credito.id}
          numeroCuota={cuotaParaPagar.mes}
          saldoPendiente={cuotaParaPagar.saldoPendienteCuota}
          saldoTotalCredito={saldoTotalPendiente}
          fechaVencimiento={cuotaParaPagar.fechaVencimiento}
          onClose={() => setCuotaParaPagar(null)}
          onRegistered={(pagosCreados) => {
            setCuotaParaPagar(null);

            // Si el abono tocó más de una cuota (derrame), avisa cuáles.
            if (pagosCreados.length > 1) {
              const cuotas = pagosCreados.map((p) => p.numeroCuota);
              const primera = cuotas[0];
              const ultima = cuotas[cuotas.length - 1];
              setMensajeDerrame(
                primera === ultima
                  ? `Abono aplicado a la cuota ${primera}.`
                  : `Abono aplicado a las cuotas ${primera} a ${ultima}.`
              );
              setTimeout(() => setMensajeDerrame(null), 4000);
            }

            onPagoRegistrado();
          }}
        />
      )}

      {abonoParaAnular && (
        <AnularAbonoModal
          creditoId={credito.id}
          pagoId={abonoParaAnular.pagoId}
          monto={abonoParaAnular.monto}
          primeraCuota={abonoParaAnular.primeraCuota}
          ultimaCuota={abonoParaAnular.ultimaCuota}
          onClose={() => setAbonoParaAnular(null)}
          onAnulado={() => {
            setMensajeDerrame(`Abono de ${formatoMoneda(abonoParaAnular.monto)} anulado.`);
            setTimeout(() => setMensajeDerrame(null), 4000);
            setAbonoParaAnular(null);
            onPagoRegistrado(); // recarga el crédito para reflejar la anulación
          }}
        />
      )}
      {modalMora && mora && (
        <MoraMovimientoModal
          creditoId={credito.id}
          tipo={modalMora}
          saldo={mora.saldo}
          onClose={() => setModalMora(null)}
          onRegistrado={(resumen) => {
            setMora(resumen);
            setMensajeDerrame(modalMora === 'COBRO' ? 'Mora cobrada.' : 'Mora condonada.');
            setTimeout(() => setMensajeDerrame(null), 4000);
            setModalMora(null);
          }}
        />
      )}
    </div>
  );
}