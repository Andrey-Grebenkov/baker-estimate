import { useEffect, useState } from 'react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export function FeedbackModal({ isOpen, onClose, email }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMessage('')
      setToast(null)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) {
      setToast({ type: 'error', message: 'Введите сообщение' })
      return
    }

    setIsLoading(true)
    setToast(null)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message: trimmed }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить сообщение')
      }
      setToast({ type: 'success', message: 'Сообщение отправлено. Спасибо!' })
      setMessage('')
      setTimeout(() => {
        setToast(null)
        onClose()
      }, 1500)
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Ошибка отправки',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="feedback-modal"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Обратная связь
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Закрыть"
            data-testid="feedback-modal-close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="feedback-message"
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Ваше сообщение
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Опишите проблему или предложение..."
              data-testid="feedback-message-input"
            />
          </div>

          {toast && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                toast.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
              data-testid="feedback-toast"
            >
              {toast.message}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              data-testid="feedback-cancel-button"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="feedback-submit-button"
            >
              {isLoading ? 'Отправка…' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
