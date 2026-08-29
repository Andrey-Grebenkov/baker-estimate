import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AppState } from '../hooks/useAppState'
import { roundToCurrency } from '../domain/money'
import {
  calculateAverageCostBreakdown,
  calculateDashboardMetrics,
  getRecentCakeCosts,
  type CostBreakdownPoint,
} from '../domain/dashboard'
import { VerificationPrompt } from './VerificationPrompt'

interface DashboardPageProps {
  state: AppState
  theme: 'light' | 'dark'
  onOpenCakes: () => void
  isVerified?: boolean
  onResendVerification?: () => Promise<{ error: { message: string; code?: string } | null }>
}

const BREAKDOWN_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#64748b']
const BAR_COLOR = '#6366f1'

export function DashboardPage({
  state,
  theme,
  onOpenCakes,
  isVerified = true,
  onResendVerification,
}: DashboardPageProps) {
  const isDark = theme === 'dark'

  if (!isVerified) {
    return (
      <div className="relative z-0 space-y-6" data-testid="dashboard-page">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Дашборд</h2>
        <VerificationPrompt
          showNotification
          title="Дашборд заблокирован"
          description="Доступ к финансовой аналитике открывается после подтверждения email."
          notification="Подтвердите email, чтобы открыть аналитику и графики."
          resendLabel="Выслать письмо"
          onResend={onResendVerification}
        />
      </div>
    )
  }
  const axisColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#475569' : '#e2e8f0'
  const tooltipColor = isDark ? '#e2e8f0' : '#1e293b'

  const metrics = useMemo(
    () => calculateDashboardMetrics(state.cakes, state.recipes, state.orders),
    [state.cakes, state.recipes, state.orders],
  )
  const recentCosts = useMemo(() => getRecentCakeCosts(state.cakes, 5), [state.cakes])
  const costBreakdown = useMemo(() => calculateAverageCostBreakdown(state.cakes), [state.cakes])

  const recentCostTooltipFormatter = (value: number) => [`${value.toFixed(2)} ₽`, 'Себестоимость']
  const breakdownTooltipFormatter = (value: number, _name: string, props: { payload: CostBreakdownPoint }) => {
    return [`${value.toFixed(2)} ₽`, props.payload.name]
  }

  const statCardClass =
    'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'

  if (state.cakes.length === 0) {
    return (
      <div className="relative z-0 space-y-6" data-testid="dashboard-page">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Дашборд</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={statCardClass}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Всего смет</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-total-cakes">
              0
            </p>
          </div>
          <div className={statCardClass}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Базовых рецептов</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-total-recipes">
              {metrics.totalRecipes}
            </p>
          </div>
          <div className={statCardClass}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Средняя себестоимость</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-average-cost">
              0 ₽
            </p>
          </div>
          <div className={statCardClass}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Выручка (выдано)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-total-revenue">
              0 ₽
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <p className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
            У вас пока нет сохраненных смет
          </p>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            Создайте первую смету, чтобы увидеть аналитику и графики.
          </p>
          <button
            type="button"
            onClick={onOpenCakes}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            data-testid="dashboard-create-first-cake"
          >
            Создать первую смету
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-0 space-y-6" data-testid="dashboard-page">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Дашборд</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={statCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Всего смет</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-total-cakes">
            {metrics.totalCakes}
          </p>
        </div>
        <div className={statCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Базовых рецептов</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-total-recipes">
            {metrics.totalRecipes}
          </p>
        </div>
        <div className={statCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Средняя себестоимость</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-average-cost">
            {metrics.averageCost.toFixed(2)} ₽
          </p>
        </div>
        <div className={statCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Выручка (выдано)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-total-revenue">
            {metrics.totalRevenue.toFixed(2)} ₽
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
            Себестоимость последних смет
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentCosts} margin={{ top: 8, right: 8, bottom: 32, left: 8 }}>
                <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={{ stroke: axisColor }}
                  tickLine={{ stroke: axisColor }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={{ stroke: axisColor }}
                  tickLine={{ stroke: axisColor }}
                  tickFormatter={(value: number) => roundToCurrency(value).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderRadius: 8,
                    color: tooltipColor,
                    pointerEvents: 'none',
                  }}
                  formatter={recentCostTooltipFormatter}
                />
                <Bar dataKey="cost" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
            Средняя структура себестоимости
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {costBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ color: axisColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderRadius: 8,
                    color: tooltipColor,
                    pointerEvents: 'none',
                  }}
                  formatter={breakdownTooltipFormatter as any}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
