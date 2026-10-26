import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clienteService } from '../services/clienteService';

const TEAL = '#0F766E';

// Reglas de validación. Ajusta los mensajes/límites si tu negocio los define distinto.
const clienteSchema = z.object({
  nombreCompleto: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  numeroDocumento: z
    .string()
    .trim()
    .min(5, 'El documento debe tener al menos 5 caracteres')
    .max(20, 'El documento no puede superar 20 caracteres'),
  telefono: z
    .string()
    .trim()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono no puede superar 20 caracteres'),
  direccion: z
    .string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'La dirección no puede superar 200 caracteres'),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

interface ClienteFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

// text-base en móvil evita el zoom automático de iOS al enfocar un input.
const claseInput =
  'w-full rounded-lg border border-[#E2E4E9] bg-white px-3.5 py-2.5 text-base sm:text-sm text-[#1B1F2A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/25';

export default function ClienteFormModal({ onClose, onCreated }: ClienteFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
  });

  // Cierra con la tecla Escape y bloquea el scroll de la página de fondo.
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

  const onSubmit = async (data: ClienteFormValues) => {
    try {
      await clienteService.crear(data);
      onCreated();
    } catch (err: unknown) {
      // Caso típico: numeroDocumento duplicado (columna unique en el backend) -> 500/400
      setError('numeroDocumento', {
        message: 'No se pudo guardar. Verifica que el documento no esté ya registrado.',
      });
      console.error(err);
    }
  };

  return (
    // Móvil: la hoja sube desde abajo (items-end). Desde sm: modal centrado.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-cliente"
        className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-lg sm:max-h-[90dvh] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado fijo */}
        <div className="flex items-center justify-between border-b border-[#EEF0F3] px-5 py-4 sm:px-6">
          <h2 id="titulo-nuevo-cliente" className="text-lg font-semibold text-[#1B1F2A]">
            Nuevo cliente
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
          {/* Campos: esta zona hace scroll si el teclado o la pantalla son pequeños */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <label htmlFor="nombreCompleto" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                Nombre completo
              </label>
              <input
                id="nombreCompleto"
                type="text"
                autoComplete="off"
                {...register('nombreCompleto')}
                className={claseInput}
                placeholder="Juan Pérez"
              />
              {errors.nombreCompleto && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.nombreCompleto.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="numeroDocumento" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                Número de documento
              </label>
              <input
                id="numeroDocumento"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                {...register('numeroDocumento')}
                className={claseInput}
                placeholder="12345678"
              />
              {errors.numeroDocumento && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.numeroDocumento.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="telefono" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                {...register('telefono')}
                className={claseInput}
                placeholder="5512345678"
              />
              {errors.telefono && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.telefono.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="direccion" className="mb-1.5 block text-sm font-medium text-[#1B1F2A]">
                Dirección
              </label>
              <input
                id="direccion"
                type="text"
                autoComplete="off"
                {...register('direccion')}
                className={claseInput}
                placeholder="Calle Falsa 123"
              />
              {errors.direccion && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.direccion.message}</p>
              )}
            </div>
          </div>

          {/* Pie fijo: botones apilados a lo ancho en móvil, a la derecha en desktop */}
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
              {isSubmitting ? 'Guardando…' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}