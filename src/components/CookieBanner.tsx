import { useEffect, useState } from 'react'

const CONSENT_KEY = 'baker-cookie-consent'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) {
        setIsVisible(true)
      }
    } catch {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted')
    } catch {
      // ignore storage errors (private mode)
    }
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1200] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95"
      data-testid="cookie-banner"
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Мы используем файлы cookie для работы приложения и сохранения настроек.
        </p>
        <button
          type="button"
          onClick={handleAccept}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          data-testid="cookie-accept-button"
        >
          OK
        </button>
      </div>
    </div>
  )
}
