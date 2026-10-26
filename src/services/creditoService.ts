import api from '../config/api';
import type { Credito, CreditoCreateRequest } from '../types/Credito';

export const creditoService = {
  // GET /api/creditos
  listarTodos: async (): Promise<Credito[]> => {
    const response = await api.get<Credito[]>('/creditos');
    return response.data;
  },

  // GET /api/creditos/{id}
  buscarPorId: async (id: number): Promise<Credito> => {
    const response = await api.get<Credito>(`/creditos/${id}`);
    return response.data;
  },

  // GET /api/creditos/cliente/{clienteId}
  buscarPorCliente: async (clienteId: number): Promise<Credito[]> => {
    const response = await api.get<Credito[]>(`/creditos/cliente/${clienteId}`);
    return response.data;
  },

  // POST /api/creditos (el backend calcula cuotaMensual automáticamente)
  crear: async (credito: CreditoCreateRequest): Promise<Credito> => {
    const response = await api.post<Credito>('/creditos', credito);
    return response.data;
  },

    // PUT /api/creditos/{id}/aprobar
  aprobar: async (id: number): Promise<Credito> => {
    const response = await api.put<Credito>(`/creditos/${id}/aprobar`);
    return response.data;
  },

  // PUT /api/creditos/{id}/rechazar
  rechazar: async (id: number): Promise<Credito> => {
    const response = await api.put<Credito>(`/creditos/${id}/rechazar`);
    return response.data;
  },

  // DELETE /api/creditos/{id}
  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/creditos/${id}`);
  },
};