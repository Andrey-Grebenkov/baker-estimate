import { supabase } from './supabase'
import { buildIngredient } from '../domain/ingredient'
import { buildRecipe } from '../domain/recipe'
import { buildCake, type CakeDetails } from '../domain/cake'
import { roundToCurrency } from '../domain/money'
import { generateId } from './id'
import type {
  Cake,
  CakeInput,
  CakeRecipeItem,
  Ingredient,
  MeasurementUnit,
  Order,
  OrderInput,
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
  yield_amount: number | null
  yield_unit: string | null
  total_weight: number
  total_cost: number
}

interface DbOrder {
  id: string
  user_id: string
  cake_id: string | null
  client_name: string | null
  client_phone: string | null
  status: string
  delivery_date: string
  actual_weight_kg: number | null
  actual_cost: number
  total_cost: number
  paid_amount: number
  advance_payment: number
  completion_comment: string | null
  internal_comment: string | null
  unit: string | null
  created_at: string
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
  base_yield_weight: number | null
  base_yield_unit: string | null
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
    yield_amount: row.yield_amount == null ? undefined : toNumber(row.yield_amount),
    yield_unit: (row.yield_unit as Recipe['yield_unit']) ?? undefined,
    totalWeight: toNumber(row.total_weight),
    totalCost: toNumber(row.total_cost),
  }
}

function mapOrder(row: DbOrder): Order {
  return {
    id: row.id,
    user_id: row.user_id,
    cake_id: row.cake_id ?? undefined,
    client_name: row.client_name ?? undefined,
    client_phone: row.client_phone ?? undefined,
    status: (row.status as Order['status']) || 'Новый',
    delivery_date: row.delivery_date,
    actual_weight_kg: row.actual_weight_kg == null ? undefined : toNumber(row.actual_weight_kg),
    actual_cost: toNumber(row.actual_cost),
    total_cost: toNumber(row.total_cost),
    paid_amount: toNumber(row.paid_amount),
    advance_payment: toNumber(row.advance_payment),
    completion_comment: row.completion_comment ?? undefined,
    internal_comment: row.internal_comment ?? undefined,
    unit: (row.unit as Order['unit']) ?? undefined,
    created_at: row.created_at,
  }
}

