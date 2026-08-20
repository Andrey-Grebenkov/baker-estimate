import { describe, expect, it } from 'vitest'
import { normalizeNumberString, parseNumberInput } from './numberInput'

describe('normalizeNumberString', () => {
  it('strips leading zeros and keeps decimals', () => {
    expect(normalizeNumberString('03')).toBe('3')
    expect(normalizeNumberString('0032')).toBe('32')
    expect(normalizeNumberString('0.02')).toBe('0.02')
    expect(normalizeNumberString('.5')).toBe('0.5')
    expect(normalizeNumberString('0')).toBe('0')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeNumberString('')).toBe('')
  })

  it('clamps values above the provided max', () => {
    expect(normalizeNumberString('1000000', 999999)).toBe('999999')
    expect(normalizeNumberString('999999.5', 999999)).toBe('999999')
    expect(normalizeNumberString('1001', 1000)).toBe('1000')
    expect(normalizeNumberString('1234567890123', 999999)).toBe('999999')
  })

  it('does not clamp values at or below the max', () => {
    expect(normalizeNumberString('999999', 999999)).toBe('999999')
    expect(normalizeNumberString('1000', 1000)).toBe('1000')
    expect(normalizeNumberString('0.5', 1000)).toBe('0.5')
  })
})

describe('parseNumberInput', () => {
  it('returns a number for valid input', () => {
    expect(parseNumberInput('250')).toBe(250)
    expect(parseNumberInput('0.5')).toBe(0.5)
  })

  it('returns 0 for empty or invalid input', () => {
    expect(parseNumberInput('')).toBe(0)
    expect(parseNumberInput('-')).toBe(0)
    expect(parseNumberInput('abc')).toBe(0)
  })
})
