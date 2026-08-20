/**
 * Округление до копеек (2 знака после запятой).
 */
export function roundToCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatMoney(value: number): string {
  return roundToCurrency(value).toFixed(2)
}
