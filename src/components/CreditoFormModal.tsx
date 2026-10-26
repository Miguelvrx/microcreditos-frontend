import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { creditoService } from '../services/creditoService';

const TEAL = '#0F766E';

const creditoSchema = z.object({
  montoSolicitado: z.coerce
    .number({ message: 'Ingresa un monto válido' })
    .positive('El monto debe ser mayor a 0'),
  tasaInteresMensual: z.coerce
    .number({ message: 'Ingresa una tasa válida' })
    .positive('La tasa debe ser mayor a 0')
    .max(100, 'La tasa no puede superar 100%'),
  plazoMeses: z.coerce
    .number({ message: 'Ingresa un plazo válido' })
    .int('El plazo debe ser un número entero de meses')
    .positive('El plazo debe ser mayor a 0')
    .max(360, 'El plazo no puede superar 360 meses'),
});

type CreditoFormValues = z.infer<typeof creditoSchema>;

interface CreditoFormModalProps {
  clienteId: number;
  clienteNombre: string;
  onClose: () => void;
  onCreated: () => void;
}

// Misma fórmula de amortización francesa que CreditoService.calcularCuotaMensual() en el backend.
// Es solo una vista previa en el cliente; el valor real y autoritativo lo calcula y guarda el backend.
function calcularCuotaEstimada(monto: number, tasaPorcentaje: number, plazoMeses: number): number | null {
  if (!monto || !tasaPorcentaje || !plazoMeses) return null;
  const i = tasaPorcentaje / 100;
  const unoMasIElevadoN = Math.pow(1 + i, plazoMeses);
  const cuota = (monto * i * unoMasIElevadoN) / (unoMasIElevadoN - 1);
  return Number.isFinite(cuota) ? cuota : null;
}

export default function CreditoFormModal({
  clienteId,
  clienteNombre,
  onClose,
  onCreated,
}: CreditoFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreditoFormValues>({
    resolver: zodResolver(creditoSchema),
  });

  const monto = watch('montoSolicitado');
  const tasa = watch('tasaInteresMensual');
  const plazo = watch('plazoMeses');
  const cuotaEstimada = calcularCuotaEstimada(Number(monto), Number(tasa), Number(plazo));

  const onSubmit = async (data: CreditoFormValues) => {
    try {
      await creditoService.crear({ clienteId, ...data });
      onCreated();
    } catch (err: unknown) {
      setError('montoSolicitado', {
        message: 'No se pudo crear el crédito. Verifica los datos e intenta de nuevo.',
      });
      console.error(err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#1B1F2A]">Solicitar crédito</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1B1F2A] text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-[#6B7280] mb-5">
          Cliente: <span className="font-medium text-[#1B1F2A]">{clienteNombre}</span>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="montoSolicitado" className="block text-sm font-medium text-[#1B1F2A] mb-1">
              Monto solicitado
            </label>
            <input
              id="montoSolicitado"
              type="number"
              step="0.01"
              {...register('montoSolicitado')}
              className="w-full rounded-md border border-[#E2E4E9] px-3 py-2 text-sm text-[#1B1F2A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              placeholder="5000"
            />
            {errors.montoSolicitado && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.montoSolicitado.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="tasaInteresMensual" className="block text-sm font-medium text-[#1B1F2A] mb-1">
              Tasa de interés mensual (%)
            </label>
            <input
              id="tasaInteresMensual"
              type="number"
              step="0.01"
              {...register('tasaInteresMensual')}
              className="w-full rounded-md border border-[#E2E4E9] px-3 py-2 text-sm text-[#1B1F2A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              placeholder="2.5"
            />
            {errors.tasaInteresMensual && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.tasaInteresMensual.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="plazoMeses" className="block text-sm font-medium text-[#1B1F2A] mb-1">
              Plazo (meses)
            </label>
            <input
              id="plazoMeses"
              type="number"
              step="1"
              {...register('plazoMeses')}
              className="w-full rounded-md border border-[#E2E4E9] px-3 py-2 text-sm text-[#1B1F2A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              placeholder="12"
            />
            {errors.plazoMeses && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.plazoMeses.message}</p>
            )}
          </div>

          {cuotaEstimada !== null && (
            <div className="rounded-md bg-[#F7F8FA] border border-[#E2E4E9] px-3 py-2">
              <p className="text-xs text-[#6B7280]">Cuota mensual estimada</p>
              <p className="text-base font-semibold text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ${cuotaEstimada.toFixed(2)}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Estimado en el navegador. El valor final lo calcula y guarda el servidor.
              </p>
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
              {isSubmitting ? 'Guardando…' : 'Crear crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}