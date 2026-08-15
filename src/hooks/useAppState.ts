import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { buildCake, type CakeDetails } from '../domain/cake'
import { buildIngredient } from '../domain/ingredient'
import { buildRecipe } from '../domain/recipe'
import { generateId } from '../lib/id'
import type {
  CakeInput,
  Ingredient,
  MeasurementUnit,
  Recipe,
  RecipeInput,
} from '../domain/types'

const STORAGE_KEY = 'baker-estimate:store'

interface Store {
  ingredients: Ingredient[]
  recipeInputs: RecipeInput[]
  cakeInputs: CakeInput[]
}

export interface AppState {
  ingredients: Ingredient[]
  recipes: Recipe[]
  cakes: CakeDetails[]

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
  const [store, setStore] = useLocalStorage<Store>(STORAGE_KEY, {
    ingredients: [],
    recipeInputs: [],
    cakeInputs: [],
  })

  const ingredientsById = useMemo(
    () => Object.fromEntries(store.ingredients.map((i) => [i.id, i])),
    [store.ingredients],
  )

  const recipes = useMemo(
    () =>
      store.recipeInputs
        .map((r) => {
          try {
            return buildRecipe(r, ingredientsById)
          } catch {
            return null
          }
        })
        .filter((r): r is Recipe => r !== null),
    [store.recipeInputs, ingredientsById],
  )

  const recipesById = useMemo(
    () => Object.fromEntries(recipes.map((r) => [r.id, r])),
    [recipes],
  )

  const cakes = useMemo(
    () =>
      store.cakeInputs
        .map((c) => {
          try {
            return buildCake(c, recipesById)
          } catch {
            return null
          }
        })
        .filter((c): c is CakeDetails => c !== null),
    [store.cakeInputs, recipesById],
  )

  const addIngredient = useCallback(
    (input) => {
      const ingredient = buildIngredient({ ...input, id: generateId() })
      setStore((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredient],
      }))
    },
    [setStore],
  )

  const updateIngredient = useCallback(
    (id, input) => {
      setStore((prev) => ({
        ...prev,
        ingredients: prev.ingredients.map((i) =>
          i.id === id ? buildIngredient({ ...input, id }) : i,
        ),
      }))
    },
    [setStore],
  )

  const deleteIngredient = useCallback(
    (id) => {
      setStore((prev) => {
        const ingredients = prev.ingredients.filter((i) => i.id !== id)
        const remainingRecipeInputs = prev.recipeInputs.filter(
          (r) => !r.ingredients.some((ri) => ri.ingredientId === id),
        )
        const deletedRecipeIds = prev.recipeInputs
          .filter((r) => r.ingredients.some((ri) => ri.ingredientId === id))
          .map((r) => r.id)
        const remainingCakeInputs = prev.cakeInputs.filter(
          (c) => !c.recipes.some((cr) => deletedRecipeIds.includes(cr.recipeId)),
        )

        return {
          ...prev,
          ingredients,
          recipeInputs: remainingRecipeInputs,
          cakeInputs: remainingCakeInputs,
        }
      })
    },
    [setStore],
  )

  const addRecipe = useCallback(
    (input) => {
      const recipeInput: RecipeInput = { ...input, id: generateId() }
      setStore((prev) => ({
        ...prev,
        recipeInputs: [...prev.recipeInputs, recipeInput],
      }))
    },
    [setStore],
  )

  const updateRecipe = useCallback(
    (id, input) => {
      setStore((prev) => ({
        ...prev,
        recipeInputs: prev.recipeInputs.map((r) =>
          r.id === id ? { ...input, id } : r,
        ),
      }))
    },
    [setStore],
  )

  const deleteRecipe = useCallback(
    (id) => {
      setStore((prev) => ({
        ...prev,
        recipeInputs: prev.recipeInputs.filter((r) => r.id !== id),
        cakeInputs: prev.cakeInputs.filter(
          (c) => !c.recipes.some((r) => r.recipeId === id),
        ),
      }))
    },
    [setStore],
  )

  const addCake = useCallback(
    (input) => {
      const cakeInput: CakeInput = { ...input, id: generateId() }
      setStore((prev) => ({
        ...prev,
        cakeInputs: [...prev.cakeInputs, cakeInput],
      }))
    },
    [setStore],
  )

  const updateCake = useCallback(
    (id, input) => {
      setStore((prev) => ({
        ...prev,
        cakeInputs: prev.cakeInputs.map((c) =>
          c.id === id ? { ...input, id } : c,
        ),
      }))
    },
    [setStore],
  )

  const deleteCake = useCallback(
    (id) => {
      setStore((prev) => ({
        ...prev,
        cakeInputs: prev.cakeInputs.filter((c) => c.id !== id),
      }))
    },
    [setStore],
  )

  return {
    ingredients: store.ingredients,
    recipes,
    cakes,

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
