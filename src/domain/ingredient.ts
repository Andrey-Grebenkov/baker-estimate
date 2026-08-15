import type { Ingredient } from './types'
import { roundToCurrency } from './money'

/**
 * Рассчитывает стоимость базовой единицы ингредиента
 * (цена за 1 г, 1 мл или 1 штуку).
 */
export function calculatePricePerBaseUnit(
  pricePerPackage: number,
  packageQuantity: number,
): number {
  if (packageQuantity <= 0) {
    throw new Error('Package quantity must be greater than zero')
  }
  if (pricePerPackage < 0) {
    throw new Error('Price per package cannot be negative')
  }
  return pricePerPackage / packageQuantity
}

/**
 * Создает ингредиент с заполненным вычисляемым полем pricePerBaseUnit.
 */
export function buildIngredient(
  input: Omit<Ingredient, 'pricePerBaseUnit'>,
): Ingredient {
  return {
    ...input,
    pricePerBaseUnit: calculatePricePerBaseUnit(
      input.pricePerPackage,
      input.packageQuantity,
    ),
  }
}

/**
 * Стоимость использованного количества ингредиента.
 */
export function calculateIngredientCost(
  ingredient: Ingredient,
  quantity: number,
): number {
  if (quantity < 0) {
    throw new Error('Quantity used cannot be negative')
  }
  return ingredient.pricePerBaseUnit * quantity
}

/**
 * Стоимость использованного количества, округленная до копеек.
 */
export function calculateRoundedIngredientCost(
  ingredient: Ingredient,
  quantity: number,
): number {
  return roundToCurrency(calculateIngredientCost(ingredient, quantity))
}
