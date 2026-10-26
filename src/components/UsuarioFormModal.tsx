import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usuarioService } from '../services/usuarioService';

const TEAL = '#0F766E';

const usuarioSchema = z.object({
  nombreUsuario: z.string().min(3, 'Mínimo 3 caracteres'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rol: z.enum(['ADMIN', 'OPERADOR', 'COBRADOR'], {
    errorMap: () => ({ message: 'Selecciona un rol' }),
  }),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

interface UsuarioFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

// text-base en móvil evita el zoom automático de iOS al enfocar un campo.
const claseInput =
  'w-full rounded-lg border border-[#E2E4E9] bg-white px-3.5 py-2.5 text-base sm:text-sm text-[#1B1F2A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/25';

export default function UsuarioFormModal({ onClose, onCreated }: UsuarioFormModalProps) {
  const [verPassword, setVerPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { rol: 'OPERADOR' },
  });

  // Cierra con Escape y bloquea el scroll de la página de fondo.
  useEffect(() => {
    function manejarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', manejarTecla);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  const onSubmit = async (data: UsuarioFormValues) => {
    try {
      await usuarioService.crear(data);
      onCreated();
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: string } })?.response?.data ??
        'No se pudo crear el usuario. Intenta de nuevo.';
      setError('nombreUsuario', { message: mensaje });
      console.error(err);
    }
  };

  return (
    // Móvil: la hoja sube desde abajo. Desde sm: modal centrado.
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-usuario"
        className="flex max-h-[92dvh] w-full max-w-sm flex-col rounded-t-2xl bg-white shadow-lg sm:max-h-[90dvh] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado fijo */}
        <div className="flex items-center justify-between border-b border-[#EEF0F3] px-5 py-4 sm:px-6">
          <h2 id="titulo-nuevo-usuario" className="text-lg font-semibold text-[#1B1F2A]">
            Nuevo usuario
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1B1F2A]"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          {/* Campos: hacen scroll si el teclado ocupa espacio */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <label htmlFor="nombreUsuario" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                Nombre de usuario
              </label>
              <input
                id="nombreUsuario"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                {...register('nombreUsuario')}
                className={claseInput}
              />
              {errors.nombreUsuario && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.nombreUsuario.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
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
              {errors.password && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="rol" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                Rol
              </label>
              <select id="rol" {...register('rol')} className={claseInput}>
                <option value="OPERADOR">OPERADOR</option>
                <option value="COBRADOR">COBRADOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              {errors.rol && <p className="mt-1 text-xs text-[#B91C1C]">{errors.rol.message}</p>}
            </div>
          </div>

          {/* Pie fijo: botones apilados en móvil, a la derecha en desktop */}
          <div className="flex flex-col-reverse gap-2 border-t border-[#EEF0F3] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:pb-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#E2E4E9] px-4 py-2.5 text-sm font-medium text-[#6B7280] hover:bg-[#F7F8FA] sm:border-transparent sm:py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:py-2"
              style={{ backgroundColor: TEAL }}
            >
              {isSubmitting ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}