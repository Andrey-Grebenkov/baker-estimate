import { differenceInCalendarDays, endOfMonth, startOfMonth } from 'date-fns'
import { calculateTaxAmount, roundToCurrency } from './money'
import type { CakeDetails } from './cake'
import type { Order, OrderStatus } from './types'

export interface CostBreakdownPoint {
  name: string
  value: number
}

/**
 * Метрики дашборда за текущий месяц.
 * Выручка и прибыль — ожидаемые (pipeline): по всем заказам месяца,
 * кроме отменённых, а не только по выданным.
 */
export interface MonthMetrics {
  expectedRevenue: number
  expectedProfit: number
  monthOrderCount: number
  averageCheck: number
  /** Все активные заказы («Новый»/«В работе») независимо от месяца. */
  activeOrdersCount: number
}

/** Визуальная срочность отдачи заказа для списка «Ближайшие отдачи». */
export type OrderUrgency = 'overdue' | 'urgent' | 'soon' | 'planned'

const BREAKDOWN_LABELS: Record<string, string> = {
  totalIngredientsCost: 'Ингредиенты',
  totalPackagingCost: 'Упаковка',
  totalDecorCost: 'Декор',
  totalOverheadsCost: 'Накладные',
}

const ACTIVE_STATUSES: OrderStatus[] = ['Новый', 'В работе']

export function isActiveOrder(order: Order): boolean {
  return ACTIVE_STATUSES.includes(order.status)
}

/** Заказы с датой отдачи внутри месяца, содержащего `now`. */
export function getCurrentMonthOrders(orders: Order[], now = new Date()): Order[] {
  const start = startOfMonth(now).getTime()
  const end = endOfMonth(now).getTime()
  return orders.filter((order) => {
    const time = new Date(order.delivery_date).getTime()
    return time >= start && time <= end
  })
}

export function calculateMonthMetrics(
  orders: Order[],
  taxPercent: number,
  now = new Date(),
): MonthMetrics {
  const monthOrders = getCurrentMonthOrders(orders, now).filter(
    (order) => order.status !== 'Отменен',
  )
  const expectedRevenue = roundToCurrency(
    monthOrders.reduce((sum, order) => sum + order.paid_amount, 0),
  )
  const cost = monthOrders.reduce((sum, order) => sum + order.total_cost, 0)
  const tax = calculateTaxAmount(expectedRevenue, taxPercent)
  const monthOrderCount = monthOrders.length

  return {
    expectedRevenue,
    expectedProfit: roundToCurrency(expectedRevenue - cost - tax),
    monthOrderCount,
    averageCheck: monthOrderCount > 0 ? roundToCurrency(expectedRevenue / monthOrderCount) : 0,
    activeOrdersCount: orders.filter(isActiveOrder).length,
  }
}

/** Все активные заказы по возрастанию даты отдачи (ближайшие и просроченные сверху). */
export function getActiveOrdersByDelivery(orders: Order[]): Order[] {
  return orders
    .filter(isActiveOrder)
    .sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime())
}

/**
 * Срочность по дате отдачи: уже прошла → 'overdue', сегодня/завтра → 'urgent',
 * в пределах недели → 'soon', позже → 'planned'.
 */
export function getOrderUrgency(order: Order, now = new Date()): OrderUrgency {
  const days = differenceInCalendarDays(new Date(order.delivery_date), now)
  if (days < 0) return 'overdue'
  if (days <= 1) return 'urgent'
  if (days <= 7) return 'soon'
  return 'planned'
}

export function calculateAverageCostBreakdown(cakes: CakeDetails[]): CostBreakdownPoint[] {
  if (cakes.length === 0) return []

  const sums = {
    totalIngredientsCost: 0,
    totalPackagingCost: 0,
    totalDecorCost: 0,
    totalOverheadsCost: 0,
  }

  for (const cake of cakes) {
    sums.totalIngredientsCost += cake.totalIngredientsCost
    sums.totalPackagingCost += cake.totalPackagingCost
    sums.totalDecorCost += cake.totalDecorCost
    sums.totalOverheadsCost += cake.totalOverheadsCost
  }

  return Object.entries(sums).map(([key, value]) => ({
    name: BREAKDOWN_LABELS[key] ?? key,
    value: roundToCurrency(value / cakes.length),
  }))
}
