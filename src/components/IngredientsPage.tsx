import { useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import type { Ingredient, MeasurementUnit } from '../domain/types'

const units: { value: MeasurementUnit; label: string }[] = [
  { value: 'g', label: 'г' },
  { value: 'ml', label: 'мл' },
  { value: 'pcs', label: 'шт.' },
]

export function IngredientsPage({ state }: { state: AppState }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<MeasurementUnit>('g')
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setPrice('')
    setQuantity('')
    setUnit('g')
    setError(null)
  }

  const startEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id)
    setName(ingredient.name)
    setPrice(String(ingredient.pricePerPackage))
    setQuantity(String(ingredient.packageQuantity))
    setUnit(ingredient.unit)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      setError('Введите название продукта')
      return
    }

    const priceNum = Number(price)
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Цена должна быть положительным числом')
      return
    }

    const quantityNum = Number(quantity)
    if (Number.isNaN(quantityNum) || quantityNum <= 0) {
      setError('Количество в упаковке должно быть положительным числом')
      return
    }

    if (editingId) {
      state.updateIngredient(editingId, {
        name: trimmedName,
        pricePerPackage: priceNum,
        packageQuantity: quantityNum,
        unit,
      })
    } else {
      state.addIngredient({
        name: trimmedName,
        pricePerPackage: priceNum,
        packageQuantity: quantityNum,
        unit,
      })
    }

    resetForm()
  }

  return (
    <div className="space-y-6" data-testid="ingredients-page">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"
        data-testid="ingredient-form"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {editingId ? 'Редактировать продукт' : 'Добавить продукт'}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="ingredient-name" className="text-sm font-medium text-slate-600">
              Название
            </label>
            <input
              id="ingredient-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Например, Сахар белый"
              data-testid="ingredient-name-input"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ingredient-price" className="text-sm font-medium text-slate-600">
              Цена за упаковку, ₽
            </label>
            <input
              id="ingredient-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="0"
              data-testid="ingredient-price-input"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ingredient-quantity" className="text-sm font-medium text-slate-600">
              Размер упаковки
            </label>
            <input
              id="ingredient-quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="1000"
              data-testid="ingredient-quantity-input"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ingredient-unit" className="text-sm font-medium text-slate-600">
              Единица
            </label>
            <select
              id="ingredient-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as MeasurementUnit)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              data-testid="ingredient-unit-select"
            >
              {units.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-rose-600" data-testid="ingredient-form-error">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            data-testid="ingredient-submit-button"
          >
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              data-testid="ingredient-cancel-button"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <div
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"
        data-testid="ingredients-list"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">База продуктов</h2>

        {state.ingredients.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="ingredients-empty-state">
            Пока нет продуктов. Добавьте первый ингредиент.
          </p>
        ) : (
          <div className="space-y-3">
            {state.ingredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                data-testid="ingredient-row"
                data-ingredient-id={ingredient.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{ingredient.name}</p>
                  <p className="text-sm text-slate-500">
                    {ingredient.pricePerPackage} ₽ за {ingredient.packageQuantity}
                    {units.find((u) => u.value === ingredient.unit)?.label} (
                    {ingredient.pricePerBaseUnit.toFixed(2)} ₽/{' '}
                    {units.find((u) => u.value === ingredient.unit)?.label})
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(ingredient)}
                    className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50"
                    data-testid="ingredient-edit-button"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => state.deleteIngredient(ingredient.id)}
                    className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50"
                    data-testid="ingredient-delete-button"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
