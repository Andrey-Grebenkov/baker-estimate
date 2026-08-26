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
  user_id?: string // Владелец записи (из auth.users)
  name: string // Название, например: "Сахар белый"
  pricePerPackage: number // Цена за целую упаковку
  packageQuantity: number // Размер упаковки (например, 1000)
  unit: MeasurementUnit // Единица измерения упаковки (например, 'g')

  // Рассчитываемое поле (pricePerPackage / packageQuantity).
  // Можно вычислять на лету, но удобно хранить в объекте.
  pricePerBaseUnit: number

  // Текущий остаток на складе (г/мл/шт).
  inStock?: number
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
  user_id?: string // Владелец записи (из auth.users)
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
export interface CakeAdditionalItem {
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
  user_id?: string // Владелец записи (из auth.users)
  name: string // Например: "Свадебный 3-ярусный"

  recipes: CakeRecipeItem[]
  packaging: CakeAdditionalItem[]
  decor: CakeAdditionalItem[]
  overheads: Overheads

  marginPercent: number // Желаемая наценка в процентах (например, 30%)

  // Итоговые расчетные поля:
  totalIngredientsCost: number // Стоимость всех полуфабрикатов
  totalPackagingCost: number // Стоимость упаковки
  totalDecorCost: number // Стоимость декора
  totalOverheadsCost: number // (workHours * hourlyRate) + fixedCosts

  finalCostPrice: number // Полная себестоимость (ингредиенты + упаковка + декор + расходы)
  recommendedPrice: number // Цена продажи (finalCostPrice + marginPercent)
  image_url?: string // URL фотографии торта в Supabase Storage
}

/** Тип для сохранения рецепта — вычисляемые поля подставляются при загрузке. */
export type RecipeInput = Omit<Recipe, 'totalWeight' | 'totalCost'>

/** Тип для сохранения торта — вычисляемые поля подставляются при загрузке. */
export type CakeInput = Omit<
  Cake,
  | 'totalIngredientsCost'
  | 'totalPackagingCost'
  | 'totalDecorCost'
  | 'totalOverheadsCost'
  | 'finalCostPrice'
  | 'recommendedPrice'
>

/**
 * TASK: УЧЕТ ПРОДАЖ / ЗАКАЗОВ
 */
export type OrderStatus = 'Новый' | 'В работе' | 'Выдан'

export interface Order {
  id: string
  user_id?: string
  cake_id?: string // Ссылка на сохранённый торт (может стать null при удалении торта)
  client_name?: string
  client_phone?: string
  status: OrderStatus
  delivery_date: string // ISO-строка даты/времени
  actual_weight_kg?: number // Фактический вес в кг
  actual_cost: number // Реальная себестоимость
  paid_amount: number // Итоговая сумма к оплате
  advance_payment: number // Предоплата / аванс
  completion_comment?: string // Причина переплаты (доставка, чаевые и т.п.)
  internal_comment?: string // Внутренняя заметка по заказу
  created_at?: string
}

export type OrderInput = Omit<Order, 'id' | 'user_id' | 'created_at'>

