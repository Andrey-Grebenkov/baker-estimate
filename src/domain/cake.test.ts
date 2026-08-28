import { describe, it, expect } from 'vitest'
import type { Ingredient, Recipe } from './types'
import { buildIngredient } from './ingredient'
import { buildRecipe } from './recipe'
import { buildCake } from './cake'

const sugar = buildIngredient({
  id: 'sugar-1',
  name: 'Сахар белый',
  pricePerPackage: 250,
  packageQuantity: 1000,
  unit: 'g',
})

const milk = buildIngredient({
  id: 'milk-1',
  name: 'Молоко',
  pricePerPackage: 120,
  packageQuantity: 500,
  unit: 'ml',
})

const eggs = buildIngredient({
  id: 'eggs-1',
  name: 'Яйца',
  pricePerPackage: 150,
  packageQuantity: 10,
  unit: 'pcs',
})

const flour = buildIngredient({
  id: 'flour-1',
  name: 'Мука',
  pricePerPackage: 120,
  packageQuantity: 1000,
  unit: 'g',
})

const ingredientsById: Record<string, Ingredient> = {
  'sugar-1': sugar,
  'milk-1': milk,
  'eggs-1': eggs,
  'flour-1': flour,
}

const biscuit = buildRecipe(
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

const cream = buildRecipe(
  {
    id: 'cream-1',
    name: 'Крем чиз',
    ingredients: [
      { ingredientId: 'milk-1', quantityUsed: 250 },
      { ingredientId: 'sugar-1', quantityUsed: 100 },
    ],
  },
  ingredientsById,
)

const recipesById: Record<string, Recipe> = {
  'biscuit-1': biscuit,
  'cream-1': cream,
}

describe('buildCake', () => {
  it('calculates full cake cost with recipes, packaging, decor, overheads and margin', () => {
    const cake = buildCake(
      {
        id: 'cake-1',
        name: 'Свадебный 2-ярусный',
        recipes: [
          { recipeId: 'biscuit-1', multiplier: 1 },
          { recipeId: 'cream-1', multiplier: 1.5 },
        ],
        packaging: [{ id: 'box', name: 'Коробка', cost: 150, quantity: 1 }],
        decor: [{ id: 'topper', name: 'Топпер', cost: 80, quantity: 1 }],
        overheads: { workHours: 3, hourlyRate: 500, fixedCosts: 100 },
        marginPercent: 30,
      },
      recipesById,
    )

    expect(cake.totalIngredientsCost).toBe(231.5)
    expect(cake.totalPackagingCost).toBe(150)
    expect(cake.totalDecorCost).toBe(80)
    expect(cake.totalOverheadsCost).toBe(1600)
    expect(cake.finalCostPrice).toBe(2061.5)
    expect(cake.recommendedPrice).toBe(2679.95)
    expect(cake.weightKg).toBe(0.825)
    expect(cake.costPerKg).toBe(280.61)
    expect(cake.recommendedPricePerKg).toBe(364.79)
  })

  it('handles cake without packaging and decor', () => {
    const cake = buildCake(
      {
        id: 'cake-2',
        name: 'Торт без декора',
        recipes: [{ recipeId: 'biscuit-1', multiplier: 1 }],
        packaging: [],
        decor: [],
        overheads: { workHours: 1, hourlyRate: 300, fixedCosts: 50 },
        marginPercent: 20,
      },
      recipesById,
    )

    expect(cake.totalPackagingCost).toBe(0)
    expect(cake.totalDecorCost).toBe(0)
    expect(cake.finalCostPrice).toBe(454)
    expect(cake.recommendedPrice).toBe(544.8)
    expect(cake.costPerKg).toBe(346.67)
    expect(cake.recommendedPricePerKg).toBe(416)
  })

  it('handles zero margin', () => {
    const cake = buildCake(
      {
        id: 'cake-3',
        name: 'Торт без наценки',
        recipes: [{ recipeId: 'biscuit-1', multiplier: 1 }],
        packaging: [],
        decor: [],
        overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
        marginPercent: 0,
      },
      recipesById,
    )

    expect(cake.finalCostPrice).toBe(104)
    expect(cake.recommendedPrice).toBe(104)
    expect(cake.recommendedPricePerKg).toBe(cake.costPerKg)
  })

  it('calculates correct cost per kg for cakes under 1 kg', () => {
    const halfKilo = buildRecipe(
      {
        id: 'half-kg',
        name: 'Маленький торт',
        ingredients: [{ ingredientId: 'flour-1', quantityUsed: 500 }],
      },
      ingredientsById,
    )

    const cake = buildCake(
      {
        id: 'cake-4',
        name: 'Мини-торт',
        recipes: [{ recipeId: 'half-kg', multiplier: 1 }],
        packaging: [],
        decor: [],
        overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
        marginPercent: 0,
      },
      { 'half-kg': halfKilo },
    )

    expect(cake.weightKg).toBe(0.5)
    expect(cake.finalCostPrice).toBe(60)
    expect(cake.costPerKg).toBe(120)
  })

  it('calculates correct cost per kg for cakes over 1 kg', () => {
    const twoKilo = buildRecipe(
      {
        id: 'two-kg',
        name: 'Большой торт',
        ingredients: [{ ingredientId: 'flour-1', quantityUsed: 2000 }],
      },
      ingredientsById,
    )

    const cake = buildCake(
      {
        id: 'cake-5',
        name: 'Большой торт',
        recipes: [{ recipeId: 'two-kg', multiplier: 1 }],
        packaging: [],
        decor: [],
        overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
        marginPercent: 0,
      },
      { 'two-kg': twoKilo },
    )

    expect(cake.weightKg).toBe(2)
    expect(cake.finalCostPrice).toBe(240)
    expect(cake.costPerKg).toBe(120)
  })

  it('does not auto-scale recipe multipliers by base_yield_weight', () => {
    const cake = buildCake(
      {
        id: 'cake-base-yield',
        name: 'Торт с базовым выходом',
        recipes: [{ recipeId: 'biscuit-1', multiplier: 1 }],
        packaging: [],
        decor: [],
        overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
        marginPercent: 0,
        base_yield_weight: 1.2,
        base_yield_unit: 'кг',
      },
      recipesById,
    )

    expect(cake.recipes[0].multiplier).toBe(1)
    expect(cake.totalIngredientsCost).toBe(biscuit.totalCost)
    expect(cake.weightKg).toBe(1.2)
  })

  it('handles fractional recipe multipliers', () => {
    const cake = buildCake(
      {
        id: 'cake-6',
        name: 'Торт с дробной порцией',
        recipes: [{ recipeId: 'biscuit-1', multiplier: 0.5 }],
        packaging: [],
        decor: [],
        overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
        marginPercent: 0,
      },
      recipesById,
    )

    expect(cake.totalIngredientsCost).toBe(52)
    expect(cake.weightKg).toBe(0.15)
    expect(cake.costPerKg).toBe(346.67)
  })

  it('handles zero total weight and returns zero per-kg prices', () => {
    const cake = buildCake(
      {
        id: 'cake-7',
        name: 'Торт без рецептов',
        recipes: [],
        packaging: [{ id: 'box', name: 'Коробка', cost: 150, quantity: 1 }],
        decor: [],
        overheads: { workHours: 1, hourlyRate: 200, fixedCosts: 0 },
        marginPercent: 10,
      },
      {},
    )

    expect(cake.weightKg).toBe(0)
    expect(cake.totalIngredientsCost).toBe(0)
    expect(cake.totalPackagingCost).toBe(150)
    expect(cake.totalDecorCost).toBe(0)
    expect(cake.finalCostPrice).toBe(350)
    expect(cake.recommendedPrice).toBe(385)
    expect(cake.costPerKg).toBe(0)
    expect(cake.recommendedPricePerKg).toBe(0)
  })

  it('skips missing recipe references', () => {
    const cake = buildCake(
      {
        id: 'cake-missing',
        name: 'Торт с удалённым рецептом',
        recipes: [
          { recipeId: 'missing', multiplier: 1 },
          { recipeId: 'biscuit-1', multiplier: 1 },
        ],
        packaging: [],
        decor: [],
        overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
        marginPercent: 0,
      },
      recipesById,
    )

    expect(cake.totalIngredientsCost).toBe(biscuit.totalCost)
    expect(cake.weightKg).toBe(biscuit.totalWeight / 1000)
  })

  it('throws on negative recipe multiplier', () => {
    expect(() =>
      buildCake(
        {
          id: 'cake-negative-multiplier',
          name: 'Ошибочный торт',
          recipes: [{ recipeId: 'biscuit-1', multiplier: -1 }],
          packaging: [],
          decor: [],
          overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
          marginPercent: 0,
        },
        recipesById,
      ),
    ).toThrow('Recipe multiplier cannot be negative')
  })

  it('throws on negative packaging cost', () => {
    expect(() =>
      buildCake(
        {
          id: 'cake-negative-packaging-cost',
          name: 'Ошибочный торт',
          recipes: [],
          packaging: [{ id: 'bad', name: 'Bad', cost: -10, quantity: 1 }],
          decor: [],
          overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
          marginPercent: 0,
        },
        {},
      ),
    ).toThrow('Item cost cannot be negative')
  })

  it('throws on negative decor quantity', () => {
    expect(() =>
      buildCake(
        {
          id: 'cake-negative-decor-qty',
          name: 'Ошибочный торт',
          recipes: [],
          packaging: [],
          decor: [{ id: 'bad', name: 'Bad', cost: 10, quantity: -1 }],
          overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
          marginPercent: 0,
        },
        {},
      ),
    ).toThrow('Item quantity cannot be negative')
  })

  it('throws on negative overheads', () => {
    expect(() =>
      buildCake(
        {
          id: 'cake-negative-overheads',
          name: 'Ошибочный торт',
          recipes: [],
          packaging: [],
          decor: [],
          overheads: { workHours: -1, hourlyRate: 100, fixedCosts: 0 },
          marginPercent: 0,
        },
        {},
      ),
    ).toThrow('Work hours cannot be negative')
  })

  it('throws on negative margin', () => {
    expect(() =>
      buildCake(
        {
          id: 'cake-negative-margin',
          name: 'Ошибочный торт',
          recipes: [],
          packaging: [],
          decor: [],
          overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
          marginPercent: -10,
        },
        {},
      ),
    ).toThrow('Margin percent cannot be negative')
  })
})
