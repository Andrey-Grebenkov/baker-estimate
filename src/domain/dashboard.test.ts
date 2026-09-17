import { describe, expect, it } from 'vitest'
import { buildCake } from './cake'
import { buildIngredient } from './ingredient'
import { buildRecipe } from './recipe'
import {
  calculateAverageCostBreakdown,
  calculateMonthMetrics,
  getActiveOrdersByDelivery,
  getCurrentMonthOrders,
  getOrderUrgency,
} from './dashboard'
import type { Order } from './types'

const userId = 'user-1'

// Фиксированное «сейчас»: чт, 17 сентября 2026, полдень.
const NOW = new Date(2026, 8, 17, 12, 0, 0)

function makeIngredient(id: string, name: string, price = 100, quantity = 1000) {
  return buildIngredient({
    id,
    user_id: userId,
    name,
    pricePerPackage: price,
    packageQuantity: quantity,
    unit: 'g',
  })
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    status: 'Новый',
    delivery_date: '2026-09-20T12:00:00',
    actual_cost: 0,
    total_cost: 500,
    paid_amount: 2000,
    advance_payment: 0,
    ...overrides,
  }
}

describe('getCurrentMonthOrders', () => {
  it('keeps only orders with delivery date inside the month', () => {
    const orders = [
      makeOrder({ id: 'aug', delivery_date: '2026-08-31T23:59:00' }),
      makeOrder({ id: 'sep-first', delivery_date: '2026-09-01T00:01:00' }),
      makeOrder({ id: 'sep-last', delivery_date: '2026-09-30T23:59:00' }),
      makeOrder({ id: 'oct', delivery_date: '2026-10-01T00:01:00' }),
    ]

    const ids = getCurrentMonthOrders(orders, NOW).map((o) => o.id)
    expect(ids).toEqual(['sep-first', 'sep-last'])
  })

  it('returns empty array for empty input', () => {
    expect(getCurrentMonthOrders([], NOW)).toEqual([])
  })
})

describe('calculateMonthMetrics', () => {
  it('returns zeros for empty data', () => {
    const metrics = calculateMonthMetrics([], 0, NOW)
    expect(metrics.expectedRevenue).toBe(0)
    expect(metrics.expectedProfit).toBe(0)
    expect(metrics.monthOrderCount).toBe(0)
    expect(metrics.averageCheck).toBe(0)
  })

  it('sums expected revenue over all month orders except canceled', () => {
    const orders = [
      makeOrder({ id: 'a', paid_amount: 3000, total_cost: 1000 }),
      makeOrder({ id: 'b', status: 'В работе', paid_amount: 2000, total_cost: 800 }),
      makeOrder({ id: 'c', status: 'Выдан', paid_amount: 1000, total_cost: 400 }),
      makeOrder({ id: 'd', status: 'Отменен', paid_amount: 5000, total_cost: 2000 }),
      // Заказ следующего месяца не участвует в выручке/среднем чеке.
      makeOrder({ id: 'e', delivery_date: '2026-10-05T12:00:00', paid_amount: 9000, total_cost: 100 }),
    ]

    const metrics = calculateMonthMetrics(orders, 0, NOW)

    expect(metrics.expectedRevenue).toBe(6000)
    expect(metrics.expectedProfit).toBe(6000 - 2200)
    expect(metrics.monthOrderCount).toBe(3)
    expect(metrics.averageCheck).toBe(2000)
  })

  it('deducts tax from expected profit', () => {
    const orders = [makeOrder({ paid_amount: 10000, total_cost: 4000 })]
    const metrics = calculateMonthMetrics(orders, 6, NOW)
    expect(metrics.expectedProfit).toBe(10000 - 4000 - 600)
  })

  it('counts every non-canceled order of the month in monthOrderCount', () => {
    const orders = [
      makeOrder({ id: 'a', status: 'Новый' }),
      makeOrder({ id: 'b', status: 'В работе' }),
      makeOrder({ id: 'c', status: 'Выдан' }),
      makeOrder({ id: 'd', status: 'Отменен' }),
      makeOrder({ id: 'e', status: 'Новый', delivery_date: '2026-10-05T12:00:00' }),
    ]

    expect(calculateMonthMetrics(orders, 0, NOW).monthOrderCount).toBe(3)
  })

  it('calculates metrics for a selected past month', () => {
    const orders = [
      makeOrder({ id: 'aug', delivery_date: '2026-08-10T12:00:00', paid_amount: 3000 }),
      makeOrder({ id: 'sep', delivery_date: '2026-09-10T12:00:00', paid_amount: 5000 }),
    ]

    const metrics = calculateMonthMetrics(orders, 0, new Date(2026, 7, 15))
    expect(metrics.expectedRevenue).toBe(3000)
    expect(metrics.monthOrderCount).toBe(1)
  })
})

