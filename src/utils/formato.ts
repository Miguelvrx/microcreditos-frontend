// Formato de moneda compartido por el dashboard y el modal del crédito.
// Con separador de miles y 2 decimales, igual que los PDF: 40300 -> "$40,300.00".
export function formatoMoneda(valor: number): string {
  return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}