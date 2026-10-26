import api from '../config/api';
import type { Notificacion } from '../types/Notificacion';

export const notificacionService = {
  // GET /api/notificaciones
  listarRecientes: async (): Promise<Notificacion[]> => {
    const response = await api.get<Notificacion[]>('/notificaciones');
    return response.data;
  },

  // GET /api/notificaciones/no-leidas/conteo
  contarNoLeidas: async (): Promise<number> => {
    const response = await api.get<{ noLeidas: number }>('/notificaciones/no-leidas/conteo');
    return response.data.noLeidas;
  },

  // PUT /api/notificaciones/{id}/leida
  marcarComoLeida: async (id: number): Promise<Notificacion> => {
    const response = await api.put<Notificacion>(`/notificaciones/${id}/leida`);
    return response.data;
  },

  // PUT /api/notificaciones/marcar-todas
  marcarTodasComoLeidas: async (): Promise<number> => {
    const response = await api.put<{ marcadas: number }>('/notificaciones/marcar-todas');
    return response.data.marcadas;
  },
};