import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import type { Cliente } from '../types/Cliente';
import type { Credito, EstadoCredito } from '../types/Credito';
import { creditoService } from '../services/creditoService';
import CreditoDetalleModal from './CreditoDetalleModal';

const TEAL = '#0F766E';

interface CreditosClienteModalProps {
  cliente: Cliente;
  onClose: () => void;
  onActualizado: () => void; // avisa al padre que recargue clientes tras aprobar/rechazar
}

function badgeEstadoCredito(estado: EstadoCredito) {
  const estilos: Record<EstadoCredito, string> = {
    PENDIENTE: 'text-[#6B7280]',
    APROBADO: 'text-[#0F766E]',
    PAGADO: 'text-[#0F766E]',
    RECHAZADO: 'text-[#B91C1C]',
    EN_MORA: 'text-[#B45309]',
  };
  return <span className={`text-xs font-medium ${estilos[estado]}`}>{estado}</span>;
}

export default function CreditosClienteModal({ cliente, onClose, onActualizado }: CreditosClienteModalProps) {
  const [creditoSeleccionado, setCreditoSeleccionado] = useState<Credito | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const creditos = cliente.creditos ?? [];
  const { rol } = useAuth();
  const esAdmin = rol === 'ADMIN';

  // Si el cliente se actualiza desde el padre (tras aprobar o registrar un pago),
  // sincroniza el crédito que está abierto en el modal de detalle.
  useEffect(() => {
    if (creditoSeleccionado) {
      const actualizado = creditos.find((c) => c.id === creditoSeleccionado.id);
      if (actualizado) setCreditoSeleccionado(actualizado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  // Escape cierra este modal, pero solo si el de detalle no está abierto encima.
  useEffect(() => {
    function manejarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape' && !creditoSeleccionado) onClose();
    }
    document.addEventListener('keydown', manejarTecla);
    return () => document.removeEventListener('keydown', manejarTecla);
  }, [onClose, creditoSeleccionado]);

  const handleAprobar = async (id: number) => {
    setProcesandoId(id);
    setError(null);
    try {
      await creditoService.aprobar(id);
      onActualizado();
    } catch (err) {
      setError('No se pudo aprobar el crédito. Intenta de nuevo.');
      console.error(err);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (id: number) => {
    setProcesandoId(id);
    setError(null);
    try {
      await creditoService.rechazar(id);
      onActualizado();
    } catch (err) {
      setError('No se pudo rechazar el crédito. Intenta de nuevo.');
      console.error(err);
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    // Móvil: hoja que sube desde abajo. Desde sm: modal centrado.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-creditos-cliente"
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-lg sm:max-h-[85dvh] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado fijo */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E4E9] px-5 py-4 sm:px-6">
          <h2
            id="titulo-creditos-cliente"
            className="min-w-0 break-words text-base font-semibold text-[#1B1F2A] sm:text-lg"
          >
            Créditos de {cliente.nombreCompleto}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1B1F2A]"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="border-b border-[#F3D7C4] bg-[#FFF7ED] px-5 py-2 text-sm text-[#9A3412] sm:px-6">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {creditos.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-[#6B7280]">
              Este cliente todavía no tiene créditos registrados.
            </p>
          ) : (
            <>
              {/* MÓVIL: una tarjeta por crédito */}
              <ul className="space-y-3 bg-[#F7F8FA] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
                {creditos.map((credito) => {
                  const procesando = procesandoId === credito.id;
                  return (
                    <li
                      key={credito.id}
                      className="rounded-lg border border-[#E2E4E9] bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#1B1F2A]">Crédito #{credito.id}</p>
                        {badgeEstadoCredito(credito.estado)}
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div>
                          <dt className="text-xs text-[#6B7280]">Monto</dt>
                          <dd className="text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            ${credito.montoSolicitado.toFixed(2)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[#6B7280]">Cuota mensual</dt>
                          <dd className="text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            ${credito.cuotaMensual.toFixed(2)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[#6B7280]">Tasa mensual</dt>
                          <dd className="text-[#1B1F2A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {credito.tasaInteresMensual}%
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[#6B7280]">Plazo</dt>
                          <dd className="text-[#1B1F2A]">{credito.plazoMeses} meses</dd>
                        </div>
                      </dl>

                      <div className="mt-4 space-y-2">
                        {credito.estado === 'PENDIENTE' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleAprobar(credito.id)}
                              disabled={procesando}
                              className="rounded-md py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                              style={{ backgroundColor: TEAL }}
                            >
                              {procesando ? '…' : 'Aprobar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRechazar(credito.id)}
                              disabled={procesando}
                              className="rounded-md border border-[#B91C1C] py-2.5 text-sm font-medium text-[#B91C1C] transition-colors hover:bg-[#FEF2F2] disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setCreditoSeleccionado(credito)}
                          className="w-full rounded-md border py-2.5 text-sm font-medium transition-colors hover:bg-[#F0FDFA]"
                          style={{ color: TEAL, borderColor: TEAL }}
                        >
                          Ver amortización
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* DESKTOP/TABLET: tabla */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E4E9] text-[#6B7280]">
                      <th className="px-4 py-2.5 font-medium lg:px-5">ID</th>
                      <th className="px-4 py-2.5 text-right font-medium lg:px-5">Monto</th>
                      <th className="px-4 py-2.5 text-right font-medium lg:px-5">Tasa</th>
                      <th className="px-4 py-2.5 text-right font-medium lg:px-5">Plazo</th>
                      <th className="px-4 py-2.5 text-right font-medium lg:px-5">Cuota</th>
                      <th className="px-4 py-2.5 font-medium lg:px-5">Estado</th>
                      <th className="px-4 py-2.5 text-right font-medium lg:px-5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditos.map((credito) => (
                      <tr key={credito.id} className="border-b border-[#EEF0F3]">
                        <td className="px-4 py-2.5 text-[#1B1F2A] lg:px-5">{credito.id}</td>
                        <td
                          className="px-4 py-2.5 text-right text-[#1B1F2A] lg:px-5"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          ${credito.montoSolicitado.toFixed(2)}
                        </td>
                        <td
                          className="px-4 py-2.5 text-right text-[#6B7280] lg:px-5"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {credito.tasaInteresMensual}%
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-[#6B7280] lg:px-5">
                          {credito.plazoMeses} m
                        </td>
                        <td
                          className="px-4 py-2.5 text-right text-[#1B1F2A] lg:px-5"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          ${credito.cuotaMensual.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 lg:px-5">{badgeEstadoCredito(credito.estado)}</td>
                        <td className="px-4 py-2.5 text-right lg:px-5">
                          <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                            {credito.estado === 'PENDIENTE' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAprobar(credito.id)}
                                  disabled={procesandoId === credito.id}
                                  className="text-sm font-medium hover:underline disabled:opacity-50"
                                  style={{ color: TEAL }}
                                >
                                  {procesandoId === credito.id ? '…' : 'Aprobar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRechazar(credito.id)}
                                  disabled={procesandoId === credito.id}
                                  className="text-sm font-medium text-[#B91C1C] hover:underline disabled:opacity-50"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => setCreditoSeleccionado(credito)}
                              className="text-sm font-medium hover:underline"
                              style={{ color: TEAL }}
                            >
                              Ver amortización
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {creditoSeleccionado && (
        <CreditoDetalleModal
          credito={creditoSeleccionado}
          onClose={() => setCreditoSeleccionado(null)}
          onPagoRegistrado={onActualizado}
          puedeAnular={esAdmin}
        />
      )}
    </div>
  );
}