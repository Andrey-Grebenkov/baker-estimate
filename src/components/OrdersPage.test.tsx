import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OrdersPage } from './OrdersPage'
import type { AppState } from '../hooks/useAppState'
import type { Order } from '../domain/types'

const mockOtpProps = {
  email: 'test@example.com',
  isVerified: true,
  onSendOtp: vi.fn(() => Promise.resolve({ error: null })),
  onVerifyOtp: vi.fn(() => Promise.resolve({ error: null })),
  onOtpVerified: vi.fn(),
  onOpenSettings: vi.fn(),
}

function createMockState(orders: Order[], taxPercent = 0): AppState {
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
    taxPercent,
    updateTaxPercent: vi.fn(),
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

    render(<OrdersPage state={createMockState(orders)} {...mockOtpProps} />)

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

    const { rerender } = render(<OrdersPage state={workingState} {...mockOtpProps} />)

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
        {...mockOtpProps}
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

    render(<OrdersPage state={createMockState(orders)} {...mockOtpProps} />)

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
    render(<OrdersPage state={createMockState([])} {...mockOtpProps} />)
    expect(screen.getByTestId('orders-revenue').textContent).toContain('0')
    expect(screen.getByTestId('orders-profit').textContent).toContain('0')
    expect(screen.getByTestId('orders-expected').textContent).toContain('0')
  })

  it('keeps active orders from previous months in the default "month" view', () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString()

    const orders: Order[] = [
      {
        ...baseOrder(),
        id: 'o-old-active',
        status: 'В работе',
        delivery_date: lastMonth,
        client_name: 'Old Active',
      },
      {
        ...baseOrder(),
        id: 'o-old-completed',
        status: 'Выдан',
        delivery_date: lastMonth,
        client_name: 'Old Completed',
      },
      {
        ...baseOrder(),
        id: 'o-current-new',
        status: 'Новый',
        client_name: 'Current New',
      },
    ]

    render(<OrdersPage state={createMockState(orders)} {...mockOtpProps} />)

    const rows = screen.getAllByTestId('order-row')
    expect(rows).toHaveLength(2)
    expect(screen.getByText('Old Active')).toBeTruthy()
    expect(screen.queryByText('Old Completed')).toBeFalsy()
    expect(screen.getByText('Current New')).toBeTruthy()

    // Metrics: expected includes the old active order + the current new order,
    // realized revenue excludes them, and costs include both active orders.
    expect(screen.getByTestId('orders-expected').textContent).toContain('2 000')
    expect(screen.getByTestId('orders-revenue').textContent).toContain('0')
    expect(screen.getByTestId('orders-profit').textContent).toContain('-1 200')
  })

  it('deducts the configured tax from realized revenue and shows the tax chip', async () => {
    const orders: Order[] = [
      {
        ...baseOrder(),
        status: 'Выдан',
        paid_amount: 1000,
        total_cost: 600,
      },
    ]

    render(<OrdersPage state={createMockState(orders, 6)} {...mockOtpProps} />)

    const periodSelect = screen.getByTestId('orders-period-select') as HTMLSelectElement
    fireEvent.change(periodSelect, { target: { value: 'all' } })

    await waitFor(() => {
      // Tax = 6% of 1 000 = 60
      expect(screen.getByTestId('orders-tax').textContent).toContain('60')
      // Profit = revenue - cost - tax = 1 000 - 600 - 60 = 340
      expect(screen.getByTestId('orders-profit').textContent).toContain('340')
    })
  })

  it('hides the tax chip when no rate is configured', () => {
    render(<OrdersPage state={createMockState([baseOrder()])} {...mockOtpProps} />)
    expect(screen.queryByTestId('orders-tax')).toBeNull()
  })

  it('shows the trial-expired notice instead of orders when the trial is over', () => {
    render(
      <OrdersPage
        state={createMockState([baseOrder()])}
        {...mockOtpProps}
        isTrialExpired
      />,
    )
    expect(screen.getByTestId('trial-expired-notice')).toBeTruthy()
    expect(screen.queryByTestId('order-row')).toBeNull()

    fireEvent.click(screen.getByTestId('trial-subscribe-button'))
    expect(mockOtpProps.onOpenSettings).toHaveBeenCalledTimes(1)
  })
})
