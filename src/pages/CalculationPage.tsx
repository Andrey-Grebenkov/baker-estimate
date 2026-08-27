import { useEffect, useMemo, useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import type { Ingredient, MeasurementUnit, Recipe } from '../domain/types'
import {
  MAX_DEFAULT_DIMENSION,
  MAX_DEFAULT_QUANTITY,
  normalizeNumberString,
  parseNumberInput,
} from '../lib/numberInput'
import { calculateScalingCoefficient, roundToDecimal, type Pan, type PanShape } from '../domain/recipeScaling'
import { scaleIngredientQuantity } from '../domain/recipeScaling'
import { unitLabelFor } from '../domain/shoppingList'
import { RequiredMark } from '../components/RequiredMark'

function buildPan(shape: PanShape, diameter: string, length: string, width: string): Pan | null {
  if (shape === 'round') {
    const d = parseNumberInput(diameter)
    return d > 0 ? { shape: 'round', diameter: d } : null
  }
  const l = parseNumberInput(length)
  const w = parseNumberInput(width)
  return l > 0 && w > 0 ? { shape: 'rectangular', length: l, width: w } : null
}

function unitDisplay(quantity: number, unit: MeasurementUnit): string {
  const rounded = unit === 'pcs' ? Math.round(quantity) : Number(quantity.toFixed(1))
  return `${rounded} ${unitLabelFor(unit)}`
}

function formatScaleCoefficient(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return String(Number(value.toFixed(3)))
}

export function CalculationPage({ state }: { state: AppState }) {
  const [selectedCakeId, setSelectedCakeId] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [multiplier, setMultiplier] = useState(1)

  const [showPanCalc, setShowPanCalc] = useState(false)
  const [sourceShape, setSourceShape] = useState<PanShape>('round')
  const [sourceDiameter, setSourceDiameter] = useState('16')
  const [sourceLength, setSourceLength] = useState('')
  const [sourceWidth, setSourceWidth] = useState('')
  const [targetShape, setTargetShape] = useState<PanShape>('round')
  const [targetDiameter, setTargetDiameter] = useState('20')
  const [targetLength, setTargetLength] = useState('')
  const [targetWidth, setTargetWidth] = useState('')

  const selectedCake = state.cakes.find((c) => c.id === selectedCakeId)
  const baseYield = selectedCake?.base_yield_weight ?? selectedCake?.weightKg ?? 1
  const baseUnit = selectedCake?.base_yield_unit ?? 'кг'

  const recipesById = useMemo(
    () => Object.fromEntries(state.recipes.map((r) => [r.id, r])) as Record<string, Recipe>,
    [state.recipes],
  )
  const ingredientsById = useMemo(
    () => Object.fromEntries(state.ingredients.map((i) => [i.id, i])) as Record<string, Ingredient>,
    [state.ingredients],
  )

  useEffect(() => {
    if (selectedCake) {
      const base = selectedCake.base_yield_weight ?? selectedCake.weightKg
      setTargetWeight(base > 0 ? String(base) : '1')
      setMultiplier(1)
    } else {
      setTargetWeight('')
      setMultiplier(1)
    }
  }, [selectedCake?.id])

  useEffect(() => {
    if (!selectedCake) return
    const target = Number(targetWeight) || 0
    const base = baseYield
    setMultiplier(base > 0 ? target / base : 1)
  }, [targetWeight, baseYield, selectedCake])

  const sourcePan = buildPan(sourceShape, sourceDiameter, sourceLength, sourceWidth)
  const targetPan = buildPan(targetShape, targetDiameter, targetLength, targetWidth)
  const scalingCoefficient =
    sourcePan && targetPan ? roundToDecimal(calculateScalingCoefficient(sourcePan, targetPan), 4) : 0

  const applyPanScaling = () => {
    if (!sourcePan || !targetPan || scalingCoefficient <= 0 || !selectedCake) return
    const newTarget = roundToDecimal(baseYield * scalingCoefficient, 4)
    setTargetWeight(String(newTarget))
  }

  const scaledRecipes = useMemo(() => {
    if (!selectedCake) return []

    return selectedCake.recipes
      .map((cr) => {
        const recipe = recipesById[cr.recipeId]
        if (!recipe) return null

        const recipeMultiplier = cr.multiplier * multiplier
        const ingredients = recipe.ingredients
          .map((ri) => {
            const ingredient = ingredientsById[ri.ingredientId]
            if (!ingredient) return null
            return {
              ingredient,
              required: scaleIngredientQuantity(ri.quantityUsed, recipeMultiplier),
            }
          })
          .filter((item): item is { ingredient: Ingredient; required: number } => item !== null)

        return { recipe, ingredients }
      })
      .filter((item): item is { recipe: Recipe; ingredients: { ingredient: Ingredient; required: number }[] } => item !== null)
  }, [selectedCake, multiplier, recipesById, ingredientsById])

  return (
    <div data-testid="calculation-page">
      <h2 className="mb-4 text-xl font-semibold text-slate-800" data-testid="calculation-title">
        Расчет
      </h2>

      <div className="mb-4 card-inset p-4" data-testid="calculation-cake-select-section">
        <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Торт</h3>

        <div className="space-y-1">
          <label htmlFor="calc-cake-select" className="inline-flex items-center gap-1 text-sm text-slate-600">
            Выберите торт
            <RequiredMark />
          </label>
          <select
            id="calc-cake-select"
            value={selectedCakeId}
            onChange={(e) => setSelectedCakeId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            data-testid="calc-cake-select"
          >
            <option value="">Выберите торт</option>
            {state.cakes.map((cake) => (
              <option key={cake.id} value={cake.id}>
                {cake.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCake && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="calc-cake-reference-yield">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Базовый выход</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {selectedCake.base_yield_weight ?? selectedCake.weightKg} {selectedCake.base_yield_unit ?? 'кг'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Рецептов в торте</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{selectedCake.recipes.length}</p>
            </div>
          </div>
        )}
      </div>

      {selectedCake && (
        <>
          <div className="mb-4 card-inset p-4" data-testid="calculation-target-section">
            <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Нужный выход</h3>

            <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor="calc-target-weight" className="inline-flex items-center gap-1 text-sm text-slate-600">
                  Нужный вес / кол-во
                  <RequiredMark />
                </label>
                <div className="flex gap-2">
                  <input
                    id="calc-target-weight"
                    type="number"
                    min="0"
                    max={MAX_DEFAULT_QUANTITY}
                    step="0.01"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(normalizeNumberString(e.target.value, MAX_DEFAULT_QUANTITY))}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="1"
                    data-testid="calc-target-weight-input"
                  />
                  <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {baseUnit}
                  </span>
                </div>
              </div>

              <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 dark:bg-slate-700/50">
                <span className="text-xs text-slate-500 dark:text-slate-400">Коэффициент масштаба</span>
                <span className="font-medium text-slate-800 dark:text-slate-200" data-testid="calc-multiplier-value">
                  {formatScaleCoefficient(multiplier)}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 dark:bg-slate-700/50">
              <button
                type="button"
                onClick={() => setShowPanCalc((prev) => !prev)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none"
                data-testid="calc-toggle-pan-calc"
              >
                {showPanCalc ? '▾ Скрыть пересчет по форме' : '▸ Пересчитать по форме'}
              </button>

              {showPanCalc && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Исходная форма</p>
                    <select
                      value={sourceShape}
                      onChange={(e) => setSourceShape(e.target.value as PanShape)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      data-testid="calc-source-shape-select"
                    >
                      <option value="round">Круглая</option>
                      <option value="rectangular">Прямоугольная</option>
                    </select>
                    {sourceShape === 'round' ? (
                      <input
                        type="number"
                        min="0"
                        max={MAX_DEFAULT_DIMENSION}
                        step="0.1"
                        value={sourceDiameter}
                        onChange={(e) => setSourceDiameter(normalizeNumberString(e.target.value, MAX_DEFAULT_DIMENSION))}
                        placeholder="Диаметр, см"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        data-testid="calc-source-diameter-input"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          max={MAX_DEFAULT_DIMENSION}
                          step="0.1"
                          value={sourceLength}
                          onChange={(e) => setSourceLength(normalizeNumberString(e.target.value, MAX_DEFAULT_DIMENSION))}
                          placeholder="Длина, см"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          data-testid="calc-source-length-input"
                        />
                        <input
                          type="number"
                          min="0"
                          max={MAX_DEFAULT_DIMENSION}
                          step="0.1"
                          value={sourceWidth}
                          onChange={(e) => setSourceWidth(normalizeNumberString(e.target.value, MAX_DEFAULT_DIMENSION))}
                          placeholder="Ширина, см"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          data-testid="calc-source-width-input"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Целевая форма</p>
                    <select
                      value={targetShape}
                      onChange={(e) => setTargetShape(e.target.value as PanShape)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      data-testid="calc-target-shape-select"
                    >
                      <option value="round">Круглая</option>
                      <option value="rectangular">Прямоугольная</option>
                    </select>
                    {targetShape === 'round' ? (
                      <input
                        type="number"
                        min="0"
                        max={MAX_DEFAULT_DIMENSION}
                        step="0.1"
                        value={targetDiameter}
                        onChange={(e) => setTargetDiameter(normalizeNumberString(e.target.value, MAX_DEFAULT_DIMENSION))}
                        placeholder="Диаметр, см"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        data-testid="calc-target-diameter-input"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          max={MAX_DEFAULT_DIMENSION}
                          step="0.1"
                          value={targetLength}
                          onChange={(e) => setTargetLength(normalizeNumberString(e.target.value, MAX_DEFAULT_DIMENSION))}
                          placeholder="Длина, см"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          data-testid="calc-target-length-input"
                        />
                        <input
                          type="number"
                          min="0"
                          max={MAX_DEFAULT_DIMENSION}
                          step="0.1"
                          value={targetWidth}
                          onChange={(e) => setTargetWidth(normalizeNumberString(e.target.value, MAX_DEFAULT_DIMENSION))}
                          placeholder="Ширина, см"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          data-testid="calc-target-width-input"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                    <span className="text-sm text-slate-700 dark:text-slate-200" data-testid="calc-scaling-coefficient">
                      Коэффициент:{' '}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {sourcePan && targetPan ? scalingCoefficient.toFixed(4) : '—'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={applyPanScaling}
                      disabled={!sourcePan || !targetPan}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      data-testid="calc-apply-pan-scaling"
                    >
                      Применить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 card-inset p-4" data-testid="calculation-ingredients-section">
            <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Ингредиенты ({baseUnit === 'шт' ? 'на' : 'на'} {targetWeight} {baseUnit})
            </h3>

            {scaledRecipes.length === 0 ? (
              <p className="text-sm text-slate-500" data-testid="calc-empty-ingredients">
                Нет доступных рецептов для расчета.
              </p>
            ) : (
              <div className="space-y-4" data-testid="calc-ingredients-list">
                {scaledRecipes.map(({ recipe, ingredients }) => (
                  <div
                    key={recipe.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 dark:bg-slate-700/50"
                    data-testid="calc-recipe-group"
                  >
                    <h4 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">{recipe.name}</h4>
                    {ingredients.length === 0 ? (
                      <p className="text-sm text-slate-500">Нет ингредиентов</p>
                    ) : (
                      <ul className="space-y-1">
                        {ingredients.map(({ ingredient, required }) => (
                          <li
                            key={ingredient.id}
                            className="flex justify-between text-sm text-slate-700 dark:text-slate-300"
                            data-testid="calc-ingredient-row"
                          >
                            <span>{ingredient.name}</span>
                            <span className="font-medium">{unitDisplay(required, ingredient.unit)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!selectedCake && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:bg-slate-700/50" data-testid="calc-empty-state">
          <p className="text-slate-600 dark:text-slate-300">Выберите торт, чтобы рассчитать ингредиенты.</p>
        </div>
      )}
    </div>
  )
}
