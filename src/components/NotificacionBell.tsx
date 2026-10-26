import { useEffect, useRef, useState } from 'react';
import { notificacionService } from '../services/notificacionService';
import type { Notificacion } from '../types/Notificacion';

const INTERVALO_MS = 30_000;

function formatearFecha(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  return fecha.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificacionBell() {
  const [abierto, setAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Refresca solo el contador, cada 30s, sin abrir el dropdown.
  useEffect(() => {
    async function refrescarConteo() {
      try {
        const conteo = await notificacionService.contarNoLeidas();
        setNoLeidas(conteo);
      } catch {
        // Si falla (por ejemplo el token venció), el interceptor de axios
        // ya se encarga de redirigir a /login; aquí no hacemos nada más.
      }
    }
    refrescarConteo();
    const id = setInterval(refrescarConteo, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  // Cierra el dropdown si el usuario toca o hace clic fuera de él.
  useEffect(() => {
    function manejarClicFuera(e: MouseEvent | TouchEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', manejarClicFuera);
    document.addEventListener('touchstart', manejarClicFuera);
    return () => {
      document.removeEventListener('mousedown', manejarClicFuera);
      document.removeEventListener('touchstart', manejarClicFuera);
    };
  }, []);

  async function toggleDropdown() {
    const seVaAAbrir = !abierto;
    setAbierto(seVaAAbrir);
    if (seVaAAbrir) {
      setCargando(true);
      try {
        const lista = await notificacionService.listarRecientes();
        setNotificaciones(lista);
      } finally {
        setCargando(false);
      }
    }
  }

  async function manejarClicNotificacion(n: Notificacion) {
    if (n.leida) return;
    try {
      const actualizada = await notificacionService.marcarComoLeida(n.id);
      setNotificaciones((prev) => prev.map((item) => (item.id === n.id ? actualizada : item)));
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {
      // Si falla, dejamos la notificación como estaba; el usuario puede reintentar.
    }
  }

  async function marcarTodas() {
    try {
      await notificacionService.marcarTodasComoLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {
      // Igual que arriba: sin cambios locales si falla.
    }
  }

  return (
    // En móvil el contenedor NO es "relative": así el panel se posiciona
    // respecto al <header> (que es sticky) y puede ocupar todo el ancho.
    // Desde md (desktop) vuelve a ser relative y el panel cuelga de la campana.
    <div className="md:relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-[#F3F4F6] transition-colors"
        aria-label="Notificaciones"
        aria-expanded={abierto}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="w-5 h-5 text-[#1B1F2A]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-[18px] text-center font-medium">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute left-3 right-3 top-full mt-1 md:left-auto md:right-0 md:top-auto md:mt-2 md:w-80 bg-white border border-[#E2E4E9] rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E4E9]">
            <span className="text-sm font-medium text-[#1B1F2A]">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodas}
                className="text-xs text-[#0F766E] hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-[60vh] md:max-h-80 overflow-y-auto">
            {cargando && (
              <p className="px-4 py-6 text-sm text-[#6B7280] text-center">Cargando...</p>
            )}
            {!cargando && notificaciones.length === 0 && (
              <p className="px-4 py-6 text-sm text-[#6B7280] text-center">Sin notificaciones</p>
            )}
            {!cargando &&
              notificaciones.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => manejarClicNotificacion(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB] transition-colors ${
                    n.leida ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.leida && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0F766E] flex-shrink-0" />
                    )}
                    <div className={`min-w-0 ${n.leida ? 'pl-4' : ''}`}>
                      <p className="text-sm text-[#1B1F2A] break-words">{n.mensaje}</p>
                      <p className="text-xs text-[#6B7280] mt-1">{formatearFecha(n.fecha)}</p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}