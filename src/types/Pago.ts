export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'ATRASADO' | 'ANULACION';

// Cómo se recibió el abono (desde la migración V4). Transferencia y depósito exigen referencia.
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO';

// Refleja la entidad Pago.java tal como la devuelve el backend (GET)
// Nota: el campo "credito" NO viene incluido en la respuesta por el
// @JsonBackReference en Pago.credito (evita el ciclo infinito con Credito.pagos)
export interface Pago {
  id: number;
  numeroCuota: number;
  // Positivo en un abono normal; negativo en una fila de anulación (estado ANULACION).
  montoPagado: number;
  fechaPago: string; // asignada automáticamente por el backend (LocalDate.now())
  fechaVencimiento: string;
  estado: EstadoPago; // calculado automáticamente por el backend, no se envía

  // Identificador compartido por las filas de un mismo abono (un abono con
  // derrame crea varias filas). null en pagos anteriores a la migración V2.
  abonoRef: string | null;
  // Solo en filas de anulación: id del pago que esa fila revierte.
  pagoOriginalId: number | null;
  // Solo en filas de anulación: motivo capturado por el ADMIN.
  motivoAnulacion: string | null;

  // Desde V4. Los pagos anteriores quedaron como EFECTIVO. Una fila de anulación
  // hereda el método y la referencia del pago que revierte.
  metodoPago: MetodoPago;
  // Folio, clave de rastreo o número de ficha. El backend la guarda en mayúsculas.
  referenciaPago: string | null;
}

// Body que espera POST /api/pagos (coincide con RegistroPagoRequest del backend)
// OJO: NO lleva fechaPago ni estado — PagoService.registrarPago() los calcula solo
export interface PagoCreateRequest {
  creditoId: number;
  numeroCuota: number;
  montoPagado: number;
  // Opcionales: sin método el backend asume EFECTIVO. La referencia es obligatoria
  // si el método es TRANSFERENCIA o DEPOSITO.
  metodoPago?: MetodoPago;
  referenciaPago?: string;
}

// Body que espera POST /api/pagos/{id}/anular (AnulacionRequest del backend)
export interface PagoAnularRequest {
  motivo: string;
}