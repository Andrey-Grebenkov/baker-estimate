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
  name: string
  price_per_package: number
  package_quantity: number
  unit: string
  price_per_base_unit: number
}

interface DbRecipe {
  id: string
  name: string
  ingredients: Recipe['ingredients']
  total_weight: number
  total_cost: number
}

interface DbCake {
  id: string
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
    name: row.name,
    pricePerPackage: toNumber(row.price_per_package),
    packageQuantity: toNumber(row.package_quantity),
    unit: row.unit as MeasurementUnit,
    pricePerBaseUnit: toNumber(row.price_per_base_unit),
  }
}

function mapRecipe(row: DbRecipe): Recipe {
  return {
    id: row.id,
    name: row.name,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    totalWeight: toNumber(row.total_weight),
    totalCost: toNumber(row.total_cost),
  }
}

function mapCake(row: DbCake): CakeDetails {
  return {
    id: row.id,
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

export async function addIngredient(input: {
  name: string
  pricePerPackage: number
  packageQuantity: number
  unit: MeasurementUnit
}): Promise<void> {
  const ingredient = buildIngredient({ ...input, id: generateId() })
  const { error } = await supabase.from('ingredients').insert({
    id: ingredient.id,
    name: ingredient.name,
    price_per_package: ingredient.pricePerPackage,
    package_quantity: ingredient.packageQuantity,
    unit: ingredient.unit,
    price_per_base_unit: ingredient.pricePerBaseUnit,
  })
  if (error) throw new Error(error.message)
}

export async function updateIngredient(
  id: string,
  input: Omit<Ingredient, 'id' | 'pricePerBaseUnit'>,
): Promise<void> {
  const ingredient = buildIngredient({ ...input, id })
  const { error } = await supabase.from('ingredients').update({
    name: ingredient.name,
    price_per_package: ingredient.pricePerPackage,
    package_quantity: ingredient.packageQuantity,
    unit: ingredient.unit,
    price_per_base_unit: ingredient.pricePerBaseUnit,
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
  input: Omit<RecipeInput, 'id'>,
  ingredientsById: Record<string, Ingredient>,
): Promise<void> {
  const recipe = buildRecipe({ ...input, id: generateId() }, ingredientsById)
  const { error } = await supabase.from('recipes').insert({
    id: recipe.id,
    name: recipe.name,
    ingredients: recipe.ingredients,
    total_weight: recipe.totalWeight,
    total_cost: recipe.totalCost,
  })
  if (error) throw new Error(error.message)
}

export async function updateRecipe(
  id: string,
  input: Omit<RecipeInput, 'id'>,
  ingredientsById: Record<string, Ingredient>,
): Promise<void> {
  const recipe = buildRecipe({ ...input, id }, ingredientsById)
  const { error } = await supabase.from('recipes').update({
    name: recipe.name,
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
  input: Omit<CakeInput, 'id'>,
  recipesById: Record<string, Recipe>,
): Promise<void> {
  const cake = buildCake({ ...input, id: generateId() }, recipesById)
  const { error } = await supabase.from('cakes').insert({
    id: cake.id,
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
  input: Omit<CakeInput, 'id'>,
  recipesById: Record<string, Recipe>,
): Promise<void> {
  const cake = buildCake({ ...input, id }, recipesById)
  const { error } = await supabase.from('cakes').update({
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
  }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCake(id: string): Promise<void> {
  const { error } = await supabase.from('cakes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
