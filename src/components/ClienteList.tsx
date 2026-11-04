import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { clienteService } from '../services/clienteService';
import type { Cliente } from '../types/Cliente';
import ClienteFormModal from './ClienteFormModal';
import CreditoFormModal from './CreditoFormModal';
import CreditosClienteModal from './CreditosClienteModal';
import NavBar from './NavBar';

const NAVY = '#1E3A5F';
const TEAL = '#0F766E';
const TEAL_SUAVE = '#E6F2F1';
const TAMANO_PAGINA = 10;

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

const IconoBuscar = (
    <Icono>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </Icono>
);

const IconoMas = (
    <Icono>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </Icono>
);

const IconoBillete = (
    <Icono>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
    </Icono>
);

const IconoDocumento = (
    <Icono size={14}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M6.17 15a3 3 0 0 1 5.66 0" />
        <path d="M16 10h2" />
        <path d="M16 14h2" />
    </Icono>
);

const IconoTelefono = (
    <Icono size={14}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icono>
);

const IconoUbicacion = (
    <Icono size={14}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </Icono>
);

const IconoCalendario = (
    <Icono size={14}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
    </Icono>
);

const IconoWallet = (
    <Icono size={14}>
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </Icono>
);

const IconoAnterior = (
    <Icono>
        <path d="m15 18-6-6 6-6" />
    </Icono>
);

const IconoSiguiente = (
    <Icono>
        <path d="m9 18 6-6-6-6" />
    </Icono>
);

const IconoClientesGrande = (
    <Icono size={22}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icono>
);

/* ---------- Auxiliares ---------- */

function iniciales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
}

function Avatar({ nombre }: { nombre: string }) {
    return (
        <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{ color: TEAL, backgroundColor: TEAL_SUAVE }}
            aria-hidden="true"
        >
            {iniciales(nombre)}
        </span>
    );
}

