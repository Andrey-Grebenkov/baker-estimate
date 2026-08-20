import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import type { AppState } from '../hooks/useAppState'
import { CakePrintView } from './CakePrintView'
import { generateId } from '../lib/id'
import type { CakeAdditionalItem, CakeRecipeItem, Ingredient, Overheads, Recipe } from '../domain/types'
import { calculateFinalCostPrice, type CakeDetails } from '../domain/cake'
import { roundToCurrency } from '../domain/money'
import { normalizeNumberString, parseNumberInput } from '../lib/numberInput'
import {
  calculateScalingCoefficient,
  roundToDecimal,
  type Pan,
  type PanShape,
} from '../domain/recipeScaling'
import { generateShoppingList } from '../domain/shoppingList'
import { ShoppingListModal } from './ShoppingListModal'
import { confirmDelete } from '../lib/confirmDelete'
import { RequiredMark } from './RequiredMark'

function formatMoney(value: number): string {
  return roundToCurrency(value).toFixed(2)
}

export function CakesPage({ state }: { state: AppState }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cakeName, setCakeName] = useState('')
  const [recipes, setRecipes] = useState<CakeRecipeItem[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [selectedMultiplier, setSelectedMultiplier] = useState('1')

  const [showScaling, setShowScaling] = useState(false)
  const [sourceShape, setSourceShape] = useState<PanShape>('round')
  const [sourceDiameter, setSourceDiameter] = useState('16')
  const [sourceLength, setSourceLength] = useState('')
  const [sourceWidth, setSourceWidth] = useState('')
  const [targetShape, setTargetShape] = useState<PanShape>('round')
  const [targetDiameter, setTargetDiameter] = useState('20')
  const [targetLength, setTargetLength] = useState('')
  const [targetWidth, setTargetWidth] = useState('')

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
    setEditingId(null)
    setCakeName('')
    setRecipes([])
    setSelectedRecipeId(state.recipes[0]?.id ?? '')
    setSelectedMultiplier('1')
    setShowScaling(false)
    setSourceShape('round')
    setSourceDiameter('16')
    setSourceLength('')
    setSourceWidth('')
    setTargetShape('round')
    setTargetDiameter('20')
    setTargetLength('')
    setTargetWidth('')
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

  const startEdit = (cake: CakeDetails) => {
    setEditingId(cake.id)
    setCakeName(cake.name)
    setRecipes(cake.recipes)
    setSelectedRecipeId(state.recipes[0]?.id ?? '')
    setSelectedMultiplier('1')
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

  function buildPan(shape: PanShape, diameter: string, length: string, width: string): Pan | null {
    if (shape === 'round') {
      const d = parseNumberInput(diameter)
      return d > 0 ? { shape: 'round', diameter: d } : null
    }
    const l = parseNumberInput(length)
    const w = parseNumberInput(width)
    return l > 0 && w > 0 ? { shape: 'rectangular', length: l, width: w } : null
  }

  const sourcePan = buildPan(sourceShape, sourceDiameter, sourceLength, sourceWidth)
  const targetPan = buildPan(targetShape, targetDiameter, targetLength, targetWidth)
  const scalingCoefficient =
    sourcePan && targetPan ? roundToDecimal(calculateScalingCoefficient(sourcePan, targetPan), 4) : 0

  const applyRecipeScaling = () => {
    if (!selectedRecipeId) {
      setError('Выберите рецепт')
      return
    }
    if (!sourcePan || !targetPan) {
      setError('Введите положительные размеры обеих форм')
      return
    }
    if (scalingCoefficient <= 0) {
      setError('Некорректные размеры форм')
      return
    }

    const newMultiplier = roundToDecimal(scalingCoefficient, 4)

    if (Number.isNaN(newMultiplier) || newMultiplier <= 0) {
      setError('Коэффициент должен быть положительным числом')
      return
    }

    setRecipes((prev) => {
      const exists = prev.some((r) => r.recipeId === selectedRecipeId)
      if (exists) {
        return prev.map((r) =>
          r.recipeId === selectedRecipeId ? { ...r, multiplier: newMultiplier } : r,
        )
      }
      return [...prev, { recipeId: selectedRecipeId, multiplier: newMultiplier }]
    })
    setSelectedMultiplier(String(newMultiplier))
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

    try {
      return {
        id,
        name: trimmedName,
        recipes,
        packaging,
        decor,
        overheads,
        marginPercent: margin,
        ...calculateDerivedCake(recipes, packaging, decor, overheads, margin, recipesById),
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

    const payload = {
      name: trimmedName,
      recipes,
      packaging,
      decor,
      overheads,
      marginPercent: margin,
      image_url: imageUrl ?? undefined,
    }

    if (editingId) {
      state.updateCake(editingId, payload, imageFile ?? undefined)
    } else {
      state.addCake(payload, imageFile ?? undefined)
    }

    resetForm()
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

          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor="cake-recipe-select" className="text-sm text-slate-600">
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

            <div className="space-y-1">
              <label htmlFor="cake-recipe-multiplier" className="text-sm text-slate-600">
                Коэффициент
                <RequiredMark />
              </label>
              <input
                id="cake-recipe-multiplier"
                type="number"
                min="0"
                step="0.01"
                value={selectedMultiplier}
                onChange={(e) => setSelectedMultiplier(normalizeNumberString(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="1"
                data-testid="cake-recipe-multiplier-input"
              />
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

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() => setShowScaling((prev) => !prev)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none"
              data-testid="cake-toggle-scaling-button"
            >
              {showScaling ? '▾ Скрыть пересчет по форме' : '▸ Пересчитать по форме'}
            </button>

            {showScaling && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">Исходная форма</p>
                  <select
                    value={sourceShape}
                    onChange={(e) => setSourceShape(e.target.value as PanShape)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    data-testid="cake-source-shape-select"
                  >
                    <option value="round">Круглая</option>
                    <option value="rectangular">Прямоугольная</option>
                  </select>
                  {sourceShape === 'round' ? (
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={sourceDiameter}
                      onChange={(e) => setSourceDiameter(normalizeNumberString(e.target.value))}
                      placeholder="Диаметр, см"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      data-testid="cake-source-diameter-input"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={sourceLength}
                        onChange={(e) => setSourceLength(normalizeNumberString(e.target.value))}
                        placeholder="Длина, см"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        data-testid="cake-source-length-input"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={sourceWidth}
                        onChange={(e) => setSourceWidth(normalizeNumberString(e.target.value))}
                        placeholder="Ширина, см"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        data-testid="cake-source-width-input"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">Целевая форма</p>
                  <select
                    value={targetShape}
                    onChange={(e) => setTargetShape(e.target.value as PanShape)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    data-testid="cake-target-shape-select"
                  >
                    <option value="round">Круглая</option>
                    <option value="rectangular">Прямоугольная</option>
                  </select>
                  {targetShape === 'round' ? (
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={targetDiameter}
                      onChange={(e) => setTargetDiameter(normalizeNumberString(e.target.value))}
                      placeholder="Диаметр, см"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      data-testid="cake-target-diameter-input"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={targetLength}
                        onChange={(e) => setTargetLength(normalizeNumberString(e.target.value))}
                        placeholder="Длина, см"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        data-testid="cake-target-length-input"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={targetWidth}
                        onChange={(e) => setTargetWidth(normalizeNumberString(e.target.value))}
                        placeholder="Ширина, см"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        data-testid="cake-target-width-input"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                  <span className="text-sm text-slate-700" data-testid="cake-scaling-coefficient">
                    Коэффициент:{' '}
                    <span className="font-semibold text-slate-900">
                      {sourcePan && targetPan ? scalingCoefficient.toFixed(4) : '—'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={applyRecipeScaling}
                    disabled={!sourcePan || !targetPan}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    data-testid="cake-apply-scaling-button"
                  >
                    Применить
                  </button>
                </div>
              </div>
            )}
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

          <button
            type="button"
            onClick={() => setShowShoppingList(true)}
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            data-testid="cake-shopping-list-button"
          >
            Сформировать список покупок
          </button>
        </div>

        <div className="mb-4 card-inset p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Упаковка</h3>

          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor="packaging-name" className="text-sm text-slate-600">
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
              <label htmlFor="packaging-cost" className="text-sm text-slate-600">
                Стоимость, ₽
                <RequiredMark />
              </label>
              <input
                id="packaging-cost"
                type="number"
                min="0"
                step="0.01"
                value={packagingCost}
                onChange={(e) => setPackagingCost(normalizeNumberString(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
                data-testid="packaging-cost-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="packaging-quantity" className="text-sm text-slate-600">
                Количество
                <RequiredMark />
              </label>
              <input
                id="packaging-quantity"
                type="number"
                min="0"
                step="1"
                value={packagingQuantity}
                onChange={(e) => setPackagingQuantity(normalizeNumberString(e.target.value))}
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
                  <button
                    type="button"
                    onClick={() => removePackaging(p.id)}
                    className="text-sm text-rose-600 hover:text-rose-700"
                    data-testid="cake-remove-packaging-button"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 card-inset p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Декор</h3>

          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor="decor-name" className="text-sm text-slate-600">
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
              <label htmlFor="decor-cost" className="text-sm text-slate-600">
                Стоимость, ₽
                <RequiredMark />
              </label>
              <input
                id="decor-cost"
                type="number"
                min="0"
                step="0.01"
                value={decorCost}
                onChange={(e) => setDecorCost(normalizeNumberString(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
                data-testid="decor-cost-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="decor-quantity" className="text-sm text-slate-600">
                Количество
                <RequiredMark />
              </label>
              <input
                id="decor-quantity"
                type="number"
                min="0"
                step="1"
                value={decorQuantity}
                onChange={(e) => setDecorQuantity(normalizeNumberString(e.target.value))}
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
                  <button
                    type="button"
                    onClick={() => removeDecor(d.id)}
                    className="text-sm text-rose-600 hover:text-rose-700"
                    data-testid="cake-remove-decor-button"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 card-inset p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Накладные расходы</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="overheads-hours" className="text-sm text-slate-600">
                Часы работы
                <RequiredMark />
              </label>
              <input
                id="overheads-hours"
                type="number"
                min="0"
                step="0.5"
                value={rawOverheads.workHours}
                onChange={(e) => {
                  const value = normalizeNumberString(e.target.value)
                  setRawOverheads((prev) => ({ ...prev, workHours: value }))
                  setOverheads((prev) => ({ ...prev, workHours: parseNumberInput(value) }))
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="overheads-hours-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="overheads-rate" className="text-sm text-slate-600">
                Ставка за час, ₽
                <RequiredMark />
              </label>
              <input
                id="overheads-rate"
                type="number"
                min="0"
                step="0.01"
                value={rawOverheads.hourlyRate}
                onChange={(e) => {
                  const value = normalizeNumberString(e.target.value)
                  setRawOverheads((prev) => ({ ...prev, hourlyRate: value }))
                  setOverheads((prev) => ({ ...prev, hourlyRate: parseNumberInput(value) }))
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="overheads-rate-input"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="overheads-fixed" className="text-sm text-slate-600">
                Фиксированные расходы, ₽
                <RequiredMark />
              </label>
              <input
                id="overheads-fixed"
                type="number"
                min="0"
                step="0.01"
                value={rawOverheads.fixedCosts}
                onChange={(e) => {
                  const value = normalizeNumberString(e.target.value)
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
            <label htmlFor="cake-margin" className="text-sm font-medium text-slate-600">
              Желаемая наценка, %
              <RequiredMark />
            </label>
            <input
              id="cake-margin"
              type="number"
              min="0"
              step="0.01"
              value={marginPercent}
              onChange={(e) => setMarginPercent(normalizeNumberString(e.target.value))}
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
                recipes={state.recipes}
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
          items={shoppingListItems}
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
): Omit<CakeDetails, 'id' | 'name' | 'recipes' | 'packaging' | 'decor' | 'overheads' | 'marginPercent'> {
  let totalIngredientsCost = 0
  let totalWeightGrams = 0

  for (const item of recipes) {
    const recipe = recipesById[item.recipeId]
    if (!recipe) {
      throw new Error(`Recipe with id "${item.recipeId}" not found`)
    }
    totalIngredientsCost += roundToCurrency(recipe.totalCost * item.multiplier)
    totalWeightGrams += recipe.totalWeight * item.multiplier
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

  const weightKg = totalWeightGrams / 1000
  const finalCostPrice = calculateFinalCostPrice(
    totalIngredientsCost,
    totalPackagingCost,
    totalDecorCost,
    totalOverheadsCost,
  )
  const recommendedPrice = roundToCurrency(finalCostPrice * (1 + marginPercent / 100))

  return {
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

function CakePreview({ cake }: { cake: CakeDetails | null }) {
  if (!cake) return null

  return (
    <div
      className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 sm:p-6 print:hidden"
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
  onPrint,
  recipes,
}: {
  cake: CakeDetails
  onEdit: () => void
  onDelete: () => void
  onPrint: () => void
  recipes: Recipe[]
}) {
  return (
    <div
      className="card-inset overflow-hidden print:bg-white"
      data-testid="cake-row"
      data-cake-id={cake.id}
    >
      {cake.image_url ? (
        <div className="aspect-video w-full bg-slate-100">
          <img
            src={cake.image_url}
            alt={cake.name}
            className="h-full w-full object-cover"
            data-testid="cake-card-image"
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-slate-100" data-testid="cake-card-placeholder">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-12 w-12 text-slate-300"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="7" width="18" height="13" rx="2" ry="2" />
            <circle cx="12" cy="13" r="3" />
            <path d="M8 7h8" />
          </svg>
        </div>
      )}

      <div className="p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <p className="font-medium text-slate-800">{cake.name}</p>
          <p className="text-sm text-slate-500">
            {cake.recipes.length} рецептов | {cake.packaging.length} упак. | {cake.decor.length} декора
          </p>
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
        <Metric label="Вес" value={`${(cake.weightKg * 1000).toFixed(0)} г / ${cake.weightKg.toFixed(3)} кг`} />
        <Metric label="Себестоимость" value={`${formatMoney(cake.finalCostPrice)} ₽`} />
        <Metric label="Цена продажи" value={`${formatMoney(cake.recommendedPrice)} ₽`} />
        <Metric label="Наценка" value={`${cake.marginPercent}%`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
        <Metric label="За 1 кг (себест.)" value={`${formatMoney(cake.costPerKg)} ₽/кг`} />
        <Metric label="За 1 кг (продажа)" value={`${formatMoney(cake.recommendedPricePerKg)} ₽/кг`} />
        <Metric
          label="Состав"
          value={`ингр. ${formatMoney(cake.totalIngredientsCost)} ₽ + упак. ${formatMoney(
            cake.totalPackagingCost,
          )} ₽ + декор ${formatMoney(cake.totalDecorCost)} ₽ + труд ${formatMoney(
            cake.totalOverheadsCost,
          )} ₽`}
        />
      </div>

      <div className="hidden print:block">
        <CakePrintView cake={cake} recipes={recipes} />
      </div>
      </div>
    </div>
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
