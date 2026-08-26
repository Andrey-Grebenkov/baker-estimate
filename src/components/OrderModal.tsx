import { useEffect, useMemo, useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import { formatMoney, roundToCurrency } from '../domain/money'
import type { Order, OrderStatus } from '../domain/types'
import { MAX_DEFAULT_PRICE, MAX_DEFAULT_QUANTITY, normalizeNumberString } from '../lib/numberInput'
import { RequiredMark } from './RequiredMark'

const ORDER_STATUSES: OrderStatus[] = ['Новый', 'В работе', 'Выдан']

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  state: AppState
  orderToEdit?: Order | null
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateForInput(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return getTodayDateString()
  }
}

export function OrderModal({ isOpen, onClose, state, orderToEdit }: OrderModalProps) {
  const isEditing = Boolean(orderToEdit)

  const [cakeId, setCakeId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [status, setStatus] = useState<OrderStatus>('Новый')
  const [deliveryDate, setDeliveryDate] = useState(getTodayDateString)
  const [actualWeight, setActualWeight] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [advancePayment, setAdvancePayment] = useState('')
  const [internalComment, setInternalComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setCakeId(orderToEdit.cake_id ?? '')
        setClientName(orderToEdit.client_name ?? '')
        setClientPhone(orderToEdit.client_phone ?? '')
        setStatus(orderToEdit.status)
        setDeliveryDate(formatDateForInput(orderToEdit.delivery_date))
        setActualWeight(orderToEdit.actual_weight_kg != null ? String(orderToEdit.actual_weight_kg) : '')
        setPaidAmount(String(orderToEdit.paid_amount))
        setAdvancePayment(String(orderToEdit.advance_payment))
        setInternalComment(orderToEdit.internal_comment ?? '')
      } else {
        setCakeId('')
        setClientName('')
        setClientPhone('')
        setStatus('Новый')
        setDeliveryDate(getTodayDateString())
        setActualWeight('')
        setPaidAmount('')
        setAdvancePayment('')
        setInternalComment('')
      }
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen, orderToEdit])

  const selectedCake = useMemo(
    () => state.cakes.find((cake) => cake.id === cakeId) || null,
    [cakeId, state.cakes],
  )

  const actualWeightNum = useMemo(() => {
    const value = actualWeight.trim()
    return value === '' ? 0 : Number(value)
  }, [actualWeight])

  const paidAmountNum = useMemo(() => {
    const value = paidAmount.trim()
    return value === '' ? 0 : Number(value)
  }, [paidAmount])

  const advancePaymentNum = useMemo(() => {
    const value = advancePayment.trim()
    return value === '' ? 0 : Number(value)
  }, [advancePayment])

  const actualCost = useMemo(() => {
    if (!selectedCake || actualWeightNum <= 0) return 0
    if (selectedCake.weightKg <= 0) return 0
    return roundToCurrency((actualWeightNum / selectedCake.weightKg) * selectedCake.finalCostPrice)
  }, [selectedCake, actualWeightNum])

  const remainingBalance = useMemo(
    () => Math.max(0, roundToCurrency(paidAmountNum - advancePaymentNum)),
    [paidAmountNum, advancePaymentNum],
  )

  const netProfit = useMemo(
    () => roundToCurrency(paidAmountNum - actualCost),
    [paidAmountNum, actualCost],
  )

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (paidAmountNum < 0) {
      setError('Сумма оплаты не может быть отрицательной')
      return
    }
    if (advancePaymentNum < 0) {
      setError('Аванс не может быть отрицательным')
      return
    }
    if (advancePaymentNum > paidAmountNum) {
      setError('Аванс не может превышать общую сумму')
      return
    }
    if (!deliveryDate) {
      setError('Укажите дату доставки')
      return
    }

    const actualWeightValue = actualWeight.trim() === '' ? undefined : Number(actualWeight.trim())

    const input = {
      cake_id: selectedCake?.id,
      client_name: clientName.trim() || undefined,
      client_phone: clientPhone.trim() || undefined,
      status,
      delivery_date: new Date(deliveryDate).toISOString(),
      actual_weight_kg: actualWeightValue,
      actual_cost: actualCost,
      paid_amount: paidAmountNum,
      advance_payment: advancePaymentNum,
      internal_comment: internalComment.trim(),
    }

    setSubmitting(true)
    try {
      if (orderToEdit) {
        await state.updateOrder(orderToEdit.id, input)
      } else {
        await state.addOrder(input)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex max-w-[100vw] items-center justify-center overflow-x-hidden bg-black/50 p-4"
      data-testid="order-modal"
    >
      <div className="flex w-full max-w-2xl max-h-[90dvh] flex-col overflow-hidden rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="flex-shrink-0 mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isEditing ? 'Редактировать заказ' : 'Отметить продажу'}
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

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                htmlFor="order-phone"
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Телефон клиента
              </label>
              <input
                id="order-phone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                placeholder="+7 (999) 123-45-67"
                data-testid="order-phone-input"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-cake"
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Торт
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
                htmlFor="order-weight"
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Фактический вес, кг
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

            <div className="min-w-0 max-w-full space-y-1">
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
                className="h-10 min-h-0 w-full min-w-0 max-w-full rounded-lg border border-slate-300 px-3 py-2 leading-tight text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                data-testid="order-date-input"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-status"
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Статус
              </label>
              <select
                id="order-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                data-testid="order-status-select"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="order-paid"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Общая сумма, ₽
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

            <div className="space-y-1">
              <label
                htmlFor="order-advance"
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Аванс, ₽
              </label>
              <input
                id="order-advance"
                type="number"
                min="0"
                max={MAX_DEFAULT_PRICE}
                step="0.01"
                value={advancePayment}
                onChange={(e) => setAdvancePayment(normalizeNumberString(e.target.value, MAX_DEFAULT_PRICE))}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                placeholder="0"
                data-testid="order-advance-input"
              />
            </div>

            <div className="col-span-1 space-y-1 sm:col-span-2">
              <label
                htmlFor="order-internal-comment"
                className="text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Внутренняя заметка
              </label>
              <textarea
                id="order-internal-comment"
                rows={3}
                value={internalComment}
                onChange={(e) => setInternalComment(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                placeholder="Внутренние примечания по заказу (не видны клиенту)"
                data-testid="order-internal-comment-input"
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Общая сумма</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {formatMoney(paidAmountNum)} ₽
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Аванс</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {formatMoney(advancePaymentNum)} ₽
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Остаток к оплате</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {formatMoney(remainingBalance)} ₽
                </p>
              </div>
              <div className="sm:col-span-2">
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
          </div>

          <div className="flex flex-shrink-0 justify-end gap-3 border-t border-slate-200 pt-4 pb-2 dark:border-slate-700/50">
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
              {submitting ? 'Сохранение…' : isEditing ? 'Сохранить изменения' : 'Сохранить заказ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
