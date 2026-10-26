import type { Pago } from './Pago';

export type EstadoCredito = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'PAGADO' | 'EN_MORA';

// Lo único del cobrador que el backend incluye en el crédito (nunca el usuario completo).
export interface CobradorResumen {
  id: number;
  nombreUsuario: string;
}

// Refleja la entidad Credito.java tal como la devuelve el backend (GET)
// Nota: el campo "cliente" NO viene incluido en la respuesta por el
// @JsonBackReference en Credito.cliente (evita el ciclo infinito con Cliente.creditos)
export interface Credito {
  id: number;
  montoSolicitado: number;
  tasaInteresMensual: number;
  plazoMeses: number;
  cuotaMensual: number;
  fechaInicio: string; // formato ISO: "2026-09-13"
  estado: EstadoCredito;
  pagos: Pago[] | null;
  // Desde V4. null si el crédito no tiene cobrador asignado.
  cobradorAsignado?: CobradorResumen | null;
}

// Body que espera POST /api/creditos (coincide con SolicitudCreditoRequest del backend)
export interface CreditoCreateRequest {
  clienteId: number;
  montoSolicitado: number;
  tasaInteresMensual: number;
  plazoMeses: number;
}