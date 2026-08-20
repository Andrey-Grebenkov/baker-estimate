import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useAppState } from './hooks/useAppState'
import { AuthPage } from './components/AuthPage'
import { ProfileDropdown } from './components/ProfileDropdown'
import { IngredientsPage } from './components/IngredientsPage'
import { RecipesPage } from './components/RecipesPage'
import { CakesPage } from './components/CakesPage'
import { SettingsPage } from './components/SettingsPage'

type Tab = 'ingredients' | 'recipes' | 'cakes' | 'settings'

const tabs: { value: Tab; label: string }[] = [
  { value: 'ingredients', label: 'Ингредиенты' },
  { value: 'recipes', label: 'Рецепты' },
  { value: 'cakes', label: 'Торты' },
  { value: 'settings', label: 'Настройки' },
]

function App() {
  const { session, user, loading, error, signIn, signUp, signOut, updatePassword, deleteAccount } =
    useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('ingredients')
  const state = useAppState(user)

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600"
        data-testid="auth-loading"
      >
        Загрузка…
      </div>
    )
  }

  if (!session) {
    return <AuthPage error={error} onSignIn={signIn} onSignUp={signUp} />
  }

  if (!state.initialized) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600"
        data-testid="data-loading"
      >
        Загрузка данных…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white" data-testid="app">
      <header className="bg-white shadow-sm ring-1 ring-slate-200 print:hidden">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1
              className="text-xl font-bold text-slate-900 sm:text-2xl"
              data-testid="app-title"
            >
              Калькулятор себестоимости торта
            </h1>
            <p className="mt-1 text-sm text-slate-500" data-testid="app-subtitle">
              {user?.email ?? 'Локальное приложение для кондитеров'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {state.isLoading && (
              <span className="text-sm text-slate-500" data-testid="data-loading-indicator">
                Сохранение…
              </span>
            )}
            <ProfileDropdown
              user={user}
              onSignOut={signOut}
              onUpdatePassword={updatePassword}
              onDeleteAccount={deleteAccount}
            />
          </div>
        </div>
      </header>

      {state.error && (
        <div
          className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:px-8 print:hidden"
          data-testid="app-error-banner"
        >
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:flex sm:items-start sm:justify-between">
            <span data-testid="app-error-message">{state.error}</span>
            <button
              type="button"
              onClick={state.clearError}
              className="mt-2 font-medium text-rose-700 underline sm:mt-0"
              data-testid="app-error-close"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:p-0">
        <nav
          className="mb-6 flex flex-wrap gap-2 print:hidden"
          role="tablist"
          data-testid="app-tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-base ${
                activeTab === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
              }`}
              data-testid={`tab-${tab.value}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'ingredients' && <IngredientsPage state={state} />}
        {activeTab === 'recipes' && <RecipesPage state={state} />}
        {activeTab === 'cakes' && <CakesPage state={state} />}
        {activeTab === 'settings' && <SettingsPage user={user} state={state} />}
      </main>
    </div>
  )
}

export default App
