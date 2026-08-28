import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OrdersPage } from './OrdersPage'
import type { AppState } from '../hooks/useAppState'
import type { Order } from '../domain/types'

function createMockState(orders: Order[]): AppState {
  return {
    ingredients: [],
    recipes: [],
    cakes: [],
    orders,
    isLoading: false,
    initialized: true,
    error: null,
    clearError: vi.fn(),
    reload: vi.fn(),
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
    deleteIngredient: vi.fn(),
    addRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    addCake: vi.fn(),
    updateCake: vi.fn(),
    deleteCake: vi.fn(),
    addOrder: vi.fn(),
    updateOrder: vi.fn(),
    deleteOrder: vi.fn(),
  }
}

function baseOrder(): Order {
  return {
    id: 'o-1',
    status: 'Новый',
    delivery_date: new Date().toISOString(),
    paid_amount: 1000,
    total_cost: 600,
    actual_cost: 600,
    advance_payment: 0,
    unit: 'кг',
  }
}

describe('OrdersPage', () => {
  it('counts completed orders toward revenue and all active orders toward costs and expected', async () => {
    const orders: Order[] = [
      {
        ...baseOrder(),
        id: 'o-1',
        status: 'Выдан',
        paid_amount: 1000,
        total_cost: 600,
      },
      {
        ...baseOrder(),
        id: 'o-2',
        status: 'В работе',
        paid_amount: 500,
        total_cost: 300,
      },
      {
        ...baseOrder(),
        id: 'o-3',
        status: 'Новый',
        paid_amount: 250,
        total_cost: 150,
      },
    ]

    render(<OrdersPage state={createMockState(orders)} />)

    const periodSelect = screen.getByTestId('orders-period-select') as HTMLSelectElement
    fireEvent.change(periodSelect, { target: { value: 'all' } })

    await waitFor(() => {
      // Revenue: only completed (order 1)
      expect(screen.getByTestId('orders-revenue').textContent).toContain('1 000')
      // Expected: pending orders (2 + 3)
      expect(screen.getByTestId('orders-expected').textContent).toContain('750')
      // Costs: all active orders (1 + 2 + 3)
      // Profit = revenue - totalCost = 1000 - (600 + 300 + 150) = -50
      expect(screen.getByTestId('orders-profit').textContent).toContain('-50')
    })
  })

  it('moves an order amount from "Ожидается" to "Выручка" when it is completed', async () => {
    const workingState = createMockState([
      {
        ...baseOrder(),
        status: 'В работе',
      },
    ])

    const { rerender } = render(<OrdersPage state={workingState} />)

    const periodSelect = screen.getByTestId('orders-period-select') as HTMLSelectElement
    fireEvent.change(periodSelect, { target: { value: 'all' } })

    await waitFor(() => {
      expect(screen.getByTestId('orders-revenue').textContent).toContain('0')
      expect(screen.getByTestId('orders-expected').textContent).toContain('1 000')
      expect(screen.getByTestId('orders-profit').textContent).toContain('-600')
    })

    rerender(
      <OrdersPage
        state={createMockState([
          {
            ...baseOrder(),
            status: 'Выдан',
          },
        ])}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('orders-revenue').textContent).toContain('1 000')
      expect(screen.getByTestId('orders-expected').textContent).toContain('0')
      expect(screen.getByTestId('orders-profit').textContent).toContain('400')
    })
  })

  it('excludes canceled orders from revenue, cost, and expected metrics', async () => {
    const orders: Order[] = [
      {
        ...baseOrder(),
        id: 'o-1',
        status: 'Выдан',
        paid_amount: 1000,
        total_cost: 600,
      },
      {
        ...baseOrder(),
        id: 'o-2',
        status: 'В работе',
        paid_amount: 500,
        total_cost: 300,
      },
      {
        ...baseOrder(),
        id: 'o-3',
        status: 'Отменен',
        paid_amount: 250,
        total_cost: 150,
      },
    ]

    render(<OrdersPage state={createMockState(orders)} />)

    const periodSelect = screen.getByTestId('orders-period-select') as HTMLSelectElement
    fireEvent.change(periodSelect, { target: { value: 'all' } })

    await waitFor(() => {
      expect(screen.getByTestId('orders-revenue').textContent).toContain('1 000')
      expect(screen.getByTestId('orders-expected').textContent).toContain('500')
      // Profit = revenue - (costs of active orders) = 1000 - (600 + 300) = 100
      expect(screen.getByTestId('orders-profit').textContent).toContain('100')
    })
  })

  it('shows zero metrics when there are no orders', () => {
    render(<OrdersPage state={createMockState([])} />)
    expect(screen.getByTestId('orders-revenue').textContent).toContain('0')
    expect(screen.getByTestId('orders-profit').textContent).toContain('0')
    expect(screen.getByTestId('orders-expected').textContent).toContain('0')
  })
})
