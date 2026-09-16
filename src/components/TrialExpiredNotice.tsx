interface TrialExpiredNoticeProps {
  description: string
  onOpenSettings: () => void
}

export function TrialExpiredNotice({ description, onOpenSettings }: TrialExpiredNoticeProps) {
  return (
    <div
      className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
      data-testid="trial-expired-notice"
    >
      <p className="mb-2 text-lg font-semibold text-slate-800 dark:text-white">
        Пробный период завершен
      </p>
      <p className="mx-auto mb-6 max-w-md text-sm text-slate-600 dark:text-slate-300">
        {description}
      </p>
      <button
        type="button"
        onClick={onOpenSettings}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        data-testid="trial-subscribe-button"
      >
        Оформить подписку
      </button>
    </div>
  )
}
