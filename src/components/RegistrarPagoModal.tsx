import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pagoService } from '../services/pagoService';
import type { MetodoPago, Pago } from '../types/Pago';

const TEAL = '#0F766E';
const AVISO = '#B45309';
const MAX_REFERENCIA = 50; // mismo límite que la columna referencia_pago

// La ayuda de cada método existe porque los cobradores confunden transferencia con depósito al capturar.
const METODOS: { valor: MetodoPago; etiqueta: string; ayuda: string }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo', ayuda: 'Dinero recibido en mano.' },
  {
    valor: 'TRANSFERENCIA',
    etiqueta: 'Transferencia',
    ayuda: 'Llegó por banca en línea o app del banco. Anota la clave de rastreo o el folio.',
  },
  {
    valor: 'DEPOSITO',
    etiqueta: 'Depósito',
    ayuda: 'Ficha pagada en ventanilla o cajero. Anota el número de ficha o el folio.',
  },
];

const buildPagoSchema = (saldoTotalCredito: number) =>
  z
    .object({
      montoPagado: z.coerce
        .number({ message: 'Ingresa un monto válido' })
        .positive('El monto debe ser mayor a 0')
        .max(saldoTotalCredito, `No puede superar el saldo total pendiente del crédito ($${saldoTotalCredito.toFixed(2)})`),
      metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO']),
      referenciaPago: z
        .string()
        .max(MAX_REFERENCIA, `La referencia no puede superar los ${MAX_REFERENCIA} caracteres`)
        .optional(),
    })
    .refine(
      (datos) => datos.metodoPago === 'EFECTIVO' || (datos.referenciaPago ?? '').trim().length > 0,
      { message: 'La referencia es obligatoria para transferencias y depósitos', path: ['referenciaPago'] }
    );

type PagoFormValues = { montoPagado: number; metodoPago: MetodoPago; referenciaPago?: string };

interface RegistrarPagoModalProps {
  creditoId: number;
  numeroCuota: number;
  saldoPendiente: number;
  saldoTotalCredito: number;
  fechaVencimiento: string;
  onClose: () => void;
  onRegistered: (pagosCreados: Pago[]) => void;
}

export default function RegistrarPagoModal({
  creditoId,
  numeroCuota,
  saldoPendiente,
  saldoTotalCredito,
  fechaVencimiento,
  onClose,
  onRegistered,
}: RegistrarPagoModalProps) {
  const [advertenciaReferencia, setAdvertenciaReferencia] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<PagoFormValues>({
    resolver: zodResolver(buildPagoSchema(saldoTotalCredito)),
    defaultValues: { montoPagado: saldoPendiente, metodoPago: 'EFECTIVO', referenciaPago: '' },
  });

  const metodoPago = watch('metodoPago');
  const metodoActual = METODOS.find((m) => m.valor === metodoPago) ?? METODOS[0];
  const pideReferencia = metodoPago !== 'EFECTIVO';

  // Aviso de posible duplicado: la misma referencia ya está en un abono activo. No bloquea el registro,
  // porque dos pagos legítimos podrían compartir folio; solo le pide al cobrador que lo verifique.
  const verificarReferencia = async (valor: string) => {
    const referencia = valor.trim();
    if (!referencia) {
      setAdvertenciaReferencia(null);
      return;
    }
    try {
      const creditos = await pagoService.referenciaExistente(referencia);
      if (creditos.length === 0) {
        setAdvertenciaReferencia(null);
        return;
      }
      const lista = creditos.map((id) => `#${id}`).join(', ');
      setAdvertenciaReferencia(
        `Esta referencia ya está registrada en ${creditos.length === 1 ? 'el crédito' : 'los créditos'} ${lista}. ` +
          'Verifica que no sea un pago duplicado.'
      );
    } catch {
      setAdvertenciaReferencia(null); // si falla la consulta, no se estorba el registro
    }
  };

  const onSubmit = async (data: PagoFormValues) => {
    try {
      const pagosCreados = await pagoService.registrar({
        creditoId,
        numeroCuota,
        montoPagado: data.montoPagado,
        metodoPago: data.metodoPago,
        referenciaPago: data.metodoPago === 'EFECTIVO' ? undefined : data.referenciaPago?.trim(),
      });
      onRegistered(pagosCreados);
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: string } })?.response?.data ??
        'No se pudo registrar el abono. Intenta de nuevo.';
      // Los errores de referencia se muestran junto a su campo; el resto, junto al monto.
      const campo = /referencia/i.test(String(mensaje)) ? 'referenciaPago' : 'montoPagado';
      setError(campo, { message: String(mensaje) });
      console.error(err);
    }
  };

  const claseCampo =
    'w-full rounded-md border border-[#E2E4E9] px-3 py-2 text-sm text-[#1B1F2A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[70]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#1B1F2A]">Registrar abono</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1B1F2A] text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-[#6B7280] mb-1">
          Cuota {numeroCuota} — vence {fechaVencimiento} — saldo de esta cuota ${saldoPendiente.toFixed(2)}
        </p>
        <p className="text-xs text-[#6B7280] mb-5">
          Si abonas más de lo que debe esta cuota, el excedente se aplica automáticamente a las
          siguientes (saldo total pendiente del crédito: ${saldoTotalCredito.toFixed(2)}).
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="montoPagado" className="block text-sm font-medium text-[#1B1F2A] mb-1">
              Monto del abono
            </label>
            <input
              id="montoPagado"
              type="number"
              step="0.01"
              {...register('montoPagado')}
              className={claseCampo}
            />
            {errors.montoPagado && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.montoPagado.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="metodoPago" className="block text-sm font-medium text-[#1B1F2A] mb-1">
              Método de pago
            </label>
            <select
              id="metodoPago"
              {...register('metodoPago', { onChange: () => setAdvertenciaReferencia(null) })}
              className={`${claseCampo} bg-white`}
            >
              {METODOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[#6B7280]">{metodoActual.ayuda}</p>
          </div>

          {pideReferencia && (
            <div>
              <label htmlFor="referenciaPago" className="block text-sm font-medium text-[#1B1F2A] mb-1">
                Referencia
              </label>
              <input
                id="referenciaPago"
                type="text"
                autoComplete="off"
                maxLength={MAX_REFERENCIA}
                {...register('referenciaPago', {
                  onBlur: (e) => verificarReferencia(e.target.value),
                  onChange: () => setAdvertenciaReferencia(null),
                })}
                className={claseCampo}
              />
              {errors.referenciaPago && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.referenciaPago.message}</p>
              )}
              {advertenciaReferencia && (
                <p
                  className="mt-2 rounded-md border border-[#F3D7C4] bg-[#FFF7ED] px-3 py-2 text-xs"
                  style={{ color: AVISO }}
                >
                  {advertenciaReferencia}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F7F8FA]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: TEAL }}
            >
              {isSubmitting ? 'Guardando…' : 'Confirmar abono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}