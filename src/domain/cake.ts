import type { Cake, CakeAdditionalItem, CakeRecipeItem, Overheads, Recipe } from './types'
import { roundToCurrency } from './money'

function assertNonNegative(value: number, message: string): void {
  if (value < 0) {
    throw new Error(message)
  }
}

export interface CakeDetails extends Cake {
  /** Итоговый вес торта в килограммах. */
  weightKg: number
  /** Себестоимость за 1 кг торта. */
  costPerKg: number
  /** Рекомендуемая цена продажи за 1 кг торта. */
  recommendedPricePerKg: number
}

export function calculateCakeRecipeCost(
  item: CakeRecipeItem,
  recipe: Recipe,
): number {
  if (item.multiplier < 0) {
    throw new Error('Recipe multiplier cannot be negative')
  }
  return roundToCurrency(recipe.totalCost * item.multiplier)
}

export function calculateCakeRecipeWeight(
  item: CakeRecipeItem,
  recipe: Recipe,
): number {
  if (item.multiplier < 0) {
    throw new Error('Recipe multiplier cannot be negative')
  }
  return recipe.totalWeight * item.multiplier
}

export function calculateCakeRecipesCost(
  items: CakeRecipeItem[],
  recipesById: Record<string, Recipe>,
): number {
  let total = 0

  for (const item of items) {
    const recipe = recipesById[item.recipeId]
    if (!recipe) {
      // Пропускаем рецепты, которые были удалены из базы.
      continue
    }
    total += calculateCakeRecipeCost(item, recipe)
  }

  return roundToCurrency(total)
}

export function calculateCakeRecipesWeight(
  items: CakeRecipeItem[],
  recipesById: Record<string, Recipe>,
): number {
  let total = 0

  for (const item of items) {
    const recipe = recipesById[item.recipeId]
    if (!recipe) {
      // Пропускаем рецепты, которые были удалены из базы.
      continue
    }
    total += calculateCakeRecipeWeight(item, recipe)
  }

  return total
}

export function calculateAdditionalItemsCost(
  items: CakeAdditionalItem[],
): number {
  let total = 0

  for (const item of items) {
    assertNonNegative(item.cost, 'Item cost cannot be negative')
    assertNonNegative(item.quantity, 'Item quantity cannot be negative')
    total += item.cost * item.quantity
  }

  return roundToCurrency(total)
}

export function calculateOverheadsCost(overheads: Overheads): number {
  assertNonNegative(overheads.workHours, 'Work hours cannot be negative')
  assertNonNegative(overheads.hourlyRate, 'Hourly rate cannot be negative')
  assertNonNegative(overheads.fixedCosts, 'Fixed costs cannot be negative')
  return roundToCurrency(overheads.workHours * overheads.hourlyRate + overheads.fixedCosts)
}

export function gramsToKilograms(grams: number): number {
  return grams / 1000
}

export function calculateFinalCostPrice(
  totalIngredientsCost: number,
  totalPackagingCost: number,
  totalDecorCost: number,
  totalOverheadsCost: number,
): number {
  return roundToCurrency(
    totalIngredientsCost + totalPackagingCost + totalDecorCost + totalOverheadsCost,
  )
}

export function calculateRecommendedPrice(
  finalCostPrice: number,
  marginPercent: number,
): number {
  assertNonNegative(marginPercent, 'Margin percent cannot be negative')
  return roundToCurrency(finalCostPrice * (1 + marginPercent / 100))
}

export function calculateCostPerKg(
  finalCostPrice: number,
  weightKg: number,
): number {
  if (weightKg <= 0) {
    return 0
  }
  return roundToCurrency(finalCostPrice / weightKg)
}

export function calculateRecommendedPricePerKg(
  recommendedPrice: number,
  weightKg: number,
): number {
  if (weightKg <= 0) {
    return 0
  }
  return roundToCurrency(recommendedPrice / weightKg)
}

export function buildCake(
  input: Omit<
    Cake,
    | 'totalIngredientsCost'
    | 'totalPackagingCost'
    | 'totalDecorCost'
    | 'totalOverheadsCost'
    | 'finalCostPrice'
    | 'recommendedPrice'
  >,
  recipesById: Record<string, Recipe>,
): CakeDetails {
  const totalIngredientsCost = calculateCakeRecipesCost(input.recipes, recipesById)
  const totalPackagingCost = calculateAdditionalItemsCost(input.packaging)
  const totalDecorCost = calculateAdditionalItemsCost(input.decor)
  const totalOverheadsCost = calculateOverheadsCost(input.overheads)
  const totalWeightGrams = calculateCakeRecipesWeight(input.recipes, recipesById)
  const weightKg = gramsToKilograms(totalWeightGrams)
  const finalCostPrice = calculateFinalCostPrice(
    totalIngredientsCost,
    totalPackagingCost,
    totalDecorCost,
    totalOverheadsCost,
  )
  const recommendedPrice = calculateRecommendedPrice(finalCostPrice, input.marginPercent)

  return {
    ...input,
    totalIngredientsCost,
    totalPackagingCost,
    totalDecorCost,
    totalOverheadsCost,
    finalCostPrice,
    recommendedPrice,
    weightKg,
    costPerKg: calculateCostPerKg(finalCostPrice, weightKg),
    recommendedPricePerKg: calculateRecommendedPricePerKg(recommendedPrice, weightKg),
  }
}
