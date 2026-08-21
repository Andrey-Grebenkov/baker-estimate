import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { CakeDetails } from '../domain/cake'
import type { Recipe } from '../domain/types'
import { formatMoney } from '../domain/money'

interface ClientReceiptModalProps {
  cake: CakeDetails
  recipes: Recipe[]
  isOpen: boolean
  onClose: () => void
}

export function ClientReceiptModal({ cake, recipes, isOpen, onClose }: ClientReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [showPhoto, setShowPhoto] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const recipesById: Record<string, Recipe> = Object.fromEntries(recipes.map((r) => [r.id, r]))

  const recipeNames = cake.recipes
    .map((cr) => recipesById[cr.recipeId]?.name)
    .filter(Boolean) as string[]

  const packagingNames = cake.packaging.map((p) => p.name)
  const decorNames = cake.decor.map((d) => d.name)

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
      link.download = `chek-${cake.name.toLowerCase().replace(/\s+/g, '-')}.png`
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Чек для клиента</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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

        <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
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
          className="overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 via-indigo-50 to-sky-50 p-8 shadow-sm ring-1 ring-slate-100"
          data-testid="client-receipt-node"
        >
          <div className="text-center">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-slate-400">
              Смета на торт
            </p>
            <h3 className="font-serif text-2xl font-bold text-slate-900">{cake.name}</h3>

            {showPhoto && cake.image_url && (
              <div className="mt-4 flex justify-center">
                <img
                  src={cake.image_url}
                  alt={cake.name}
                  className="h-40 w-40 rounded-full object-cover shadow-md ring-4 ring-white"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/70 p-3 backdrop-blur-sm">
                <p className="text-xs text-slate-500">Вес</p>
                <p className="text-lg font-semibold text-slate-800">
                  {(cake.weightKg * 1000).toFixed(0)} г
                </p>
              </div>
              <div className="rounded-xl bg-white/70 p-3 backdrop-blur-sm">
                <p className="text-xs text-slate-500">Цена</p>
                <p className="text-lg font-semibold text-indigo-700">
                  {formatMoney(cake.recommendedPrice)} ₽
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {recipeNames.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Рецепты
                </p>
                <ul className="flex flex-wrap gap-2">
                  {recipeNames.map((name, idx) => (
                    <li
                      key={idx}
                      className="rounded-full bg-white/80 px-3 py-1 text-sm text-slate-700 shadow-sm"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {packagingNames.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Упаковка
                </p>
                <ul className="flex flex-wrap gap-2">
                  {packagingNames.map((name, idx) => (
                    <li
                      key={idx}
                      className="rounded-full bg-white/80 px-3 py-1 text-sm text-slate-700 shadow-sm"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {decorNames.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Декор
                </p>
                <ul className="flex flex-wrap gap-2">
                  {decorNames.map((name, idx) => (
                    <li
                      key={idx}
                      className="rounded-full bg-white/80 px-3 py-1 text-sm text-slate-700 shadow-sm"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="font-serif text-sm text-slate-400">Спасибо за заказ!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
