import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificacionBell from './NotificacionBell';

const TEAL = '#0F766E';

export type PaginaActiva = 'clientes' | 'dashboard' | 'usuarios' | 'auditoria';

interface NavBarProps {
  activo: PaginaActiva;
}

interface Enlace {
  pagina: PaginaActiva;
  ruta: string;
  texto: string;
  soloAdmin?: boolean;
}

const ENLACES: Enlace[] = [
  { pagina: 'clientes', ruta: '/', texto: 'Clientes' },
  { pagina: 'dashboard', ruta: '/dashboard', texto: 'Dashboard' },
  { pagina: 'usuarios', ruta: '/usuarios', texto: 'Usuarios', soloAdmin: true },
  { pagina: 'auditoria', ruta: '/auditoria', texto: 'Auditoría', soloAdmin: true },
];

export default function NavBar({ activo }: NavBarProps) {
  const navigate = useNavigate();
  const { nombreUsuario, rol, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlacesVisibles = ENLACES.filter((e) => !e.soloAdmin || rol === 'ADMIN');

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

          <nav className="hidden md:flex items-center gap-6">
            {enlacesVisibles.map((e) => (
              <button
                key={e.pagina}
                type="button"
                onClick={() => ir(e.ruta)}
                className={
                  e.pagina === activo
                    ? 'text-sm font-medium'
                    : 'text-sm text-[#6B7280] hover:text-[#1B1F2A] transition-colors'
                }
                style={e.pagina === activo ? { color: TEAL } : undefined}
              >
                {e.texto}
              </button>
            ))}
          </nav>
        </div>

        {/* Derecha desktop */}
        <div className="hidden md:flex items-center gap-4">
          <NotificacionBell />
          <span className="hidden lg:inline text-sm text-[#6B7280]">
            {nombreUsuario ? `Hola, ${nombreUsuario}` : 'Panel de administración'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-[#1B1F2A] hover:text-[#0F766E] transition-colors"
          >
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
          {enlacesVisibles.map((e) => (
            <button
              key={e.pagina}
              type="button"
              onClick={() => ir(e.ruta)}
              className={`text-left py-3 text-sm border-b border-[#F1F2F5] ${
                e.pagina === activo ? 'font-medium' : 'text-[#6B7280]'
              }`}
              style={e.pagina === activo ? { color: TEAL } : undefined}
            >
              {e.texto}
            </button>
          ))}

          <div className="pt-3 flex items-center justify-between">
            <span className="text-sm text-[#6B7280] truncate">
              {nombreUsuario ? `Hola, ${nombreUsuario}` : 'Panel de administración'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-[#1B1F2A]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}