import { useState } from 'react'
import type { AuthError } from '@supabase/supabase-js'
import { mapAuthError } from '../lib/authErrors'
import { RequiredMark } from './RequiredMark'

interface AuthPageProps {
  error: string | null
  onSignIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  onSignUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
}

export function AuthPage({ error, onSignIn, onSignUp }: AuthPageProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setLocalError('Введите email и пароль')
      return
    }

    if (password.length < 6) {
      setLocalError('Пароль должен содержать не менее 6 символов')
      return
    }

    setIsLoading(true)
    try {
      const { error: signError } = isRegister
        ? await onSignUp(trimmedEmail, password)
        : await onSignIn(trimmedEmail, password)
      if (signError) {
        setLocalError(mapAuthError(signError))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const displayedError = mapAuthError(localError || error)

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12"
      data-testid="auth-page"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900" data-testid="auth-title">
          Калькулятор себестоимости
        </h1>
        <p className="mb-6 text-sm text-slate-500" data-testid="auth-subtitle">
          {isRegister ? 'Создайте аккаунт, чтобы начать' : 'Войдите, чтобы продолжить'}
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4" data-testid="auth-form">
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-slate-600">
              Email
              <RequiredMark />
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="you@example.com"
              data-testid="auth-email-input"
              required
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-slate-600">
              Пароль
              <RequiredMark />
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••"
              data-testid="auth-password-input"
              required
            />
          </div>

          {displayedError && (
            <div
              className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              data-testid="auth-error"
            >
              {displayedError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="auth-submit-button"
          >
            {isLoading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setLocalError(null)
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
            data-testid="auth-toggle-button"
          >
            {isRegister ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  )
}
