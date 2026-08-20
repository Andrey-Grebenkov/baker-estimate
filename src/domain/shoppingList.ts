import { roundToCurrency } from './money'
import type { CakeRecipeItem, Ingredient, MeasurementUnit, Recipe } from './types'

export interface ShoppingListItem {
  ingredientId: string
  name: string
  totalQuantity: number
  unit: MeasurementUnit
  estimatedCost: number
}

/**
 * Aggregates ingredients from selected recipes.
 * @param recipeItems — recipes with multipliers (e.g. from a cake or a list of cakes).
 * @param recipesById — map of base recipes.
 * @param ingredientsById — map of base ingredients (used for price and unit).
 */
export function generateShoppingList(
  recipeItems: CakeRecipeItem[],
  recipesById: Record<string, Recipe>,
  ingredientsById: Record<string, Ingredient>,
): ShoppingListItem[] {
  const quantities: Record<string, { quantity: number; ingredient: Ingredient }> = {}

  for (const item of recipeItems) {
    const recipe = recipesById[item.recipeId]
    if (!recipe) continue

    for (const ri of recipe.ingredients) {
      const ingredient = ingredientsById[ri.ingredientId]
      if (!ingredient) continue

      const quantity = ri.quantityUsed * item.multiplier
      const existing = quantities[ri.ingredientId]
      if (existing) {
        existing.quantity += quantity
      } else {
        quantities[ri.ingredientId] = { quantity, ingredient }
      }
    }
  }

  return Object.values(quantities)
    .map(({ ingredient, quantity }) => ({
      ingredientId: ingredient.id,
      name: ingredient.name,
      totalQuantity: roundToCurrency(quantity),
      unit: ingredient.unit,
      estimatedCost: roundToCurrency(quantity * ingredient.pricePerBaseUnit),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export function formatShoppingList(items: ShoppingListItem[]): string {
  return items
    .map((item) => {
      const unitLabel = unitLabelFor(item.unit)
      return `${item.name}: ${item.totalQuantity} ${unitLabel} — ${item.estimatedCost.toFixed(2)} ₽`
    })
    .join('\n')
}

function unitLabelFor(unit: MeasurementUnit): string {
  if (unit === 'g') return 'г'
  if (unit === 'ml') return 'мл'
  return 'шт.'
}
