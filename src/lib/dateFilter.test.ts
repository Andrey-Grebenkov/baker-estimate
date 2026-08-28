import { describe, expect, it } from 'vitest'
import { getPeriodRange, isDateInRange, formatPeriodRevenue } from './dateFilter'

describe('dateFilter', () => {
  it('returns the current calendar month by default', () => {
    const now = new Date('2026-08-28T12:00:00')
    const range = getPeriodRange('month', undefined, undefined, now)
    expect(range).not.toBeNull()
    expect(range?.start.getFullYear()).toBe(2026)
    expect(range?.start.getMonth()).toBe(7)
    expect(range?.start.getDate()).toBe(1)
    expect(range?.end.getFullYear()).toBe(2026)
    expect(range?.end.getMonth()).toBe(7)
    expect(range?.end.getDate()).toBe(31)
  })

  it('returns today\'s start and end', () => {
    const now = new Date('2026-08-28T12:00:00')
    const range = getPeriodRange('today', undefined, undefined, now)
    expect(range).not.toBeNull()
    expect(range?.start.getFullYear()).toBe(2026)
    expect(range?.start.getMonth()).toBe(7)
    expect(range?.start.getDate()).toBe(28)
    expect(range?.end.getFullYear()).toBe(2026)
    expect(range?.end.getMonth()).toBe(7)
    expect(range?.end.getDate()).toBe(28)
    expect(range?.end.getHours()).toBe(23)
  })

  it('returns the current Monday-to-Sunday week', () => {
    // Friday, 28 Aug 2026. The calendar week is Mon 24 Aug - Sun 30 Aug.
    const now = new Date('2026-08-28T12:00:00')
    const range = getPeriodRange('week', undefined, undefined, now)
    expect(range).not.toBeNull()
    expect(range?.start.getFullYear()).toBe(2026)
    expect(range?.start.getMonth()).toBe(7)
    expect(range?.start.getDate()).toBe(24)
    expect(range?.end.getFullYear()).toBe(2026)
    expect(range?.end.getMonth()).toBe(7)
    expect(range?.end.getDate()).toBe(30)
    expect(range?.end.getHours()).toBe(23)
  })

  it('returns null for all time', () => {
    const range = getPeriodRange('all', undefined, undefined, new Date())
    expect(range).toBeNull()
  })

  it('returns a custom range covering both start and end days', () => {
    const range = getPeriodRange('custom', '2026-08-10', '2026-08-15', new Date('2026-08-28T12:00:00'))
    expect(range).not.toBeNull()
    expect(range?.start.getFullYear()).toBe(2026)
    expect(range?.start.getMonth()).toBe(7)
    expect(range?.start.getDate()).toBe(10)
    expect(range?.start.getHours()).toBe(0)
    expect(range?.end.getFullYear()).toBe(2026)
    expect(range?.end.getMonth()).toBe(7)
    expect(range?.end.getDate()).toBe(15)
    expect(range?.end.getHours()).toBe(23)
  })

  it('filters dates correctly within a month range', () => {
    const range = getPeriodRange('month', undefined, undefined, new Date('2026-08-28T12:00:00'))
    expect(range).not.toBeNull()
    expect(isDateInRange(new Date('2026-08-01T00:00:00').toISOString(), range!)).toBe(true)
    expect(isDateInRange(new Date('2026-08-15T12:00:00').toISOString(), range!)).toBe(true)
    expect(isDateInRange(new Date('2026-08-31T23:59:59').toISOString(), range!)).toBe(true)
    expect(isDateInRange(new Date('2026-07-31T23:59:59').toISOString(), range!)).toBe(false)
    expect(isDateInRange(new Date('2026-09-01T00:00:00').toISOString(), range!)).toBe(false)
  })

  it('formats revenue with thousand separators and no trailing fractional zeros', () => {
    expect(formatPeriodRevenue(35000)).toBe('35 000')
    expect(formatPeriodRevenue(35000.5)).toBe('35 000.5')
    expect(formatPeriodRevenue(35000.55)).toBe('35 000.55')
    expect(formatPeriodRevenue(0)).toBe('0')
  })
})
