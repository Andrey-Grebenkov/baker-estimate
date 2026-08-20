/**
 * Normalizes a typed number string:
 * - strips leading zeros for whole numbers ("03" -> "3", "0032" -> "32");
 * - keeps a single leading zero for decimals ("0.02" stays "0.02");
 * - turns a leading dot into a valid decimal start (".5" -> "0.5");
 * - falls back to "0" if the value becomes an empty integer.
 */
export function normalizeNumberString(value: string): string {
  if (value === '' || value === '-') return value

  // Start typing a decimal with the dot
  if (value === '.') return '0.'
  if (value.startsWith('.')) return `0${value}`

  // Remove leading zeros only when a non-zero integer digit follows
  const withoutLeadingZeros = value.replace(/^0+(?=\d)/, '')
  if (withoutLeadingZeros === '') return '0'
  return withoutLeadingZeros
}

/** Parses a number input value and returns 0 for empty/invalid values. */
export function parseNumberInput(value: string): number {
  const normalized = normalizeNumberString(value)
  if (normalized === '' || normalized === '-') return 0
  const num = Number(normalized)
  return Number.isNaN(num) ? 0 : num
}
