import api from '../config/api';
import type { Pago, PagoCreateRequest, PagoAnularRequest } from '../types/Pago';

export const pagoService = {
  // GET /api/pagos/credito/{creditoId}
  // Incluye también las filas de anulación (estado ANULACION, monto negativo).
  listarPorCredito: async (creditoId: number): Promise<Pago[]> => {
    const response = await api.get<Pago[]>(`/pagos/credito/${creditoId}`);
    return response.data;
  },

  // POST /api/pagos — devuelve un array: si el abono hace derrame, puede
  // crear más de un Pago (uno por cada cuota que alcanzó a cubrir).
  // Con TRANSFERENCIA o DEPOSITO la referencia es obligatoria (el backend responde 400 si falta).
  registrar: async (pago: PagoCreateRequest): Promise<Pago[]> => {
    const response = await api.post<Pago[]>('/pagos', pago);
    return response.data;
  },

  // GET /api/pagos/referencia-existente?referencia=...
  // Devuelve los ids de los créditos que ya tienen un abono activo con esa referencia
  // (lista vacía si no hay). Sirve para avisar de un posible duplicado; no bloquea nada.
  referenciaExistente: async (referencia: string): Promise<number[]> => {
    const response = await api.get<{ existe: boolean; creditos: number[] }>(
      '/pagos/referencia-existente',
      { params: { referencia } }
    );
    return response.data.creditos;
  },

  // POST /api/pagos/{id}/anular — solo ADMIN. El id puede ser cualquier fila
  // del abono: el backend anula el abono completo y devuelve las filas de
  // anulación creadas (una por cada fila del abono original).
  // Los errores de regla de negocio llegan como 400 con el mensaje en
  // response.data (texto plano); un 403 significa que el usuario no es ADMIN.
  anular: async (pagoId: number, motivo: string): Promise<Pago[]> => {
    const body: PagoAnularRequest = { motivo };
    const response = await api.post<Pago[]>(`/pagos/${pagoId}/anular`, body);
    return response.data;
  },
};