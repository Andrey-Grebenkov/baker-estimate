import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { mapAuthError } from '../lib/authErrors'
import { RequiredMark } from './RequiredMark'

interface ProfileDropdownProps {
  user: User | null
  onSignOut: () => Promise<unknown>
  onUpdatePassword: (password: string) => Promise<{ error: { message: string; code?: string } | null }>
  onDeleteAccount: () => Promise<{ error: { message: string; code?: string } | null }>
  onOpenSettings: () => void
  onOpenFeedback: () => void
}

export function ProfileDropdown({
  user,
  onSignOut,
  onUpdatePassword,
  onDeleteAccount,
  onOpenSettings,
  onOpenFeedback,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const email = user?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || '?'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const resetModals = () => {
    setIsChangePasswordOpen(false)
    setIsDeleteOpen(false)
    setNewPassword('')
    setLocalError(null)
    setSuccess(null)
  }

  const handleSignOut = async () => {
    setIsOpen(false)
    await onSignOut()
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setSuccess(null)

    if (newPassword.length < 6) {
      setLocalError('Пароль должен содержать минимум 6 символов')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await onUpdatePassword(newPassword)
      if (error) {
        setLocalError(mapAuthError(error))
      } else {
        setSuccess('Пароль успешно изменён')
        setNewPassword('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    setLocalError(null)
    try {
      const { error } = await onDeleteAccount()
      if (error) {
        setLocalError(mapAuthError(error))
      }
      // При успехе onAuthStateChange обнулит сессию и компонент размонтируется
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative z-[200]" ref={containerRef} data-testid="profile-dropdown">
      <button
        type="button"
        onPointerDown={() => setIsOpen((prev) => !prev)}
        onClick={(e) => {
          if (e.detail === 0) {
            setIsOpen((prev) => !prev)
          }
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        data-testid="profile-avatar"
      >
        {initial}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200"
          data-testid="profile-menu"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-800" data-testid="profile-email">
              {email}
            </p>
          </div>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              setIsOpen(false)
              setIsChangePasswordOpen(true)
            }}
            onClick={(e) => {
              if (e.detail === 0) {
                setIsOpen(false)
                setIsChangePasswordOpen(true)
              }
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            data-testid="profile-change-password"
          >
            Сменить пароль
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              setIsOpen(false)
              onOpenSettings()
            }}
            onClick={(e) => {
              if (e.detail === 0) {
                setIsOpen(false)
                onOpenSettings()
              }
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            data-testid="profile-settings"
          >
            Настройки
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              setIsOpen(false)
              onOpenFeedback()
            }}
            onClick={(e) => {
              if (e.detail === 0) {
                setIsOpen(false)
                onOpenFeedback()
              }
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            data-testid="profile-feedback"
          >
            Обратная связь
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              setIsOpen(false)
              setIsDeleteOpen(true)
            }}
            onClick={(e) => {
              if (e.detail === 0) {
                setIsOpen(false)
                setIsDeleteOpen(true)
              }
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            data-testid="profile-delete-account"
          >
            Удалить аккаунт
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              handleSignOut()
            }}
            onClick={(e) => {
              if (e.detail === 0) {
                handleSignOut()
              }
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            data-testid="profile-sign-out"
          >
            Выйти
          </button>
        </div>
      )}

      {isChangePasswordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          data-testid="change-password-modal"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Сменить пароль</h2>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-slate-600"
                >
                  Новый пароль
                  <RequiredMark />
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••"
                  data-testid="new-password-input"
                />
              </div>

              {localError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {localError}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  data-testid="save-password-button"
                >
                  {isLoading ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={resetModals}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  data-testid="cancel-password-button"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          data-testid="delete-account-modal"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <h2 className="mb-2 text-lg font-semibold text-slate-800">Удалить аккаунт?</h2>
            <p className="mb-4 text-sm text-slate-600">
              Вы уверены? Это действие нельзя отменить. Все данные будут удалены.
            </p>

            {localError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {localError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="confirm-delete-button"
              >
                {isLoading ? 'Удаление…' : 'Удалить'}
              </button>
              <button
                type="button"
                onClick={resetModals}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                data-testid="cancel-delete-button"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
