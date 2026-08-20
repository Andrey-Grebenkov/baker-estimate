import type { Ingredient, Recipe, RecipeIngredient } from './types'
import { roundToCurrency } from './money'

export function calculateRecipeTotals(
  recipeIngredients: RecipeIngredient[],
  ingredientsById: Record<string, Ingredient>,
): { totalWeight: number; totalCost: number } {
  let totalWeight = 0
  let totalCost = 0

  for (const item of recipeIngredients) {
    if (item.quantityUsed < 0) {
      throw new Error('Quantity used cannot be negative')
    }

    const ingredient = ingredientsById[item.ingredientId]
    if (!ingredient) {
      // Пропускаем ингредиенты, которые были удалены из базы.
      continue
    }

    if (ingredient.unit === 'g' || ingredient.unit === 'ml') {
      totalWeight += item.quantityUsed
    }

    totalCost += ingredient.pricePerBaseUnit * item.quantityUsed
  }

  return {
    totalWeight,
    totalCost: roundToCurrency(totalCost),
  }
}

export function buildRecipe(
  input: Omit<Recipe, 'totalWeight' | 'totalCost'>,
  ingredientsById: Record<string, Ingredient>,
): Recipe {
  const { totalWeight, totalCost } = calculateRecipeTotals(
    input.ingredients,
    ingredientsById,
  )

  return {
    ...input,
    totalWeight,
    totalCost,
  }
}
