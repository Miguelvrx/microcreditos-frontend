import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificacionBell from './NotificacionBell';

const TEAL = '#0F766E';
const TEAL_SUAVE = '#E6F2F1'; // fondo tenue del enlace activo

export type PaginaActiva = 'clientes' | 'dashboard' | 'usuarios' | 'auditoria';

interface NavBarProps {
  activo: PaginaActiva;
}

interface Enlace {
  pagina: PaginaActiva;
  ruta: string;
  texto: string;
  icono: ReactNode;
  soloAdmin?: boolean;
}

/* ---------- Iconos (estilo Lucide, trazo fino, sin dependencias) ---------- */

function Icono({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const IconoClientes = (
  <Icono>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icono>
);

const IconoDashboard = (
  <Icono>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Icono>
);

const IconoUsuarios = (
  <Icono>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </Icono>
);

const IconoAuditoria = (
  <Icono>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </Icono>
);

const IconoSalir = (
  <Icono>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icono>
);

/* ---------- Enlaces ---------- */

const ENLACES: Enlace[] = [
  { pagina: 'clientes', ruta: '/', texto: 'Clientes', icono: IconoClientes },
  { pagina: 'dashboard', ruta: '/dashboard', texto: 'Dashboard', icono: IconoDashboard },
  { pagina: 'usuarios', ruta: '/usuarios', texto: 'Usuarios', icono: IconoUsuarios, soloAdmin: true },
  { pagina: 'auditoria', ruta: '/auditoria', texto: 'Auditoría', icono: IconoAuditoria, soloAdmin: true },
];

export default function NavBar({ activo }: NavBarProps) {
  const navigate = useNavigate();
  const { nombreUsuario, rol, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlacesVisibles = ENLACES.filter((e) => !e.soloAdmin || rol === 'ADMIN');
  const inicial = nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'A';

  function ir(ruta: string) {
    navigate(ruta);
    setMenuAbierto(false);
  }

  function handleLogout() {
    setMenuAbierto(false);
    logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-[#E2E4E9] bg-white sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between">
        {/* Izquierda: logo + links (links solo en desktop) */}
        <div className="flex items-center gap-6">
          <span className="text-[15px] font-semibold text-[#1B1F2A]">Microcréditos</span>

          <nav className="hidden md:flex items-center gap-1">
            {enlacesVisibles.map((e) => {
              const esActivo = e.pagina === activo;
              return (
                <button
                  key={e.pagina}
                  type="button"
                  onClick={() => ir(e.ruta)}
                  aria-current={esActivo ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    esActivo
                      ? 'font-medium'
                      : 'text-[#6B7280] hover:text-[#1B1F2A] hover:bg-gray-100'
                  }`}
                  style={esActivo ? { color: TEAL, backgroundColor: TEAL_SUAVE } : undefined}
                >
                  {e.icono}
                  {e.texto}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Derecha desktop */}
        <div className="hidden md:flex items-center gap-4">
          <NotificacionBell />

          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
              style={{ color: TEAL, backgroundColor: TEAL_SUAVE }}
              aria-hidden="true"
            >
              {inicial}
            </span>
            <span className="hidden lg:inline text-sm text-[#6B7280]">
              {nombreUsuario ?? 'Administrador'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-[#1B1F2A] hover:text-[#0F766E] transition-colors"
          >
            {IconoSalir}
            Cerrar sesión
          </button>
        </div>

        {/* Derecha móvil: campana + hamburguesa */}
        <div className="flex md:hidden items-center gap-2">
          <NotificacionBell />
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
            className="p-2 rounded-md text-[#1B1F2A] hover:bg-gray-100"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuAbierto ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Panel desplegable móvil */}
      {menuAbierto && (
        <div className="md:hidden border-t border-[#E2E4E9] bg-white px-4 py-3 flex flex-col">
          {enlacesVisibles.map((e) => {
            const esActivo = e.pagina === activo;
            return (
              <button
                key={e.pagina}
                type="button"
                onClick={() => ir(e.ruta)}
                aria-current={esActivo ? 'page' : undefined}
                className={`flex items-center gap-3 text-left py-3 text-sm border-b border-[#F1F2F5] ${
                  esActivo ? 'font-medium' : 'text-[#6B7280]'
                }`}
                style={esActivo ? { color: TEAL } : undefined}
              >
                {e.icono}
                {e.texto}
              </button>
            );
          })}

          <div className="pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ color: TEAL, backgroundColor: TEAL_SUAVE }}
                aria-hidden="true"
              >
                {inicial}
              </span>
              <span className="text-sm text-[#6B7280] truncate">
                {nombreUsuario ?? 'Administrador'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1B1F2A]"
            >
              {IconoSalir}
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}