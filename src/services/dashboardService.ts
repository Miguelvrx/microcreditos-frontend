import api from '../config/api';
import type { DashboardData } from '../types/Dashboard';

export const dashboardService = {
  // GET /api/dashboard
  obtenerResumen: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },
};