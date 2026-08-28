export type PeriodFilter = 'today' | 'week' | 'month' | 'custom' | 'all'

export interface DateRange {
  start: Date
  end: Date
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

export function getPeriodRange(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
  now = new Date(),
): DateRange | null {
  if (period === 'all') return null

  if (period === 'custom') {
    if (!customStart || !customEnd) return null
    return {
      start: startOfDay(new Date(customStart)),
      end: endOfDay(new Date(customEnd)),
    }
  }

  const today = startOfDay(now)

  switch (period) {
    case 'today':
      return { start: today, end: endOfDay(now) }

    case 'week': {
      const dayOfWeek = today.getDay()
      const daysSinceMonday = (dayOfWeek + 6) % 7
      const monday = new Date(today)
      monday.setDate(today.getDate() - daysSinceMonday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return { start: startOfDay(monday), end: endOfDay(sunday) }
    }

    case 'month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { start: startOfDay(firstDay), end: endOfDay(lastDay) }
    }

    default:
      return null
  }
}

export function isDateInRange(isoDate: string, range: DateRange): boolean {
  const time = new Date(isoDate).getTime()
  return time >= range.start.getTime() && time <= range.end.getTime()
}

export function formatPeriodRevenue(value: number): string {
  return String(parseFloat(value.toFixed(2)))
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
