import { describe, expect, it } from 'vitest'
import { calculateTaxAmount, formatMoney, roundToCurrency } from './money'

describe('roundToCurrency', () => {
  it('rounds to two decimals', () => {
    expect(roundToCurrency(1.236)).toBe(1.24)
    expect(roundToCurrency(1.234)).toBe(1.23)
    expect(roundToCurrency(10.499)).toBe(10.5)
    expect(roundToCurrency(0)).toBe(0)
  })
})

describe('formatMoney', () => {
  it('strips trailing zeros', () => {
    expect(formatMoney(1000)).toBe('1000')
    expect(formatMoney(55.5)).toBe('55.5')
    expect(formatMoney(55.56)).toBe('55.56')
  })
})

describe('calculateTaxAmount', () => {
  it('returns 0 when the rate is 0 or negative', () => {
    expect(calculateTaxAmount(1000, 0)).toBe(0)
    expect(calculateTaxAmount(1000, -4)).toBe(0)
  })

  it('returns 0 when revenue is 0 or negative', () => {
    expect(calculateTaxAmount(0, 6)).toBe(0)
    expect(calculateTaxAmount(-100, 6)).toBe(0)
  })

  it('calculates percent of revenue', () => {
    expect(calculateTaxAmount(1000, 6)).toBe(60)
    expect(calculateTaxAmount(2500, 4)).toBe(100)
  })

  it('rounds the result to currency', () => {
    expect(calculateTaxAmount(1234.56, 4.5)).toBe(55.56)
    expect(calculateTaxAmount(999.99, 7)).toBe(70)
  })
})
