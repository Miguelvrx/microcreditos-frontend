import api from '../config/api';
import type { ReporteCarteraFiltros } from '../types/ReporteFiltros';

// Fecha de hoy en hora local (YYYY-MM-DD). toISOString() devuelve la fecha en UTC,
// y por la noche en México ya es el día siguiente.
function fechaHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function construirQueryParams(filtros?: ReporteCarteraFiltros): string {
  const params = new URLSearchParams();
  if (filtros?.estados?.length) {
    filtros.estados.forEach((estado) => params.append('estados', estado));
  }
  if (filtros?.clienteId) params.append('clienteId', String(filtros.clienteId));
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);

  const query = params.toString();
  return query ? `?${query}` : '';
}

async function descargarArchivo(url: string, nombreArchivo: string, mimeType: string): Promise<void> {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: mimeType });
  const objectUrl = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export const reporteService = {
  descargarCartera: async (filtros?: ReporteCarteraFiltros): Promise<void> => {
    const fecha = fechaHoy();
    await descargarArchivo(
      `/reportes/cartera${construirQueryParams(filtros)}`,
      `cartera_${fecha}.pdf`,
      'application/pdf'
    );
  },

  descargarCarteraExcel: async (filtros?: ReporteCarteraFiltros): Promise<void> => {
    const fecha = fechaHoy();
    await descargarArchivo(
      `/reportes/cartera/excel${construirQueryParams(filtros)}`,
      `cartera_${fecha}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  },

  descargarPagos: async (creditoId: number): Promise<void> => {
    const fecha = fechaHoy();
    await descargarArchivo(
      `/reportes/pagos/${creditoId}`,
      `pagos_credito_${creditoId}_${fecha}.pdf`,
      'application/pdf'
    );
  },

  descargarPagosExcel: async (creditoId: number): Promise<void> => {
    const fecha = fechaHoy();
    await descargarArchivo(
      `/reportes/pagos/${creditoId}/excel`,
      `pagos_credito_${creditoId}_${fecha}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  },

  descargarMora: async (): Promise<void> => {
    const fecha = fechaHoy();
    await descargarArchivo(`/reportes/mora`, `mora_${fecha}.pdf`, 'application/pdf');
  },

  descargarMoraExcel: async (): Promise<void> => {
    const fecha = fechaHoy();
    await descargarArchivo(
      `/reportes/mora/excel`,
      `mora_${fecha}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  },

  descargarRecibo: async (pagoId: number): Promise<void> => {
    const numero = String(pagoId).padStart(6, '0');
    await descargarArchivo(`/reportes/recibo/${pagoId}`, `recibo_R-${numero}.pdf`, 'application/pdf');
  },

  descargarReciboMora: async (movimientoId: number): Promise<void> => {
    const numero = String(movimientoId).padStart(6, '0');
    await descargarArchivo(`/reportes/recibo-mora/${movimientoId}`, `recibo_M-${numero}.pdf`, 'application/pdf');
  },
};