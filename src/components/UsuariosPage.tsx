import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usuarioService } from '../services/usuarioService';
import type { Usuario } from '../types/Usuario';
import UsuarioFormModal from './UsuarioFormModal';
import NavBar from './NavBar';

const NAVY = '#1E3A5F';
const TEAL = '#0F766E';
const TEAL_SUAVE = '#E6F2F1';
const AMBAR = '#B45309';
const AMBAR_SUAVE = '#FEF3E2';

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

const IconoMas = (
  <Icono>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Icono>
);

const IconoDesactivar = (
  <Icono>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m17 8 5 5" />
    <path d="m22 8-5 5" />
  </Icono>
);

const IconoActivar = (
  <Icono>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m16 11 2 2 4-4" />
  </Icono>
);

/* ---------- Auxiliares ---------- */

function Avatar({ nombre }: { nombre: string }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ color: TEAL, backgroundColor: TEAL_SUAVE }}
      aria-hidden="true"
    >
      {nombre.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

function colorRol(rol: string): { color: string; fondo: string } {
  switch (rol) {
    case 'ADMIN':
      return { color: TEAL, fondo: TEAL_SUAVE };
    case 'OPERADOR':
      return { color: NAVY, fondo: '#EAF0F7' };
    default:
      return { color: '#4B5563', fondo: '#F1F2F5' };
  }
}

function InsigniaRol({ rol }: { rol: string }) {
  const { color, fondo } = colorRol(rol);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color, backgroundColor: fondo }}
    >
      {rol}
    </span>
  );
}

function InsigniaEstado({ activo }: { activo: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        color: activo ? TEAL : AMBAR,
        backgroundColor: activo ? TEAL_SUAVE : AMBAR_SUAVE,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: activo ? TEAL : AMBAR }}
        aria-hidden="true"
      />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { nombreUsuario } = useAuth();

  const cargarUsuarios = () => {
    setLoading(true);
    setError(null);
    usuarioService
      .listarTodos()
      .then(setUsuarios)
      .catch(() =>
        setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en localhost:8080.')
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function toggleActivo(usuario: Usuario) {
    setAccionError(null);
    try {
      if (usuario.activo) {
        await usuarioService.desactivar(usuario.id);
      } else {
        await usuarioService.activar(usuario.id);
      }
      cargarUsuarios();
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: string } })?.response?.data ??
        'No se pudo actualizar el usuario.';
      setAccionError(mensaje);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <NavBar activo="usuarios" />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1B1F2A]">Usuarios</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {loading ? 'Cargando…' : `${usuarios.length} ${usuarios.length === 1 ? 'usuario' : 'usuarios'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md px-4 py-2.5 sm:py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: TEAL }}
          >
            {IconoMas}
            Nuevo usuario
          </button>
        </div>

        {accionError && (
          <div className="mb-4 rounded-md border border-[#F3D7C4] bg-[#FFF7ED] px-4 py-2 text-sm text-[#9A3412]">
            {accionError}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-[#E2E4E9] bg-white px-6 py-16 text-center text-sm text-[#6B7280]">
            Cargando usuarios…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-[#F3D7C4] bg-[#FFF7ED] px-6 py-8 text-center">
            <p className="text-sm text-[#9A3412]">{error}</p>
            <button
              type="button"
              onClick={cargarUsuarios}
              className="mt-3 text-sm font-medium underline"
              style={{ color: NAVY }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* MÓVIL: tarjetas */}
            <ul className="md:hidden space-y-3">
              {usuarios.map((usuario) => {
                const esUsuarioActual = usuario.nombreUsuario === nombreUsuario;
                return (
                  <li
                    key={usuario.id}
                    className="rounded-lg border border-[#E2E4E9] bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar nombre={usuario.nombreUsuario} />
                        <p className="font-medium text-[#1B1F2A] break-words min-w-0">
                          {usuario.nombreUsuario}
                          {esUsuarioActual && <span className="text-[#6B7280] font-normal"> (tú)</span>}
                        </p>
                      </div>
                      <InsigniaEstado activo={usuario.activo} />
                    </div>

                    <div className="mt-3">
                      <InsigniaRol rol={usuario.rol} />
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleActivo(usuario)}
                      disabled={esUsuarioActual}
                      title={esUsuarioActual ? 'No puedes desactivar tu propio usuario' : undefined}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        color: esUsuarioActual ? '#6B7280' : usuario.activo ? AMBAR : TEAL,
                        borderColor: esUsuarioActual ? '#E2E4E9' : usuario.activo ? AMBAR : TEAL,
                      }}
                    >
                      {usuario.activo ? IconoDesactivar : IconoActivar}
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* DESKTOP/TABLET: tabla */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E2E4E9] bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E4E9] bg-[#FAFAFB] text-[#6B7280]">
                    <th className="px-5 py-3 font-medium">Usuario</th>
                    <th className="px-5 py-3 font-medium">Rol</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario, index) => {
                    const esUsuarioActual = usuario.nombreUsuario === nombreUsuario;
                    return (
                      <tr
                        key={usuario.id}
                        className={`transition-colors hover:bg-[#FAFAFB] ${
                          index !== usuarios.length - 1 ? 'border-b border-[#EEF0F3]' : ''
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar nombre={usuario.nombreUsuario} />
                            <span className="text-[#1B1F2A] font-medium">
                              {usuario.nombreUsuario}
                              {esUsuarioActual && <span className="text-[#6B7280] font-normal"> (tú)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <InsigniaRol rol={usuario.rol} />
                        </td>
                        <td className="px-5 py-3">
                          <InsigniaEstado activo={usuario.activo} />
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleActivo(usuario)}
                            disabled={esUsuarioActual}
                            title={esUsuarioActual ? 'No puedes desactivar tu propio usuario' : undefined}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-[#F1F2F5] disabled:cursor-not-allowed disabled:text-[#9CA3AF] disabled:hover:bg-transparent"
                            style={{ color: esUsuarioActual ? undefined : usuario.activo ? AMBAR : TEAL }}
                          >
                            {usuario.activo ? IconoDesactivar : IconoActivar}
                            {usuario.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {showForm && (
        <UsuarioFormModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            cargarUsuarios();
          }}
        />
      )}
    </div>
  );
}