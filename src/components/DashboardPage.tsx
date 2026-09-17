import { useMemo } from 'react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { ArrowRight, ClipboardList, Receipt, TrendingUp, Wallet } from 'lucide-react'
import type { AppState } from '../hooks/useAppState'
import type { Order } from '../domain/types'
import { formatPeriodRevenue } from '../lib/dateFilter'
import { statusStyles } from '../lib/orderStatus'
import {
  calculateAverageCostBreakdown,
  calculateMonthMetrics,
  getActiveOrdersByDelivery,
  getOrderUrgency,
  type CostBreakdownPoint,
  type OrderUrgency,
} from '../domain/dashboard'
import { OtpVerificationModal } from './OtpVerificationModal'
import { TrialExpiredNotice } from './TrialExpiredNotice'
import { LoadingSpinner } from './LoadingSpinner'

interface DashboardPageProps {
  state: AppState
  theme: 'light' | 'dark'
  onOpenCakes: () => void
  onOpenOrders: () => void
  onOpenSettings: () => void
  email: string
  isVerified?: boolean
  isVerificationLoading?: boolean
  isTrialExpired?: boolean
  onSendOtp: () => Promise<{ error: { message: string; code?: string } | null }>
  onVerifyOtp: (code: string) => Promise<{ error: { message: string; code?: string } | null }>
  onOtpVerified: () => void
}

const BREAKDOWN_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#64748b']

const URGENCY_BADGE: Record<OrderUrgency, { label: string; className: string }> = {
  overdue: {
    label: 'Просрочено',
    className:
      'bg-rose-100 text-rose-700 ring-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-800',
  },
  urgent: {
    label: 'Срочно',
    className:
      'bg-rose-100 text-rose-700 ring-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-800',
  },
  soon: {
    label: 'Скоро',
    className:
      'bg-amber-100 text-amber-700 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800',
  },
  planned: {
    label: 'В планах',
    className:
      'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-700/60 dark:text-slate-400 dark:ring-slate-600',
  },
}

