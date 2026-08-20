import { useMemo } from 'react'
import type { ImportAnalysis } from '../lib/backup'

interface ImportConflictModalProps {
  analysis: ImportAnalysis
  selectedIds: Set<string>
  isLoading: boolean
  onToggle: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onImport: () => void
  onCancel: () => void
}

function countNew(analysis: ImportAnalysis): number {
  return analysis.ingredients.new.length + analysis.recipes.new.length + analysis.cakes.new.length
}

function allConflictIds(analysis: ImportAnalysis): string[] {
  return [
    ...analysis.ingredients.conflicts.map((c) => c.item.id),
    ...analysis.recipes.conflicts.map((c) => c.item.id),
    ...analysis.cakes.conflicts.map((c) => c.item.id),
  ]
}

function selectedCount(analysis: ImportAnalysis, selectedIds: Set<string>): number {
  return allConflictIds(analysis).filter((id) => selectedIds.has(id)).length
}

export function ImportConflictModal({
  analysis,
  selectedIds,
  isLoading,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onImport,
  onCancel,
}: ImportConflictModalProps) {
  const hasConflicts =
    analysis.ingredients.conflicts.length > 0 ||
    analysis.recipes.conflicts.length > 0 ||
    analysis.cakes.conflicts.length > 0

  const conflictIds = useMemo(() => allConflictIds(analysis), [analysis])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      data-testid="import-conflict-modal"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-lg sm:p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Конфликты при импорте</h2>
        <p className="mb-4 text-sm text-slate-600">
          Ниже перечислены элементы, которые уже есть в облаке. Отметьте те, что нужно заменить
          данными из резервной копии. Новые элементы ({countNew(analysis)} шт.) будут добавлены
          автоматически.
        </p>

        {hasConflicts ? (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSelectAll}
                className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid="import-conflict-select-all"
              >
                Выбрать всё
              </button>
              <button
                type="button"
                onClick={onDeselectAll}
                className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid="import-conflict-deselect-all"
              >
                Снять выделение
              </button>
            </div>

            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {analysis.ingredients.conflicts.length > 0 && (
                <div className="p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ингредиенты
                  </p>
                  <ul className="space-y-2">
                    {analysis.ingredients.conflicts.map(({ item }) => (
                      <li key={item.id} className="flex items-center gap-3">
                        <input
                          id={`conflict-${item.id}`}
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => onToggle(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          data-testid="import-conflict-checkbox"
                        />
                        <label
                          htmlFor={`conflict-${item.id}`}
                          className="flex-1 text-sm text-slate-800"
                        >
                          {item.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recipes.conflicts.length > 0 && (
                <div className="p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Рецепты
                  </p>
                  <ul className="space-y-2">
                    {analysis.recipes.conflicts.map(({ item }) => (
                      <li key={item.id} className="flex items-center gap-3">
                        <input
                          id={`conflict-${item.id}`}
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => onToggle(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          data-testid="import-conflict-checkbox"
                        />
                        <label
                          htmlFor={`conflict-${item.id}`}
                          className="flex-1 text-sm text-slate-800"
                        >
                          {item.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.cakes.conflicts.length > 0 && (
                <div className="p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Торты
                  </p>
                  <ul className="space-y-2">
                    {analysis.cakes.conflicts.map(({ item }) => (
                      <li key={item.id} className="flex items-center gap-3">
                        <input
                          id={`conflict-${item.id}`}
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => onToggle(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          data-testid="import-conflict-checkbox"
                        />
                        <label
                          htmlFor={`conflict-${item.id}`}
                          className="flex-1 text-sm text-slate-800"
                        >
                          {item.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Выбрано для замены: <span className="font-semibold">{selectedCount(analysis, selectedIds)}</span> из{' '}
              {conflictIds.length}
            </p>
          </>
        ) : (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            Конфликтов нет. Все элементы из резервной копии новые и будут добавлены.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-testid="import-conflict-cancel"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onImport}
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            data-testid="import-conflict-import"
          >
            {isLoading ? 'Импорт…' : 'Импортировать выбранные'}
          </button>
        </div>
      </div>
    </div>
  )
}
