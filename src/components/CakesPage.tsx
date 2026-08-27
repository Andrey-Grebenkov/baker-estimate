import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import type { AppState } from '../hooks/useAppState'
import { CakePrintView } from './CakePrintView'
import { generateId } from '../lib/id'
import type { Cake, CakeAdditionalItem, CakeInput, CakeRecipeItem, Ingredient, Overheads, Recipe } from '../domain/types'
import { calculateFinalCostPrice, type CakeDetails } from '../domain/cake'
import { formatMoney, roundToCurrency } from '../domain/money'
import {
  MAX_DEFAULT_PERCENT,
  MAX_DEFAULT_PRICE,
  MAX_DEFAULT_QUANTITY,
  normalizeNumberString,
  parseNumberInput,
} from '../lib/numberInput'

import { generateShoppingList } from '../domain/shoppingList'
import { pluralizeRu } from '../lib/pluralize'
import { ShoppingListModal } from './ShoppingListModal'
import { confirmDelete } from '../lib/confirmDelete'
import { RequiredMark } from './RequiredMark'

export function CakesPage({ state }: { state: AppState }) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cakeName, setCakeName] = useState('')
  const [recipes, setRecipes] = useState<CakeRecipeItem[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState('')

  const [baseYieldWeight, setBaseYieldWeight] = useState('1')
  const [baseYieldUnit, setBaseYieldUnit] = useState<Cake['base_yield_unit']>('кг')

  const [packaging, setPackaging] = useState<CakeAdditionalItem[]>([])
  const [packagingName, setPackagingName] = useState('')
  const [packagingCost, setPackagingCost] = useState('')
  const [packagingQuantity, setPackagingQuantity] = useState('1')

  const [decor, setDecor] = useState<CakeAdditionalItem[]>([])
  const [decorName, setDecorName] = useState('')
  const [decorCost, setDecorCost] = useState('')
  const [decorQuantity, setDecorQuantity] = useState('1')

  const [overheads, setOverheads] = useState<Overheads>({
    workHours: 0,
    hourlyRate: 0,
    fixedCosts: 0,
  })
  const [rawOverheads, setRawOverheads] = useState({
    workHours: '0',
    hourlyRate: '0',
    fixedCosts: '0',
  })

  const [marginPercent, setMarginPercent] = useState('30')
  const [error, setError] = useState<string | null>(null)
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [printingCakeId, setPrintingCakeId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const resetForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setCakeName('')
    setRecipes([])
    setSelectedRecipeId(state.recipes[0]?.id ?? '')
    setBaseYieldWeight('1')
    setBaseYieldUnit('кг')
    setPackaging([])
    setPackagingName('')
    setPackagingCost('')
    setPackagingQuantity('1')
    setDecor([])
    setDecorName('')
    setDecorCost('')
    setDecorQuantity('1')
    setOverheads({ workHours: 0, hourlyRate: 0, fixedCosts: 0 })
    setRawOverheads({ workHours: '0', hourlyRate: '0', fixedCosts: '0' })
    setMarginPercent('30')
    setImageUrl(null)
    setImageFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setError(null)
  }

  const openForm = () => {
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startEdit = (cake: CakeDetails) => {
    setIsFormOpen(true)
    setEditingId(cake.id)
    setCakeName(cake.name)
    setRecipes(cake.recipes.map((cr) => ({ ...cr, multiplier: 1 })))
    setSelectedRecipeId(state.recipes[0]?.id ?? '')
    setBaseYieldWeight(cake.base_yield_weight != null ? String(cake.base_yield_weight) : '1')
    setBaseYieldUnit(cake.base_yield_unit ?? 'кг')
    setPackaging([...cake.packaging])
    setPackagingName('')
    setPackagingCost('')
    setPackagingQuantity('1')
    setDecor([...cake.decor])
    setDecorName('')
    setDecorCost('')
    setDecorQuantity('1')
    setOverheads(cake.overheads)
    setRawOverheads({
      workHours: String(cake.overheads.workHours),
      hourlyRate: String(cake.overheads.hourlyRate),
      fixedCosts: String(cake.overheads.fixedCosts),
    })
    setMarginPercent(String(cake.marginPercent))
    setImageUrl(cake.image_url ?? null)
    setImageFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addRecipeToCake = () => {
    if (!selectedRecipeId) {
      setError('Выберите рецепт')
      return
    }

    if (recipes.some((r) => r.recipeId === selectedRecipeId)) {
      setError('Этот рецепт уже добавлен. Удалите старый или выберите другой.')
      return
    }

    setRecipes((prev) => [...prev, { recipeId: selectedRecipeId, multiplier: 1 }])
    setError(null)
  }

  const removeRecipeFromCake = (recipeId: string) => {
    setRecipes((prev) => prev.filter((r) => r.recipeId !== recipeId))
  }

  const addPackaging = () => {
    const trimmedName = packagingName.trim()
    if (trimmedName.length === 0) {
      setError('Введите название упаковки')
      return
    }

    const cost = Number(packagingCost)
    if (Number.isNaN(cost) || cost < 0) {
      setError('Стоимость не может быть отрицательной')
      return
    }

    const quantity = Number(packagingQuantity)
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError('Количество должно быть положительным числом')
      return
    }

    setPackaging((prev) => [
      ...prev,
      { id: generateId(), name: trimmedName, cost, quantity },
    ])

    setPackagingName('')
    setPackagingCost('')
    setPackagingQuantity('1')
    setError(null)
  }

  const removePackaging = (id: string) => {
    setPackaging((prev) => prev.filter((p) => p.id !== id))
  }

  const editPackaging = (item: CakeAdditionalItem) => {
    setPackagingName(item.name)
    setPackagingCost(String(item.cost))
    setPackagingQuantity(String(item.quantity))
    setPackaging((prev) => prev.filter((p) => p.id !== item.id))
    setError(null)
  }

  const addDecor = () => {
    const trimmedName = decorName.trim()
    if (trimmedName.length === 0) {
      setError('Введите название декора')
      return
    }

    const cost = Number(decorCost)
    if (Number.isNaN(cost) || cost < 0) {
      setError('Стоимость не может быть отрицательной')
      return
    }

    const quantity = Number(decorQuantity)
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError('Количество должно быть положительным числом')
      return
    }

    setDecor((prev) => [
      ...prev,
      { id: generateId(), name: trimmedName, cost, quantity },
    ])

    setDecorName('')
    setDecorCost('')
    setDecorQuantity('1')
    setError(null)
  }

  const removeDecor = (id: string) => {
    setDecor((prev) => prev.filter((d) => d.id !== id))
  }

  const editDecor = (item: CakeAdditionalItem) => {
    setDecorName(item.name)
    setDecorCost(String(item.cost))
    setDecorQuantity(String(item.quantity))
    setDecor((prev) => prev.filter((d) => d.id !== item.id))
    setError(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Выберите файл изображения')
      return
    }
    if (imageFile) {
      URL.revokeObjectURL(previewUrl ?? '')
    }
    setImageFile(file)
    setImageUrl(null)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  const removeImage = () => {
    setImageFile(null)
    setImageUrl(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
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

    const recipesById = Object.fromEntries(state.recipes.map((r) => [r.id, r])) as Record<string, Recipe>
    const id = editingId ?? generateId()
    const baseYield = Number(baseYieldWeight) || 1

    try {
      return {
        id,
        name: trimmedName,
        recipes,
        packaging,
        decor,
        overheads,
        base_yield_weight: baseYield,
        base_yield_unit: baseYieldUnit,
        marginPercent: margin,
        ...calculateDerivedCake(
          recipes,
          packaging,
          decor,
          overheads,
          margin,
          recipesById,
          baseYield,
          baseYieldUnit,
        ),
      }
    } catch {
      return null
    }
  }

  const recipesById = useMemo(
    () => Object.fromEntries(state.recipes.map((r) => [r.id, r])) as Record<string, Recipe>,
    [state.recipes],
  )

  const ingredientsById = useMemo(
    () => Object.fromEntries(state.ingredients.map((i) => [i.id, i])) as Record<string, Ingredient>,
    [state.ingredients],
  )
  const shoppingListItems = useMemo(
    () => generateShoppingList(recipes, recipesById, ingredientsById),
    [recipes, recipesById, ingredientsById],
  )

  const handlePrint = (cakeId: string) => {
    const cake = state.cakes.find((c) => c.id === cakeId)
    if (!cake) return

    flushSync(() => {
      setPrintingCakeId(cakeId)
    })

    window.print()

    setPrintingCakeId(null)
  }

  const printingCake = printingCakeId
    ? state.cakes.find((c) => c.id === printingCakeId)
    : null

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

    const payload: Omit<CakeInput, 'id' | 'user_id'> = {
      name: trimmedName,
      recipes,
      packaging,
      decor,
      overheads,
      base_yield_weight: Number(baseYieldWeight) || 1,
      base_yield_unit: baseYieldUnit,
      marginPercent: margin,
      image_url: imageUrl ?? undefined,
    }

    const editedId = editingId

    if (editingId) {
      state.updateCake(editingId, payload, imageFile ?? undefined)
    } else {
      state.addCake(payload, imageFile ?? undefined)
    }

    resetForm()

    if (editedId) {
      setTimeout(() => {
        document.getElementById(`cake-${editedId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 500)
    }
  }

  if (printingCake) {
    return (
      <div
        className="fixed inset-0 z-50 block overflow-auto bg-white p-4 sm:p-8 print:static print:block print:p-0"
        data-testid="cake-print-overlay"
      >
        <div className="mx-auto w-full max-w-5xl print:max-w-none">
          <CakePrintView cake={printingCake} recipes={state.recipes} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="cakes-page">
      {!isFormOpen && (
        <button
          type="button"
          onClick={openForm}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          data-testid="cake-open-form-button"
        >
          + Собрать торт
        </button>
      )}

      {isFormOpen && (
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"
        data-testid="cake-form"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {editingId ? 'Редактировать торт' : 'Собрать торт'}
        </h2>

        <div className="mb-4">
          <label htmlFor="cake-name" className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-slate-600">
            Название торта
            <RequiredMark />
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

        <div className="mb-4">
          <label htmlFor="cake-image" className="mb-1 block text-sm font-medium text-slate-600">
            Фотография торта
          </label>

          <input
            id="cake-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            data-testid="cake-image-input"
          />

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="cake-image"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              data-testid="cake-image-label"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="7" width="18" height="13" rx="2" ry="2" />
                <circle cx="12" cy="13" r="3" />
                <path d="M8 7h8" />
              </svg>
              {imageUrl || previewUrl ? 'Заменить фото' : 'Выбрать фото'}
            </label>

            {(imageUrl || previewUrl) && (
              <button
                type="button"
                onClick={removeImage}
                className="text-sm text-rose-600 hover:text-rose-700"
                data-testid="cake-remove-image-button"
              >
                Удалить
              </button>
            )}
          </div>

          {(previewUrl || imageUrl) && (
            <div className="mt-3 aspect-video w-full max-w-md overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
              <img
                src={previewUrl ?? imageUrl ?? undefined}
                alt="Предпросмотр фотографии торта"
                className="h-full w-full object-cover"
                data-testid="cake-image-preview"
              />
            </div>
          )}
        </div>

        <div className="mb-4 card-inset p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Полуфабрикаты</h3>

          <div className="grid items-end gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="cake-recipe-select" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Рецепт
                <RequiredMark />
              </label>
              <select
                id="cake-recipe-select"
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

            <div className="flex items-end">
              <button
                type="button"
                onClick={addRecipeToCake}
                className="h-10 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
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
                if (!recipe) {
                  return (
                    <li
                      key={cr.recipeId}
                      className="flex items-center justify-between rounded-md bg-rose-50 p-2 ring-1 ring-rose-200"
                      data-testid="cake-recipe-row"
                    >
                      <span className="text-sm text-rose-700">Удалённый рецепт</span>
                      <button
                        type="button"
                        onClick={() => removeRecipeFromCake(cr.recipeId)}
                        className="text-sm text-rose-700 hover:text-rose-800"
                        data-testid="cake-remove-recipe-button"
                      >
                        Удалить
                      </button>
                    </li>
                  )
                }

                return (
                  <li
                    key={cr.recipeId}
                    className="flex items-center justify-between rounded-md bg-white p-2 ring-1 ring-slate-200"
                    data-testid="cake-recipe-row"
                  >
                    <span className="text-sm text-slate-700">{recipe.name}</span>
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

          <button
            type="button"
            onClick={() => setShowShoppingList(true)}
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            data-testid="cake-shopping-list-button"
          >
            Сформировать список покупок
          </button>
        </div>

        <div className="mb-4 card-inset p-4" data-testid="cake-base-yield-section">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Базовый выход торта</h3>

          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label htmlFor="cake-base-yield-weight" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Вес / кол-во
                <RequiredMark />
              </label>
              <input
                id="cake-base-yield-weight"
                type="number"
                min="0"
                max={MAX_DEFAULT_QUANTITY}
                step="0.01"
                value={baseYieldWeight}
                onChange={(e) => setBaseYieldWeight(normalizeNumberString(e.target.value, MAX_DEFAULT_QUANTITY))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="1"
                data-testid="cake-base-yield-weight-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="cake-base-yield-unit" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Единица
                <RequiredMark />
              </label>
              <select
                id="cake-base-yield-unit"
                value={baseYieldUnit}
                onChange={(e) => setBaseYieldUnit(e.target.value as Cake['base_yield_unit'])}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="cake-base-yield-unit-select"
              >
                <option value="кг">кг</option>
                <option value="шт">шт</option>
              </select>
            </div>
          </div>

        </div>

        <div className="mb-4 card-inset p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Упаковка</h3>

          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor="packaging-name" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Название
                <RequiredMark />
              </label>
              <input
                id="packaging-name"
                type="text"
                value={packagingName}
                onChange={(e) => setPackagingName(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Коробка, подложка..."
                data-testid="packaging-name-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="packaging-cost" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Стоимость, ₽
                <RequiredMark />
              </label>
              <input
                id="packaging-cost"
                type="number"
                min="0"
                max={MAX_DEFAULT_PRICE}
                step="0.01"
                value={packagingCost}
                onChange={(e) => setPackagingCost(normalizeNumberString(e.target.value, MAX_DEFAULT_PRICE))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
                data-testid="packaging-cost-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="packaging-quantity" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Количество
                <RequiredMark />
              </label>
              <input
                id="packaging-quantity"
                type="number"
                min="0"
                max={MAX_DEFAULT_QUANTITY}
                step="1"
                value={packagingQuantity}
                onChange={(e) => setPackagingQuantity(normalizeNumberString(e.target.value, MAX_DEFAULT_QUANTITY))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="1"
                data-testid="packaging-quantity-input"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addPackaging}
                className="h-10 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                data-testid="cake-add-packaging-button"
              >
                Добавить
              </button>
            </div>
          </div>

          {packaging.length > 0 && (
            <ul className="mt-4 space-y-2" data-testid="cake-packaging-list">
              {packaging.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md bg-white p-2 ring-1 ring-slate-200"
                  data-testid="cake-packaging-row"
                >
                  <span className="text-sm text-slate-700">
                    {p.name} — {p.quantity} шт. × {p.cost} ₽
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editPackaging(p)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                      data-testid="cake-edit-packaging-button"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => removePackaging(p.id)}
                      className="text-sm text-rose-600 hover:text-rose-700"
                      data-testid="cake-remove-packaging-button"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 card-inset p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Декор</h3>

          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor="decor-name" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Название
                <RequiredMark />
              </label>
              <input
                id="decor-name"
                type="text"
                value={decorName}
                onChange={(e) => setDecorName(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Топпер, свежие ягоды..."
                data-testid="decor-name-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="decor-cost" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Стоимость, ₽
                <RequiredMark />
              </label>
              <input
                id="decor-cost"
                type="number"
                min="0"
                max={MAX_DEFAULT_PRICE}
                step="0.01"
                value={decorCost}
                onChange={(e) => setDecorCost(normalizeNumberString(e.target.value, MAX_DEFAULT_PRICE))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
                data-testid="decor-cost-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="decor-quantity" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Количество
                <RequiredMark />
              </label>
              <input
                id="decor-quantity"
                type="number"
                min="0"
                max={MAX_DEFAULT_QUANTITY}
                step="1"
                value={decorQuantity}
                onChange={(e) => setDecorQuantity(normalizeNumberString(e.target.value, MAX_DEFAULT_QUANTITY))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="1"
                data-testid="decor-quantity-input"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addDecor}
                className="h-10 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                data-testid="cake-add-decor-button"
              >
                Добавить
              </button>
            </div>
          </div>

          {decor.length > 0 && (
            <ul className="mt-4 space-y-2" data-testid="cake-decor-list">
              {decor.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-md bg-white p-2 ring-1 ring-slate-200"
                  data-testid="cake-decor-row"
                >
                  <span className="text-sm text-slate-700">
                    {d.name} — {d.quantity} шт. × {d.cost} ₽
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editDecor(d)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                      data-testid="cake-edit-decor-button"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDecor(d.id)}
                      className="text-sm text-rose-600 hover:text-rose-700"
                      data-testid="cake-remove-decor-button"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 card-inset p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Накладные расходы</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="overheads-hours" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Часы работы
                <RequiredMark />
              </label>
              <input
                id="overheads-hours"
                type="number"
                min="0"
                max={MAX_DEFAULT_QUANTITY}
                step="0.5"
                value={rawOverheads.workHours}
                onChange={(e) => {
                  const value = normalizeNumberString(e.target.value, MAX_DEFAULT_QUANTITY)
                  setRawOverheads((prev) => ({ ...prev, workHours: value }))
                  setOverheads((prev) => ({ ...prev, workHours: parseNumberInput(value) }))
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="overheads-hours-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="overheads-rate" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Ставка за час, ₽
                <RequiredMark />
              </label>
              <input
                id="overheads-rate"
                type="number"
                min="0"
                max={MAX_DEFAULT_PRICE}
                step="0.01"
                value={rawOverheads.hourlyRate}
                onChange={(e) => {
                  const value = normalizeNumberString(e.target.value, MAX_DEFAULT_PRICE)
                  setRawOverheads((prev) => ({ ...prev, hourlyRate: value }))
                  setOverheads((prev) => ({ ...prev, hourlyRate: parseNumberInput(value) }))
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="overheads-rate-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="overheads-fixed" className="inline-flex items-center gap-1 text-sm text-slate-600">
                Фиксированные расходы, ₽
                <RequiredMark />
              </label>
              <input
                id="overheads-fixed"
                type="number"
                min="0"
                max={MAX_DEFAULT_PRICE}
                step="0.01"
                value={rawOverheads.fixedCosts}
                onChange={(e) => {
                  const value = normalizeNumberString(e.target.value, MAX_DEFAULT_PRICE)
                  setRawOverheads((prev) => ({ ...prev, fixedCosts: value }))
                  setOverheads((prev) => ({ ...prev, fixedCosts: parseNumberInput(value) }))
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="overheads-fixed-input"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="cake-margin" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600">
              Желаемая наценка, %
              <RequiredMark />
            </label>
            <input
              id="cake-margin"
              type="number"
              min="0"
              max={MAX_DEFAULT_PERCENT}
              step="0.01"
              value={marginPercent}
              onChange={(e) => setMarginPercent(normalizeNumberString(e.target.value, MAX_DEFAULT_PERCENT))}
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

          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            data-testid="cake-cancel-button"
          >
            Отмена
          </button>
        </div>
      </form>
      )}

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
                state={state}
                onEdit={() => startEdit(cake)}
                onDelete={() => confirmDelete(() => state.deleteCake(cake.id))}
                onPrint={() => handlePrint(cake.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showShoppingList && (
        <ShoppingListModal
          result={shoppingListItems}
          cakeName={cakeName.trim() || 'Новый торт'}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </div>
  )
}

function calculateDerivedCake(
  recipes: CakeRecipeItem[],
  packaging: CakeAdditionalItem[],
  decor: CakeAdditionalItem[],
  overheads: Overheads,
  marginPercent: number,
  recipesById: Record<string, Recipe>,
  baseYieldWeight: number,
  baseYieldUnit: Cake['base_yield_unit'],
): Omit<
  CakeDetails,
  'id' | 'name' | 'recipes' | 'packaging' | 'decor' | 'overheads' | 'marginPercent'
> {
  let totalIngredientsCost = 0

  for (const item of recipes) {
    const recipe = recipesById[item.recipeId]
    if (!recipe) {
      continue
    }
    totalIngredientsCost += roundToCurrency(recipe.totalCost * item.multiplier)
  }

  totalIngredientsCost = roundToCurrency(totalIngredientsCost)

  const totalPackagingCost = roundToCurrency(
    packaging.reduce((sum, item) => sum + item.cost * item.quantity, 0),
  )
  const totalDecorCost = roundToCurrency(
    decor.reduce((sum, item) => sum + item.cost * item.quantity, 0),
  )

  const totalOverheadsCost = roundToCurrency(
    overheads.workHours * overheads.hourlyRate + overheads.fixedCosts,
  )

  const finalCostPrice = calculateFinalCostPrice(
    totalIngredientsCost,
    totalPackagingCost,
    totalDecorCost,
    totalOverheadsCost,
  )
  const recommendedPrice = roundToCurrency(finalCostPrice * (1 + marginPercent / 100))
  const weightKg = baseYieldWeight

  return {
    base_yield_weight: baseYieldWeight,
    base_yield_unit: baseYieldUnit,
    totalIngredientsCost,
    totalPackagingCost,
    totalDecorCost,
    totalOverheadsCost,
    finalCostPrice,
    recommendedPrice,
    weightKg,
    costPerKg: weightKg > 0 ? roundToCurrency(finalCostPrice / weightKg) : 0,
    recommendedPricePerKg: weightKg > 0 ? roundToCurrency(recommendedPrice / weightKg) : 0,
  }
}

function formatCakeWeight(weight: number, unit: 'кг' | 'шт'): string {
  const trimmed = Number(weight.toFixed(3))
  return `${trimmed} ${unit}`
}

function CakePreview({ cake }: { cake: CakeDetails | null }) {
  if (!cake) return null

  const unit = cake.base_yield_unit ?? 'кг'
  const perUnitLabel = unit === 'шт' ? 'За 1 шт' : 'За 1 кг'

  return (
    <div
      className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 sm:p-6 print:hidden"
      data-testid="cake-preview-card"
    >
      <h3 className="mb-3 text-lg font-semibold text-slate-800">Предварительный расчёт</h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Вес"
          value={formatCakeWeight(cake.base_yield_weight ?? cake.weightKg, unit)}
        />
        <Metric label="Себестоимость" value={`${formatMoney(cake.finalCostPrice)} ₽`} />
        <Metric label="Цена продажи" value={`${formatMoney(cake.recommendedPrice)} ₽`} />
        <Metric label="Наценка" value={`${cake.marginPercent}%`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label={`${perUnitLabel} (себест.)`} value={`${formatMoney(cake.costPerKg)} ₽/${unit}`} />
        <Metric label={`${perUnitLabel} (продажа)`} value={`${formatMoney(cake.recommendedPricePerKg)} ₽/${unit}`} />
      </div>
    </div>
  )
}

function CakeCard({
  cake,
  onEdit,
  onDelete,
  onPrint,
  state,
}: {
  cake: CakeDetails
  onEdit: () => void
  onDelete: () => void
  onPrint: () => void
  state: AppState
}) {
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)
  const [selectedReplacementId, setSelectedReplacementId] = useState('')

  const handleStartReplace = (missingRecipeId: string) => {
    setEditingRecipeId(missingRecipeId)
    const available = state.recipes.filter(
      (r) => !cake.recipes.some((cr) => cr.recipeId === r.id && cr.recipeId !== missingRecipeId),
    )
    setSelectedReplacementId(available[0]?.id ?? '')
  }

  const handleCancelReplace = () => {
    setEditingRecipeId(null)
    setSelectedReplacementId('')
  }

  const handleSaveReplacement = (missingRecipeId: string) => {
    if (!selectedReplacementId) return

    const newRecipes = cake.recipes.map((cr) =>
      cr.recipeId === missingRecipeId ? { recipeId: selectedReplacementId, multiplier: 1 } : { ...cr, multiplier: 1 },
    )

    const payload: Omit<CakeInput, 'id' | 'user_id'> = {
      name: cake.name,
      recipes: newRecipes,
      packaging: cake.packaging,
      decor: cake.decor,
      overheads: cake.overheads,
      base_yield_weight: cake.base_yield_weight,
      base_yield_unit: cake.base_yield_unit,
      marginPercent: cake.marginPercent,
      image_url: cake.image_url,
    }

    state.updateCake(cake.id, payload)
    setEditingRecipeId(null)
    setSelectedReplacementId('')
  }

  return (
    <div
      id={`cake-${cake.id}`}
      className="card-inset overflow-hidden print:bg-white"
      data-testid="cake-row"
      data-cake-id={cake.id}
    >
      <div className="p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {cake.image_url && (
              <ImageThumbnail imageUrl={cake.image_url} cakeName={cake.name} />
            )}
            <div>
              <p className="font-medium text-slate-800">{cake.name}</p>
              <p className="text-sm text-slate-500">
                {pluralizeRu(cake.recipes.length, ['рецепт', 'рецепта', 'рецептов'])} |{' '}
                {pluralizeRu(cake.packaging.length, ['упаковка', 'упаковки', 'упаковок'])} |{' '}
                {pluralizeRu(cake.decor.length, ['декор', 'декора', 'декоров'])}
              </p>
            </div>
          </div>
          {cake.recipes.map((cr) => {
            const recipe = state.recipes.find((r) => r.id === cr.recipeId)
            if (recipe) return null

            if (editingRecipeId === cr.recipeId) {
              return (
                <div key={cr.recipeId} className="mt-2 flex flex-wrap items-center gap-2" data-testid="cake-replace-recipe-inline">
                  <select
                    value={selectedReplacementId}
                    onChange={(e) => setSelectedReplacementId(e.target.value)}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    data-testid="cake-replace-recipe-select"
                  >
                    {state.recipes
                      .filter((r) => !cake.recipes.some((cr) => cr.recipeId === r.id))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.totalWeight} г, {formatMoney(r.totalCost)} ₽)
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSaveReplacement(cr.recipeId)}
                    disabled={!selectedReplacementId || state.isLoading}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    data-testid="cake-replace-recipe-save"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReplace}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    data-testid="cake-replace-recipe-cancel"
                  >
                    Отмена
                  </button>
                </div>
              )
            }

            return (
              <button
                key={cr.recipeId}
                type="button"
                onClick={() => handleStartReplace(cr.recipeId)}
                disabled={state.isLoading}
                className="mt-1 block text-left text-sm font-medium text-rose-600 hover:text-rose-700 disabled:text-slate-400"
                data-testid="cake-missing-recipe-warning"
              >
                ⚠ Обнаружен удаленный рецепт (нажмите для замены)
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50"
            data-testid="cake-print-button"
          >
            Распечатать смету
          </button>
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
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden"
        data-testid="cake-result-card"
      >
        <Metric
          label="Вес"
          value={formatCakeWeight(cake.base_yield_weight ?? cake.weightKg, cake.base_yield_unit ?? 'кг')}
        />
        <Metric label="Себестоимость" value={`${formatMoney(cake.finalCostPrice)} ₽`} />
        <Metric label="Цена продажи" value={`${formatMoney(cake.recommendedPrice)} ₽`} />
        <Metric label="Наценка" value={`${cake.marginPercent}%`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
        <Metric
          label={cake.base_yield_unit === 'шт' ? 'За 1 шт (себест.)' : 'За 1 кг (себест.)'}
          value={`${formatMoney(cake.costPerKg)} ₽/${cake.base_yield_unit ?? 'кг'}`}
        />
        <Metric
          label={cake.base_yield_unit === 'шт' ? 'За 1 шт (продажа)' : 'За 1 кг (продажа)'}
          value={`${formatMoney(cake.recommendedPricePerKg)} ₽/${cake.base_yield_unit ?? 'кг'}`}
        />
        <Metric
          label="Структура затрат"
          value={`ингр. ${formatMoney(cake.totalIngredientsCost)} ₽ + упак. ${formatMoney(
            cake.totalPackagingCost,
          )} ₽ + декор ${formatMoney(cake.totalDecorCost)} ₽ + труд ${formatMoney(
            cake.totalOverheadsCost,
          )} ₽`}
        />
      </div>

      <div className="hidden print:block">
        <CakePrintView cake={cake} recipes={state.recipes} />
      </div>

      </div>
    </div>
  )
}

function ImageThumbnail({ imageUrl, cakeName }: { imageUrl: string; cakeName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200 hover:ring-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        data-testid="cake-image-thumbnail-button"
      >
        <img
          src={imageUrl}
          alt={cakeName}
          className="h-16 w-16 object-cover"
          data-testid="cake-image-thumbnail"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
          data-testid="cake-image-lightbox"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={imageUrl}
              alt={cakeName}
              className="max-h-[80vh] max-w-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-2 text-slate-800 shadow-md hover:bg-slate-100"
              data-testid="cake-image-lightbox-close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-inset p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  )
}
