import type { CakeDetails } from '../domain/cake'
import type { Recipe } from '../domain/types'

interface CakePrintViewProps {
  cake: CakeDetails
  recipes: Recipe[]
}

export function CakePrintView({ cake, recipes }: CakePrintViewProps) {
  return (
    <div
      className="w-full bg-white p-4 text-black shadow-none sm:p-6 print:p-0"
      data-testid="cake-print-view"
    >
      <header className="mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold print:text-black" data-testid="cake-print-title">
          Смета: {cake.name}
        </h1>
        <p className="text-sm text-slate-600 print:text-black" data-testid="cake-print-date">
          {new Date().toLocaleDateString('ru-RU')}
        </p>
      </header>

      <section className="mb-6" data-testid="cake-print-recipes">
        <h2 className="mb-2 text-lg font-semibold">Полуфабрикаты</h2>
        <table className="w-full border-collapse border border-slate-300 text-sm print:border-black" data-testid="cake-print-recipes-table">
          <thead>
            <tr className="bg-slate-100 print:bg-white print:text-black">
              <th className="border border-slate-300 px-3 py-2 text-left print:border-black">Рецепт</th>
              <th className="border border-slate-300 px-3 py-2 text-left print:border-black">Коэффициент</th>
              <th className="border border-slate-300 px-3 py-2 text-left print:border-black">Вес, г</th>
            </tr>
          </thead>
          <tbody>
            {cake.recipes.map((cr) => {
              const recipe = recipes.find((r) => r.id === cr.recipeId)
              if (!recipe) return null

              return (
                <tr key={cr.recipeId} data-testid="cake-print-recipe-row">
                  <td className="border border-slate-300 px-3 py-2 print:border-black">{recipe.name}</td>
                  <td className="border border-slate-300 px-3 py-2 print:border-black">{cr.multiplier}</td>
                  <td className="border border-slate-300 px-3 py-2 print:border-black">
                    {(recipe.totalWeight * cr.multiplier).toFixed(0)} г
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {cake.decorations.length > 0 && (
        <section className="mb-6" data-testid="cake-print-decorations">
          <h2 className="mb-2 text-lg font-semibold">Упаковка и декор</h2>
          <table className="w-full border-collapse border border-slate-300 text-sm print:border-black" data-testid="cake-print-decorations-table">
            <thead>
              <tr className="bg-slate-100 print:bg-white print:text-black">
                <th className="border border-slate-300 px-3 py-2 text-left print:border-black">Наименование</th>
                <th className="border border-slate-300 px-3 py-2 text-left print:border-black">Количество</th>
              </tr>
            </thead>
            <tbody>
              {cake.decorations.map((d) => (
                <tr key={d.id} data-testid="cake-print-decoration-row">
                  <td className="border border-slate-300 px-3 py-2 print:border-black">{d.name}</td>
                  <td className="border border-slate-300 px-3 py-2 print:border-black">{d.quantity} шт.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="grid gap-4 border-t-2 border-black pt-4 sm:grid-cols-2" data-testid="cake-print-totals">
        <div>
          <p className="text-sm text-slate-600 print:text-black">Итоговый вес</p>
          <p className="text-xl font-bold print:text-black" data-testid="cake-print-weight">
            {(cake.weightKg * 1000).toFixed(0)} г / {cake.weightKg.toFixed(3)} кг
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-600 print:text-black">Рекомендуемая розничная цена</p>
          <p className="text-2xl font-bold text-indigo-700 print:text-black" data-testid="cake-print-recommended-price">
            {cake.recommendedPrice.toFixed(2)} ₽
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-600 print:text-black">Цена за 1 кг</p>
          <p className="text-xl font-bold print:text-black" data-testid="cake-print-price-per-kg">
            {cake.recommendedPricePerKg.toFixed(2)} ₽/кг
          </p>
        </div>
      </section>
    </div>
  )
}
