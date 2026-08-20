import { useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import type { Ingredient, RecipeIngredient, Recipe } from '../domain/types'
import { normalizeNumberString } from '../lib/numberInput'

const unitLabels: Record<Ingredient['unit'], string> = {
  g: 'г',
  ml: 'мл',
  pcs: 'шт.',
}

export function RecipesPage({ state }: { state: AppState }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [recipeName, setRecipeName] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])
  const [selectedIngredientId, setSelectedIngredientId] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setEditingId(null)
    setRecipeName('')
    setRecipeIngredients([])
    setSelectedIngredientId(state.ingredients[0]?.id ?? '')
    setSelectedQuantity('')
    setError(null)
  }

  const startEdit = (recipe: Recipe) => {
    setEditingId(recipe.id)
    setRecipeName(recipe.name)
    setRecipeIngredients(recipe.ingredients)
    setSelectedIngredientId(state.ingredients[0]?.id ?? '')
    setSelectedQuantity('')
    setError(null)
  }

  const addIngredientToRecipe = () => {
    if (!selectedIngredientId) {
      setError('Выберите ингредиент')
      return
    }

    const quantity = Number(selectedQuantity)
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError('Количество должно быть положительным числом')
      return
    }

    if (recipeIngredients.some((ri) => ri.ingredientId === selectedIngredientId)) {
      setRecipeIngredients((prev) =>
        prev.map((ri) =>
          ri.ingredientId === selectedIngredientId ? { ...ri, quantityUsed: quantity } : ri,
        ),
      )
    } else {
      setRecipeIngredients((prev) => [...prev, { ingredientId: selectedIngredientId, quantityUsed: quantity }])
    }

    setSelectedQuantity('')
    setError(null)
  }

  const removeRecipeIngredient = (ingredientId: string) => {
    setRecipeIngredients((prev) => prev.filter((ri) => ri.ingredientId !== ingredientId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = recipeName.trim()
    if (trimmedName.length === 0) {
      setError('Введите название рецепта')
      return
    }

    if (recipeIngredients.length === 0) {
      setError('Добавьте хотя бы один ингредиент')
      return
    }

    if (editingId) {
      state.updateRecipe(editingId, {
        name: trimmedName,
        ingredients: recipeIngredients,
      })
    } else {
      state.addRecipe({
        name: trimmedName,
        ingredients: recipeIngredients,
      })
    }

    resetForm()
  }

  return (
    <div className="space-y-6" data-testid="recipes-page">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"
        data-testid="recipe-form"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {editingId ? 'Редактировать рецепт' : 'Создать рецепт'}
        </h2>

        <div className="mb-4">
          <label htmlFor="recipe-name" className="mb-1 block text-sm font-medium text-slate-600">
            Название рецепта
          </label>
          <input
            id="recipe-name"
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Например, Бисквит ванильный"
            data-testid="recipe-name-input"
          />
        </div>

        <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-950/20">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Состав рецепта</h3>

          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor="recipe-ingredient-select" className="text-sm text-slate-600">
                Ингредиент
              </label>
              <select
                id="recipe-ingredient-select"
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="recipe-ingredient-select"
              >
                <option value="">Выберите продукт</option>
                {state.ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="recipe-quantity-input" className="text-sm text-slate-600">
                Количество
              </label>
              <input
                id="recipe-quantity-input"
                type="number"
                min="0"
                step="0.01"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(normalizeNumberString(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
                data-testid="recipe-quantity-input"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addIngredientToRecipe}
                className="h-10 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                data-testid="recipe-add-ingredient-button"
              >
                Добавить
              </button>
            </div>
          </div>

          {recipeIngredients.length > 0 && (
            <ul className="mt-4 space-y-2" data-testid="recipe-ingredient-list">
              {recipeIngredients.map((ri) => {
                const ingredient = state.ingredients.find((i) => i.id === ri.ingredientId)
                if (!ingredient) return null

                return (
                  <li
                    key={ri.ingredientId}
                    className="flex items-center justify-between rounded-md bg-white p-2 ring-1 ring-slate-200"
                    data-testid="recipe-ingredient-row"
                  >
                    <span className="text-sm text-slate-700">
                      {ingredient.name} — {ri.quantityUsed} {unitLabels[ingredient.unit]}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRecipeIngredient(ri.ingredientId)}
                      className="text-sm text-rose-600 hover:text-rose-700"
                      data-testid="recipe-remove-ingredient-button"
                    >
                      Удалить
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && (
          <p className="mb-3 text-sm text-rose-600" data-testid="recipe-form-error">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            data-testid="recipe-submit-button"
          >
            {editingId ? 'Сохранить' : 'Создать рецепт'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              data-testid="recipe-cancel-button"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <div
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"
        data-testid="recipes-list"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">База рецептов</h2>

        {state.recipes.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="recipes-empty-state">
            Пока нет рецептов. Создайте первый.
          </p>
        ) : (
          <div className="space-y-3">
            {state.recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                data-testid="recipe-row"
                data-recipe-id={recipe.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{recipe.name}</p>
                    <p className="text-sm text-slate-500">
                      {recipe.ingredients.length} ингредиентов | вес {recipe.totalWeight} г |{' '}
                      {recipe.totalCost.toFixed(2)} ₽
                    </p>
                    <ul className="mt-1 text-xs text-slate-500">
                      {recipe.ingredients.map((ri) => {
                        const ingredient = state.ingredients.find((i) => i.id === ri.ingredientId)
                        if (!ingredient) return null
                        return (
                          <li key={ri.ingredientId}>
                            {ingredient.name} — {ri.quantityUsed} {unitLabels[ingredient.unit]}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(recipe)}
                      className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50"
                      data-testid="recipe-edit-button"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => state.deleteRecipe(recipe.id)}
                      className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50"
                      data-testid="recipe-delete-button"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