function mapCake(row: DbCake): CakeDetails {
  const baseYieldWeight =
    row.base_yield_weight == null ? 0 : toNumber(row.base_yield_weight)
  const baseUnit = (row.base_yield_unit as Cake['base_yield_unit']) ?? 'кг'
  const finalCostPrice = toNumber(row.final_cost_price)
  const recommendedPrice = toNumber(row.recommended_price)
  const weightKg =
    baseYieldWeight > 0 ? baseYieldWeight : toNumber(row.weight_kg)

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    recipes: (Array.isArray(row.recipes) ? row.recipes : [])
      .filter((cr) => typeof cr === 'object' && cr !== null)
      .map((cr) => ({ ...(cr as CakeRecipeItem), multiplier: 1 })),
    packaging: Array.isArray(row.packaging) ? row.packaging : [],
    decor: Array.isArray(row.decor) ? row.decor : [],
    overheads:
      typeof row.overheads === 'object' && row.overheads !== null
        ? (row.overheads as Overheads)
        : { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
    base_yield_weight: baseYieldWeight > 0 ? baseYieldWeight : undefined,
    base_yield_unit: baseUnit,
    marginPercent: toNumber(row.margin_percent),
    totalIngredientsCost: toNumber(row.total_ingredients_cost),
    totalPackagingCost: toNumber(row.total_packaging_cost),
    totalDecorCost: toNumber(row.total_decor_cost),
    totalOverheadsCost: toNumber(row.total_overheads_cost),
    finalCostPrice,
    recommendedPrice,
    weightKg,
    costPerKg: weightKg > 0 ? roundToCurrency(finalCostPrice / weightKg) : 0,
    recommendedPricePerKg:
      weightKg > 0 ? roundToCurrency(recommendedPrice / weightKg) : 0,
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
  const payload: Record<string, unknown> = {
    id: ingredient.id,
    user_id: userId,
    name: ingredient.name,
    price_per_package: ingredient.pricePerPackage,
    package_quantity: ingredient.packageQuantity,
    unit: ingredient.unit,
    price_per_base_unit: ingredient.pricePerBaseUnit,
  }
  if (ingredient.inStock != null) {
    payload.in_stock = ingredient.inStock
  }
  const { error } = await supabase.from('ingredients').insert(payload)
  if (error) throw new Error(error.message)
}

export async function updateIngredient(
  id: string,
  input: Omit<Ingredient, 'id' | 'pricePerBaseUnit' | 'user_id'>,
  userId: string,
): Promise<void> {
  const ingredient = buildIngredient({ ...input, id, user_id: userId })
  const payload: Record<string, unknown> = {
    name: ingredient.name,
    user_id: userId,
    price_per_package: ingredient.pricePerPackage,
    package_quantity: ingredient.packageQuantity,
    unit: ingredient.unit,
    price_per_base_unit: ingredient.pricePerBaseUnit,
  }
  if (ingredient.inStock != null) {
    payload.in_stock = ingredient.inStock
  }
  const { error } = await supabase.from('ingredients').update(payload).eq('id', id)
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
  const validIngredients = input.ingredients.filter((ri) => ingredientsById[ri.ingredientId])
  const recipe = buildRecipe(
    { ...input, id: generateId(), user_id: userId, ingredients: validIngredients },
    ingredientsById,
  )
  const { error } = await supabase.from('recipes').insert({
    id: recipe.id,
    user_id: userId,
    name: recipe.name,
    ingredients: recipe.ingredients,
    yield_amount: recipe.yield_amount ?? 1,
    yield_unit: recipe.yield_unit ?? 'кг',
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
  const validIngredients = input.ingredients.filter((ri) => ingredientsById[ri.ingredientId])
  const recipe = buildRecipe(
    { ...input, id, user_id: userId, ingredients: validIngredients },
    ingredientsById,
  )
  const payload: Record<string, unknown> = {
    name: recipe.name,
    user_id: userId,
    ingredients: recipe.ingredients,
    total_weight: recipe.totalWeight,
    total_cost: recipe.totalCost,
  }
  if (recipe.yield_amount !== undefined) {
    payload.yield_amount = recipe.yield_amount
  }
  if (recipe.yield_unit !== undefined) {
    payload.yield_unit = recipe.yield_unit
  }
  const { error } = await supabase.from('recipes').update(payload).eq('id', id)
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
  const validRecipes = input.recipes
    .filter((cr) => recipesById[cr.recipeId])
    .map((cr) => ({ ...cr, multiplier: 1 }))
  const cake = buildCake(
    { ...input, id: generateId(), user_id: userId, recipes: validRecipes },
    recipesById,
  )
  const { error } = await supabase.from('cakes').insert({
    id: cake.id,
    user_id: userId,
    name: cake.name,
    recipes: cake.recipes,
    packaging: cake.packaging,
    decor: cake.decor,
    overheads: cake.overheads,
    margin_percent: cake.marginPercent,
    base_yield_weight: cake.base_yield_weight ?? cake.weightKg,
    base_yield_unit: cake.base_yield_unit ?? 'кг',
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
  const validRecipes = input.recipes
    .filter((cr) => recipesById[cr.recipeId])
    .map((cr) => ({ ...cr, multiplier: 1 }))
  const cake = buildCake({ ...input, id, user_id: userId, recipes: validRecipes }, recipesById)
  const { error } = await supabase.from('cakes').update({
    name: cake.name,
    user_id: userId,
    recipes: cake.recipes,
    packaging: cake.packaging,
    decor: cake.decor,
    overheads: cake.overheads,
    margin_percent: cake.marginPercent,
    base_yield_weight: cake.base_yield_weight ?? cake.weightKg,
    base_yield_unit: cake.base_yield_unit ?? 'кг',
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

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*').order('delivery_date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapOrder(row as DbOrder))
}

export async function addOrder(input: OrderInput, userId: string): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    id: generateId(),
    user_id: userId,
    cake_id: input.cake_id ?? null,
    client_name: input.client_name ?? null,
    client_phone: input.client_phone?.trim() || null,
    status: input.status,
    delivery_date: input.delivery_date,
    actual_weight_kg: input.actual_weight_kg ?? null,
    actual_cost: input.actual_cost,
    total_cost: input.total_cost,
    paid_amount: input.paid_amount,
    advance_payment: input.advance_payment,
    completion_comment: input.completion_comment ?? null,
    internal_comment: input.internal_comment?.trim() || null,
    unit: input.unit ?? 'кг',
  })
  if (error) throw new Error(error.message)
}

export async function updateOrder(id: string, input: OrderInput, userId: string): Promise<void> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    cake_id: input.cake_id ?? null,
    client_name: input.client_name ?? null,
    client_phone: input.client_phone?.trim() || null,
    status: input.status,
    delivery_date: input.delivery_date,
    actual_weight_kg: input.actual_weight_kg ?? null,
    actual_cost: input.actual_cost,
    total_cost: input.total_cost,
    paid_amount: input.paid_amount,
    advance_payment: input.advance_payment,
  }
  if (input.completion_comment !== undefined) {
    payload.completion_comment = input.completion_comment || null
  }
  if (input.internal_comment !== undefined) {
    payload.internal_comment = input.internal_comment?.trim() || null
  }
  if (input.unit !== undefined) {
    payload.unit = input.unit
  }
  const { error } = await supabase.from('orders').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
