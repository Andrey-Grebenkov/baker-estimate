import type { OrderStatus } from '../domain/types'

export const ORDER_STATUSES: OrderStatus[] = ['Новый', 'В работе', 'Выдан', 'Отменен']

export const statusStyles: Record<OrderStatus, string> = {
  'Новый':
    'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600',
  'В работе':
    'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-700',
  'Выдан':
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-700',
  'Отменен':
    'bg-slate-700 text-slate-400 ring-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-600',
}

export const dotColor: Record<OrderStatus, string> = {
  'Новый': 'bg-slate-400',
  'В работе': 'bg-blue-500',
  'Выдан': 'bg-emerald-500',
  'Отменен': 'bg-slate-500',
}
