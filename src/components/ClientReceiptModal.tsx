import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { CakeDetails } from '../domain/cake'
import type { Order, Recipe } from '../domain/types'
import { formatMoney } from '../domain/money'

interface ClientReceiptModalProps {
  order: Order
  cake?: CakeDetails
  recipes: Recipe[]
  isOpen: boolean
  onClose: () => void
}

function formatDeliveryDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

function formatKg(weightKg: number | undefined): string {
  if (weightKg == null) return '—'
  const trimmed = Number(weightKg).toString()
  return `${trimmed} кг`
}

const receiptTheme = {
  bg: '#ffffff',
  blockBg: '#f8fafc',
  itemBg: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#f1f5f9',
}

export function ClientReceiptModal({ order, cake, recipes, isOpen, onClose }: ClientReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [showPhoto, setShowPhoto] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const recipesById: Record<string, Recipe> = Object.fromEntries(recipes.map((r) => [r.id, r]))

  const recipeItems = cake
    ? cake.recipes
        .map((cr) => {
          const recipe = recipesById[cr.recipeId]
          if (!recipe) return null
          return { name: recipe.name, multiplier: cr.multiplier }
        })
        .filter((item): item is { name: string; multiplier: number } => item !== null)
    : []

  const packagingItems = cake ? cake.packaging : []
  const decorItems = cake ? cake.decor : []

  const handleDownload = async () => {
    if (!receiptRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `chek-${(cake?.name ?? 'zakaz').toLowerCase().replace(/\s+/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to export receipt:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      data-testid="client-receipt-modal-overlay"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-50 p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Чек для клиента
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-900 hover:bg-slate-100 dark:text-white"
            data-testid="client-receipt-close-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900 dark:text-white">
            <input
              type="checkbox"
              checked={showPhoto}
              onChange={(e) => setShowPhoto(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              data-testid="client-receipt-show-photo-toggle"
            />
            Показывать фото торта
          </label>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            data-testid="client-receipt-download-button"
          >
            {isExporting ? 'Сохранение…' : 'Скачать картинку'}
          </button>
        </div>

        <div
          ref={receiptRef}
          className="overflow-hidden rounded-2xl p-8 shadow-lg border"
          style={{
            backgroundColor: receiptTheme.bg,
            borderColor: receiptTheme.border,
            color: receiptTheme.text,
          }}
          data-testid="client-receipt-node"
        >
          <div className="mb-6 text-center">
            <p
              className="mb-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: receiptTheme.muted }}
            >
              Чек на заказ
            </p>
            <h3 className="font-serif text-2xl font-bold" style={{ color: receiptTheme.text }}>
              {cake?.name ?? 'Заказ'}
            </h3>
            <p className="mt-1 text-sm font-medium" style={{ color: receiptTheme.text }}>
              {formatDeliveryDate(order.delivery_date)}
            </p>

            {showPhoto && cake?.image_url && (
              <div className="mt-4 flex justify-center">
                <img
                  src={cake.image_url}
                  alt={cake.name}
                  className="h-40 w-40 rounded-2xl object-cover shadow-md border-4"
                  style={{ borderColor: receiptTheme.border }}
                  crossOrigin="anonymous"
                />
              </div>
            )}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div
              className="rounded-xl p-4 text-center shadow-sm border"
              style={{ backgroundColor: receiptTheme.blockBg, borderColor: receiptTheme.border }}
            >
              <p
                className="mb-1 text-xs font-semibold uppercase tracking-wider"
                style={{ color: receiptTheme.muted }}
              >
                Вес
              </p>
              <p className="text-xl font-semibold" style={{ color: receiptTheme.text }}>
                {formatKg(order.actual_weight_kg)}
              </p>
            </div>
            <div
              className="rounded-xl p-4 text-center shadow-sm border"
              style={{ backgroundColor: receiptTheme.blockBg, borderColor: receiptTheme.border }}
            >
              <p
                className="mb-1 text-xs font-semibold uppercase tracking-wider"
                style={{ color: receiptTheme.muted }}
              >
                Оплачено
              </p>
              <p className="text-xl font-semibold" style={{ color: receiptTheme.text }}>
                {formatMoney(order.paid_amount)} ₽
              </p>
            </div>
          </div>

          {cake && (
            <div
              className="rounded-xl p-5 shadow-sm border"
              style={{ backgroundColor: receiptTheme.blockBg, borderColor: receiptTheme.border }}
            >
              <p
                className="mb-3 text-center text-xs font-semibold uppercase tracking-widest"
                style={{ color: receiptTheme.muted }}
              >
                Состав
              </p>

              {recipeItems.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {recipeItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm shadow-sm"
                      style={{ backgroundColor: receiptTheme.itemBg, color: receiptTheme.text }}
                    >
                      <span>{item.name}</span>
                      {item.multiplier !== 1 && (
                        <span style={{ color: receiptTheme.muted }}>× {item.multiplier}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {packagingItems.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold" style={{ color: receiptTheme.muted }}>
                    Упаковка
                  </p>
                  <ul className="space-y-2">
                    {packagingItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg px-3 py-2 text-sm shadow-sm"
                        style={{ backgroundColor: receiptTheme.itemBg, color: receiptTheme.text }}
                      >
                        {item.name}
                        {item.quantity !== 1 && (
                          <span className="ml-1" style={{ color: receiptTheme.muted }}>
                            × {item.quantity}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {decorItems.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold" style={{ color: receiptTheme.muted }}>
                    Декор
                  </p>
                  <ul className="space-y-2">
                    {decorItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg px-3 py-2 text-sm shadow-sm"
                        style={{ backgroundColor: receiptTheme.itemBg, color: receiptTheme.text }}
                      >
                        {item.name}
                        {item.quantity !== 1 && (
                          <span className="ml-1" style={{ color: receiptTheme.muted }}>
                            × {item.quantity}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!cake && (
            <p
              className="rounded-xl p-4 text-center text-sm shadow-sm border"
              style={{
                backgroundColor: receiptTheme.blockBg,
                borderColor: receiptTheme.border,
                color: receiptTheme.text,
              }}
            >
              Торт, указанный в заказе, был удалён. Состав недоступен.
            </p>
          )}

          <div className="mt-6 text-center">
            <p className="font-serif text-sm font-medium" style={{ color: receiptTheme.muted }}>
              Спасибо за заказ!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