export function DashboardPage({
  state,
  theme,
  onOpenCakes,
  onOpenOrders,
  onOpenSettings,
  email,
  isVerified = false,
  isVerificationLoading = false,
  isTrialExpired = false,
  onSendOtp,
  onVerifyOtp,
  onOtpVerified,
}: DashboardPageProps) {
  const isDark = theme === 'dark'

  const monthMetrics = useMemo(
    () => calculateMonthMetrics(state.orders, state.taxPercent),
    [state.orders, state.taxPercent],
  )
  const upcomingOrders = useMemo(() => getActiveOrdersByDelivery(state.orders), [state.orders])
  const costBreakdown = useMemo(() => calculateAverageCostBreakdown(state.cakes), [state.cakes])
  const cakeNameById = useMemo(
    () => new Map(state.cakes.map((cake) => [cake.id, cake.name])),
    [state.cakes],
  )

  // Пока статус верификации неизвестен или грузятся данные — спиннер,
  // чтобы не мигали OTP-заглушка и пустой дашборд. Фоновые silent-проверки
  // у верифицированного пользователя сюда не попадают (isVerified остаётся true).
  if (state.isInitialDataLoading || (isVerificationLoading && !isVerified)) {
    return <LoadingSpinner />
  }

  if (!isVerified) {
    return (
      <div className="relative z-0 space-y-6" data-testid="dashboard-page">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Дашборд</h2>
        <OtpVerificationModal
          email={email}
          title="Дашборд заблокирован"
          description="Доступ к финансовой аналитике открывается после подтверждения email."
          onSend={onSendOtp}
          onVerify={onVerifyOtp}
          onVerified={onOtpVerified}
        />
      </div>
    )
  }

  if (isTrialExpired) {
    return (
      <div className="relative z-0 space-y-6" data-testid="dashboard-page">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Дашборд</h2>
        <TrialExpiredNotice
          description="Бесплатный пробный период завершился. Оформите подписку, чтобы снова видеть финансовую аналитику."
          onOpenSettings={onOpenSettings}
        />
      </div>
    )
  }

  const axisColor = isDark ? '#94a3b8' : '#64748b'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#475569' : '#e2e8f0'
  const tooltipColor = isDark ? '#e2e8f0' : '#1e293b'

  const now = new Date()
  const monthLabel = format(now, 'LLLL yyyy', { locale: ru })

  const breakdownTooltipFormatter = (value: number, _name: string, props: { payload: CostBreakdownPoint }) => {
    return [`${value.toFixed(2)} ₽`, props.payload.name]
  }

  const statCardClass =
    'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'

  const statIconClass = 'rounded-lg p-1.5'
  const profitTone =
    monthMetrics.expectedProfit > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : monthMetrics.expectedProfit < 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-900 dark:text-white'

  const isEmpty = state.cakes.length === 0 && state.orders.length === 0

  const orderCakeName = (order: Order): string => {
    if (!order.cake_id) return 'Без торта'
    return cakeNameById.get(order.cake_id) ?? 'Торт удалён'
  }

  return (
    <div className="relative z-0 space-y-6" data-testid="dashboard-page">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Дашборд</h2>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Метрики текущего месяца
          </h3>
          <span className="text-sm capitalize text-slate-400 dark:text-slate-500">{monthLabel}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={statCardClass}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Ожидаемая выручка</p>
              <span className={`${statIconClass} bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300`}>
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-month-revenue">
              {formatPeriodRevenue(monthMetrics.expectedRevenue)} ₽
            </p>
          </div>
          <div className={statCardClass}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Ожидаемая прибыль</p>
              <span className={`${statIconClass} bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300`}>
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${profitTone}`} data-testid="dashboard-month-profit">
              {formatPeriodRevenue(monthMetrics.expectedProfit)} ₽
            </p>
          </div>
          <div className={statCardClass}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Заказов в работе</p>
              <span className={`${statIconClass} bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300`}>
                <ClipboardList className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-active-orders">
              {monthMetrics.activeOrdersCount}
            </p>
          </div>
          <div className={statCardClass}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Средний чек</p>
              <span className={`${statIconClass} bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300`}>
                <Receipt className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white" data-testid="dashboard-average-check">
              {formatPeriodRevenue(monthMetrics.averageCheck)} ₽
            </p>
          </div>
        </div>
      </section>

      {isEmpty ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <p className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
            У вас пока нет смет и заказов
          </p>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            Создайте первую смету, чтобы увидеть аналитику и план отдач.
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
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 lg:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Ближайшие отдачи
                {upcomingOrders.length > 0 && (
                  <span
                    className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                    data-testid="dashboard-upcoming-count"
                  >
                    {upcomingOrders.length}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={onOpenOrders}
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none dark:text-indigo-400 dark:hover:text-indigo-300"
                data-testid="dashboard-open-orders"
              >
                Все заказы
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {upcomingOrders.length === 0 ? (
              <p
                className="py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                data-testid="dashboard-upcoming-empty"
              >
                Нет активных заказов
              </p>
            ) : (
              <ul
                className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700/60"
                data-testid="dashboard-upcoming-list"
              >
                {upcomingOrders.map((order) => {
                  const urgency = getOrderUrgency(order)
                  const badge = URGENCY_BADGE[urgency]
                  const deliveryDate = new Date(order.delivery_date)
                  const isHot = urgency === 'overdue' || urgency === 'urgent'

                  return (
                    <li
                      key={order.id}
                      className="flex items-center gap-3 py-2.5"
                      data-testid="dashboard-upcoming-row"
                    >
                      <div
                        className="w-11 shrink-0 text-center"
                        title={format(deliveryDate, 'd MMMM yyyy', { locale: ru })}
                      >
                        <p
                          className={`text-lg font-bold leading-tight ${
                            isHot
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {format(deliveryDate, 'd')}
                        </p>
                        <p className="text-[11px] uppercase leading-tight text-slate-500 dark:text-slate-400">
                          {format(deliveryDate, 'LLL', { locale: ru })}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {order.client_name || '—'}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {orderCakeName(order)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusStyles[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">
              Структура затрат
            </h3>
            {costBreakdown.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Нет данных — создайте смету
              </p>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}
