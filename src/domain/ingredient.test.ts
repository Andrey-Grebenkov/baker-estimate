import { describe, it, expect } from 'vitest'
import type { Ingredient } from './types'
import { roundToCurrency } from './money'
import {
  buildIngredient,
  calculateIngredientCost,
  calculatePricePerBaseUnit,
  calculateRoundedIngredientCost,
} from './ingredient'

describe('roundToCurrency', () => {
  it('rounds to two decimal places', () => {
    expect(roundToCurrency(10.555)).toBe(10.56)
    expect(roundToCurrency(10.554)).toBe(10.55)
    expect(roundToCurrency(0.125)).toBe(0.13)
    expect(roundToCurrency(0)).toBe(0)
  })
})

describe('calculatePricePerBaseUnit', () => {
  it('returns price per gram for solid ingredients', () => {
    // 500 руб. за 1000 г -> 0.5 руб./г
    expect(calculatePricePerBaseUnit(500, 1000)).toBe(0.5)
  })

  it('returns price per milliliter for liquids', () => {
    // 120 руб. за 500 мл -> 0.24 руб./мл
    expect(calculatePricePerBaseUnit(120, 500)).toBe(0.24)
  })

  it('returns price per piece for countable items', () => {
    // 150 руб. за 10 яиц -> 15 руб./шт.
    expect(calculatePricePerBaseUnit(150, 10)).toBe(15)
  })

  it('handles fractional package quantities', () => {
    expect(calculatePricePerBaseUnit(99, 1000)).toBe(0.099)
  })

  it('throws on zero package quantity', () => {
    expect(() => calculatePricePerBaseUnit(500, 0)).toThrow(
      'Package quantity must be greater than zero',
    )
  })

  it('throws on negative package quantity', () => {
    expect(() => calculatePricePerBaseUnit(500, -100)).toThrow(
      'Package quantity must be greater than zero',
    )
  })

  it('throws on negative price', () => {
    expect(() => calculatePricePerBaseUnit(-100, 1000)).toThrow(
      'Price per package cannot be negative',
    )
  })

  it('returns zero price per unit for free ingredients', () => {
    expect(calculatePricePerBaseUnit(0, 1000)).toBe(0)
  })
})

describe('buildIngredient', () => {
  it('calculates pricePerBaseUnit and keeps other fields', () => {
    const input = {
      id: 'sugar-1',
      name: 'Сахар белый',
      pricePerPackage: 250,
      packageQuantity: 1000,
      unit: 'g' as const,
    }

    const ingredient = buildIngredient(input)

    expect(ingredient).toEqual({
      ...input,
      pricePerBaseUnit: 0.25,
    })
  })

  it('keeps inStock undefined when not provided', () => {
    const input = {
      id: 'sugar-1',
      name: 'Сахар белый',
      pricePerPackage: 250,
      packageQuantity: 1000,
      unit: 'g' as const,
    }

    const ingredient = buildIngredient(input)

    expect(ingredient.inStock).toBeUndefined()
  })

  it('preserves inStock value when provided', () => {
    const input = {
      id: 'sugar-1',
      name: 'Сахар белый',
      pricePerPackage: 250,
      packageQuantity: 1000,
      unit: 'g' as const,
      inStock: 500,
    }

    const ingredient = buildIngredient(input)

    expect(ingredient.inStock).toBe(500)
  })

  it('preserves a zero inStock value', () => {
    const input = {
      id: 'sugar-1',
      name: 'Сахар белый',
      pricePerPackage: 250,
      packageQuantity: 1000,
      unit: 'g' as const,
      inStock: 0,
    }

    const ingredient = buildIngredient(input)

    expect(ingredient.inStock).toBe(0)
  })
})

describe('calculateIngredientCost', () => {
  it('calculates cost for a given quantity', () => {
    const ingredient: Ingredient = {
      id: 'milk-1',
      name: 'Молоко',
      pricePerPackage: 120,
      packageQuantity: 500,
      unit: 'ml',
      pricePerBaseUnit: 0.24,
    }

    expect(calculateIngredientCost(ingredient, 250)).toBe(60)
    expect(calculateIngredientCost(ingredient, 0)).toBe(0)
  })

  it('throws on negative quantity', () => {
    const ingredient: Ingredient = {
      id: 'milk-1',
      name: 'Молоко',
      pricePerPackage: 120,
      packageQuantity: 500,
      unit: 'ml',
      pricePerBaseUnit: 0.24,
    }

    expect(() => calculateIngredientCost(ingredient, -10)).toThrow(
      'Quantity used cannot be negative',
    )
  })
})

describe('calculateRoundedIngredientCost', () => {
  it('returns cost rounded to currency', () => {
    const ingredient: Ingredient = {
      id: 'sugar-1',
      name: 'Сахар белый',
      pricePerPackage: 99,
      packageQuantity: 1000,
      unit: 'g',
      pricePerBaseUnit: 0.099,
    }

    expect(calculateRoundedIngredientCost(ingredient, 333)).toBe(32.97)
  })
})
