import { useMemo, useState } from 'react'
import { Calendar, FileText, List, MessageSquare } from 'lucide-react'
import type { AppState } from '../hooks/useAppState'
import { formatMoney } from '../domain/money'
import { getPeriodRange, isDateInRange, formatPeriodRevenue, type PeriodFilter } from '../lib/dateFilter'
import { OrderModal } from './OrderModal'
import { ClientReceiptModal } from './ClientReceiptModal'
import { OrderCalendarView } from './OrderCalendarView'
import { EditCommentModal } from './EditCommentModal'
import { ViewInternalCommentModal } from './ViewInternalCommentModal'
import { OrderStatusDropdown } from './OrderStatusDropdown'
import { CompleteOrderModal } from './CompleteOrderModal'
import type { Order, OrderInput, OrderStatus } from '../domain/types'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function toOrderInput(order: Order, overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    cake_id: order.cake_id,
    client_name: order.client_name,
    client_phone: order.client_phone,
    status: order.status,
    delivery_date: order.delivery_date,
    actual_weight_kg: order.actual_weight_kg,
    actual_cost: order.actual_cost,
    total_cost: order.total_cost,
    paid_amount: order.paid_amount,
    advance_payment: order.advance_payment,
    completion_comment: order.completion_comment,
    unit: order.unit,
    ...overrides,
  }
}

type ViewMode = 'list' | 'calendar'

