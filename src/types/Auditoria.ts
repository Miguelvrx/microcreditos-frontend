export type AccionAuditoria =
  | 'CREDITO_APROBADO'
  | 'CREDITO_RECHAZADO'
  | 'CREDITO_EN_MORA'
  | 'CREDITO_PAGADO'
  | 'CREDITO_AL_DIA'
  | 'CREDITO_CREADO'
  | 'PAGO_REGISTRADO'
  | 'USUARIO_CREADO'
  | 'USUARIO_ACTIVADO'
  | 'USUARIO_DESACTIVADO'
  | 'CLIENTE_CREADO'
  | 'CLIENTE_EDITADO'
  | 'LOGIN_EXITOSO'
  | 'LOGIN_FALLIDO'
  | 'CREDITO_ELIMINADO'
  | 'CLIENTE_ELIMINADO'
  | 'PAGO_ANULADO'
  | 'CREDITO_REABIERTO'
  | 'MORA_COBRADA'
  | 'MORA_CONDONADA';

// Una fila del historial. Refleja AuditoriaResponseDTO del backend.
export interface Auditoria {
  id: number;
  usuario: string;
  accion: AccionAuditoria;
  entidad: string;
  entidadId: number | null;
  detalle: string | null;
  // LocalDateTime del backend, sin zona horaria: "2026-09-20T15:42:10.123"
  fecha: string;
}

// Respuesta paginada. Refleja AuditoriaPaginaDTO del backend.
export interface AuditoriaPagina {
  contenido: Auditoria[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

// Filtros opcionales; solo se envían al backend los que tienen valor.
export interface AuditoriaFiltros {
  usuario?: string;
  accion?: string;
  desde?: string; // yyyy-MM-dd
  hasta?: string; // yyyy-MM-dd
}

export interface AuditoriaConsulta extends AuditoriaFiltros {
  pagina?: number;
  tamano?: number;
}