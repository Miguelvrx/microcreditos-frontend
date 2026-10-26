import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { auditoriaService } from '../services/auditoriaService';
import type { AccionAuditoria, AuditoriaFiltros, AuditoriaPagina } from '../types/Auditoria';
import NavBar from './NavBar';

const NAVY = '#1E3A5F';
const TEAL = '#0F766E';
const AMBER = '#B45309';
const GRIS = '#6B7280';

const TAMANO_PAGINA = 20;

// Etiqueta legible y color de cada acción. Verde azulado = algo se completó
// o se habilitó; ámbar = algo se rechazó, se desactivó o requiere atención.
const ACCIONES: Record<AccionAuditoria, { label: string; color: string }> = {
  CREDITO_APROBADO: { label: 'Crédito aprobado', color: TEAL },
  CREDITO_RECHAZADO: { label: 'Crédito rechazado', color: AMBER },
  CREDITO_EN_MORA: { label: 'Crédito en mora', color: AMBER },
  CREDITO_PAGADO: { label: 'Crédito pagado', color: TEAL },
  CREDITO_AL_DIA: { label: 'Crédito al día', color: TEAL },
  CREDITO_CREADO: { label: 'Crédito creado', color: TEAL },
  PAGO_REGISTRADO: { label: 'Pago registrado', color: TEAL },
  USUARIO_CREADO: { label: 'Usuario creado', color: TEAL },
  USUARIO_ACTIVADO: { label: 'Usuario activado', color: TEAL },
  USUARIO_DESACTIVADO: { label: 'Usuario desactivado', color: AMBER },
  CLIENTE_CREADO: { label: 'Cliente creado', color: TEAL },
  CLIENTE_EDITADO: { label: 'Cliente editado', color: TEAL },
  LOGIN_EXITOSO: { label: 'Inicio de sesión', color: TEAL },
  LOGIN_FALLIDO: { label: 'Intento de inicio fallido', color: AMBER },
  CREDITO_ELIMINADO: { label: 'Crédito eliminado', color: AMBER },
  CLIENTE_ELIMINADO: { label: 'Cliente eliminado', color: AMBER },
  PAGO_ANULADO: { label: 'Pago anulado', color: AMBER },
  CREDITO_REABIERTO: { label: 'Crédito reabierto', color: AMBER },
  MORA_COBRADA: { label: 'Mora cobrada', color: TEAL },
  MORA_CONDONADA: { label: 'Mora condonada', color: AMBER },
};

const ENTIDADES: Record<string, string> = {
  Credito: 'Crédito',
  Pago: 'Pago',
  Usuario: 'Usuario',
  Cliente: 'Cliente',
};

