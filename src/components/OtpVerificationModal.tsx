import { useState } from 'react'
import { Mail, X } from 'lucide-react'

interface OtpError {
  message: string
  code?: string
}

export interface OtpVerificationModalProps {
  email: string
  title?: string
  description?: string
  onSend: () => Promise<{ error: OtpError | null }>
  onVerify: (code: string) => Promise<{ error: OtpError | null }>
  onVerified?: () => void
  onClose?: () => void
}

function mapBackendMessage(message: string): string {
  switch (message) {
    case 'Code expired':
      return 'Код истек. Запросите новый.'
    case 'Too many attempts':
      return 'Слишком много попыток. Код удален — запросите новый.'
    case 'Invalid code':
      return 'Неверный код.'
    case 'Code not found or already used':
      return 'Код не найден или уже использован.'
    case 'Unauthorized':
      return 'Ошибка авторизации. Войдите заново.'
    case 'Failed to send OTP':
      return 'Не удалось отправить код. Попробуйте позже.'
    case 'Failed to verify OTP':
      return 'Не удалось проверить код. Попробуйте позже.'
    default:
      return message || 'Произошла ошибка. Попробуйте позже.'
  }
}

export function OtpVerificationModal({
  email,
  title = 'Подтверждение email',
  description = 'Доступ к этому разделу открывается после проверки вашего адреса.',
  onSend,
  onVerify,
  onVerified,
  onClose,
}: OtpVerificationModalProps) {
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: sendError } = await onSend()
      if (sendError) {
        setError(mapBackendMessage(sendError.message))
        setStep('send')
      } else {
        setStep('verify')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Введите 6-значный код.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: verifyError } = await onVerify(code)
      if (verifyError) {
        setError(mapBackendMessage(verifyError.message))
      } else {
        setCode('')
        onVerified?.()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="relative z-10 mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
      data-testid="otp-verification-modal"
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          data-testid="otp-modal-close"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <Mail className="mx-auto h-10 w-10 text-indigo-500" />

      <h3 className="mt-4 text-center text-lg font-semibold text-slate-800 dark:text-white" data-testid="otp-title">
        {title}
      </h3>

      <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300" data-testid="otp-description">
        {description}
      </p>

      <p
        className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400"
        data-testid="otp-email"
      >
        {email}
      </p>

      {error && (
        <div
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          data-testid="otp-error"
        >
          {error}
        </div>
      )}

      {step === 'send' && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="otp-send-button"
          >
            {isLoading ? 'Отправка…' : 'Выслать 6-значный код'}
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="otp-code" className="mb-1 block text-sm font-medium text-slate-600">
              Код из письма
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isLoading}
              placeholder="000000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.5em] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              data-testid="otp-code-input"
            />
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="otp-verify-button"
          >
            {isLoading ? 'Проверка…' : 'Подтвердить'}
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            data-testid="otp-resend-button"
          >
            Выслать новый код
          </button>
        </div>
      )}
    </div>
  )
}
