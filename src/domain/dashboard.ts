import { roundToCurrency } from './money'
import type { CakeDetails } from './cake'

export interface DashboardMetrics {
  totalCakes: number
  totalRecipes: number
  averageCost: number
}

export interface CakeCostPoint {
  name: string
  cost: number
}

export interface CostBreakdownPoint {
  name: string
  value: number
}

const BREAKDOWN_LABELS: Record<string, string> = {
  totalIngredientsCost: 'Ингредиенты',
  totalPackagingCost: 'Упаковка',
  totalDecorCost: 'Декор',
  totalOverheadsCost: 'Накладные',
}

const MAX_CAKE_NAME_LENGTH = 18

function truncateCakeName(name: string): string {
  return name.length > MAX_CAKE_NAME_LENGTH ? `${name.slice(0, MAX_CAKE_NAME_LENGTH)}…` : name
}

export function calculateDashboardMetrics(
  cakes: CakeDetails[],
  recipes: { id?: string }[] | undefined,
): DashboardMetrics {
  const totalCakes = cakes.length
  const totalRecipes = recipes?.length ?? 0
  const averageCost =
    totalCakes > 0
      ? roundToCurrency(cakes.reduce((sum, cake) => sum + cake.finalCostPrice, 0) / totalCakes)
      : 0

  return { totalCakes, totalRecipes, averageCost }
}

/**
 * Returns the `limit` most recent cakes with their final cost.
 * `cakes` is expected to already be ordered by `created_at` descending.
 */
export function getRecentCakeCosts(cakes: CakeDetails[], limit = 5): CakeCostPoint[] {
  return cakes.slice(0, limit).map((cake) => ({
    name: truncateCakeName(cake.name),
    cost: cake.finalCostPrice,
  }))
}

export function calculateAverageCostBreakdown(cakes: CakeDetails[]): CostBreakdownPoint[] {
  if (cakes.length === 0) return []

  const sums = {
    totalIngredientsCost: 0,
    totalPackagingCost: 0,
    totalDecorCost: 0,
    totalOverheadsCost: 0,
  }

  for (const cake of cakes) {
    sums.totalIngredientsCost += cake.totalIngredientsCost
    sums.totalPackagingCost += cake.totalPackagingCost
    sums.totalDecorCost += cake.totalDecorCost
    sums.totalOverheadsCost += cake.totalOverheadsCost
  }

  return Object.entries(sums).map(([key, value]) => ({
    name: BREAKDOWN_LABELS[key] ?? key,
    value: roundToCurrency(value / cakes.length),
  }))
}
