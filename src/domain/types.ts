/**
 * Базовые единицы измерения.
 * Для упрощения расчетов используем только граммы, миллилитры и штуки.
 * Все килограммы и литры конвертируются в г и мл на уровне UI.
 */
export type MeasurementUnit = 'g' | 'ml' | 'pcs'

/**
 * TASK 1: БАЗОВЫЙ ИНГРЕДИЕНТ
 * Представляет купленный в магазине продукт.
 */
export interface Ingredient {
  id: string
  name: string // Название, например: "Сахар белый"
  pricePerPackage: number // Цена за целую упаковку
  packageQuantity: number // Размер упаковки (например, 1000)
  unit: MeasurementUnit // Единица измерения упаковки (например, 'g')

  // Рассчитываемое поле (pricePerPackage / packageQuantity).
  // Можно вычислять на лету, но удобно хранить в объекте.
  pricePerBaseUnit: number
}

/**
 * TASK 2: СОСТАВЛЯЮЩИЕ РЕЦЕПТА (ПОЛУФАБРИКАТА)
 */
export interface RecipeIngredient {
  ingredientId: string // Ссылка на базовый ингредиент
  quantityUsed: number // Сколько грамм/мл/шт нужно для этого рецепта
}

/**
 * TASK 2: РЕЦЕПТ / ПОЛУФАБРИКАТ
 * Например: "Крем чиз на масле" или "Бисквит ванильный"
 */
export interface Recipe {
  id: string
  name: string
  ingredients: RecipeIngredient[]

  // Рассчитываемые поля:
  totalWeight: number // Сумма quantityUsed всех ингредиентов (если в 'g' или 'ml')
  totalCost: number // Сумма (quantityUsed * pricePerBaseUnit)
}

/**
 * TASK 3: ЭЛЕМЕНТЫ ТОРТА
 */

// Добавленный в торт полуфабрикат (рецепт)
export interface CakeRecipeItem {
  recipeId: string // Ссылка на рецепт
  multiplier: number // Коэффициент порции (например, 1.5 порции крема)
}

// Упаковка или декор (считается поштучно, не требует создания рецепта)
export interface CakeDecorationItem {
  id: string
  name: string // Например, "Коробка 30х30", "Топпер 'С днем рождения'"
  cost: number // Стоимость за штуку
  quantity: number // Количество
}

// Накладные расходы и труд
export interface Overheads {
  workHours: number // Потрачено часов
  hourlyRate: number // Стоимость часа работы
  fixedCosts: number // Фиксированные расходы (электричество, вода, доставка)
}

/**
 * TASK 3 & 4: ИТОГОВОЕ ИЗДЕЛИЕ (ТОРТ)
 */
export interface Cake {
  id: string
  name: string // Например: "Свадебный 3-ярусный"

  recipes: CakeRecipeItem[]
  decorations: CakeDecorationItem[]
  overheads: Overheads

  marginPercent: number // Желаемая наценка в процентах (например, 30%)

  // Итоговые расчетные поля:
  totalIngredientsCost: number // Стоимость всех полуфабрикатов
  totalDecorationsCost: number // Стоимость коробки, подложки, декора
  totalOverheadsCost: number // (workHours * hourlyRate) + fixedCosts

  finalCostPrice: number // Полная себестоимость (ингредиенты + декор + расходы)
  recommendedPrice: number // Цена продажи (finalCostPrice + marginPercent)
}
