import { describe, expect, it, vi } from 'vitest'
import { addCake, updateCake } from './db'
import { supabase } from './supabase'
import { buildIngredient } from '../domain/ingredient'
import { buildRecipe } from '../domain/recipe'
import type { Recipe } from '../domain/types'

const sugar = buildIngredient({
  id: 'sugar-1',
  user_id: 'u-1',
  name: 'Сахар',
  pricePerPackage: 250,
  packageQuantity: 1000,
  unit: 'g',
})

const milk = buildIngredient({
  id: 'milk-1',
  user_id: 'u-1',
  name: 'Молоко',
  pricePerPackage: 120,
  packageQuantity: 500,
  unit: 'ml',
})

const eggs = buildIngredient({
  id: 'eggs-1',
  user_id: 'u-1',
  name: 'Яйца',
  pricePerPackage: 150,
  packageQuantity: 10,
  unit: 'pcs',
})

const ingredientsById = { [sugar.id]: sugar, [milk.id]: milk, [eggs.id]: eggs }

const biscuit = buildRecipe(
  {
    id: 'biscuit-1',
    user_id: 'u-1',
    name: 'Бисквит',
    ingredients: [
      { ingredientId: sugar.id, quantityUsed: 200 },
      { ingredientId: milk.id, quantityUsed: 100 },
      { ingredientId: eggs.id, quantityUsed: 2 },
    ],
  },
  ingredientsById,
)

const recipesById: Record<string, Recipe> = { [biscuit.id]: biscuit }

function getInsertPayload() {
  const fromMock = vi.mocked(supabase.from)
  const table = fromMock.mock.results.at(-1)?.value
  return table?.insert?.mock?.calls?.[0]?.[0]
}

function getUpdatePayload() {
  const fromMock = vi.mocked(supabase.from)
  const table = fromMock.mock.results.at(-1)?.value
  return table?.update?.mock?.calls?.[0]?.[0]
}

describe('db cake recipes', () => {
  it('addCake normalizes all recipe multipliers to 1', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockClear()

    await addCake(
      {
        name: 'Торт с неправильным множителем',
        recipes: [{ recipeId: biscuit.id, multiplier: 5 }],
        packaging: [],
        decor: [],
        overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
        base_yield_weight: 1.2,
        base_yield_unit: 'кг',
        marginPercent: 0,
      },
      'u-1',
      recipesById,
    )

    const payload = getInsertPayload()
    expect(payload).toBeDefined()
    expect(payload.recipes).toHaveLength(1)
    expect(payload.recipes[0].multiplier).toBe(1)
    expect(payload.recipes[0].recipeId).toBe(biscuit.id)
    expect(payload.total_ingredients_cost).toBe(biscuit.totalCost)
    expect(payload.weight_kg).toBe(1.2)
  })

  it('updateCake normalizes all recipe multipliers to 1', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockClear()

    await updateCake(
      'cake-1',
      {
        name: 'Обновленный торт',
        recipes: [
          { recipeId: biscuit.id, multiplier: 3 },
        ],
        packaging: [],
        decor: [],
        overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
        base_yield_weight: 1.2,
        base_yield_unit: 'кг',
        marginPercent: 0,
      },
      'u-1',
      recipesById,
    )

    const payload = getUpdatePayload()
    expect(payload).toBeDefined()
    expect(payload.recipes).toHaveLength(1)
    expect(payload.recipes[0].multiplier).toBe(1)
    expect(payload.total_ingredients_cost).toBe(biscuit.totalCost)
  })
})
