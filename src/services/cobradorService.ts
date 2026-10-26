import api from '../config/api';
import type { CobradorResumen, Credito } from '../types/Credito';

export const cobradorService = {
  // GET /api/usuarios/cobradores — solo ADMIN. Usuarios con rol COBRADOR que no están desactivados.
  listar: async (): Promise<CobradorResumen[]> => {
    const response = await api.get<CobradorResumen[]>('/usuarios/cobradores');
    return response.data;
  },

  // PUT /api/creditos/{id}/cobrador — solo ADMIN. cobradorId = null quita el cobrador asignado.
  // Los errores de regla de negocio llegan como 400 con el mensaje en response.data (texto plano).
  asignar: async (creditoId: number, cobradorId: number | null): Promise<Credito> => {
    const response = await api.put<Credito>(`/creditos/${creditoId}/cobrador`, { cobradorId });
    return response.data;
  },
};