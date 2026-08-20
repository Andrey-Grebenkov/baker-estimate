import { buildIngredient } from '../domain/ingredient'
import { buildRecipe } from '../domain/recipe'
import { buildCake, type CakeDetails } from '../domain/cake'
import { supabase } from './supabase'
import * as db from './db'
import type { Ingredient, Recipe, RecipeIngredient } from '../domain/types'

export const BACKUP_VERSION = 1

export interface BackupData {
  version: number
  exportedAt: string
  appName: string
  userId?: string
  ingredients: Ingredient[]
  recipes: Recipe[]
  cakes: CakeDetails[]
}

export interface BackupResult {
  ingredients: number
  recipes: number
  cakes: number
}

export function createBackup(
  ingredients: Ingredient[],
  recipes: Recipe[],
  cakes: CakeDetails[],
  userId?: string,
): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'Смета Кондитера',
    userId,
    ingredients,
    recipes,
    cakes,
  }
}

export async function exportBackup(userId?: string): Promise<BackupData> {
  const [ingredients, recipes, cakes] = await Promise.all([
    db.fetchIngredients(),
    db.fetchRecipes(),
    db.fetchCakes(),
  ])
  return createBackup(ingredients, recipes, cakes, userId)
}

export function downloadBackupFile(backup: BackupData): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `smeta_konditera_backup_${date}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function isIngredient(value: unknown): value is Ingredient {
  if (!value || typeof value !== 'object') return false
  const i = value as Partial<Ingredient>
  return (
    typeof i.id === 'string' &&
    typeof i.name === 'string' &&
    typeof i.pricePerPackage === 'number' &&
    typeof i.packageQuantity === 'number' &&
    typeof i.unit === 'string' &&
    ['g', 'ml', 'pcs'].includes(i.unit)
  )
}

function isRecipeIngredient(value: unknown): value is RecipeIngredient {
  if (!value || typeof value !== 'object') return false
  const ri = value as Partial<RecipeIngredient>
  return typeof ri.ingredientId === 'string' && typeof ri.quantityUsed === 'number'
}

function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== 'object') return false
  const r = value as Partial<Recipe>
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    Array.isArray(r.ingredients) &&
    r.ingredients.every(isRecipeIngredient)
  )
}

function isCake(value: unknown): value is CakeDetails {
  if (!value || typeof value !== 'object') return false
  const c = value as Partial<CakeDetails>
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    Array.isArray(c.recipes) &&
    Array.isArray(c.packaging) &&
    Array.isArray(c.decor) &&
    typeof c.overheads === 'object' &&
    c.overheads !== null &&
    typeof ((c.overheads as unknown) as Record<string, unknown>).workHours === 'number' &&
    typeof ((c.overheads as unknown) as Record<string, unknown>).hourlyRate === 'number' &&
    typeof ((c.overheads as unknown) as Record<string, unknown>).fixedCosts === 'number' &&
    typeof c.marginPercent === 'number'
  )
}

export function validateBackup(data: unknown): BackupData {
  if (!data || typeof data !== 'object') {
    throw new Error('Резервная копия не является JSON-объектом')
  }

  const backup = data as Partial<BackupData>

  if (backup.version !== BACKUP_VERSION) {
    throw new Error(`Неподдерживаемая версия резервной копии: ${backup.version}`)
  }
  if (!Array.isArray(backup.ingredients) || !backup.ingredients.every(isIngredient)) {
    throw new Error('Некорректный массив ингредиентов в резервной копии')
  }
  if (!Array.isArray(backup.recipes) || !backup.recipes.every(isRecipe)) {
    throw new Error('Некорректный массив рецептов в резервной копии')
  }
  if (!Array.isArray(backup.cakes) || !backup.cakes.every(isCake)) {
    throw new Error('Некорректный массив тортов в резервной копии')
  }

  return backup as BackupData
}

function toDbIngredient(ingredient: Ingredient, userId: string) {
  return {
    id: ingredient.id,
    user_id: userId,
    name: ingredient.name,
    price_per_package: ingredient.pricePerPackage,
    package_quantity: ingredient.packageQuantity,
    unit: ingredient.unit,
    price_per_base_unit: ingredient.pricePerBaseUnit,
  }
}

function toDbRecipe(recipe: Recipe, userId: string) {
  return {
    id: recipe.id,
    user_id: userId,
    name: recipe.name,
    ingredients: recipe.ingredients,
    total_weight: recipe.totalWeight,
    total_cost: recipe.totalCost,
  }
}

function toDbCake(cake: CakeDetails, userId: string) {
  return {
    id: cake.id,
    user_id: userId,
    name: cake.name,
    recipes: cake.recipes,
    packaging: cake.packaging,
    decor: cake.decor,
    overheads: cake.overheads,
    margin_percent: cake.marginPercent,
    total_ingredients_cost: cake.totalIngredientsCost,
    total_packaging_cost: cake.totalPackagingCost,
    total_decor_cost: cake.totalDecorCost,
    total_overheads_cost: cake.totalOverheadsCost,
    final_cost_price: cake.finalCostPrice,
    recommended_price: cake.recommendedPrice,
    weight_kg: cake.weightKg,
    cost_per_kg: cake.costPerKg,
    recommended_price_per_kg: cake.recommendedPricePerKg,
    image_url: cake.image_url ?? null,
  }
}

export async function importBackup(data: unknown, userId: string): Promise<BackupResult> {
  const backup = validateBackup(data)

  const ingredients = backup.ingredients.map((i) =>
    buildIngredient({
      id: i.id,
      user_id: userId,
      name: i.name,
      pricePerPackage: i.pricePerPackage,
      packageQuantity: i.packageQuantity,
      unit: i.unit,
    }),
  )
  const ingredientsById = Object.fromEntries(ingredients.map((i) => [i.id, i]))

  for (const recipe of backup.recipes) {
    for (const ri of recipe.ingredients) {
      if (!ingredientsById[ri.ingredientId]) {
        throw new Error(`В рецепте "${recipe.name}" ссылкается несуществующий ингредиент ${ri.ingredientId}`)
      }
    }
  }

  const recipes = backup.recipes.map((r) =>
    buildRecipe(
      {
        id: r.id,
        user_id: userId,
        name: r.name,
        ingredients: r.ingredients,
      },
      ingredientsById,
    ),
  )
  const recipesById = Object.fromEntries(recipes.map((r) => [r.id, r]))

  for (const cake of backup.cakes) {
    for (const cr of cake.recipes) {
      if (!recipesById[cr.recipeId]) {
        throw new Error(`В торте "${cake.name}" ссылкается несуществующий рецепт ${cr.recipeId}`)
      }
    }
  }

  const cakes = backup.cakes.map((c) =>
    buildCake(
      {
        id: c.id,
        user_id: userId,
        name: c.name,
        recipes: c.recipes,
        packaging: c.packaging,
        decor: c.decor,
        overheads: c.overheads,
        marginPercent: c.marginPercent,
        image_url: c.image_url,
      },
      recipesById,
    ),
  )

  const dbIngredients = ingredients.map((i) => toDbIngredient(i, userId))
  const dbRecipes = recipes.map((r) => toDbRecipe(r, userId))
  const dbCakes = cakes.map((c) => toDbCake(c, userId))

  const { error: ingredientsError } = await supabase
    .from('ingredients')
    .upsert(dbIngredients, { onConflict: 'id' })
  if (ingredientsError) throw new Error(ingredientsError.message)

  const { error: recipesError } = await supabase.from('recipes').upsert(dbRecipes, { onConflict: 'id' })
  if (recipesError) throw new Error(recipesError.message)

  const { error: cakesError } = await supabase.from('cakes').upsert(dbCakes, { onConflict: 'id' })
  if (cakesError) throw new Error(cakesError.message)

  return {
    ingredients: dbIngredients.length,
    recipes: dbRecipes.length,
    cakes: dbCakes.length,
  }
}
