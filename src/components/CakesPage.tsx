import { useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import { generateId } from '../lib/id'
import type { CakeDecorationItem, CakeRecipeItem, Overheads } from '../domain/types'
import type { CakeDetails } from '../domain/cake'

function formatMoney(value: number): string {
  return value.toFixed(2)
}

export function CakesPage({ state }: { state: AppState }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cakeName, setCakeName] = useState('')
  const [recipes, setRecipes] = useState<CakeRecipeItem[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [selectedMultiplier, setSelectedMultiplier] = useState('1')

  const [decorations, setDecorations] = useState<CakeDecorationItem[]>([])
  const [decorationName, setDecorationName] = useState('')
  const [decorationCost, setDecorationCost] = useState('')
  const [decorationQuantity, setDecorationQuantity] = useState('1')

  const [overheads, setOverheads] = useState<Overheads>({
    workHours: 0,
    hourlyRate: 0,
    fixedCosts: 0,
  })

  const [marginPercent, setMarginPercent] = useState('30')
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setEditingId(null)
    setCakeName('')
    setRecipes([])
    setSelectedRecipeId(state.recipes[0]?.id ?? '')
    setSelectedMultiplier('1')
    setDecorations([])
    setDecorationName('')
    setDecorationCost('')
    setDecorationQuantity('1')
    setOverheads({ workHours: 0, hourlyRate: 0, fixedCosts: 0 })
    setMarginPercent('30')
    setError(null)
  }

  const startEdit = (cake: CakeDetails) => {
    setEditingId(cake.id)
    setCakeName(cake.name)
    setRecipes(cake.recipes)
    setSelectedRecipeId(state.recipes[0]?.id ?? '')
    setSelectedMultiplier('1')
    setDecorations(cake.decorations)
    setDecorationName('')
    setDecorationCost('')
    setDecorationQuantity('1')
    setOverheads(cake.overheads)
    setMarginPercent(String(cake.marginPercent))
    setError(null)
  }

  const addRecipeToCake = () => {
    if (!selectedRecipeId) {
      setError('Выберите рецепт')
      return
    }

    const multiplier = Number(selectedMultiplier)
    if (Number.isNaN(multiplier) || multiplier <= 0) {
      setError('Коэффициент должен быть положительным числом')
      return
    }

    if (recipes.some((r) => r.recipeId === selectedRecipeId)) {
      setRecipes((prev) =>
        prev.map((r) => (r.recipeId === selectedRecipeId ? { ...r, multiplier } : r)),
      )
    } else {
      setRecipes((prev) => [...prev, { recipeId: selectedRecipeId, multiplier }])
    }

    setSelectedMultiplier('1')
    setError(null)
  }

  const removeRecipeFromCake = (recipeId: string) => {
    setRecipes((prev) => prev.filter((r) => r.recipeId !== recipeId))
  }

  const addDecoration = () => {
    const trimmedName = decorationName.trim()
    if (trimmedName.length === 0) {
      setError('Введите название декора/упаковки')
      return
    }

    const cost = Number(decorationCost)
    if (Number.isNaN(cost) || cost < 0) {
      setError('Стоимость не может быть отрицательной')
      return
    }

    const quantity = Number(decorationQuantity)
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError('Количество должно быть положительным числом')
      return
    }

    setDecorations((prev) => [
      ...prev,
      { id: generateId(), name: trimmedName, cost, quantity },
    ])

    setDecorationName('')
    setDecorationCost('')
    setDecorationQuantity('1')
    setError(null)
  }

  const removeDecoration = (id: string) => {
    setDecorations((prev) => prev.filter((d) => d.id !== id))
  }

  const previewCake = (): CakeDetails | null => {
    const trimmedName = cakeName.trim()
    if (trimmedName.length === 0 || recipes.length === 0) {
      return null
    }

    const margin = Number(marginPercent)
    if (Number.isNaN(margin) || margin < 0) {
      return null
    }

    const recipesById = Object.fromEntries(state.recipes.map((r) => [r.id, r]))
    const id = editingId ?? generateId()

    try {
      return {
        id,
        name: trimmedName,
        recipes,
        decorations,
        overheads,
        marginPercent: margin,
        ...calculateDerivedCake(recipes, decorations, overheads, margin, recipesById),
      }
    } catch {
      return null
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = cakeName.trim()
    if (trimmedName.length === 0) {
      setError('Введите название торта')
      return
    }

    if (recipes.length === 0) {
      setError('Добавьте хотя бы один рецепт')
      return
    }

    const margin = Number(marginPercent)
    if (Number.isNaN(margin) || margin < 0) {
      setError('Наценка не может быть отрицательной')
      return
    }

    const payload = {
      name: trimmedName,
      recipes,
      decorations,
      overheads,
      marginPercent: margin,
    }

    if (editingId) {
      state.updateCake(editingId, payload)
    } else {
      state.addCake(payload)
    }

    resetForm()
  }

  return (
    <div className="space-y-6" data-testid="cakes-page">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"
        data-testid="cake-form"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {editingId ? 'Редактировать торт' : 'Собрать торт'}
        </h2>

        <div className="mb-4">
          <label htmlFor="cake-name" className="mb-1 block text-sm font-medium text-slate-600">
            Название торта
          </label>
          <input
            id="cake-name"
            type="text"
            value={cakeName}
            onChange={(e) => setCakeName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Например, Свадебный 3-ярусный"
            data-testid="cake-name-input"
          />
        </div>

        <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700">Полуфабрикаты</h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor="cake-recipe-select" className="text-sm text-slate-600">
                Рецепт
              </label>
              <select
                id="cake-recipe-select"
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="cake-recipe-select"
              >
                <option value="">Выберите рецепт</option>
                {state.recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.totalWeight} г, {recipe.totalCost.toFixed(2)} ₽)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="cake-recipe-multiplier" className="text-sm text-slate-600">
                Коэффициент
              </label>
              <input
                id="cake-recipe-multiplier"
                type="number"
                min="0"
                step="0.01"
                value={selectedMultiplier}
                onChange={(e) => setSelectedMultiplier(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="1"
                data-testid="cake-recipe-multiplier-input"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addRecipeToCake}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                data-testid="cake-add-recipe-button"
              >
                Добавить
              </button>
            </div>
          </div>

          {recipes.length > 0 && (
            <ul className="mt-4 space-y-2" data-testid="cake-recipe-list">
              {recipes.map((cr) => {
                const recipe = state.recipes.find((r) => r.id === cr.recipeId)
                if (!recipe) return null

                return (
                  <li
                    key={cr.recipeId}
                    className="flex items-center justify-between rounded-md bg-white p-2 ring-1 ring-slate-200"
                    data-testid="cake-recipe-row"
                  >
                    <span className="text-sm text-slate-700">
                      {recipe.name} × {cr.multiplier}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRecipeFromCake(cr.recipeId)}
                      className="text-sm text-rose-600 hover:text-rose-700"
                      data-testid="cake-remove-recipe-button"
                    >
                      Удалить
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700">Упаковка и декор</h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor="decoration-name" className="text-sm text-slate-600">
                Название
              </label>
              <input
                id="decoration-name"
                type="text"
                value={decorationName}
                onChange={(e) => setDecorationName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Коробка, топпер..."
                data-testid="decoration-name-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="decoration-cost" className="text-sm text-slate-600">
                Стоимость, ₽
              </label>
              <input
                id="decoration-cost"
                type="number"
                min="0"
                step="0.01"
                value={decorationCost}
                onChange={(e) => setDecorationCost(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
                data-testid="decoration-cost-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="decoration-quantity" className="text-sm text-slate-600">
                Количество
              </label>
              <input
                id="decoration-quantity"
                type="number"
                min="0"
                step="1"
                value={decorationQuantity}
                onChange={(e) => setDecorationQuantity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="1"
                data-testid="decoration-quantity-input"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addDecoration}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                data-testid="cake-add-decoration-button"
              >
                Добавить
              </button>
            </div>
          </div>

          {decorations.length > 0 && (
            <ul className="mt-4 space-y-2" data-testid="cake-decoration-list">
              {decorations.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-md bg-white p-2 ring-1 ring-slate-200"
                  data-testid="cake-decoration-row"
                >
                  <span className="text-sm text-slate-700">
                    {d.name} — {d.quantity} шт. × {d.cost} ₽
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDecoration(d.id)}
                    className="text-sm text-rose-600 hover:text-rose-700"
                    data-testid="cake-remove-decoration-button"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700">Накладные расходы</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="overheads-hours" className="text-sm text-slate-600">
                Часы работы
              </label>
              <input
                id="overheads-hours"
                type="number"
                min="0"
                step="0.5"
                value={overheads.workHours}
                onChange={(e) =>
                  setOverheads((prev) => ({ ...prev, workHours: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="overheads-hours-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="overheads-rate" className="text-sm text-slate-600">
                Ставка за час, ₽
              </label>
              <input
                id="overheads-rate"
                type="number"
                min="0"
                step="0.01"
                value={overheads.hourlyRate}
                onChange={(e) =>
                  setOverheads((prev) => ({ ...prev, hourlyRate: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="overheads-rate-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="overheads-fixed" className="text-sm text-slate-600">
                Фиксированные расходы, ₽
              </label>
              <input
                id="overheads-fixed"
                type="number"
                min="0"
                step="0.01"
                value={overheads.fixedCosts}
                onChange={(e) =>
                  setOverheads((prev) => ({ ...prev, fixedCosts: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="overheads-fixed-input"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="cake-margin" className="text-sm font-medium text-slate-600">
              Желаемая наценка, %
            </label>
            <input
              id="cake-margin"
              type="number"
              min="0"
              step="0.01"
              value={marginPercent}
              onChange={(e) => setMarginPercent(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              data-testid="cake-margin-input"
            />
          </div>
        </div>

        {error && (
          <p className="mb-3 text-sm text-rose-600" data-testid="cake-form-error">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            data-testid="cake-submit-button"
          >
            {editingId ? 'Сохранить' : 'Рассчитать и сохранить'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              data-testid="cake-cancel-button"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <CakePreview cake={previewCake()} />

      <div
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"
        data-testid="cakes-list"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Сохранённые торты</h2>

        {state.cakes.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="cakes-empty-state">
            Пока нет рассчитанных тортов.
          </p>
        ) : (
          <div className="space-y-4">
            {state.cakes.map((cake) => (
              <CakeCard
                key={cake.id}
                cake={cake}
                onEdit={() => startEdit(cake)}
                onDelete={() => state.deleteCake(cake.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function calculateDerivedCake(
  recipes: CakeRecipeItem[],
  decorations: CakeDecorationItem[],
  overheads: Overheads,
  marginPercent: number,
  recipesById: Record<string, { totalCost: number; totalWeight: number }>,
): Omit<CakeDetails, 'id' | 'name' | 'recipes' | 'decorations' | 'overheads' | 'marginPercent'> {
  let totalIngredientsCost = 0
  let totalWeightGrams = 0

  for (const item of recipes) {
    const recipe = recipesById[item.recipeId]
    if (!recipe) {
      throw new Error(`Recipe with id "${item.recipeId}" not found`)
    }
    totalIngredientsCost += recipe.totalCost * item.multiplier
    totalWeightGrams += recipe.totalWeight * item.multiplier
  }

  const totalDecorationsCost = decorations.reduce((sum, d) => sum + d.cost * d.quantity, 0)
  const totalOverheadsCost = overheads.workHours * overheads.hourlyRate + overheads.fixedCosts
  const weightKg = totalWeightGrams / 1000
  const finalCostPrice = totalIngredientsCost + totalDecorationsCost + totalOverheadsCost
  const recommendedPrice = finalCostPrice * (1 + marginPercent / 100)

  return {
    totalIngredientsCost,
    totalDecorationsCost,
    totalOverheadsCost,
    finalCostPrice,
    recommendedPrice,
    weightKg,
    costPerKg: weightKg > 0 ? finalCostPrice / weightKg : 0,
    recommendedPricePerKg: weightKg > 0 ? recommendedPrice / weightKg : 0,
  }
}

function CakePreview({ cake }: { cake: CakeDetails | null }) {
  if (!cake) return null

  return (
    <div
      className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 sm:p-6"
      data-testid="cake-preview-card"
    >
      <h3 className="mb-3 text-lg font-semibold text-slate-800">Предварительный расчёт</h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Вес" value={`${(cake.weightKg * 1000).toFixed(0)} г / ${cake.weightKg.toFixed(3)} кг`} />
        <Metric label="Себестоимость" value={`${formatMoney(cake.finalCostPrice)} ₽`} />
        <Metric label="Цена продажи" value={`${formatMoney(cake.recommendedPrice)} ₽`} />
        <Metric label="Наценка" value={`${cake.marginPercent}%`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="За 1 кг (себест.)" value={`${formatMoney(cake.costPerKg)} ₽/кг`} />
        <Metric label="За 1 кг (продажа)" value={`${formatMoney(cake.recommendedPricePerKg)} ₽/кг`} />
      </div>
    </div>
  )
}

function CakeCard({
  cake,
  onEdit,
  onDelete,
}: {
  cake: CakeDetails
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="rounded-lg border border-slate-100 bg-slate-50 p-4"
      data-testid="cake-row"
      data-cake-id={cake.id}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium text-slate-800">{cake.name}</p>
          <p className="text-sm text-slate-500">
            {cake.recipes.length} рецептов | {cake.decorations.length} декора
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50"
            data-testid="cake-edit-button"
          >
            Изменить
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50"
            data-testid="cake-delete-button"
          >
            Удалить
          </button>
        </div>
      </div>

      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="cake-result-card"
      >
        <Metric label="Вес" value={`${(cake.weightKg * 1000).toFixed(0)} г / ${cake.weightKg.toFixed(3)} кг`} />
        <Metric label="Себестоимость" value={`${formatMoney(cake.finalCostPrice)} ₽`} />
        <Metric label="Цена продажи" value={`${formatMoney(cake.recommendedPrice)} ₽`} />
        <Metric label="Наценка" value={`${cake.marginPercent}%`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="За 1 кг (себест.)" value={`${formatMoney(cake.costPerKg)} ₽/кг`} />
        <Metric label="За 1 кг (продажа)" value={`${formatMoney(cake.recommendedPricePerKg)} ₽/кг`} />
        <Metric
          label="Состав"
          value={`ингр. ${formatMoney(cake.totalIngredientsCost)} ₽ + декор ${formatMoney(
            cake.totalDecorationsCost,
          )} ₽ + труд ${formatMoney(cake.totalOverheadsCost)} ₽`}
        />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  )
}
