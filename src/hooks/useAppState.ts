import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { CakeDetails } from '../domain/cake'
import type {
  CakeInput,
  Ingredient,
  MeasurementUnit,
  Recipe,
  RecipeInput,
} from '../domain/types'
import { supabase } from '../lib/supabase'
import * as db from '../lib/db'

export interface AppState {
  ingredients: Ingredient[]
  recipes: Recipe[]
  cakes: CakeDetails[]
  isLoading: boolean
  initialized: boolean
  error: string | null
  clearError: () => void
  reload: () => Promise<void>

  addIngredient: (input: {
    name: string
    pricePerPackage: number
    packageQuantity: number
    unit: MeasurementUnit
  }) => void
  updateIngredient: (id: string, input: Omit<Ingredient, 'id' | 'pricePerBaseUnit' | 'user_id'>) => void
  deleteIngredient: (id: string) => void

  addRecipe: (input: Omit<RecipeInput, 'id' | 'user_id'>) => void
  updateRecipe: (id: string, input: Omit<RecipeInput, 'id' | 'user_id'>) => void
  deleteRecipe: (id: string) => void

  addCake: (input: Omit<CakeInput, 'id' | 'user_id'>, imageFile?: File) => void
  updateCake: (id: string, input: Omit<CakeInput, 'id' | 'user_id'>, imageFile?: File) => void
  deleteCake: (id: string) => void
}

async function uploadCakeImage(file: File): Promise<string> {
  const extension = file.name.split('.').pop() || 'png'
  const path = `cakes/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const { error } = await supabase.storage.from('cakes').upload(path, file)
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('cakes').getPublicUrl(path)
  return data.publicUrl
}

export function useAppState(user: User | null): AppState {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [cakes, setCakes] = useState<CakeDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const handleError = useCallback((err: unknown) => {
    setError(err instanceof Error ? err.message : 'Произошла ошибка')
  }, [])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [ingredientsData, recipesData, cakesData] = await Promise.all([
        db.fetchIngredients(),
        db.fetchRecipes(),
        db.fetchCakes(),
      ])
      setIngredients(ingredientsData)
      setRecipes(recipesData)
      setCakes(cakesData)
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
      setInitialized(true)
    }
  }, [handleError])

  useEffect(() => {
    if (user) {
      loadAll()
    } else {
      setIngredients([])
      setRecipes([])
      setCakes([])
      setInitialized(false)
      setError(null)
    }
  }, [user, loadAll])

  const userId = user?.id

  const addIngredient = useCallback(
    async (input) => {
      try {
        if (!userId) throw new Error('Пользователь не авторизован')
        await db.addIngredient(input, userId)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [loadAll, handleError, userId],
  )

  const updateIngredient = useCallback(
    async (id, input) => {
      try {
        if (!userId) throw new Error('Пользователь не авторизован')
        await db.updateIngredient(id, input, userId)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [loadAll, handleError, userId],
  )

  const deleteIngredient = useCallback(
    async (id) => {
      try {
        await db.deleteIngredient(id)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [loadAll, handleError],
  )

  const addRecipe = useCallback(
    async (input) => {
      try {
        if (!userId) throw new Error('Пользователь не авторизован')
        const ingredientsById = Object.fromEntries(ingredients.map((i) => [i.id, i]))
        await db.addRecipe(input, userId, ingredientsById)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [ingredients, loadAll, handleError, userId],
  )

  const updateRecipe = useCallback(
    async (id, input) => {
      try {
        if (!userId) throw new Error('Пользователь не авторизован')
        const ingredientsById = Object.fromEntries(ingredients.map((i) => [i.id, i]))
        await db.updateRecipe(id, input, userId, ingredientsById)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [ingredients, loadAll, handleError, userId],
  )

  const deleteRecipe = useCallback(
    async (id) => {
      try {
        await db.deleteRecipe(id)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [loadAll, handleError],
  )

  const addCake = useCallback(
    async (input, imageFile?) => {
      try {
        if (!userId) throw new Error('Пользователь не авторизован')
        let image_url = input.image_url
        if (imageFile) {
          image_url = await uploadCakeImage(imageFile)
        }
        const recipesById = Object.fromEntries(recipes.map((r) => [r.id, r]))
        await db.addCake({ ...input, image_url }, userId, recipesById)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [recipes, loadAll, handleError, userId],
  )

  const updateCake = useCallback(
    async (id, input, imageFile?) => {
      try {
        if (!userId) throw new Error('Пользователь не авторизован')
        let image_url = input.image_url
        if (imageFile) {
          image_url = await uploadCakeImage(imageFile)
        }
        const recipesById = Object.fromEntries(recipes.map((r) => [r.id, r]))
        await db.updateCake(id, { ...input, image_url }, userId, recipesById)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [recipes, loadAll, handleError, userId],
  )

  const deleteCake = useCallback(
    async (id) => {
      try {
        await db.deleteCake(id)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [loadAll, handleError],
  )

  return {
    ingredients,
    recipes,
    cakes,
    isLoading,
    initialized,
    error,
    clearError,
    reload: loadAll,

    addIngredient,
    updateIngredient,
    deleteIngredient,

    addRecipe,
    updateRecipe,
    deleteRecipe,

    addCake,
    updateCake,
    deleteCake,
  }
}
