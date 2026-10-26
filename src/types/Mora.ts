// Interés moratorio de un crédito. Refleja MoraService.ResumenMora del backend.

export interface MoraCuota {
    numeroCuota: number;
    diasCobrados: number; // días de atraso con interés (después de los días de gracia)
    interes: number;
}

export type TipoMovimientoMora = 'COBRO' | 'CONDONACION';

export interface MovimientoMora {
    id: number;
    creditoId: number;
    tipo: TipoMovimientoMora;
    monto: number;
    fecha: string; // yyyy-MM-dd
    motivo: string | null; // obligatorio en CONDONACION
    usuario: string;
    creadoEn: string;
}

export interface ResumenMora {
    devengado: number;
    cobrado: number;
    condonado: number;
    saldo: number; // devengado - cobrado - condonado, nunca negativo
    cuotas: MoraCuota[];
    movimientos: MovimientoMora[]; // el más reciente primero
}