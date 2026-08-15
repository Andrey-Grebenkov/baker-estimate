/**
 * Округление до копеек (2 знака после запятой).
 */
export function roundToCurrency(value: number): number {
  return Math.round(value * 100) / 100
}
