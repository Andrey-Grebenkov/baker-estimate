import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OrderModal } from './OrderModal'
import type { AppState } from '../hooks/useAppState'
import type { Order } from '../domain/types'
import { buildIngredient } from '../domain/ingredient'
import { buildRecipe } from '../domain/recipe'
import { buildCake } from '../domain/cake'

const flour = buildIngredient({
  id: 'ing-1',
  user_id: 'u-1',
  name: 'Мука',
  pricePerPackage: 100,
  packageQuantity: 1000,
  unit: 'g',
})

const recipe = buildRecipe(
  {
    id: 'rec-1',
    user_id: 'u-1',
    name: 'Бисквит',
    ingredients: [{ ingredientId: flour.id, quantityUsed: 1000 }],
  },
  { [flour.id]: flour },
)

const cake = buildCake(
  {
    id: 'cake-1',
    user_id: 'u-1',
    name: 'Торт',
    recipes: [{ recipeId: recipe.id, multiplier: 1 }],
    packaging: [],
    decor: [],
    overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
    base_yield_weight: 1,
    base_yield_unit: 'кг',
    marginPercent: 0,
  },
  { [recipe.id]: recipe },
)

function createMockState(): AppState {
  return {
    ingredients: [flour],
    recipes: [recipe],
    cakes: [cake],
    orders: [],
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
    addOrder: vi.fn(() => Promise.resolve()),
    updateOrder: vi.fn(() => Promise.resolve()),
    deleteOrder: vi.fn(),
  }
}

describe('OrderModal total_cost snapshot', () => {
  it('defaults total_cost to 0 when no cake is selected', async () => {
    const state = createMockState()
    render(<OrderModal isOpen state={state} onClose={() => {}} />)

    const weightInput = screen.getByTestId('order-weight-input') as HTMLInputElement
    const paidInput = screen.getByTestId('order-paid-input') as HTMLInputElement

    fireEvent.change(weightInput, { target: { value: '2' } })
    fireEvent.change(paidInput, { target: { value: '500' } })

    fireEvent.click(screen.getByTestId('order-modal-submit'))

    await waitFor(() => {
      expect(state.addOrder).toHaveBeenCalled()
    })

    const input = (state.addOrder as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(input.total_cost).toBe(0)
    expect(input.actual_cost).toBe(0)
    expect(input.cake_id).toBeUndefined()
  })

  it('preserves total_cost when editing status and recalculates when weight changes', async () => {
    const state = createMockState()
    const order: Order = {
      id: 'o-1',
      cake_id: cake.id,
      status: 'Новый',
      delivery_date: new Date().toISOString(),
      actual_weight_kg: 1,
      actual_cost: 100,
      total_cost: 100,
      paid_amount: 300,
      advance_payment: 0,
      unit: 'кг',
    }

    const { unmount } = render(<OrderModal isOpen state={state} orderToEdit={order} onClose={() => {}} />)

    fireEvent.change(screen.getByTestId('order-status-select') as HTMLSelectElement, {
      target: { value: 'В работе' },
    })
    fireEvent.click(screen.getByTestId('order-modal-submit'))

    await waitFor(() => {
      expect(state.updateOrder).toHaveBeenCalledTimes(1)
    })

    const statusUpdate = (state.updateOrder as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(statusUpdate.total_cost).toBe(100)

    unmount()

    render(<OrderModal isOpen state={state} orderToEdit={order} onClose={() => {}} />)

    const weightInput = screen.getByTestId('order-weight-input') as HTMLInputElement
    fireEvent.change(weightInput, { target: { value: '2' } })
    fireEvent.click(screen.getByTestId('order-modal-submit'))

    await waitFor(() => {
      expect(state.updateOrder).toHaveBeenCalledTimes(2)
    })

    const weightUpdate = (state.updateOrder as unknown as ReturnType<typeof vi.fn>).mock.calls[1][1]
    expect(weightUpdate.total_cost).toBe(200)
  })
})
