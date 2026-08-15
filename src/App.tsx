import { useState } from 'react'
import { useAppState } from './hooks/useAppState'
import { IngredientsPage } from './components/IngredientsPage'
import { RecipesPage } from './components/RecipesPage'
import { CakesPage } from './components/CakesPage'

type Tab = 'ingredients' | 'recipes' | 'cakes'

const tabs: { value: Tab; label: string }[] = [
  { value: 'ingredients', label: 'Ингредиенты' },
  { value: 'recipes', label: 'Рецепты' },
  { value: 'cakes', label: 'Торты' },
]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ingredients')
  const state = useAppState()

  return (
    <div className="min-h-screen bg-slate-50" data-testid="app">
      <header className="bg-white shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <h1
            className="text-xl font-bold text-slate-900 sm:text-2xl"
            data-testid="app-title"
          >
            Калькулятор себестоимости торта
          </h1>
          <p className="mt-1 text-sm text-slate-500" data-testid="app-subtitle">
            Локальное приложение для кондитеров
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <nav
          className="mb-6 flex flex-wrap gap-2"
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
      </main>
    </div>
  )
}

export default App
