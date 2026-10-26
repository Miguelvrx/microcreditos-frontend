import { useState } from 'react';
import type { CobradorResumen, Credito } from '../types/Credito';
import { cobradorService } from '../services/cobradorService';

const TEAL = '#0F766E';

interface CobradorCreditoProps {
  credito: Credito;
  // Solo true para el rol ADMIN. El backend lo vuelve a validar (403); esto solo decide si se muestra "Cambiar".
  puedeAsignar: boolean;
  // Avisa al padre que recargue los créditos para reflejar el cambio.
  onCambiado: () => void;
}

export default function CobradorCredito({ credito, puedeAsignar, onCambiado }: CobradorCreditoProps) {
  const [editando, setEditando] = useState(false);
  const [cobradores, setCobradores] = useState<CobradorResumen[]>([]);
  const [seleccion, setSeleccion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actual = credito.cobradorAsignado ?? null;

  async function abrirEdicion() {
    setError(null);
    setSeleccion(actual ? String(actual.id) : '');
    setEditando(true);
    try {
      setCobradores(await cobradorService.listar());
    } catch {
      setError('No se pudo cargar la lista de cobradores.');
    }
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      await cobradorService.asignar(credito.id, seleccion === '' ? null : Number(seleccion));
      setEditando(false);
      onCambiado();
    } catch (err: unknown) {
      const mensaje = (err as { response?: { data?: unknown } })?.response?.data;
      setError(typeof mensaje === 'string' ? mensaje : 'No se pudo asignar el cobrador. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  // Si el cobrador actual se desactivó, ya no viene en la lista: se conserva como opción para no perderlo de vista.
  const opciones =
    actual && !cobradores.some((c) => c.id === actual.id)
      ? [{ id: actual.id, nombreUsuario: `${actual.nombreUsuario} (desactivado)` }, ...cobradores]
      : cobradores;

  return (
    <div className="px-6 py-3 border-b border-[#E2E4E9] text-sm">
      {!editando ? (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[#6B7280]">Cobrador: </span>
          <span className="font-medium text-[#1B1F2A]">{actual ? actual.nombreUsuario : 'Sin asignar'}</span>
          {puedeAsignar && (
            <button
              type="button"
              onClick={abrirEdicion}
              className="text-sm font-medium hover:underline"
              style={{ color: TEAL }}
            >
              {actual ? 'Cambiar' : 'Asignar'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor={`cobrador-${credito.id}`} className="text-[#6B7280]">
            Cobrador:
          </label>
          <select
            id={`cobrador-${credito.id}`}
            value={seleccion}
            onChange={(e) => setSeleccion(e.target.value)}
            disabled={guardando}
            className="rounded-md border border-[#E2E4E9] bg-white px-3 py-1.5 text-sm text-[#1B1F2A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <option value="">Sin cobrador</option>
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombreUsuario}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: TEAL }}
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={guardando}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F7F8FA]"
          >
            Cancelar
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-[#B91C1C]">{error}</p>}
    </div>
  );
}