import { useEffect, useMemo, useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import { formatMoney, roundToCurrency } from '../domain/money'
import type { Order, OrderInput } from '../domain/types'
import { MAX_DEFAULT_PRICE, normalizeNumberString, parseNumberInput } from '../lib/numberInput'

interface CompleteOrderModalProps {
  order: Order
  state: AppState
  isOpen: boolean
  onClose: () => void
}

export function CompleteOrderModal({ order, state, isOpen, onClose }: CompleteOrderModalProps) {
  const remaining = useMemo(
    () => roundToCurrency(Math.max(0, order.paid_amount - order.advance_payment)),
    [order.paid_amount, order.advance_payment],
  )

  const [finalPayment, setFinalPayment] = useState(String(remaining))
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFinalPayment(String(remaining))
      setComment('')
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen, remaining])

  const finalPaymentNum = useMemo(
    () => roundToCurrency(parseNumberInput(finalPayment)),
    [finalPayment],
  )

  const isOverpaid = finalPaymentNum > remaining
  const isUnderpaid = finalPaymentNum < remaining
  const hasPaymentDifference = isOverpaid || isUnderpaid

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (finalPaymentNum < 0) {
      setError('Сумма доплаты не может быть отрицательной')
      return
    }

    const totalReceived = roundToCurrency(order.advance_payment + finalPaymentNum)
    const newPaidAmount = totalReceived
    const newComment = hasPaymentDifference ? comment.trim() || undefined : undefined

    const input: OrderInput = {
      cake_id: order.cake_id,
      client_name: order.client_name,
      client_phone: order.client_phone,
      status: 'Выдан',
      delivery_date: order.delivery_date,
      actual_weight_kg: order.actual_weight_kg,
      actual_cost: order.actual_cost,
      paid_amount: newPaidAmount,
      advance_payment: order.advance_payment,
      completion_comment: newComment,
    }

    setSubmitting(true)
    try {
      await state.updateOrder(order.id, input)
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
      data-testid="complete-order-modal"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Завершить заказ
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Закрыть"
            data-testid="complete-order-modal-close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Общая сумма</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {formatMoney(order.paid_amount)} ₽
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Остаток к оплате</p>
              <p className="text-lg font-semibold text-amber-600">{formatMoney(remaining)} ₽</p>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="complete-order-final-payment"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Сумма доплаты, ₽
            </label>
            <input
              id="complete-order-final-payment"
              type="number"
              min="0"
              max={MAX_DEFAULT_PRICE}
              step="0.01"
              value={finalPayment}
              onChange={(e) =>
                setFinalPayment(normalizeNumberString(e.target.value, MAX_DEFAULT_PRICE))
              }
              className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              placeholder="0"
              data-testid="complete-order-final-payment-input"
            />
          </div>

          {hasPaymentDifference && (
            <div className="space-y-1">
              <label
                htmlFor="complete-order-comment"
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                {isOverpaid
                  ? 'Комментарий к переплате (например, доставка, чаевые)'
                  : 'Комментарий к скидке/недоплате (например, компенсация)'}
              </label>
              <textarea
                id="complete-order-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                placeholder="Укажите причину"
                data-testid="complete-order-comment-input"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-rose-600" data-testid="complete-order-modal-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              data-testid="complete-order-modal-cancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="complete-order-modal-submit"
            >
              {submitting ? 'Сохранение…' : 'Завершить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
