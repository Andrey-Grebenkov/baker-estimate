import type { Order } from '../domain/types'

interface ViewInternalCommentModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order
}

export function ViewInternalCommentModal({ isOpen, onClose, order }: ViewInternalCommentModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="view-internal-comment-modal"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Внутренняя заметка
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Закрыть"
            data-testid="view-internal-comment-modal-close"
          >
            ✕
          </button>
        </div>

        <div
          className="mb-6 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-200"
          data-testid="view-internal-comment-text"
        >
          {order.internal_comment?.trim() || 'Заметка отсутствует'}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            data-testid="view-internal-comment-close"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
