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

describe('OrdersPage', () => {
  it('calculates revenue and profit from paid_amount and total_cost', async () => {
    const today = new Date().toISOString()
    const orders: Order[] = [
      {
        id: 'o-1',
        status: 'Выдан',
        delivery_date: today,
        paid_amount: 1000,
        total_cost: 600,
        actual_cost: 600,
        advance_payment: 0,
        unit: 'кг',
      },
      {
        id: 'o-2',
        status: 'Новый',
        delivery_date: today,
        paid_amount: 500,
        total_cost: 300,
        actual_cost: 300,
        advance_payment: 0,
        unit: 'кг',
      },
    ]

    render(<OrdersPage state={createMockState(orders)} />)

    const periodSelect = screen.getByTestId('orders-period-select') as HTMLSelectElement
    fireEvent.change(periodSelect, { target: { value: 'all' } })

    await waitFor(() => {
      expect(screen.getByTestId('orders-revenue').textContent).toContain('1 500')
      expect(screen.getByTestId('orders-profit').textContent).toContain('600')
    })
  })

  it('shows zero profit when there are no orders', () => {
    render(<OrdersPage state={createMockState([])} />)
    expect(screen.getByTestId('orders-revenue').textContent).toContain('0')
    expect(screen.getByTestId('orders-profit').textContent).toContain('0')
  })
})
