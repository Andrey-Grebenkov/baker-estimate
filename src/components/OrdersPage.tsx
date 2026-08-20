import { useState } from 'react'
import type { AppState } from '../hooks/useAppState'
import { OrderModal } from './OrderModal'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

export function OrdersPage({ state }: { state: AppState }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div data-testid="orders-page">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Учет продаж</h2>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          data-testid="record-sale-button"
        >
          Отметить продажу
        </button>
      </div>

      {state.orders.length === 0 ? (
        <p className="text-sm text-slate-500" data-testid="orders-empty-state">
          Пока нет заказов. Нажмите «Отметить продажу», чтобы создать первую запись.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Клиент
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Дата доставки
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Вес, кг
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Себест.
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Оплачено
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Прибыль
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {state.orders.map((order) => {
                const profit = order.paid_amount - order.actual_cost
                return (
                  <tr key={order.id} data-testid="order-row" data-order-id={order.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-800">
                      {order.client_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {formatDate(order.delivery_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {order.actual_weight_kg.toFixed(3)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {formatMoney(order.actual_cost)} ₽
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {formatMoney(order.paid_amount)} ₽
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-sm font-medium ${
                        profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatMoney(profit)} ₽
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <OrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