function formatoFecha(fecha: string): string {
  // Se recorta a segundos: LocalDateTime puede traer más decimales de los
  // que algunos navegadores saben interpretar.
  const d = new Date(fecha.slice(0, 19));
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function mensajeDeError(err: unknown): string {
  const respuesta = (err as { response?: { status?: number; data?: unknown } })?.response;
  if (respuesta?.status === 403) {
    return 'No tienes permiso para ver el historial de auditoría.';
  }
  if (respuesta?.status === 400 && typeof respuesta.data === 'string') {
    return respuesta.data;
  }
  return 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en localhost:8080.';
}

export default function AuditoriaPage() {
  // Valores que el usuario está escribiendo en el formulario de filtros.
  const [usuarioInput, setUsuarioInput] = useState('');
  const [accionInput, setAccionInput] = useState('');
  const [desdeInput, setDesdeInput] = useState('');
  const [hastaInput, setHastaInput] = useState('');
  const [errorFiltros, setErrorFiltros] = useState<string | null>(null);

  // Filtros realmente aplicados a la consulta (cambian solo al pulsar "Filtrar").
  const [aplicados, setAplicados] = useState<AuditoriaFiltros>({});
  const [pagina, setPagina] = useState(0);
  const [recarga, setRecarga] = useState(0);

  const [datos, setDatos] = useState<AuditoriaPagina | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    auditoriaService
      .listar({ ...aplicados, pagina, tamano: TAMANO_PAGINA })
      .then((resultado) => {
        if (!cancelado) setDatos(resultado);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(mensajeDeError(err));
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    // Si los filtros o la página cambian antes de que termine la petición
    // anterior, se descarta su resultado para no mostrar datos desactualizados.
    return () => {
      cancelado = true;
    };
  }, [aplicados, pagina, recarga]);

  function aplicarFiltros(e: FormEvent) {
    e.preventDefault();

    if (desdeInput && hastaInput && desdeInput > hastaInput) {
      setErrorFiltros('La fecha "Desde" no puede ser posterior a "Hasta".');
      return;
    }
    setErrorFiltros(null);

    setAplicados({
      usuario: usuarioInput.trim() || undefined,
      accion: accionInput || undefined,
      desde: desdeInput || undefined,
      hasta: hastaInput || undefined,
    });
    setPagina(0);
  }

  function limpiarFiltros() {
    setUsuarioInput('');
    setAccionInput('');
    setDesdeInput('');
    setHastaInput('');
    setErrorFiltros(null);
    setAplicados({});
    setPagina(0);
  }

  const hayFiltros = Object.values(aplicados).some(Boolean);
  const totalPaginas = datos?.totalPaginas ?? 0;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <NavBar activo="auditoria" />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1B1F2A]">Auditoría</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {datos
              ? `${datos.totalElementos} ${datos.totalElementos === 1 ? 'registro' : 'registros'}${hayFiltros ? ' con los filtros aplicados' : ''}`
              : 'Historial de acciones realizadas en el sistema.'}
          </p>
        </div>

        <form
          onSubmit={aplicarFiltros}
          className="mb-6 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="min-w-0">
              <label htmlFor="filtro-usuario" className="text-xs text-[#6B7280]">
                Usuario
              </label>
              <input
                id="filtro-usuario"
                type="text"
                value={usuarioInput}
                onChange={(e) => setUsuarioInput(e.target.value)}
                placeholder="Nombre o parte del nombre"
                className="mt-1 w-full rounded-md border border-[#E2E4E9] bg-white px-3 py-2.5 sm:py-2 text-sm text-[#1B1F2A]"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="filtro-accion" className="text-xs text-[#6B7280]">
                Acción
              </label>
              <select
                id="filtro-accion"
                value={accionInput}
                onChange={(e) => setAccionInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#E2E4E9] bg-white px-3 py-2.5 sm:py-2 text-sm text-[#1B1F2A]"
              >
                <option value="">Todas</option>
                {Object.entries(ACCIONES).map(([valor, { label }]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="filtro-desde" className="text-xs text-[#6B7280]">
                Desde
              </label>
              <input
                id="filtro-desde"
                type="date"
                value={desdeInput}
                onChange={(e) => setDesdeInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#E2E4E9] bg-white px-3 py-2.5 sm:py-2 text-sm text-[#1B1F2A]"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="filtro-hasta" className="text-xs text-[#6B7280]">
                Hasta
              </label>
              <input
                id="filtro-hasta"
                type="date"
                value={hastaInput}
                onChange={(e) => setHastaInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#E2E4E9] bg-white px-3 py-2.5 sm:py-2 text-sm text-[#1B1F2A]"
              />
            </div>
          </div>

          {errorFiltros && <p className="mt-3 text-xs text-[#9A3412]">{errorFiltros}</p>}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <button
              type="submit"
              className="rounded-md px-4 py-2.5 sm:py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-md px-4 py-2.5 sm:py-2 text-sm font-medium border border-[#E2E4E9] bg-white text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors"
            >
              Limpiar
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-lg border border-[#F3D7C4] bg-[#FFF7ED] px-6 py-8 text-center">
            <p className="text-sm text-[#9A3412]">{error}</p>
            <button
              type="button"
              onClick={() => setRecarga((n) => n + 1)}
              className="mt-3 text-sm font-medium underline"
              style={{ color: NAVY }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && !datos && loading && (
          <div className="rounded-lg border border-[#E2E4E9] bg-white px-6 py-16 text-center text-sm text-[#6B7280]">
            Cargando historial…
          </div>
        )}

        {!error && datos && datos.contenido.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#E2E4E9] bg-white px-6 py-16 text-center">
            <p className="text-sm text-[#6B7280]">
              {hayFiltros
                ? 'Ningún registro coincide con los filtros aplicados.'
                : 'Todavía no hay actividad registrada.'}
            </p>
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-3 text-sm font-medium underline"
                style={{ color: NAVY }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!error && datos && datos.contenido.length > 0 && (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* MÓVIL: tarjetas */}
            <ul className="md:hidden space-y-3">
              {datos.contenido.map((registro) => {
                const accion = ACCIONES[registro.accion] ?? {
                  label: registro.accion,
                  color: GRIS,
                };
                const entidad = ENTIDADES[registro.entidad] ?? registro.entidad;
                return (
                  <li
                    key={registro.id}
                    className="rounded-lg border border-[#E2E4E9] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium" style={{ color: accion.color }}>
                        {accion.label}
                      </span>
                      <span
                        className="shrink-0 text-xs text-[#6B7280]"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatoFecha(registro.fecha)}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs text-[#6B7280]">Usuario</dt>
                        <dd
                          className="font-medium break-words"
                          style={{ color: registro.usuario === 'SISTEMA' ? GRIS : '#1B1F2A' }}
                        >
                          {registro.usuario}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-[#6B7280]">Sobre</dt>
                        <dd className="text-[#1B1F2A]">
                          {entidad}
                          {registro.entidadId !== null && (
                            <span className="text-[#6B7280]"> #{registro.entidadId}</span>
                          )}
                        </dd>
                      </div>
                      {registro.detalle && (
                        <div className="min-w-0 col-span-2">
                          <dt className="text-xs text-[#6B7280]">Detalle</dt>
                          <dd className="text-[#6B7280] break-words">{registro.detalle}</dd>
                        </div>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ul>

            {/* DESKTOP/TABLET: tabla */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E2E4E9] bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E4E9] text-[#6B7280]">
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Fecha</th>
                    <th className="px-5 py-3 font-medium">Usuario</th>
                    <th className="px-5 py-3 font-medium">Acción</th>
                    <th className="px-5 py-3 font-medium">Sobre</th>
                    <th className="px-5 py-3 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.contenido.map((registro, index) => {
                    const accion = ACCIONES[registro.accion] ?? {
                      label: registro.accion,
                      color: GRIS,
                    };
                    const entidad = ENTIDADES[registro.entidad] ?? registro.entidad;
                    return (
                      <tr
                        key={registro.id}
                        className={
                          index !== datos.contenido.length - 1 ? 'border-b border-[#EEF0F3]' : ''
                        }
                      >
                        <td
                          className="px-5 py-3 text-[#6B7280] whitespace-nowrap"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatoFecha(registro.fecha)}
                        </td>
                        <td
                          className="px-5 py-3 font-medium"
                          style={{ color: registro.usuario === 'SISTEMA' ? GRIS : '#1B1F2A' }}
                        >
                          {registro.usuario}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-xs font-medium whitespace-nowrap"
                            style={{ color: accion.color }}
                          >
                            {accion.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#1B1F2A] whitespace-nowrap">
                          {entidad}
                          {registro.entidadId !== null && (
                            <span className="text-[#6B7280]"> #{registro.entidadId}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[#6B7280] break-words">
                          {registro.detalle ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación: texto arriba y botones a lo ancho en móvil */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className="text-sm text-[#6B7280] text-center sm:text-left"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                Página {datos.pagina + 1} de {totalPaginas}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(p - 1, 0))}
                  disabled={pagina === 0 || loading}
                  className="rounded-md px-3 py-2.5 sm:py-1.5 text-sm font-medium border border-[#E2E4E9] bg-white text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={pagina >= totalPaginas - 1 || loading}
                  className="rounded-md px-3 py-2.5 sm:py-1.5 text-sm font-medium border border-[#E2E4E9] bg-white text-[#1B1F2A] hover:bg-[#F7F8FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}