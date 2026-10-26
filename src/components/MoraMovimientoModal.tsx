import { useState } from 'react';
import type { FormEvent } from 'react';
import { moraService } from '../services/moraService';
import type { ResumenMora, TipoMovimientoMora } from '../types/Mora';

interface MoraMovimientoModalProps {
  creditoId: number;
  tipo: TipoMovimientoMora; // COBRO: cobrar mora. CONDONACION: perdonarla (con motivo).
  saldo: number; // saldo de mora actual: es el tope del monto
  onClose: () => void;
  onRegistrado: (resumen: ResumenMora) => void;
}

const TEAL = '#0F766E';
const NAVY = '#1E3A5F';
const MAX_MOTIVO = 300;

function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function mensajeDeError(err: unknown): string {
  const respuesta = (err as { response?: { status?: number; data?: unknown } })?.response;
  if (respuesta?.status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }
  if ((respuesta?.status === 400 || respuesta?.status === 404) && typeof respuesta.data === 'string') {
    return respuesta.data;
  }
  return 'No se pudo conectar con el servidor. Intenta de nuevo.';
}

export default function MoraMovimientoModal({
  creditoId,
  tipo,
  saldo,
  onClose,
  onRegistrado,
}: MoraMovimientoModalProps) {
  const esCobro = tipo === 'COBRO';
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const valor = redondear2(Number(monto));
    if (!Number.isFinite(valor) || valor <= 0) {
      setError('Escribe un monto mayor a 0.');
      return;
    }
    if (valor > redondear2(saldo)) {
      setError(`El monto no puede superar el saldo de mora ($${saldo.toFixed(2)}).`);
      return;
    }
    if (!esCobro && motivo.trim() === '') {
      setError('El motivo de la condonación es obligatorio.');
      return;
    }

    setEnviando(true);
    try {
      const resumen = esCobro
        ? await moraService.cobrar(creditoId, valor)
        : await moraService.condonar(creditoId, valor, motivo.trim());
      onRegistrado(resumen);
    } catch (err: unknown) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  const claseInput =
    'w-full rounded-md border border-[#E2E4E9] bg-white px-3 py-2 text-sm text-[#1B1F2A] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/25';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[70]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E2E4E9]">
          <h2 className="text-lg font-semibold text-[#1B1F2A]">
            {esCobro ? 'Cobrar mora' : 'Condonar mora'}
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Saldo de mora:{' '}
            <span className="font-medium text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              ${saldo.toFixed(2)}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="monto-mora" className="text-sm font-medium text-[#1B1F2A]">
              Monto
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="monto-mora"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                autoFocus
                placeholder="0.00"
                className={claseInput}
              />
              <button
                type="button"
                onClick={() => setMonto(saldo.toFixed(2))}
                className="whitespace-nowrap text-xs font-medium hover:underline"
                style={{ color: TEAL }}
              >
                Todo el saldo
              </button>
            </div>
          </div>

          {!esCobro && (
            <div>
              <label htmlFor="motivo-mora" className="text-sm font-medium text-[#1B1F2A]">
                Motivo
              </label>
              <textarea
                id="motivo-mora"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={MAX_MOTIVO}
                rows={3}
                placeholder="Por qué se perdona esta mora"
                className={`mt-1 ${claseInput}`}
              />
              <p className="mt-1 text-right text-xs text-[#9CA3AF]">
                {motivo.length}/{MAX_MOTIVO}
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-md border border-[#F3D7C4] bg-[#FFF7ED] px-4 py-2 text-sm text-[#9A3412]"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="rounded-md px-4 py-2 text-sm font-medium border border-[#E2E4E9] text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: esCobro ? TEAL : NAVY }}
            >
              {enviando ? 'Guardando…' : esCobro ? 'Cobrar' : 'Condonar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}