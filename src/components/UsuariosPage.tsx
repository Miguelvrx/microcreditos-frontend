import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { usuarioService } from '../services/usuarioService';
import type { Usuario } from '../types/Usuario';
import UsuarioFormModal from './UsuarioFormModal';
import NavBar from './NavBar';

const NAVY = '#1E3A5F';
const TEAL = '#0F766E';

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
            className="w-full sm:w-auto rounded-md px-4 py-2.5 sm:py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: TEAL }}
          >
            + Nuevo usuario
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
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-[#1B1F2A] break-words min-w-0">
                        {usuario.nombreUsuario}
                        {esUsuarioActual && <span className="text-[#6B7280] font-normal"> (tú)</span>}
                      </p>
                      <span
                        className="shrink-0 text-xs font-medium"
                        style={{ color: usuario.activo ? TEAL : '#B45309' }}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#6B7280]">{usuario.rol}</p>

                    <button
                      type="button"
                      onClick={() => toggleActivo(usuario)}
                      disabled={esUsuarioActual}
                      title={esUsuarioActual ? 'No puedes desactivar tu propio usuario' : undefined}
                      className="mt-4 w-full rounded-md border py-2.5 text-sm font-medium transition-colors hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        color: esUsuarioActual ? '#6B7280' : usuario.activo ? '#B45309' : TEAL,
                        borderColor: esUsuarioActual ? '#E2E4E9' : usuario.activo ? '#B45309' : TEAL,
                      }}
                    >
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
                  <tr className="border-b border-[#E2E4E9] text-[#6B7280]">
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
                        className={index !== usuarios.length - 1 ? 'border-b border-[#EEF0F3]' : ''}
                      >
                        <td className="px-5 py-3 text-[#1B1F2A] font-medium">
                          {usuario.nombreUsuario}
                          {esUsuarioActual && <span className="text-[#6B7280] font-normal"> (tú)</span>}
                        </td>
                        <td className="px-5 py-3 text-[#6B7280]">{usuario.rol}</td>
                        <td className="px-5 py-3">
                          <span
                            className="text-xs font-medium"
                            style={{ color: usuario.activo ? TEAL : '#B45309' }}
                          >
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleActivo(usuario)}
                            disabled={esUsuarioActual}
                            title={esUsuarioActual ? 'No puedes desactivar tu propio usuario' : undefined}
                            className="text-sm font-medium hover:underline disabled:no-underline disabled:cursor-not-allowed disabled:text-[#6B7280]"
                            style={{ color: esUsuarioActual ? undefined : usuario.activo ? '#B45309' : TEAL }}
                          >
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