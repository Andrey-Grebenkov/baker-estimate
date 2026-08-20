import { useEffect, useMemo, useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import { formatMoney, roundToCurrency } from '../domain/money'
import { MAX_DEFAULT_PRICE, MAX_DEFAULT_QUANTITY, normalizeNumberString } from '../lib/numberInput'
import { RequiredMark } from './RequiredMark'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  state: AppState
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function OrderModal({ isOpen, onClose, state }: OrderModalProps) {
  const [cakeId, setCakeId] = useState('')
  const [clientName, setClientName] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(getTodayDateString)
  const [actualWeight, setActualWeight] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCakeId('')
      setClientName('')
      setDeliveryDate(getTodayDateString())
      setActualWeight('')
      setPaidAmount('')
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen])

  const selectedCake = useMemo(
    () => state.cakes.find((cake) => cake.id === cakeId) || null,
    [cakeId, state.cakes],
  )

  const actualWeightNum = useMemo(() => {
    const value = actualWeight.trim()
    return value === '' ? 0 : Number(value)
  }, [actualWeight])

  const actualCost = useMemo(() => {
    if (!selectedCake || actualWeightNum <= 0) return 0
    if (selectedCake.weightKg <= 0) return 0
    return roundToCurrency((actualWeightNum / selectedCake.weightKg) * selectedCake.finalCostPrice)
  }, [selectedCake, actualWeightNum])

  const paidAmountNum = useMemo(() => {
    const value = paidAmount.trim()
    return value === '' ? 0 : Number(value)
  }, [paidAmount])

  const netProfit = useMemo(
    () => roundToCurrency(paidAmountNum - actualCost),
    [paidAmountNum, actualCost],
  )

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedCake) {
      setError('Выберите торт')
      return
    }
    if (actualWeightNum <= 0) {
      setError('Укажите фактический вес больше 0')
      return
    }
    if (paidAmountNum < 0) {
      setError('Сумма оплаты не может быть отрицательной')
      return
    }
    if (!deliveryDate) {
      setError('Укажите дату доставки')
      return
    }

    setSubmitting(true)
    try {
      await state.addOrder({
        cake_id: selectedCake.id,
        client_name: clientName.trim(),
        delivery_date: new Date(deliveryDate).toISOString(),
        actual_weight_kg: actualWeightNum,
        actual_cost: actualCost,
        paid_amount: paidAmountNum,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="order-modal"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Отметить продажу
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Закрыть"
            data-testid="order-modal-close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="order-cake"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Торт
                <RequiredMark />
              </label>
              <select
                id="order-cake"
                value={cakeId}
                onChange={(e) => setCakeId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                data-testid="order-cake-select"
              >
                <option value="">Выберите торт</option>
                {state.cakes.map((cake) => (
                  <option key={cake.id} value={cake.id}>
                    {cake.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-client"
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Имя клиента
              </label>
              <input
                id="order-client"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                placeholder="Например, Анна"
                data-testid="order-client-input"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-date"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Дата доставки
                <RequiredMark />
              </label>
              <input
                id="order-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                data-testid="order-date-input"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-weight"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Фактический вес, кг
                <RequiredMark />
              </label>
              <input
                id="order-weight"
                type="number"
                min="0"
                max={MAX_DEFAULT_QUANTITY}
                step="0.01"
                value={actualWeight}
                onChange={(e) => setActualWeight(normalizeNumberString(e.target.value, MAX_DEFAULT_QUANTITY))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                placeholder="0"
                data-testid="order-weight-input"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-paid"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Оплачено, ₽
                <RequiredMark />
              </label>
              <input
                id="order-paid"
                type="number"
                min="0"
                max={MAX_DEFAULT_PRICE}
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(normalizeNumberString(e.target.value, MAX_DEFAULT_PRICE))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                placeholder="0"
                data-testid="order-paid-input"
              />
            </div>
          </div>

          {selectedCake && actualWeightNum > 0 && (
            <div
              className="grid gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4 sm:grid-cols-2 dark:border-slate-600 dark:bg-slate-700/50"
              data-testid="order-calculation-preview"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Фактическая себестоимость</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {formatMoney(actualCost)} ₽
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Чистая прибыль</p>
                <p
                  className={`text-lg font-semibold ${
                    netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatMoney(netProfit)} ₽
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-rose-600" data-testid="order-modal-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              data-testid="order-modal-cancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="order-modal-submit"
            >
              {submitting ? 'Сохранение…' : 'Сохранить продажу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
