import { describe, it, expect } from 'vitest'
import type { Ingredient } from './types'
import { buildRecipe, calculateRecipeTotals } from './recipe'

const sugar: Ingredient = {
  id: 'sugar-1',
  name: 'Сахар белый',
  pricePerPackage: 250,
  packageQuantity: 1000,
  unit: 'g',
  pricePerBaseUnit: 0.25,
}

const milk: Ingredient = {
  id: 'milk-1',
  name: 'Молоко',
  pricePerPackage: 120,
  packageQuantity: 500,
  unit: 'ml',
  pricePerBaseUnit: 0.24,
}

const eggs: Ingredient = {
  id: 'eggs-1',
  name: 'Яйца',
  pricePerPackage: 150,
  packageQuantity: 10,
  unit: 'pcs',
  pricePerBaseUnit: 15,
}

const ingredientsById: Record<string, Ingredient> = {
  'sugar-1': sugar,
  'milk-1': milk,
  'eggs-1': eggs,
}

describe('calculateRecipeTotals', () => {
  it('sums weight and cost for g and ml ingredients', () => {
    const recipeIngredients = [
      { ingredientId: 'sugar-1', quantityUsed: 300 },
      { ingredientId: 'milk-1', quantityUsed: 200 },
    ]

    const result = calculateRecipeTotals(recipeIngredients, ingredientsById)

    expect(result.totalWeight).toBe(500)
    expect(result.totalCost).toBe(123)
  })

  it('includes pcs ingredients in cost but not in weight', () => {
    const recipeIngredients = [
      { ingredientId: 'sugar-1', quantityUsed: 200 },
      { ingredientId: 'eggs-1', quantityUsed: 3 },
    ]

    const result = calculateRecipeTotals(recipeIngredients, ingredientsById)

    expect(result.totalWeight).toBe(200)
    expect(result.totalCost).toBe(95)
  })

  it('returns zero for empty recipe', () => {
    const result = calculateRecipeTotals([], {})

    expect(result.totalWeight).toBe(0)
    expect(result.totalCost).toBe(0)
  })

  it('rounds total cost to currency', () => {
    const fractionalSugar: Ingredient = {
      ...sugar,
      pricePerPackage: 99,
      pricePerBaseUnit: 0.099,
    }

    const result = calculateRecipeTotals(
      [{ ingredientId: 'sugar-1', quantityUsed: 333 }],
      { 'sugar-1': fractionalSugar },
    )

    expect(result.totalCost).toBe(32.97)
  })

  it('throws on missing ingredient', () => {
    const recipeIngredients = [
      { ingredientId: 'missing', quantityUsed: 100 },
    ]

    expect(() => calculateRecipeTotals(recipeIngredients, ingredientsById)).toThrow(
      'Ingredient with id "missing" not found',
    )
  })

  it('throws on negative quantity', () => {
    const recipeIngredients = [
      { ingredientId: 'sugar-1', quantityUsed: -50 },
    ]

    expect(() => calculateRecipeTotals(recipeIngredients, ingredientsById)).toThrow(
      'Quantity used cannot be negative',
    )
  })
})

describe('buildRecipe', () => {
  it('creates a recipe with calculated totals', () => {
    const recipe = buildRecipe(
      {
        id: 'biscuit-1',
        name: 'Бисквит ванильный',
        ingredients: [
          { ingredientId: 'sugar-1', quantityUsed: 200 },
          { ingredientId: 'milk-1', quantityUsed: 100 },
          { ingredientId: 'eggs-1', quantityUsed: 2 },
        ],
      },
      ingredientsById,
    )

    expect(recipe.totalWeight).toBe(300)
    expect(recipe.totalCost).toBe(104)
    expect(recipe.ingredients).toHaveLength(3)
  })
})
