import { useEffect, useState } from 'react'
import { LegalDocModal, useLegalModal } from './LegalModals'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

type FeedbackType = 'bug' | 'suggestion' | 'general'

const FEEDBACK_TYPES: { value: FeedbackType; label: string; tag: string }[] = [
  { value: 'bug', label: 'Баг', tag: 'БАГ' },
  { value: 'suggestion', label: 'Предложение', tag: 'ПРЕДЛОЖЕНИЕ' },
  { value: 'general', label: 'Вопрос/Отзыв', tag: 'ОТЗЫВ' },
]

const PLACEHOLDERS: Record<FeedbackType, string> = {
  bug: 'Что сломалось и как это повторить?',
  suggestion: 'Какую функцию стоит добавить?',
  general: 'Ваш вопрос или отзыв…',
}

export function FeedbackModal({ isOpen, onClose, email }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const { legalDoc, openLegalDoc, closeLegalDoc } = useLegalModal()

  useEffect(() => {
    if (isOpen) {
      setMessage('')
      setFeedbackType('suggestion')
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
    const typeTag = FEEDBACK_TYPES.find((t) => t.value === feedbackType)?.tag ?? 'ОТЗЫВ'
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message: `[${typeTag}] ${email}: ${trimmed}` }),
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
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Обратная связь
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400" data-testid="feedback-subtitle">
              Расскажите о баге, предложите улучшение или задайте вопрос.
            </p>
          </div>
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

        <form onSubmit={handleSubmit} onChange={() => setToast(null)} className="space-y-4">
          <p className="mb-4 text-xs text-slate-400" data-testid="feedback-sender">
            Отзыв будет отправлен от: {email}
          </p>

          <div
            className="flex gap-2"
            role="radiogroup"
            aria-label="Тип отзыва"
            data-testid="feedback-type-group"
          >
            {FEEDBACK_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  feedbackType === type.value
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
                data-testid={`feedback-type-${type.value}`}
              >
                <input
                  type="radio"
                  name="feedback-type"
                  value={type.value}
                  checked={feedbackType === type.value}
                  onChange={() => setFeedbackType(type.value)}
                  disabled={isLoading}
                  className="sr-only"
                />
                {type.label}
              </label>
            ))}
          </div>

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
              placeholder={PLACEHOLDERS[feedbackType]}
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

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Отправляя сообщение, вы соглашаетесь с{' '}
            <button
              type="button"
              onClick={() => openLegalDoc('privacy')}
              className="underline hover:text-slate-700 dark:hover:text-slate-200"
              data-testid="feedback-privacy-link"
            >
              Политикой обработки персональных данных
            </button>
          </p>
        </form>
      </div>

      <LegalDocModal doc={legalDoc} onClose={closeLegalDoc} />
    </div>
  )
}
