import { supabase } from './supabase'
import { buildIngredient } from '../domain/ingredient'
import { buildRecipe } from '../domain/recipe'
import { buildCake, type CakeDetails } from '../domain/cake'
import { generateId } from './id'
import type {
  CakeInput,
  Ingredient,
  MeasurementUnit,
  Overheads,
  Recipe,
  RecipeInput,
} from '../domain/types'

interface DbIngredient {
  id: string
  user_id: string
  name: string
  price_per_package: number
  package_quantity: number
  unit: string
  price_per_base_unit: number
  in_stock: number | null
}

interface DbRecipe {
  id: string
  user_id: string
  name: string
  ingredients: Recipe['ingredients']
  total_weight: number
  total_cost: number
}

interface DbCake {
  id: string
  user_id: string
  name: string
  recipes: { recipeId: string; multiplier: number }[]
  packaging: { id: string; name: string; cost: number; quantity: number }[]
  decor: { id: string; name: string; cost: number; quantity: number }[]
  overheads: Overheads
  margin_percent: number
  total_ingredients_cost: number
  total_packaging_cost: number
  total_decor_cost: number
  total_overheads_cost: number
  final_cost_price: number
  recommended_price: number
  weight_kg: number
  cost_per_kg: number
  recommended_price_per_kg: number
  image_url: string | null
}

function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value)
}

function mapIngredient(row: DbIngredient): Ingredient {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    pricePerPackage: toNumber(row.price_per_package),
    packageQuantity: toNumber(row.package_quantity),
    unit: row.unit as MeasurementUnit,
    pricePerBaseUnit: toNumber(row.price_per_base_unit),
    inStock: row.in_stock == null ? undefined : toNumber(row.in_stock),
  }
}

function mapRecipe(row: DbRecipe): Recipe {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    totalWeight: toNumber(row.total_weight),
    totalCost: toNumber(row.total_cost),
  }
}

function mapCake(row: DbCake): CakeDetails {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    recipes: Array.isArray(row.recipes) ? row.recipes : [],
    packaging: Array.isArray(row.packaging) ? row.packaging : [],
    decor: Array.isArray(row.decor) ? row.decor : [],
    overheads:
      typeof row.overheads === 'object' && row.overheads !== null
        ? (row.overheads as Overheads)
        : { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
    marginPercent: toNumber(row.margin_percent),
    totalIngredientsCost: toNumber(row.total_ingredients_cost),
    totalPackagingCost: toNumber(row.total_packaging_cost),
    totalDecorCost: toNumber(row.total_decor_cost),
    totalOverheadsCost: toNumber(row.total_overheads_cost),
    finalCostPrice: toNumber(row.final_cost_price),
    recommendedPrice: toNumber(row.recommended_price),
    weightKg: toNumber(row.weight_kg),
    costPerKg: toNumber(row.cost_per_kg),
    recommendedPricePerKg: toNumber(row.recommended_price_per_kg),
    image_url: row.image_url ?? undefined,
  }
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from('ingredients').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapIngredient(row as DbIngredient))
}

export async function addIngredient(
  input: {
    name: string
    pricePerPackage: number
    packageQuantity: number
    unit: MeasurementUnit
    inStock?: number
  },
  userId: string,
): Promise<void> {
  const ingredient = buildIngredient({ ...input, id: generateId(), user_id: userId })
  const { error } = await supabase.from('ingredients').insert({
    id: ingredient.id,
    user_id: userId,
    name: ingredient.name,
    price_per_package: ingredient.pricePerPackage,
    package_quantity: ingredient.packageQuantity,
    unit: ingredient.unit,
    price_per_base_unit: ingredient.pricePerBaseUnit,
    in_stock: ingredient.inStock ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function updateIngredient(
  id: string,
  input: Omit<Ingredient, 'id' | 'pricePerBaseUnit' | 'user_id'>,
  userId: string,
): Promise<void> {
  const ingredient = buildIngredient({ ...input, id, user_id: userId })
  const { error } = await supabase.from('ingredients').update({
    name: ingredient.name,
    user_id: userId,
    price_per_package: ingredient.pricePerPackage,
    package_quantity: ingredient.packageQuantity,
    unit: ingredient.unit,
    price_per_base_unit: ingredient.pricePerBaseUnit,
    in_stock: ingredient.inStock ?? null,
  }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapRecipe(row as DbRecipe))
}

export async function addRecipe(
  input: Omit<RecipeInput, 'id' | 'user_id'>,
  userId: string,
  ingredientsById: Record<string, Ingredient>,
): Promise<void> {
  const recipe = buildRecipe({ ...input, id: generateId(), user_id: userId }, ingredientsById)
  const { error } = await supabase.from('recipes').insert({
    id: recipe.id,
    user_id: userId,
    name: recipe.name,
    ingredients: recipe.ingredients,
    total_weight: recipe.totalWeight,
    total_cost: recipe.totalCost,
  })
  if (error) throw new Error(error.message)
}

export async function updateRecipe(
  id: string,
  input: Omit<RecipeInput, 'id' | 'user_id'>,
  userId: string,
  ingredientsById: Record<string, Ingredient>,
): Promise<void> {
  const recipe = buildRecipe({ ...input, id, user_id: userId }, ingredientsById)
  const { error } = await supabase.from('recipes').update({
    name: recipe.name,
    user_id: userId,
    ingredients: recipe.ingredients,
    total_weight: recipe.totalWeight,
    total_cost: recipe.totalCost,
  }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchCakes(): Promise<CakeDetails[]> {
  const { data, error } = await supabase.from('cakes').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapCake(row as DbCake))
}

export async function addCake(
  input: Omit<CakeInput, 'id' | 'user_id'>,
  userId: string,
  recipesById: Record<string, Recipe>,
): Promise<void> {
  const cake = buildCake({ ...input, id: generateId(), user_id: userId }, recipesById)
  const { error } = await supabase.from('cakes').insert({
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
  })
  if (error) throw new Error(error.message)
}

export async function updateCake(
  id: string,
  input: Omit<CakeInput, 'id' | 'user_id'>,
  userId: string,
  recipesById: Record<string, Recipe>,
): Promise<void> {
  const cake = buildCake({ ...input, id, user_id: userId }, recipesById)
  const { error } = await supabase.from('cakes').update({
    name: cake.name,
    user_id: userId,
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
  }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCake(id: string): Promise<void> {
  const { error } = await supabase.from('cakes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
