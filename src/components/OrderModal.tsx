interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="order-modal"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Отметить продажу</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Закрыть"
            data-testid="order-modal-close"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-500">
          Здесь будет форма для создания заказа. Пока оставлено пустым.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            data-testid="order-modal-cancel"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
