import { useState } from 'react';
import { pagoService } from '../services/pagoService';
import type { Pago } from '../types/Pago';

interface AnularAbonoModalProps {
  creditoId: number;
  pagoId: number; // cualquier fila del abono: el backend anula el abono completo
  monto: number;
  primeraCuota: number;
  ultimaCuota: number;
  onClose: () => void;
  onAnulado: (reversos: Pago[]) => void;
}

const MAX_MOTIVO = 300; // mismo límite que motivo_anulacion en la base de datos
const DANGER = '#B91C1C';

// El backend responde los errores de negocio como texto plano en el cuerpo (400/404).
// Un 403 significa que el usuario no tiene rol ADMIN.
function mensajeDeError(err: unknown): string {
  const response = (err as { response?: { status?: number; data?: unknown } }).response;
  if (response?.status === 403) {
    return 'Solo un administrador puede anular abonos.';
  }
  if (typeof response?.data === 'string' && response.data.trim() !== '') {
    return response.data;
  }
  return 'No se pudo anular el abono. Intenta de nuevo.';
}

export default function AnularAbonoModal({
  creditoId,
  pagoId,
  monto,
  primeraCuota,
  ultimaCuota,
  onClose,
  onAnulado,
}: AnularAbonoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rangoCuotas =
    primeraCuota === ultimaCuota
      ? `la cuota ${primeraCuota}`
      : `las cuotas ${primeraCuota} a ${ultimaCuota}`;

  const motivoValido = motivo.trim().length > 0;

  async function handleConfirmar() {
    if (!motivoValido || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const reversos = await pagoService.anular(pagoId, motivo.trim());
      onAnulado(reversos);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  function handleCerrar() {
    if (!enviando) onClose();
  }

  return (
    // stopPropagation: este modal se renderiza dentro de CreditoDetalleModal,
    // cuyo contenedor cierra al hacer clic; sin esto, cerraría los dos a la vez.
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[70]"
      onClick={(e) => {
        e.stopPropagation();
        handleCerrar();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="anular-abono-titulo"
      >
        <div className="px-6 py-4 border-b border-[#E2E4E9]">
          <h2 id="anular-abono-titulo" className="text-lg font-semibold text-[#1B1F2A]">
            Anular abono
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Crédito #{creditoId}</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-[#1B1F2A]">
            Se anulará el abono de{' '}
            <span className="font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
              ${monto.toFixed(2)}
            </span>{' '}
            aplicado a {rangoCuotas}. Las cuotas volverán a quedar pendientes y el crédito se
            reabrirá si estaba pagado. El registro original se conserva en el historial y la
            anulación queda auditada.
          </p>

          <div>
            <label htmlFor="motivo-anulacion" className="block text-sm font-medium text-[#1B1F2A] mb-1">
              Motivo de la anulación
            </label>
            <textarea
              id="motivo-anulacion"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, MAX_MOTIVO))}
              rows={3}
              disabled={enviando}
              autoFocus
              placeholder="Ej. Monto capturado por error"
              className="w-full rounded-md border border-[#E2E4E9] px-3 py-2 text-sm text-[#1B1F2A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F766E] disabled:opacity-60"
            />
            <div className="mt-1 text-right text-xs text-[#6B7280]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {motivo.length}/{MAX_MOTIVO}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-[#F3D7C4] bg-[#FFF7ED] px-4 py-2 text-sm text-[#9A3412]"
            >
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E2E4E9] flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCerrar}
            disabled={enviando}
            className="rounded-md px-3 py-1.5 text-sm font-medium border border-[#E2E4E9] text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!motivoValido || enviando}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: DANGER }}
          >
            {enviando ? 'Anulando…' : 'Anular abono'}
          </button>
        </div>
      </div>
    </div>
  );
}