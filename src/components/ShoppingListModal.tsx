import { useMemo, useState } from 'react'
import { formatShoppingList, type ShoppingListItem } from '../domain/shoppingList'

interface ShoppingListModalProps {
  items: ShoppingListItem[]
  cakeName: string
  onClose: () => void
}

function unitLabel(unit: string): string {
  if (unit === 'g') return 'г'
  if (unit === 'ml') return 'мл'
  return 'шт.'
}

export function ShoppingListModal({ items, cakeName, onClose }: ShoppingListModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const totalCost = useMemo(
    () => items.reduce((sum, item) => sum + item.estimatedCost, 0),
    [items],
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
    const text = formatShoppingList(items)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
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
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {items.map((item) => (
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
                    {item.totalQuantity} {unitLabel(item.unit)} · {item.estimatedCost.toFixed(2)} ₽
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
          <span className="font-semibold">Итого: {totalCost.toFixed(2)} ₽</span>
          <span>Отмечено: {checked.size} из {items.length}</span>
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
