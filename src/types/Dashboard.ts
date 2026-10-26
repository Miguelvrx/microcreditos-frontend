export interface CreditoEnMora {
  creditoId: number;
  clienteNombre: string;
  montoEnMora: number;
  cuotasVencidas: number;
  saldoMora: number; // interés moratorio por cobrar de este crédito
}

// Crédito con interés moratorio por cobrar; incluye créditos PAGADO que quedaron debiendo mora
export interface CreditoConSaldoMora {
  creditoId: number;
  clienteNombre: string;
  estado: string;
  saldoMora: number;
}

// Un tramo del aging: lo que falta por cobrar de las cuotas vencidas con ese rango de atraso
export interface TramoAging {
  etiqueta: string;
  monto: number;
  creditos: number; // un crédito cuenta una vez por tramo en el que tenga cuotas vencidas
}

// Portfolio at Risk a N días: capital pendiente de los créditos con atraso mayor a N días
export interface ParIndicador {
  dias: number; // 30, 60 o 90
  capitalEnRiesgo: number;
  porcentaje: number; // sobre el saldo de capital de la cartera vigente, con un decimal
  creditos: number;
}

// Refleja DashboardResponse.java tal como la devuelve el backend (GET /api/dashboard)
export interface DashboardData {
  totalPrestado: number;
  totalCobrado: number;
  totalEnMora: number;
  creditosVigentes: number;
  creditosEnMora: number;
  creditosEnMoraDetalle: CreditoEnMora[];
  // Interés moratorio de toda la cartera desembolsada (activa y pagada)
  moraDevengada: number;
  moraCobrada: number;
  moraCondonada: number;
  saldoMora: number;
  creditosConSaldoMora: number;
  creditosConSaldoMoraDetalle: CreditoConSaldoMora[];
  // Calidad de cartera (punto 40)
  saldoCapitalVigente: number; // denominador del PAR
  aging: TramoAging[]; // 4 tramos, en orden
  par: ParIndicador[]; // PAR 30, 60 y 90, en orden
}