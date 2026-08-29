import { useState } from 'react'
import { Lock } from 'lucide-react'

interface VerificationPromptProps {
  title?: string
  description: string
  notification?: string
  showNotification?: boolean
  resendLabel?: string
  onResend?: () => Promise<{ error: { message: string; code?: string } | null }>
}

interface ResendStatus {
  type: 'success' | 'error'
  message: string
}

export function VerificationPrompt({
  title,
  description,
  notification = 'Подтвердите email, чтобы разблокировать этот раздел.',
  showNotification = false,
  resendLabel = 'Выслать письмо повторно',
  onResend,
}: VerificationPromptProps) {
  const [isResending, setIsResending] = useState(false)
  const [status, setStatus] = useState<ResendStatus | null>(null)

  const handleResend = async () => {
    if (!onResend) return
    setIsResending(true)
    setStatus(null)
    const { error } = await onResend()
    setIsResending(false)
    if (error) {
      setStatus({ type: 'error', message: error.message || 'Не удалось отправить письмо' })
    } else {
      setStatus({ type: 'success', message: 'Письмо отправлено. Проверьте почту.' })
    }
  }

  return (
    <div className="space-y-4" data-testid="verification-prompt">
      {showNotification && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          <span data-testid="verification-notification">{notification}</span>
          {onResend && (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
              data-testid="verification-resend-button"
            >
              {isResending ? 'Отправка…' : resendLabel}
            </button>
          )}
        </div>
      )}

      {status && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
          data-testid="verification-status"
        >
          {status.message}
        </div>
      )}

      <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <Lock className="mx-auto h-10 w-10 text-amber-500" />
        {title && (
          <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white" data-testid="verification-title">
            {title}
          </h3>
        )}
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300" data-testid="verification-description">
          {description}
        </p>
        {onResend && !showNotification && (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="verification-resend-button"
          >
            {isResending ? 'Отправка…' : resendLabel}
          </button>
        )}
      </div>
    </div>
  )
}
