import { useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { AppState } from '../hooks/useAppState'
import {
  exportBackup,
  downloadBackupFile,
  importBackupWithSelection,
  analyzeBackup,
  fetchCurrentData,
  type ImportAnalysis,
} from '../lib/backup'
import { ImportConflictModal } from './ImportConflictModal'

interface SettingsPageProps {
  user: User | null
  state: AppState
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export function SettingsPage({ user, state }: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [importData, setImportData] = useState<unknown | null>(null)
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setToast(null)
      const backup = await exportBackup(user?.id)
      downloadBackupFile(backup)
      showToast('success', 'Резервная копия успешно скачана')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Ошибка при создании резервной копии')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!user?.id) {
      showToast('error', 'Пользователь не авторизован')
      e.target.value = ''
      return
    }

    try {
      setIsAnalyzing(true)
      setToast(null)
      const text = await file.text()
      const data = JSON.parse(text) as unknown
      const current = await fetchCurrentData()
      const analysis = analyzeBackup(data, current, user.id)

      setImportData(data)
      setImportAnalysis(analysis)
      setSelectedIds(new Set())
      setShowConflictModal(true)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Ошибка при анализе резервной копии')
    } finally {
      setIsAnalyzing(false)
      e.target.value = ''
    }
  }

  const getAllConflictIds = (): string[] => {
    if (!importAnalysis) return []
    return [
      ...importAnalysis.ingredients.conflicts.map((c) => c.item.id),
      ...importAnalysis.recipes.conflicts.map((c) => c.item.id),
      ...importAnalysis.cakes.conflicts.map((c) => c.item.id),
    ]
  }

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(getAllConflictIds()))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleImport = async () => {
    if (!importData || !user?.id || !importAnalysis) return

    const confirmed = window.confirm(
      'Импорт заменит выбранные элементы в облаке и добавит новые. Продолжить?',
    )
    if (!confirmed) return

    try {
      setIsImporting(true)
      const current = await fetchCurrentData()
      const result = await importBackupWithSelection(importData, user.id, selectedIds, current)
      setShowConflictModal(false)
      setImportData(null)
      setImportAnalysis(null)
      setSelectedIds(new Set())
      await state.reload()
      showToast(
        'success',
        `Импорт завершен: ${result.ingredients} ингредиентов, ${result.recipes} рецептов, ${result.cakes} тортов`,
      )
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Ошибка при импорте')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setShowConflictModal(false)
    setImportData(null)
    setImportAnalysis(null)
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Настройки</h2>

        <div className="space-y-1">
          <p className="text-sm text-slate-600">Аккаунт</p>
          <p className="text-base font-medium text-slate-900" data-testid="settings-user-email">
            {user?.email ?? '—'}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Резервная копия</h2>
        <p className="mb-4 text-sm text-slate-600">
          Скачайте JSON-файл со всеми ингредиентами, рецептами и тортами, или восстановите данные из
          ранее сохраненного файла.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isAnalyzing || isImporting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            data-testid="settings-export-button"
          >
            {isExporting ? 'Создание…' : 'Скачать резервную копию'}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExporting || isAnalyzing || isImporting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            data-testid="settings-import-button"
          >
            {isAnalyzing ? 'Анализ…' : isImporting ? 'Импорт…' : 'Загрузить из файла'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="settings-import-input"
          />
        </div>

        {toast && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
            data-testid="settings-backup-toast"
          >
            {toast.message}
          </div>
        )}
      </div>

      {showConflictModal && importAnalysis && (
        <ImportConflictModal
          analysis={importAnalysis}
          selectedIds={selectedIds}
          isLoading={isImporting}
          onToggle={toggleId}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onImport={handleImport}
          onCancel={handleCancelImport}
        />
      )}
    </div>
  )
}