export default function ClienteList() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [clienteParaCredito, setClienteParaCredito] = useState<Cliente | null>(null);
    const [clienteParaVerCreditos, setClienteParaVerCreditos] = useState<Cliente | null>(null);

    // Búsqueda y paginación
    const [textoInput, setTextoInput] = useState(''); // lo que se escribe
    const [texto, setTexto] = useState(''); // lo que se envía al backend (con espera)
    const [pagina, setPagina] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);

    // Para ignorar respuestas viejas si el usuario sigue escribiendo o cambiando de página
    const ultimaPeticion = useRef(0);

    const cargarClientes = useCallback(() => {
        const idPeticion = ++ultimaPeticion.current;
        setLoading(true);
        setError(null);
        clienteService
            .buscarPagina(texto, pagina, TAMANO_PAGINA)
            .then((data) => {
                if (idPeticion !== ultimaPeticion.current) return;
                // Si la página quedó fuera de rango, se va a la última disponible
                if (data.totalPaginas > 0 && pagina >= data.totalPaginas) {
                    setPagina(data.totalPaginas - 1);
                    return;
                }
                setClientes(data.contenido);
                setTotalElementos(data.totalElementos);
                setTotalPaginas(data.totalPaginas);
            })
            .catch(() => {
                if (idPeticion !== ultimaPeticion.current) return;
                setError(
                    'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en localhost:8080.'
                );
            })
            .finally(() => {
                if (idPeticion === ultimaPeticion.current) setLoading(false);
            });
    }, [texto, pagina]);

    useEffect(() => {
        cargarClientes();
    }, [cargarClientes]);

    // Espera de 400 ms al escribir; al cambiar la búsqueda vuelve a la primera página
    useEffect(() => {
        const temporizador = setTimeout(() => {
            const limpio = textoInput.trim();
            if (limpio !== texto) {
                setTexto(limpio);
                setPagina(0);
            }
        }, 400);
        return () => clearTimeout(temporizador);
    }, [textoInput, texto]);

    const primeraCarga = loading && clientes.length === 0 && !error;
    const hayBusqueda = texto !== '';
    const desde = totalElementos === 0 ? 0 : pagina * TAMANO_PAGINA + 1;
    const hasta = Math.min((pagina + 1) * TAMANO_PAGINA, totalElementos);

    const textoEncabezado = () => {
        if (primeraCarga) return 'Cargando…';
        if (hayBusqueda) {
            return `${totalElementos} ${totalElementos === 1 ? 'resultado' : 'resultados'} para "${texto}"`;
        }
        return `${totalElementos} ${totalElementos === 1 ? 'cliente registrado' : 'clientes registrados'}`;
    };

    return (
        <div className="min-h-screen bg-[#F7F8FA]">
            <NavBar activo="clientes" />
            <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
                {/* Encabezado: apilado en móvil, en fila desde sm */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-[#1B1F2A]">Clientes</h1>
                        <p className="text-sm text-[#6B7280] mt-1">{textoEncabezado()}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md px-4 py-2.5 sm:py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: TEAL }}
                    >
                        {IconoMas}
                        Nuevo cliente
                    </button>
                </div>

                {/* Buscador */}
                <div className="relative mb-6 w-full sm:max-w-md">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9CA3AF]">
                        {IconoBuscar}
                    </span>
                    <input
                        type="search"
                        value={textoInput}
                        onChange={(e) => setTextoInput(e.target.value)}
                        placeholder="Buscar por nombre, documento o teléfono"
                        aria-label="Buscar clientes"
                        className="w-full rounded-md border border-[#E2E4E9] bg-white py-2.5 sm:py-2 pl-9 pr-3 text-sm text-[#1B1F2A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                </div>

                {primeraCarga && (
                    <div className="rounded-lg border border-[#E2E4E9] bg-white px-6 py-16 text-center text-sm text-[#6B7280]">
                        Cargando clientes…
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-lg border border-[#F3D7C4] bg-[#FFF7ED] px-6 py-8 text-center">
                        <p className="text-sm text-[#9A3412]">{error}</p>
                        <button
                            type="button"
                            onClick={cargarClientes}
                            className="mt-3 text-sm font-medium underline"
                            style={{ color: NAVY }}
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {!loading && !error && clientes.length === 0 && !hayBusqueda && (
                    <div className="rounded-lg border border-dashed border-[#E2E4E9] bg-white px-6 py-16 text-center">
                        <span
                            className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                            style={{ color: TEAL, backgroundColor: TEAL_SUAVE }}
                        >
                            {IconoClientesGrande}
                        </span>
                        <p className="text-sm text-[#6B7280]">Todavía no hay clientes registrados.</p>
                        <p className="text-sm text-[#6B7280] mt-1">Usa "Nuevo cliente" para agregar el primero.</p>
                    </div>
                )}

                {!loading && !error && clientes.length === 0 && hayBusqueda && (
                    <div className="rounded-lg border border-dashed border-[#E2E4E9] bg-white px-6 py-16 text-center">
                        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F1F2F5] text-[#9CA3AF]">
                            <Icono size={22}>
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </Icono>
                        </span>
                        <p className="text-sm text-[#6B7280]">
                            No hay clientes que coincidan con "{texto}".
                        </p>
                        <button
                            type="button"
                            onClick={() => setTextoInput('')}
                            className="mt-3 text-sm font-medium underline"
                            style={{ color: NAVY }}
                        >
                            Limpiar búsqueda
                        </button>
                    </div>
                )}

                {!error && clientes.length > 0 && (
                    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                        {/* MÓVIL: tarjetas (se oculta desde md) */}
                        <ul className="md:hidden space-y-3">
                            {clientes.map((cliente) => {
                                const totalCreditos = cliente.creditos?.length ?? 0;
                                return (
                                    <li
                                        key={cliente.id}
                                        className="rounded-lg border border-[#E2E4E9] bg-white p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar nombre={cliente.nombreCompleto} />
                                            <p className="font-medium text-[#1B1F2A] break-words min-w-0">
                                                {cliente.nombreCompleto}
                                            </p>
                                        </div>

                                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                            <div className="min-w-0">
                                                <dt className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                                                    {IconoDocumento}
                                                    Documento
                                                </dt>
                                                <dd
                                                    className="mt-0.5 text-[#1B1F2A] break-words"
                                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                                >
                                                    {cliente.numeroDocumento}
                                                </dd>
                                            </div>
                                            <div className="min-w-0">
                                                <dt className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                                                    {IconoTelefono}
                                                    Teléfono
                                                </dt>
                                                <dd
                                                    className="mt-0.5 text-[#1B1F2A] break-words"
                                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                                >
                                                    {cliente.telefono}
                                                </dd>
                                            </div>
                                            <div className="min-w-0 col-span-2">
                                                <dt className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                                                    {IconoUbicacion}
                                                    Dirección
                                                </dt>
                                                <dd className="mt-0.5 text-[#1B1F2A] break-words">
                                                    {cliente.direccion || '—'}
                                                </dd>
                                            </div>
                                            <div className="min-w-0">
                                                <dt className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                                                    {IconoCalendario}
                                                    Registrado
                                                </dt>
                                                <dd className="mt-0.5 text-[#1B1F2A]">{cliente.fechaRegistro}</dd>
                                            </div>
                                            <div className="min-w-0">
                                                <dt className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                                                    {IconoWallet}
                                                    Créditos
                                                </dt>
                                                <dd>
                                                    <button
                                                        type="button"
                                                        onClick={() => setClienteParaVerCreditos(cliente)}
                                                        disabled={totalCreditos === 0}
                                                        className="mt-0.5 inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#E6F4F2] px-2 text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#CCE9E5] disabled:cursor-default disabled:bg-[#F1F2F5] disabled:text-[#9CA3AF] disabled:hover:bg-[#F1F2F5]"
                                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                                    >
                                                        {totalCreditos}
                                                    </button>
                                                </dd>
                                            </div>
                                        </dl>

                                        <button
                                            type="button"
                                            onClick={() => setClienteParaCredito(cliente)}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors hover:bg-[#F0FDFA]"
                                            style={{ color: TEAL, borderColor: TEAL }}
                                        >
                                            {IconoBillete}
                                            Solicitar crédito
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* DESKTOP/TABLET: tabla (visible desde md) */}
                        <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E2E4E9] bg-white">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#E2E4E9] bg-[#FAFAFB] text-[#6B7280]">
                                        <th className="px-4 lg:px-5 py-3 font-medium">Nombre</th>
                                        <th className="px-4 lg:px-5 py-3 font-medium">Documento</th>
                                        <th className="px-4 lg:px-5 py-3 font-medium">Teléfono</th>
                                        <th className="px-4 lg:px-5 py-3 font-medium">Dirección</th>
                                        <th className="px-4 lg:px-5 py-3 font-medium whitespace-nowrap">Registrado</th>
                                        <th className="px-4 lg:px-5 py-3 font-medium text-right">Créditos</th>
                                        <th className="px-4 lg:px-5 py-3 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientes.map((cliente, index) => (
                                        <tr
                                            key={cliente.id}
                                            className={`transition-colors hover:bg-[#FAFAFB] ${
                                                index !== clientes.length - 1 ? 'border-b border-[#EEF0F3]' : ''
                                            }`}
                                        >
                                            <td className="px-4 lg:px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar nombre={cliente.nombreCompleto} />
                                                    <span className="text-[#1B1F2A] font-medium">
                                                        {cliente.nombreCompleto}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                className="px-4 lg:px-5 py-3 text-[#1B1F2A]"
                                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                            >
                                                {cliente.numeroDocumento}
                                            </td>
                                            <td
                                                className="px-4 lg:px-5 py-3 text-[#6B7280]"
                                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                            >
                                                {cliente.telefono}
                                            </td>
                                            <td className="px-4 lg:px-5 py-3 text-[#6B7280]">{cliente.direccion}</td>
                                            <td className="px-4 lg:px-5 py-3 text-[#6B7280] whitespace-nowrap">
                                                {cliente.fechaRegistro}
                                            </td>
                                            <td className="px-4 lg:px-5 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setClienteParaVerCreditos(cliente)}
                                                    className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#E6F4F2] px-2 text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#CCE9E5] disabled:cursor-default disabled:bg-[#F1F2F5] disabled:text-[#9CA3AF] disabled:hover:bg-[#F1F2F5]"
                                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                                    title={(cliente.creditos?.length ?? 0) > 0 ? 'Ver créditos' : 'Sin créditos'}
                                                    disabled={(cliente.creditos?.length ?? 0) === 0}
                                                >
                                                    {cliente.creditos?.length ?? 0}
                                                </button>
                                            </td>
                                            <td className="px-4 lg:px-5 py-3 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setClienteParaCredito(cliente)}
                                                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-[#E6F2F1]"
                                                    style={{ color: TEAL }}
                                                >
                                                    {IconoBillete}
                                                    Solicitar crédito
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p
                                className="text-sm text-[#6B7280]"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                                Mostrando {desde}–{hasta} de {totalElementos}
                            </p>
                            {totalPaginas > 1 && (
                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPagina((p) => Math.max(p - 1, 0))}
                                        disabled={pagina === 0 || loading}
                                        className="flex items-center gap-1 rounded-md border border-[#E2E4E9] bg-white py-2 pl-2 pr-3 text-sm font-medium text-[#1B1F2A] transition-colors hover:bg-[#F1F2F5] disabled:cursor-default disabled:text-[#9CA3AF] disabled:hover:bg-white"
                                    >
                                        {IconoAnterior}
                                        Anterior
                                    </button>
                                    <span
                                        className="text-sm text-[#6B7280] whitespace-nowrap"
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        Página {pagina + 1} de {totalPaginas}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas - 1))}
                                        disabled={pagina >= totalPaginas - 1 || loading}
                                        className="flex items-center gap-1 rounded-md border border-[#E2E4E9] bg-white py-2 pl-3 pr-2 text-sm font-medium text-[#1B1F2A] transition-colors hover:bg-[#F1F2F5] disabled:cursor-default disabled:text-[#9CA3AF] disabled:hover:bg-white"
                                    >
                                        Siguiente
                                        {IconoSiguiente}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {showForm && (
                <ClienteFormModal
                    onClose={() => setShowForm(false)}
                    onCreated={() => {
                        setShowForm(false);
                        cargarClientes();
                    }}
                />
            )}

            {clienteParaCredito && (
                <CreditoFormModal
                    clienteId={clienteParaCredito.id}
                    clienteNombre={clienteParaCredito.nombreCompleto}
                    onClose={() => setClienteParaCredito(null)}
                    onCreated={() => {
                        setClienteParaCredito(null);
                        cargarClientes();
                    }}
                />
            )}
            {clienteParaVerCreditos && (
                <CreditosClienteModal
                    cliente={clienteParaVerCreditos}
                    onClose={() => setClienteParaVerCreditos(null)}
                    onActualizado={() => {
                        clienteService.buscarPagina(texto, pagina, TAMANO_PAGINA).then((data) => {
                            setClientes(data.contenido);
                            setTotalElementos(data.totalElementos);
                            setTotalPaginas(data.totalPaginas);
                            const actualizado = data.contenido.find(
                                (c) => c.id === clienteParaVerCreditos.id
                            );
                            if (actualizado) setClienteParaVerCreditos(actualizado);
                        });
                    }}
                />
            )}
        </div>
    );
}