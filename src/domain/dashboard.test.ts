import { describe, expect, it } from 'vitest'
import { buildCake } from './cake'
import { buildIngredient } from './ingredient'
import { buildRecipe } from './recipe'
import {
  calculateAverageCostBreakdown,
  calculateDashboardMetrics,
  getRecentCakeCosts,
} from './dashboard'

const userId = 'user-1'

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

function makeCake(name: string, costOverrides: Partial<Parameters<typeof buildCake>[0]> = {}) {
  const ing = makeIngredient('ing-1', 'Сахар')
  const recipe = buildRecipe(
    {
      id: 'rec-1',
      user_id: userId,
      name: 'Бисквит',
      ingredients: [{ ingredientId: ing.id, quantityUsed: 100 }],
    },
    { [ing.id]: ing },
  )

  return buildCake(
    {
      id: 'cake-1',
      user_id: userId,
      name,
      recipes: [{ recipeId: recipe.id, multiplier: 1 }],
      packaging: [],
      decor: [],
      overheads: { workHours: 1, hourlyRate: 100, fixedCosts: 0 },
      marginPercent: 30,
      ...costOverrides,
    },
    { [recipe.id]: recipe },
  )
}

describe('calculateDashboardMetrics', () => {
  it('returns zeros for empty data', () => {
    const metrics = calculateDashboardMetrics([], [])
    expect(metrics.totalCakes).toBe(0)
    expect(metrics.totalRecipes).toBe(0)
    expect(metrics.averageCost).toBe(0)
  })

  it('calculates totals and average cost', () => {
    const cakes = [
      makeCake('Торт 1'),
      makeCake('Торт 2'),
    ]
    const recipes = [{ id: 'rec-1' }, { id: 'rec-2' }]

    const metrics = calculateDashboardMetrics(cakes, recipes)

    expect(metrics.totalCakes).toBe(2)
    expect(metrics.totalRecipes).toBe(2)
    expect(metrics.averageCost).toBeGreaterThan(0)
    expect(metrics.averageCost).toBe(
      Math.round((cakes[0].finalCostPrice + cakes[1].finalCostPrice) / 2 * 100) / 100,
    )
  })

  it('handles missing recipes array', () => {
    const metrics = calculateDashboardMetrics([makeCake('Торт 1')], undefined)
    expect(metrics.totalRecipes).toBe(0)
  })
})

describe('getRecentCakeCosts', () => {
  it('returns empty array when no cakes', () => {
    expect(getRecentCakeCosts([])).toEqual([])
  })

  it('returns up to the requested limit', () => {
    const cakes = [1, 2, 3, 4, 5, 6].map((i) => makeCake(`Торт ${i}`))
    const recent = getRecentCakeCosts(cakes, 5)
    expect(recent).toHaveLength(5)
    expect(recent[0].name).toBe('Торт 1')
    expect(recent[4].name).toBe('Торт 5')
  })

  it('truncates long names', () => {
    const name = 'Очень длинное название торта'
    const cake = makeCake(name)
    const recent = getRecentCakeCosts([cake])
    expect(recent[0].name.endsWith('…')).toBe(true)
    expect(recent[0].name.length).toBeLessThanOrEqual(19)
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
