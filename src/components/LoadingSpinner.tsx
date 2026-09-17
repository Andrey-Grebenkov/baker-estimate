import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  label?: string
}

export function LoadingSpinner({ label = 'Загрузка…' }: LoadingSpinnerProps) {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      role="status"
      data-testid="loading-spinner"
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}