describe('getActiveOrdersByDelivery', () => {
  it('excludes delivered/canceled and sorts by nearest delivery date', () => {
    const orders = [
      makeOrder({ id: 'later', delivery_date: '2026-09-25T10:00:00' }),
      makeOrder({ id: 'done', status: 'Выдан', delivery_date: '2026-09-18T10:00:00' }),
      makeOrder({ id: 'first', status: 'В работе', delivery_date: '2026-09-18T09:00:00' }),
      makeOrder({ id: 'canceled', status: 'Отменен', delivery_date: '2026-09-19T10:00:00' }),
      makeOrder({ id: 'overdue', delivery_date: '2026-09-10T10:00:00' }),
    ]

    expect(getActiveOrdersByDelivery(orders).map((o) => o.id)).toEqual([
      'overdue',
      'first',
      'later',
    ])
  })
})

describe('getOrderUrgency', () => {
  const urgencyAt = (iso: string) => getOrderUrgency(makeOrder({ delivery_date: iso }), NOW)

  it('marks overdue, urgent, soon and planned', () => {
    expect(urgencyAt('2026-09-16T23:00:00')).toBe('overdue')
    expect(urgencyAt('2026-09-17T08:00:00')).toBe('urgent') // сегодня
    expect(urgencyAt('2026-09-18T23:00:00')).toBe('urgent') // завтра
    expect(urgencyAt('2026-09-20T12:00:00')).toBe('soon') // +3 дня
    expect(urgencyAt('2026-09-24T12:00:00')).toBe('soon') // +7 дней
    expect(urgencyAt('2026-09-25T12:00:00')).toBe('planned') // +8 дней
  })
})

describe('calculateAverageCostBreakdown', () => {
  it('returns empty breakdown when no cakes', () => {
    expect(calculateAverageCostBreakdown([])).toEqual([])
  })

  it('averages each cost category', () => {
    const ing = makeIngredient('ing-1', 'Сахар', 200, 1000)
    const ing2 = makeIngredient('ing-2', 'Мука', 100, 1000)

    const recipe = buildRecipe(
      {
        id: 'rec-1',
        user_id: userId,
        name: 'Бисквит',
        ingredients: [
          { ingredientId: ing.id, quantityUsed: 100 },
          { ingredientId: ing2.id, quantityUsed: 100 },
        ],
      },
      { [ing.id]: ing, [ing2.id]: ing2 },
    )

    const cakeA = buildCake(
      {
        id: 'cake-a',
        user_id: userId,
        name: 'A',
        recipes: [{ recipeId: recipe.id, multiplier: 1 }],
        packaging: [{ id: '1', name: 'Коробка', cost: 100, quantity: 1 }],
        decor: [{ id: '2', name: 'Топпер', cost: 50, quantity: 1 }],
        overheads: { workHours: 1, hourlyRate: 100, fixedCosts: 0 },
        marginPercent: 30,
      },
      { [recipe.id]: recipe },
    )

    const cakeB = buildCake(
      {
        id: 'cake-b',
        user_id: userId,
        name: 'B',
        recipes: [{ recipeId: recipe.id, multiplier: 2 }],
        packaging: [{ id: '1', name: 'Коробка', cost: 200, quantity: 1 }],
        decor: [{ id: '2', name: 'Топпер', cost: 100, quantity: 1 }],
        overheads: { workHours: 2, hourlyRate: 100, fixedCosts: 50 },
        marginPercent: 30,
      },
      { [recipe.id]: recipe },
    )

    const breakdown = calculateAverageCostBreakdown([cakeA, cakeB])

    const ingredients = breakdown.find((b) => b.name === 'Ингредиенты')?.value ?? 0
    const packaging = breakdown.find((b) => b.name === 'Упаковка')?.value ?? 0
    const decor = breakdown.find((b) => b.name === 'Декор')?.value ?? 0
    const overheads = breakdown.find((b) => b.name === 'Накладные')?.value ?? 0

    expect(ingredients).toBe((cakeA.totalIngredientsCost + cakeB.totalIngredientsCost) / 2)
    expect(packaging).toBe((cakeA.totalPackagingCost + cakeB.totalPackagingCost) / 2)
    expect(decor).toBe((cakeA.totalDecorCost + cakeB.totalDecorCost) / 2)
    expect(overheads).toBe((cakeA.totalOverheadsCost + cakeB.totalOverheadsCost) / 2)
  })
})
