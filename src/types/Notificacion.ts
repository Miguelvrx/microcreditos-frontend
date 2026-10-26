export type TipoNotificacion = 'CREDITO_EN_MORA' | 'CUOTA_PROXIMA_A_VENCER';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
  creditoId: number;
  numeroCuota: number | null;
  fecha: string;
  leida: boolean;
}