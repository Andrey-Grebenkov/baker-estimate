import { useEffect, useMemo, useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import type { Order, OrderInput } from '../domain/types'

interface EditCommentModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order
  state: AppState
}

function toOrderInput(order: Order, comment: string): OrderInput {
  return {
    cake_id: order.cake_id,
    client_name: order.client_name,
    client_phone: order.client_phone,
    status: order.status,
    delivery_date: order.delivery_date,
    actual_weight_kg: order.actual_weight_kg,
    actual_cost: order.actual_cost,
    total_cost: order.total_cost,
    paid_amount: order.paid_amount,
    advance_payment: order.advance_payment,
    completion_comment: comment,
    unit: order.unit,
  }
}

export function EditCommentModal({ isOpen, onClose, order, state }: EditCommentModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentOrder = useMemo(
    () => state.orders.find((o) => o.id === order.id) ?? order,
    [state.orders, order],
  )

  useEffect(() => {
    if (isOpen) {
      setIsEditing(false)
      setError(null)
    }
  }, [isOpen])

  const handleEdit = () => {
    setDraft(currentOrder.completion_comment ?? '')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await state.updateOrder(currentOrder.id, toOrderInput(currentOrder, draft.trim()))
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="edit-comment-modal"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Комментарий к заказу
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Закрыть"
            data-testid="edit-comment-modal-close"
          >
            ✕
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Введите комментарий..."
              data-testid="edit-comment-textarea"
            />
            {error && (
              <p className="text-sm text-rose-600" data-testid="edit-comment-modal-error">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                data-testid="edit-comment-cancel"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="edit-comment-save"
              >
                {isSaving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-200"
              data-testid="edit-comment-view"
            >
              {currentOrder.completion_comment?.trim() || 'Комментарий отсутствует'}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                data-testid="edit-comment-edit"
              >
                Изменить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
