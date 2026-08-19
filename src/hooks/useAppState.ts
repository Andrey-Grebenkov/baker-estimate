import { useCallback, useEffect, useState } from 'react'
import type { CakeDetails } from '../domain/cake'
import type {
  CakeInput,
  Ingredient,
  MeasurementUnit,
  Recipe,
  RecipeInput,
} from '../domain/types'
import * as db from '../lib/db'

export interface AppState {
  ingredients: Ingredient[]
  recipes: Recipe[]
  cakes: CakeDetails[]
  isLoading: boolean
  initialized: boolean
  error: string | null
  clearError: () => void

  addIngredient: (input: {
    name: string
    pricePerPackage: number
    packageQuantity: number
    unit: MeasurementUnit
  }) => void
  updateIngredient: (id: string, input: Omit<Ingredient, 'id' | 'pricePerBaseUnit'>) => void
  deleteIngredient: (id: string) => void

  addRecipe: (input: Omit<RecipeInput, 'id'>) => void
  updateRecipe: (id: string, input: Omit<RecipeInput, 'id'>) => void
  deleteRecipe: (id: string) => void

  addCake: (input: Omit<CakeInput, 'id'>) => void
  updateCake: (id: string, input: Omit<CakeInput, 'id'>) => void
  deleteCake: (id: string) => void
}

export function useAppState(): AppState {
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
    loadAll()
  }, [loadAll])

  const addIngredient = useCallback(
    async (input) => {
      try {
        await db.addIngredient(input)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [loadAll, handleError],
  )

  const updateIngredient = useCallback(
    async (id, input) => {
      try {
        await db.updateIngredient(id, input)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [loadAll, handleError],
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
        const ingredientsById = Object.fromEntries(ingredients.map((i) => [i.id, i]))
        await db.addRecipe(input, ingredientsById)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [ingredients, loadAll, handleError],
  )

  const updateRecipe = useCallback(
    async (id, input) => {
      try {
        const ingredientsById = Object.fromEntries(ingredients.map((i) => [i.id, i]))
        await db.updateRecipe(id, input, ingredientsById)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [ingredients, loadAll, handleError],
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
    async (input) => {
      try {
        const recipesById = Object.fromEntries(recipes.map((r) => [r.id, r]))
        await db.addCake(input, recipesById)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [recipes, loadAll, handleError],
  )

  const updateCake = useCallback(
    async (id, input) => {
      try {
        const recipesById = Object.fromEntries(recipes.map((r) => [r.id, r]))
        await db.updateCake(id, input, recipesById)
        await loadAll()
      } catch (err) {
        handleError(err)
      }
    },
    [recipes, loadAll, handleError],
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