export function OrdersPage({ state }: { state: AppState }) {
  const [view, setView] = useState<ViewMode>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const [completingOrder, setCompletingOrder] = useState<Order | null>(null)
  const [commentOrder, setCommentOrder] = useState<Order | null>(null)
  const [internalCommentOrder, setInternalCommentOrder] = useState<Order | null>(null)

  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const sortedOrders = useMemo(
    () =>
      [...state.orders].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return bTime - aTime
      }),
    [state.orders],
  )

  const dateRange = useMemo(
    () => getPeriodRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  )

  const filteredOrders = useMemo(
    () =>
      dateRange ? sortedOrders.filter((order) => isDateInRange(order.delivery_date, dateRange)) : sortedOrders,
    [sortedOrders, dateRange],
  )

  const revenue = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.paid_amount, 0),
    [filteredOrders],
  )

  const totalCost = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + (order.total_cost ?? 0), 0),
    [filteredOrders],
  )

  const profit = useMemo(() => revenue - totalCost, [revenue, totalCost])

  const receiptCake = receiptOrder
    ? state.cakes.find((c) => c.id === receiptOrder.cake_id)
    : undefined

  const openAdd = () => {
    setEditingOrder(null)
    setIsModalOpen(true)
  }

  const openEdit = (order: Order) => {
    setEditingOrder(order)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingOrder(null)
  }

  const openReceipt = (order: Order) => {
    setReceiptOrder(order)
  }

  const closeComplete = () => {
    setCompletingOrder(null)
  }

  const closeComment = () => {
    setCommentOrder(null)
  }

  const closeInternalComment = () => {
    setInternalCommentOrder(null)
  }

  const handleStatusSelect = (order: Order, status: OrderStatus) => {
    if (status === order.status) return

    if (status === 'Выдан') {
      setCompletingOrder(order)
      return
    }

    state.updateOrder(order.id, toOrderInput(order, { status }))
  }

  return (
    <div data-testid="orders-page">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Учет продаж</h2>
          <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-600 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setView('list')}
              className={[
                'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'list'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
              ].join(' ')}
              data-testid="orders-view-list"
            >
              <List className="h-4 w-4" />
              Список
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={[
                'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'calendar'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
              ].join(' ')}
              data-testid="orders-view-calendar"
            >
              <Calendar className="h-4 w-4" />
              Календарь
            </button>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            data-testid="record-sale-button"
          >
            Отметить продажу
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          data-testid="orders-period-select"
        >
          <option value="today">За сегодня</option>
          <option value="week">За неделю</option>
          <option value="month">За месяц</option>
          <option value="custom">Выбрать период</option>
          <option value="all">За все время</option>
        </select>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-2" data-testid="orders-custom-range">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-10 w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              data-testid="orders-custom-start"
            />
            <span className="text-slate-500">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-10 w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              data-testid="orders-custom-end"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-start gap-4">
        <span
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-200"
          data-testid="orders-revenue"
        >
          Выручка: {formatPeriodRevenue(revenue)} ₽
        </span>

        <span
          className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-700/50 ${
            profit > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : profit < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-800 dark:text-slate-200'
          }`}
          data-testid="orders-profit"
        >
          Прибыль: {formatPeriodRevenue(profit)} ₽
        </span>
      </div>
    </div>

    {filteredOrders.length === 0 ? (
        <p className="text-sm text-slate-500" data-testid="orders-empty-state">
          {state.orders.length === 0
            ? 'Пока нет заказов. Нажмите «Отметить продажу», чтобы создать первую запись.'
            : 'Нет заказов за выбранный период.'}
        </p>
      ) : view === 'list' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:ring-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th
                  scope="col"
                  className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Статус
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Клиент
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Дата доставки
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Вес / Кол-во
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Сумма
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Аванс
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Остаток
                </th>
                <th
                  scope="col"
                  className="w-1 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Заметка
                </th>
                <th
                  scope="col"
                  className="w-1 px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
              {filteredOrders.map((order) => {
                const remaining = Math.max(0, order.paid_amount - order.advance_payment)
                const isCompleted = order.status === 'Выдан'
                return (
                  <tr key={order.id} data-testid="order-row" data-order-id={order.id}>
                    <td className="whitespace-nowrap px-2 py-2 text-center">
                      <div className="flex justify-center">
                        <OrderStatusDropdown
                          order={order}
                          onSelect={(status) => handleStatusSelect(order, status)}
                          disabled={state.isLoading}
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {order.client_name}
                      </div>
                      {order.client_phone && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {order.client_phone}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(order.delivery_date)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-600 dark:text-slate-300">
                      {order.actual_weight_kg != null ? `${Number(order.actual_weight_kg.toFixed(3))} ${order.unit ?? 'кг'}` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        {formatMoney(order.paid_amount)} ₽
                        {order.completion_comment && (
                          <MessageSquare
                            onClick={() => setCommentOrder(order)}
                            className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            data-testid="order-comment-icon"
                          />
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-slate-600 dark:text-slate-300">
                      {formatMoney(order.advance_payment)} ₽
                    </td>
                    <td
                      className={`whitespace-nowrap px-2 py-2 text-sm font-medium ${
                        isCompleted
                          ? 'text-emerald-500'
                          : remaining > 0
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }`}
                    >
                      {isCompleted ? 'Оплачено' : `${formatMoney(remaining)} ₽`}
                    </td>
                    <td className="w-1 whitespace-nowrap px-2 py-2 text-center">
                      {order.internal_comment?.trim() && (
                        <FileText
                          onClick={() => setInternalCommentOrder(order)}
                          className="h-4 w-4 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          data-testid="order-internal-comment-icon"
                        />
                      )}
                    </td>
                    <td className="w-1 whitespace-nowrap px-2 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(order)}
                          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-600"
                          data-testid="order-edit-button"
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => openReceipt(order)}
                          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50 dark:bg-slate-700 dark:text-emerald-300 dark:ring-emerald-800 dark:hover:bg-emerald-900/30"
                          data-testid="order-receipt-button"
                        >
                          Чек
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <OrderCalendarView
          orders={filteredOrders}
          cakes={state.cakes}
          onEdit={(order) => {
            setEditingOrder(order)
            setIsModalOpen(true)
          }}
          onReceipt={openReceipt}
        />
      )}

      <OrderModal
        isOpen={isModalOpen}
        onClose={closeModal}
        state={state}
        orderToEdit={editingOrder}
      />

      {receiptOrder && (
        <ClientReceiptModal
          order={receiptOrder}
          cake={receiptCake}
          recipes={state.recipes}
          isOpen={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {completingOrder && (
        <CompleteOrderModal
          order={completingOrder}
          state={state}
          isOpen={!!completingOrder}
          onClose={closeComplete}
        />
      )}

      {commentOrder && (
        <EditCommentModal
          isOpen={!!commentOrder}
          onClose={closeComment}
          order={commentOrder}
          state={state}
        />
      )}

      {internalCommentOrder && (
        <ViewInternalCommentModal
          isOpen={!!internalCommentOrder}
          onClose={closeInternalComment}
          order={internalCommentOrder}
        />
      )}
    </div>
  )
}
