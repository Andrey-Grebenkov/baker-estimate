import { roundToCurrency } from './money'
import { roundToDecimal } from './recipeScaling'
import type { CakeRecipeItem, Ingredient, MeasurementUnit, Recipe } from './types'

export interface ShoppingListItem {
  ingredientId: string
  name: string
  unit: MeasurementUnit
  required: number
  inStock: number
  toBuy: number
  packagesToBuy: number
  purchaseQuantity: number
  purchasePrice: number
}

export interface ShoppingListResult {
  toBuy: ShoppingListItem[]
  inStock: ShoppingListItem[]
  hasIngredients: boolean
}

/**
 * Aggregates raw ingredients from the selected recipes (with multipliers),
 * deducts current warehouse stock, and calculates how many whole packages
 * need to be purchased.
 *
 * @param recipeItems — recipes with multipliers (from a cake).
 * @param recipesById — map of base recipes.
 * @param ingredientsById — map of base ingredients (used for price, unit and package size).
 */
export function generateShoppingList(
  recipeItems: CakeRecipeItem[],
  recipesById: Record<string, Recipe>,
  ingredientsById: Record<string, Ingredient>,
): ShoppingListResult {
  const quantities: Record<string, { required: number; ingredient: Ingredient }> = {}

  for (const item of recipeItems) {
    const recipe = recipesById[item.recipeId]
    if (!recipe) continue

    for (const ri of recipe.ingredients) {
      const ingredient = ingredientsById[ri.ingredientId]
      if (!ingredient) continue

      const required = ri.quantityUsed * item.multiplier
      const existing = quantities[ri.ingredientId]
      if (existing) {
        existing.required += required
      } else {
        quantities[ri.ingredientId] = { required, ingredient }
      }
    }
  }

  const allItems: ShoppingListItem[] = Object.values(quantities).map(({ ingredient, required }) => {
    const inStock = ingredient.inStock ?? 0
    const roundedRequired = roundToDecimal(required, 1)
    const deficit = Math.max(0, roundToDecimal(roundedRequired - inStock, 1))

    const packageSize = Math.max(1, ingredient.packageQuantity || 1)
    const packagesToBuy = deficit > 0 ? Math.ceil(deficit / packageSize) : 0
    const purchaseQuantity = packagesToBuy * packageSize
    const purchasePrice = roundToCurrency(packagesToBuy * ingredient.pricePerPackage)

    return {
      ingredientId: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      required: roundedRequired,
      inStock,
      toBuy: deficit,
      packagesToBuy,
      purchaseQuantity,
      purchasePrice,
    }
  })

  const toBuy = allItems
    .filter((item) => item.toBuy > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  const inStock = allItems
    .filter((item) => item.toBuy === 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  return { toBuy, inStock, hasIngredients: allItems.length > 0 }
}

export function formatShoppingList(items: ShoppingListItem[]): string {
  return items
    .filter((item) => item.toBuy > 0)
    .map((item) => {
      const unitLabel = unitLabelFor(item.unit)
      return `${item.name}: ${item.packagesToBuy} упак. (${item.purchaseQuantity} ${unitLabel}) — ${item.purchasePrice.toFixed(2)} ₽`
    })
    .join('\n')
}

function unitLabelFor(unit: MeasurementUnit): string {
  if (unit === 'g') return 'г'
  if (unit === 'ml') return 'мл'
  return 'шт.'
}
