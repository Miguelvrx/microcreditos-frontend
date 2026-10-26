import api from '../config/api';
import type { ResumenMora } from '../types/Mora';

export const moraService = {
  obtener: async (creditoId: number): Promise<ResumenMora> => {
    const response = await api.get<ResumenMora>(`/creditos/${creditoId}/mora`);
    return response.data;
  },

  // Los 3 roles pueden cobrar mora.
  cobrar: async (creditoId: number, monto: number): Promise<ResumenMora> => {
    const response = await api.post<ResumenMora>(`/creditos/${creditoId}/mora/cobros`, { monto });
    return response.data;
  },

  // Solo ADMIN (el backend responde 403 a los demás). El motivo es obligatorio.
  condonar: async (creditoId: number, monto: number, motivo: string): Promise<ResumenMora> => {
    const response = await api.post<ResumenMora>(`/creditos/${creditoId}/mora/condonaciones`, {
      monto,
      motivo,
    });
    return response.data;
  },
};