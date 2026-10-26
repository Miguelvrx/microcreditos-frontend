import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TEAL = '#0F766E';
const NAVY = '#1E3A5F';

interface ErrorLogin {
  code?: string;
  response?: { status?: number };
}

export default function Login() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [avisoSesion, setAvisoSesion] = useState(
    () => sessionStorage.getItem('sesion_expirada') === '1'
  );
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem('sesion_expirada');
  }, []);


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAvisoSesion(false);
    setCargando(true);

    try {
      await login({ nombreUsuario, password });
      navigate('/');
    } catch (err: unknown) {
      const e = err as ErrorLogin;
      if (e.response?.status === 401) {
        setError('Usuario o contraseña incorrectos');
      } else if (e.code === 'ERR_NETWORK' || !e.response) {
        setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
      } else {
        setError('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  // text-base en móvil evita el zoom automático de iOS al enfocar un input.
  const claseInput =
    'w-full rounded-lg border border-[#D5D8DE] bg-white px-3.5 py-3 text-base sm:text-sm text-[#1B1F2A] placeholder:text-[#9CA3AF] transition focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/25';

  return (
    <div className="min-h-screen bg-[#F7F8FA] lg:grid lg:grid-cols-2">
      {/* Panel de marca: solo en pantallas grandes */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 text-white"
        style={{ background: `linear-gradient(145deg, ${TEAL} 0%, ${NAVY} 100%)` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-semibold">
            M
          </div>
          <span className="text-lg font-semibold">Microcréditos</span>
        </div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Gestiona clientes, créditos
            <br />
            y cartera en un solo lugar.
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/75">
            Controla pagos, detecta la mora a tiempo y genera reportes cuando los necesites.
          </p>
        </div>

        <p className="text-xs text-white/60">© {new Date().getFullYear()} Microcréditos</p>
      </aside>

      {/* Formulario */}
      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:min-h-0">
        <div className="w-full max-w-sm">
          {/* Marca visible solo en móvil/tablet (en desktop está en el panel) */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-semibold text-white"
              style={{ backgroundColor: TEAL }}
            >
              M
            </div>
            <span className="text-lg font-semibold text-[#1B1F2A]">Microcréditos</span>
          </div>

          <div className="rounded-xl border border-[#E2E4E9] bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold text-[#1B1F2A]">Iniciar sesión</h1>
            <p className="mt-1 mb-6 text-sm text-[#6B7280]">Ingresa tus datos para acceder al sistema</p>
            {avisoSesion && (
              <div
                role="status"
                className="mb-4 rounded-lg border border-[#C9D8EA] bg-[#EFF5FB] px-3.5 py-2.5 text-sm text-[#1E3A5F]"
              >
                Tu sesión expiró. Inicia sesión de nuevo para continuar.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
              <div>
                <label htmlFor="nombreUsuario" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                  Usuario
                </label>
                <input
                  id="nombreUsuario"
                  type="text"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="Tu nombre de usuario"
                  className={claseInput}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={verPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    className={`${claseInput} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#6B7280] hover:text-[#1B1F2A]"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {verPassword ? (
                        <>
                          <path d="M3 3l18 18" />
                          <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4 9.5 6a12 12 0 0 1-2.6 3.3M6.6 6.7A12.3 12.3 0 0 0 2.5 12c1 2 4.5 6 9.5 6a9.7 9.7 0 0 0 4-.9" />
                          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                        </>
                      ) : (
                        <>
                          <path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#F3D7C4] bg-[#FFF7ED] px-3.5 py-2.5 text-sm text-[#9A3412]"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: TEAL }}
              >
                {cargando && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[#9CA3AF] lg:hidden">
            © {new Date().getFullYear()} Microcréditos
          </p>
        </div>
      </main>
    </div>
  );
}