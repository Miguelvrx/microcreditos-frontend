import api from '../config/api';
import type { AuditoriaConsulta, AuditoriaPagina } from '../types/Auditoria';

export const auditoriaService = {
  // GET /api/auditoria (solo ADMIN). Solo se mandan los filtros con valor,
  // así el backend aplica únicamente los que el usuario realmente eligió.
  listar: async (consulta: AuditoriaConsulta = {}): Promise<AuditoriaPagina> => {
    const params: Record<string, string | number> = {};
    if (consulta.usuario) params.usuario = consulta.usuario;
    if (consulta.accion) params.accion = consulta.accion;
    if (consulta.desde) params.desde = consulta.desde;
    if (consulta.hasta) params.hasta = consulta.hasta;
    if (consulta.pagina !== undefined) params.pagina = consulta.pagina;
    if (consulta.tamano !== undefined) params.tamano = consulta.tamano;

    const response = await api.get<AuditoriaPagina>('/auditoria', { params });
    return response.data;
  },
};