import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMoney } from '../domain/money'
import type { CakeDetails } from '../domain/cake'
import type { Order } from '../domain/types'
import { dotColor, statusStyles } from '../lib/orderStatus'

interface OrderCalendarViewProps {
  orders: Order[]
  cakes: CakeDetails[]
  onEdit: (order: Order) => void
  onReceipt: (order: Order) => void
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function orderDate(order: Order): Date {
  return new Date(order.delivery_date)
}

function orderCakeName(order: Order, cakes: CakeDetails[]): string {
  const cake = cakes.find((c) => c.id === order.cake_id)
  return cake?.name ?? 'Торт удалён'
}

function formatDay(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function OrderCalendarView({ orders, cakes, onEdit, onReceipt }: OrderCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const ordersByDay = useMemo(() => {
    const map: Record<string, Order[]> = {}
    for (const order of orders) {
      const key = format(orderDate(order), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(order)
    }
    return map
  }, [orders])

  const dayOrders = useMemo(() => {
    if (!selectedDay) return []
    const key = format(selectedDay, 'yyyy-MM-dd')
    return ordersByDay[key] ?? []
  }, [selectedDay, ordersByDay])

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1))
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1))

  return (
    <div className="space-y-4" data-testid="order-calendar-view">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold capitalize text-slate-800 dark:text-white">
          {format(monthStart, 'LLLL yyyy', { locale: ru })}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium uppercase text-slate-500 dark:text-slate-400"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayList = ordersByDay[key] ?? []
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={[
                'flex min-h-[4.5rem] flex-col items-start justify-start rounded-lg border p-2 text-left transition-colors',
                isCurrentMonth
                  ? 'border-slate-100 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/50'
                  : 'border-transparent bg-slate-50 text-slate-400 dark:bg-slate-900/30 dark:text-slate-600',
                isSelected ? 'ring-2 ring-inset ring-indigo-500' : '',
              ].join(' ')}
              data-testid="calendar-day"
            >
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              {dayList.length > 0 && (
                <div className="mt-1 flex w-full flex-wrap gap-1">
                  {dayList.slice(0, 4).map((order, idx) => (
                    <span
                      key={idx}
                      className={`h-2 w-2 rounded-full ${dotColor[order.status]}`}
                      title={order.client_name}
                    />
                  ))}
                  {dayList.length > 4 && (
                    <span className="text-[10px] leading-3 text-slate-500 dark:text-slate-400">
                      +{dayList.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedDay && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 dark:text-white">
              Заказы на {formatDay(selectedDay.toISOString())}
            </h4>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Скрыть
            </button>
          </div>

          {dayOrders.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Нет заказов на этот день.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {dayOrders.map((order) => {
                const remaining = Math.max(0, order.paid_amount - order.advance_payment)
                const isCompleted = order.status === 'Выдан'
                return (
                  <li key={order.id} className="py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {order.client_name}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusStyles[order.status]}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {orderCakeName(order, cakes)} · {order.actual_weight_kg.toFixed(3)} кг ·{' '}
                          {formatDay(order.delivery_date)}
                        </p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                          Сумма: {formatMoney(order.paid_amount)} ₽ · Аванс:{' '}
                          {formatMoney(order.advance_payment)} ₽ ·{' '}
                          {isCompleted ? (
                            <span className="font-medium text-emerald-500">Оплачено</span>
                          ) : (
                            `Остаток: ${formatMoney(remaining)} ₽`
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(order)}
                          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-600"
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => onReceipt(order)}
                          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50 dark:bg-slate-700 dark:text-emerald-300 dark:ring-emerald-800 dark:hover:bg-emerald-900/30"
                        >
                          Чек
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
