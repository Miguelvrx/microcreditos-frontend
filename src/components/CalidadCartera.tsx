import type { DashboardData } from '../types/Dashboard';
import { formatoMoneda } from '../utils/formato';

// De menos a más grave: ámbar, naranja oscuro, rojo, rojo muy oscuro
const COLORES_TRAMO = ['#D97706', '#C2410C', '#B91C1C', '#7F1D1D'];

export default function CalidadCartera({ data }: { data: DashboardData }) {
  // Sin cartera vigente no hay nada que medir
  if (!data.saldoCapitalVigente || data.saldoCapitalVigente <= 0) return null;

  const totalAging = data.aging.reduce((suma, tramo) => suma + tramo.monto, 0);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-[#1B1F2A]">Calidad de cartera</h2>
      <p className="text-sm text-[#6B7280] mt-1 mb-3">
        Qué parte de lo que está prestado está en manos de clientes atrasados.
      </p>

      {/* PAR 30 / 60 / 90 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {data.par.map((indicador) => {
          const enRiesgo = indicador.porcentaje > 0;
          return (
            <div
              key={indicador.dias}
              className="min-w-0 rounded-lg border px-4 sm:px-5 py-4"
              style={{
                borderColor: enRiesgo ? '#F3D7C4' : '#E2E4E9',
                backgroundColor: enRiesgo ? '#FFF7ED' : 'white',
              }}
            >
              <p className="text-xs text-[#6B7280]">PAR {indicador.dias}</p>
              <p
                className="text-lg sm:text-xl font-semibold mt-1"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  color: enRiesgo ? '#B45309' : '#1B1F2A',
                }}
              >
                {indicador.porcentaje.toFixed(1)}%
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5 break-words">
                {formatoMoneda(indicador.capitalEnRiesgo)} en riesgo ·{' '}
                {indicador.creditos} {indicador.creditos === 1 ? 'crédito' : 'créditos'}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[#6B7280]">
        Sobre {formatoMoneda(data.saldoCapitalVigente)} de capital pendiente en la cartera vigente.
        PAR 30 cuenta los créditos con alguna cuota vencida hace más de 30 días; de cada uno entra todo
        su capital pendiente, no solo la cuota atrasada.
      </p>

      {/* Aging */}
      <div className="mt-4 rounded-lg border border-[#E2E4E9] bg-white px-4 sm:px-5 py-4">
        <p className="text-sm font-semibold text-[#1B1F2A]">Aging de cuotas vencidas</p>
        <p className="text-xs text-[#6B7280] mt-0.5 mb-3">
          Lo que falta por cobrar de las cuotas vencidas, según los días de atraso.
        </p>

        {totalAging <= 0 ? (
          <p className="text-sm text-[#6B7280]">No hay cuotas vencidas en este momento.</p>
        ) : (
          <ul className="space-y-3">
            {data.aging.map((tramo, indice) => (
              <li key={tramo.etiqueta}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-[#1B1F2A]">{tramo.etiqueta}</span>
                  <span
                    className="text-[#1B1F2A] font-medium"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatoMoneda(tramo.monto)}
                    <span className="ml-2 text-xs font-normal text-[#6B7280]">
                      {tramo.creditos} {tramo.creditos === 1 ? 'crédito' : 'créditos'}
                    </span>
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#EEF0F3]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(tramo.monto / totalAging) * 100}%`,
                      backgroundColor: COLORES_TRAMO[indice] ?? COLORES_TRAMO[0],
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-[#6B7280]">
          Un crédito con cuotas de distinta antigüedad aparece en cada tramo que le corresponda. La suma
          de los tramos es igual al monto de la tarjeta "En mora".
        </p>
      </div>
    </div>
  );
}