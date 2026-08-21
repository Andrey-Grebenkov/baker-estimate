import { useMemo, useState } from 'react'
import { formatShoppingList, type ShoppingListResult } from '../domain/shoppingList'
import type { ShoppingListItem } from '../domain/shoppingList'

interface ShoppingListModalProps {
  result: ShoppingListResult
  cakeName: string
  onClose: () => void
}

function unitLabel(unit: string): string {
  if (unit === 'g') return 'г'
  if (unit === 'ml') return 'мл'
  return 'шт.'
}

export function ShoppingListModal({ result, cakeName, onClose }: ShoppingListModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const totalCost = useMemo(
    () => result.toBuy.reduce((sum, item) => sum + item.purchasePrice, 0),
    [result.toBuy],
  )

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopy = async () => {
    const text = formatShoppingList(result.toBuy)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (!result.hasIngredients) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        data-testid="shopping-list-modal-empty"
      >
        <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-lg dark:bg-slate-800 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
            Список покупок
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            В текущем торте нет ингредиентов. Добавьте рецепты, чтобы сформировать список.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderToBuyItem = (item: ShoppingListItem) => (
    <li
      key={item.ingredientId}
      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
    >
      <input
        id={`shop-${item.ingredientId}`}
        type="checkbox"
        checked={checked.has(item.ingredientId)}
        onChange={() => toggleItem(item.ingredientId)}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
        data-testid="shopping-list-checkbox"
      />
      <label
        htmlFor={`shop-${item.ingredientId}`}
        className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {item.name}
        </span>
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {item.packagesToBuy} упак. ({item.purchaseQuantity} {unitLabel(item.unit)}) · {item.purchasePrice.toFixed(2)} ₽
          {item.inStock > 0 && (
            <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
              (нужно {item.required}, есть {item.inStock})
            </span>
          )}
        </span>
      </label>
    </li>
  )

  const renderInStockItem = (item: ShoppingListItem) => (
    <li
      key={item.ingredientId}
      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
    >
      <div className="h-4 w-4" />
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {item.name}
        </span>
        <span className="text-sm text-slate-600 dark:text-slate-300">
          нужно {item.required} {unitLabel(item.unit)} · в наличии {item.inStock} {unitLabel(item.unit)}
        </span>
      </div>
    </li>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      data-testid="shopping-list-modal"
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-lg dark:bg-slate-800 sm:p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-800 dark:text-white">
          Список покупок
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{cakeName}</p>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
          {result.toBuy.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-600 dark:text-slate-300">
              Все ингредиенты уже есть на складе.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {result.toBuy.map((item) => renderToBuyItem(item))}
            </ul>
          )}
        </div>

        {result.inStock.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              В наличии
            </h3>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {result.inStock.map((item) => renderInStockItem(item))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
          <span className="font-semibold">Итого: {totalCost.toFixed(2)} ₽</span>
          <span>
            Отмечено: {checked.size} из {result.toBuy.length}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            data-testid="shopping-list-copy"
          >
            {copied ? 'Скопировано!' : 'Скопировать в буфер'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-testid="shopping-list-close"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
