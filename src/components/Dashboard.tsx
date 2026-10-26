import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import { reporteService } from '../services/reporteService';
import { clienteService } from '../services/clienteService';
import type { DashboardData } from '../types/Dashboard';
import type { Cliente } from '../types/Cliente';
import NavBar from './NavBar';
import { formatoMoneda } from '../utils/formato';
import CalidadCartera from './CalidadCartera';


const NAVY = '#1E3A5F';
const TEAL = '#0F766E';

const ESTADOS_DISPONIBLES = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'PAGADO', 'EN_MORA'];
const ESTADOS_DEFAULT = ['APROBADO', 'EN_MORA'];

// Estados que puede tener un crédito con interés por cobrar, con su etiqueta y color
const ESTILO_ESTADO: Record<string, { texto: string; color: string; fondo: string }> = {
  EN_MORA: { texto: 'En mora', color: '#B45309', fondo: '#FFF7ED' },
  PAGADO: { texto: 'Pagado', color: '#0F766E', fondo: '#ECFDF5' },
  APROBADO: { texto: 'Aprobado', color: '#1E3A5F', fondo: '#EEF2F7' },
};

function EtiquetaEstado({ estado }: { estado: string }) {
  const estilo = ESTILO_ESTADO[estado] ?? { texto: estado, color: '#6B7280', fondo: '#F3F4F6' };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color: estilo.color, backgroundColor: estilo.fondo }}
    >
      {estilo.texto}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  // --- Filtros del reporte de cartera ---
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>(ESTADOS_DEFAULT);
  const [clienteId, setClienteId] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [descargandoExcel, setDescargandoExcel] = useState(false);

  // --- Reporte de mora ---
  const [descargandoMora, setDescargandoMora] = useState(false);
  const [descargandoMoraExcel, setDescargandoMoraExcel] = useState(false);

  const cargarResumen = () => {
    setLoading(true);
    setError(null);
    dashboardService
      .obtenerResumen()
      .then(setData)
      .catch(() =>
        setError(
          'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en localhost:8080.'
        )
      )
      .finally(() => setLoading(false));
  };

  function toggleEstado(estado: string) {
    setEstadosSeleccionados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  }

  async function handleDescargarReporteExcel() {
    setDescargandoExcel(true);
    setErrorDescarga(null);
    try {
      await reporteService.descargarCarteraExcel({
        estados: estadosSeleccionados.length > 0 ? estadosSeleccionados : undefined,
        clienteId: clienteId ? Number(clienteId) : undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      });
    } catch {
      setErrorDescarga('No se pudo generar el reporte. Intenta de nuevo.');
    } finally {
      setDescargandoExcel(false);
    }
  }

  async function handleDescargarReporte() {
    setDescargando(true);
    setErrorDescarga(null);
    try {
      await reporteService.descargarCartera({
        estados: estadosSeleccionados.length > 0 ? estadosSeleccionados : undefined,
        clienteId: clienteId ? Number(clienteId) : undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      });
    } catch {
      setErrorDescarga('No se pudo generar el reporte. Intenta de nuevo.');
    } finally {
      setDescargando(false);
    }
  }

  async function handleDescargarMora() {
    setDescargandoMora(true);
    setErrorDescarga(null);
    try {
      await reporteService.descargarMora();
    } catch {
      setErrorDescarga('No se pudo generar el reporte de mora. Intenta de nuevo.');
    } finally {
      setDescargandoMora(false);
    }
  }

  async function handleDescargarMoraExcel() {
    setDescargandoMoraExcel(true);
    setErrorDescarga(null);
    try {
      await reporteService.descargarMoraExcel();
    } catch {
      setErrorDescarga('No se pudo generar el reporte de mora. Intenta de nuevo.');
    } finally {
      setDescargandoMoraExcel(false);
    }
  }

  useEffect(() => {
    cargarResumen();
    clienteService.listarTodos().then(setClientes).catch(() => {
      // Si falla la carga de clientes, el filtro por cliente simplemente
      // no aparece disponible; no bloquea el resto del dashboard.
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <NavBar activo="dashboard" />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Encabezado: título arriba, botones abajo en móvil; en fila desde md */}
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1B1F2A]">Cartera y mora</h1>
            <p className="text-sm text-[#6B7280] mt-1">Resumen general de créditos activos.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => setMostrarFiltros((prev) => !prev)}
              className="col-span-2 rounded-md px-4 py-2.5 sm:py-2 text-sm font-medium border border-[#E2E4E9] bg-white text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors"
            >
              {mostrarFiltros ? 'Ocultar filtros' : 'Filtros'}
            </button>
            <button
              type="button"
              onClick={handleDescargarReporte}
              disabled={descargando || loading || !!error}
              className="rounded-md px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-white text-center transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: TEAL }}
            >
              {descargando ? 'Generando…' : 'Reporte (PDF)'}
            </button>
            <button
              type="button"
              onClick={handleDescargarReporteExcel}
              disabled={descargandoExcel || loading || !!error}
              className="rounded-md px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-center border border-[#E2E4E9] bg-white text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors disabled:opacity-60"
            >
              {descargandoExcel ? 'Generando…' : 'Reporte (Excel)'}
            </button>
          </div>
        </div>

        {mostrarFiltros && (
          <div className="mb-6 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="min-w-0">
                <label className="text-xs text-[#6B7280]">Cliente</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E2E4E9] bg-white px-3 py-2.5 sm:py-2 text-sm text-[#1B1F2A]"
                >
                  <option value="">Todos</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombreCompleto}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="text-xs text-[#6B7280]">Desde (fecha de inicio)</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E2E4E9] bg-white px-3 py-2.5 sm:py-2 text-sm text-[#1B1F2A]"
                />
              </div>
              <div className="min-w-0">
                <label className="text-xs text-[#6B7280]">Hasta (fecha de inicio)</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E2E4E9] bg-white px-3 py-2.5 sm:py-2 text-sm text-[#1B1F2A]"
                />
              </div>
              <div className="min-w-0">
                <label className="text-xs text-[#6B7280]">Estados</label>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                  {ESTADOS_DISPONIBLES.map((estado) => (
                    <label key={estado} className="flex items-center gap-1.5 text-sm text-[#1B1F2A]">
                      <input
                        type="checkbox"
                        checked={estadosSeleccionados.includes(estado)}
                        onChange={() => toggleEstado(estado)}
                        className="h-4 w-4"
                      />
                      {estado}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#6B7280]">
              Sin estados marcados, el reporte usa los mismos de siempre (APROBADO y EN_MORA).
            </p>
          </div>
        )}

        {errorDescarga && (
          <div className="mb-4 rounded-md border border-[#F3D7C4] bg-[#FFF7ED] px-4 py-2 text-sm text-[#9A3412]">
            {errorDescarga}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-[#E2E4E9] bg-white px-6 py-16 text-center text-sm text-[#6B7280]">
            Cargando…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-[#F3D7C4] bg-[#FFF7ED] px-6 py-8 text-center">
            <p className="text-sm text-[#9A3412]">{error}</p>
            <button
              type="button"
              onClick={cargarResumen}
              className="mt-3 text-sm font-medium underline"
              style={{ color: NAVY }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Tarjetas resumen: 2 columnas en móvil, 4 en desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="min-w-0 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
                <p className="text-xs text-[#6B7280]">Total prestado</p>
                <p
                  className="text-lg sm:text-xl font-semibold text-[#1B1F2A] mt-1 break-words"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatoMoneda(data.totalPrestado)}
                </p>
              </div>
              <div className="min-w-0 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
                <p className="text-xs text-[#6B7280]">Total cobrado</p>
                <p
                  className="text-lg sm:text-xl font-semibold text-[#1B1F2A] mt-1 break-words"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatoMoneda(data.totalCobrado)}
                </p>
              </div>
              <div className="min-w-0 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
                <p className="text-xs text-[#6B7280]">Créditos vigentes</p>
                <p
                  className="text-lg sm:text-xl font-semibold text-[#1B1F2A] mt-1"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {data.creditosVigentes}
                </p>
              </div>
              <div
                className="min-w-0 rounded-lg border px-4 sm:px-5 py-4"
                style={{
                  borderColor: data.creditosEnMora > 0 ? '#F3D7C4' : '#E2E4E9',
                  backgroundColor: data.creditosEnMora > 0 ? '#FFF7ED' : 'white',
                }}
              >
                <p className="text-xs text-[#6B7280]">En mora</p>
                <p
                  className="text-lg sm:text-xl font-semibold mt-1 break-words"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: data.creditosEnMora > 0 ? '#B45309' : '#1B1F2A',
                  }}
                >
                  {formatoMoneda(data.totalEnMora)}
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {data.creditosEnMora} {data.creditosEnMora === 1 ? 'crédito' : 'créditos'} con cuotas
                  vencidas
                </p>
              </div>
            </div>

            <CalidadCartera data={data} />

            {/* Interés moratorio: solo aparece si alguna vez se generó mora */}
            {(data.moraDevengada > 0 || data.moraCobrada > 0 || data.moraCondonada > 0) && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[#1B1F2A]">Interés moratorio</h2>
                <p className="text-sm text-[#6B7280] mt-1 mb-3">
                  Recargo por pagar tarde. Es distinto de las cuotas vencidas de arriba.
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="min-w-0 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
                    <p className="text-xs text-[#6B7280]">Devengado</p>
                    <p
                      className="text-lg sm:text-xl font-semibold text-[#1B1F2A] mt-1 break-words"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatoMoneda(data.moraDevengada)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
                    <p className="text-xs text-[#6B7280]">Cobrado</p>
                    <p
                      className="text-lg sm:text-xl font-semibold text-[#1B1F2A] mt-1 break-words"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatoMoneda(data.moraCobrada)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
                    <p className="text-xs text-[#6B7280]">Condonado</p>
                    <p
                      className="text-lg sm:text-xl font-semibold text-[#1B1F2A] mt-1 break-words"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatoMoneda(data.moraCondonada)}
                    </p>
                  </div>
                  <div
                    className="min-w-0 rounded-lg border px-4 sm:px-5 py-4"
                    style={{
                      borderColor: data.saldoMora > 0 ? '#F3D7C4' : '#E2E4E9',
                      backgroundColor: data.saldoMora > 0 ? '#FFF7ED' : 'white',
                    }}
                  >
                    <p className="text-xs text-[#6B7280]">Interés por cobrar</p>
                    <p
                      className="text-lg sm:text-xl font-semibold mt-1 break-words"
                      style={{
                        fontVariantNumeric: 'tabular-nums',
                        color: data.saldoMora > 0 ? '#B45309' : '#1B1F2A',
                      }}
                    >
                      {formatoMoneda(data.saldoMora)}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {data.creditosConSaldoMora}{' '}
                      {data.creditosConSaldoMora === 1 ? 'crédito' : 'créditos'}
                    </p>
                  </div>
                </div>

                {/* Barra de reparto: de lo generado, cuánto se cobró, se condonó y sigue pendiente */}
                {(() => {
                  const total = data.moraCobrada + data.moraCondonada + data.saldoMora;
                  if (total <= 0) return null;
                  const segmentos = [
                    { clave: 'cobrado', etiqueta: 'Cobrado', valor: data.moraCobrada, color: TEAL },
                    { clave: 'condonado', etiqueta: 'Condonado', valor: data.moraCondonada, color: '#94A3B8' },
                    { clave: 'pendiente', etiqueta: 'Por cobrar', valor: data.saldoMora, color: '#D97706' },
                  ];
                  const porcentaje = (valor: number) => Math.round((valor / total) * 100);
                  return (
                    <div className="mt-4 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
                      <p className="text-xs text-[#6B7280] mb-2">¿Qué pasó con el interés generado?</p>
                      <div
                        className="flex h-3 w-full overflow-hidden rounded-full bg-[#EEF0F3]"
                        role="img"
                        aria-label={segmentos
                          .map((s) => `${s.etiqueta} ${porcentaje(s.valor)}%`)
                          .join(', ')}
                      >
                        {segmentos
                          .filter((s) => s.valor > 0)
                          .map((s) => (
                            <div
                              key={s.clave}
                              style={{ width: `${(s.valor / total) * 100}%`, backgroundColor: s.color }}
                            />
                          ))}
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#6B7280]">
                        {segmentos.map((s) => (
                          <li key={s.clave} className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            <span>
                              {s.etiqueta}{' '}
                              <span
                                className="font-medium text-[#1B1F2A]"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                              >
                                {formatoMoneda(s.valor)}
                              </span>{' '}
                              ({porcentaje(s.valor)}%)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* Interés por cobrar, crédito por crédito (incluye los ya pagados) */}
                {data.creditosConSaldoMoraDetalle.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-[#1B1F2A] mb-2">
                      Interés por cobrar por crédito
                    </h3>

                    {/* MÓVIL: tarjetas */}
                    <ul className="md:hidden space-y-2">
                      {data.creditosConSaldoMoraDetalle.map((credito) => (
                        <li
                          key={credito.creditoId}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E4E9] bg-white px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1B1F2A] break-words">
                              {credito.clienteNombre}
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-xs text-[#6B7280]">
                              <span>Crédito #{credito.creditoId}</span>
                              <EtiquetaEstado estado={credito.estado} />
                            </p>
                          </div>
                          <span
                            className="shrink-0 text-sm font-medium text-[#B45309]"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {formatoMoneda(credito.saldoMora)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* DESKTOP/TABLET: tabla */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E2E4E9] bg-white">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#E2E4E9] text-[#6B7280]">
                            <th className="px-5 py-3 font-medium">Crédito</th>
                            <th className="px-5 py-3 font-medium">Cliente</th>
                            <th className="px-5 py-3 font-medium">Estado</th>
                            <th className="px-5 py-3 font-medium text-right">Interés por cobrar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.creditosConSaldoMoraDetalle.map((credito, index) => (
                            <tr
                              key={credito.creditoId}
                              className={
                                index !== data.creditosConSaldoMoraDetalle.length - 1
                                  ? 'border-b border-[#EEF0F3]'
                                  : ''
                              }
                            >
                              <td className="px-5 py-3 text-[#1B1F2A]">#{credito.creditoId}</td>
                              <td className="px-5 py-3 text-[#1B1F2A] font-medium">
                                {credito.clienteNombre}
                              </td>
                              <td className="px-5 py-3">
                                <EtiquetaEstado estado={credito.estado} />
                              </td>
                              <td
                                className="px-5 py-3 text-right text-[#B45309] font-medium"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                              >
                                {formatoMoneda(credito.saldoMora)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-[#6B7280]">
                      Los créditos pagados aparecen aquí porque pueden quedar debiendo interés aunque
                      ya no tengan cuotas pendientes.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                <h2 className="text-lg font-semibold text-[#1B1F2A]">Créditos en mora</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDescargarMora}
                    disabled={descargandoMora}
                    className="flex-1 sm:flex-none rounded-md px-3 py-2 sm:py-1.5 text-xs font-medium text-white text-center transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: TEAL }}
                  >
                    {descargandoMora ? 'Generando…' : 'Descargar reporte (PDF)'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDescargarMoraExcel}
                    disabled={descargandoMoraExcel}
                    className="flex-1 sm:flex-none rounded-md px-3 py-2 sm:py-1.5 text-xs font-medium text-center border border-[#E2E4E9] bg-white text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors disabled:opacity-60"
                  >
                    {descargandoMoraExcel ? 'Generando…' : 'Descargar (Excel)'}
                  </button>
                </div>
              </div>

              {data.creditosEnMoraDetalle.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E2E4E9] bg-white px-6 py-12 text-center">
                  <p className="text-sm text-[#6B7280]">No hay créditos en mora en este momento.</p>
                </div>
              ) : (
                <>
                  {/* MÓVIL: tarjetas */}
                  <ul className="md:hidden space-y-3">
                    {data.creditosEnMoraDetalle.map((credito) => (
                      <li
                        key={credito.creditoId}
                        className="rounded-lg border border-[#E2E4E9] bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-[#1B1F2A] break-words min-w-0">
                            {credito.clienteNombre}
                          </p>
                          <span className="shrink-0 text-xs text-[#6B7280]">
                            Crédito #{credito.creditoId}
                          </span>
                        </div>
                        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-[#6B7280]">Cuotas vencidas</dt>
                            <dd
                              className="text-[#B45309]"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {credito.cuotasVencidas}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#6B7280]">Monto en mora</dt>
                            <dd
                              className="text-[#B45309] font-medium"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatoMoneda(credito.montoEnMora)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#6B7280]">Interés por cobrar</dt>
                            <dd
                              className={
                                credito.saldoMora > 0
                                  ? 'text-[#B45309] font-medium'
                                  : 'text-[#6B7280]'
                              }
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatoMoneda(credito.saldoMora)}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>

                  {/* DESKTOP/TABLET: tabla */}
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E2E4E9] bg-white">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E2E4E9] text-[#6B7280]">
                          <th className="px-5 py-3 font-medium">Crédito</th>
                          <th className="px-5 py-3 font-medium">Cliente</th>
                          <th className="px-5 py-3 font-medium text-right">Cuotas vencidas</th>
                          <th className="px-5 py-3 font-medium text-right">Monto en mora</th>
                          <th className="px-5 py-3 font-medium text-right">Interés por cobrar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.creditosEnMoraDetalle.map((credito, index) => (
                          <tr
                            key={credito.creditoId}
                            className={
                              index !== data.creditosEnMoraDetalle.length - 1
                                ? 'border-b border-[#EEF0F3]'
                                : ''
                            }
                          >
                            <td className="px-5 py-3 text-[#1B1F2A]">#{credito.creditoId}</td>
                            <td className="px-5 py-3 text-[#1B1F2A] font-medium">{credito.clienteNombre}</td>
                            <td
                              className="px-5 py-3 text-right text-[#B45309]"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {credito.cuotasVencidas}
                            </td>
                            <td
                              className="px-5 py-3 text-right text-[#B45309] font-medium"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatoMoneda(credito.montoEnMora)}
                            </td>
                            <td
                              className={`px-5 py-3 text-right ${credito.saldoMora > 0 ? 'text-[#B45309] font-medium' : 'text-[#6B7280]'
                                }`}
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatoMoneda(credito.saldoMora)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}