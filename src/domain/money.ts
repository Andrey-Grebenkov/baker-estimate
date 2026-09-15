/**
 * Округление до копеек (2 знака после запятой).
 */
export function roundToCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatMoney(value: number): string {
  return String(parseFloat(roundToCurrency(value).toFixed(2)))
}

/**
 * Сумма налога от выручки по ставке в процентах.
 * Ставка 0 или отрицательная — налог не начисляется.
 */
export function calculateTaxAmount(revenue: number, taxPercent: number): number {
  if (taxPercent <= 0 || revenue <= 0) {
    return 0
  }
  return roundToCurrency(revenue * (taxPercent / 100))
}
