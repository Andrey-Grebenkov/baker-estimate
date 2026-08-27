import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { buildIngredient } from '../domain/ingredient'
import { buildRecipe } from '../domain/recipe'
import { buildCake } from '../domain/cake'
import type { AppState } from '../hooks/useAppState'
import { CalculationPage } from './CalculationPage'

function createMockState(): AppState {
  const flour = buildIngredient({
    id: 'ing-1',
    user_id: 'u-1',
    name: 'Мука',
    pricePerPackage: 100,
    packageQuantity: 1000,
    unit: 'g',
  })

  const eggs = buildIngredient({
    id: 'ing-2',
    user_id: 'u-1',
    name: 'Яйца',
    pricePerPackage: 120,
    packageQuantity: 10,
    unit: 'pcs',
  })

  const biscuit = buildRecipe(
    {
      id: 'rec-1',
      user_id: 'u-1',
      name: 'Бисквит',
      ingredients: [{ ingredientId: flour.id, quantityUsed: 300 }],
    },
    { [flour.id]: flour },
  )

  const cream = buildRecipe(
    {
      id: 'rec-2',
      user_id: 'u-1',
      name: 'Крем',
      ingredients: [
        { ingredientId: flour.id, quantityUsed: 100 },
        { ingredientId: eggs.id, quantityUsed: 2 },
      ],
    },
    { [flour.id]: flour, [eggs.id]: eggs },
  )

  const cake = buildCake(
    {
      id: 'cake-1',
      user_id: 'u-1',
      name: 'Торт',
      recipes: [
        { recipeId: biscuit.id, multiplier: 1 },
        { recipeId: cream.id, multiplier: 1 },
      ],
      packaging: [],
      decor: [],
      overheads: { workHours: 0, hourlyRate: 0, fixedCosts: 0 },
      base_yield_weight: 1,
      base_yield_unit: 'кг',
      marginPercent: 0,
    },
    { [biscuit.id]: biscuit, [cream.id]: cream },
  )

  return {
    ingredients: [flour, eggs],
    recipes: [biscuit, cream],
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
    addOrder: vi.fn(),
    updateOrder: vi.fn(),
    deleteOrder: vi.fn(),
  }
}

describe('CalculationPage', () => {
  it('renders the page title and empty state', () => {
    render(<CalculationPage state={createMockState()} />)
    expect(screen.getByTestId('calculation-title').textContent).toBe('Расчет')
    expect(screen.getByTestId('calc-empty-state').textContent).toContain('Выберите торт')
  })

  it('displays the selected cake base yield', async () => {
    render(<CalculationPage state={createMockState()} />)
    fireEvent.change(screen.getByTestId('calc-cake-select'), {
      target: { value: 'cake-1' },
    })
    await waitFor(() => {
      expect(screen.getByTestId('calc-cake-reference-yield').textContent).toContain('1 кг')
    })
  })

  it('updates the scale coefficient when the target weight changes', async () => {
    render(<CalculationPage state={createMockState()} />)
    fireEvent.change(screen.getByTestId('calc-cake-select'), {
      target: { value: 'cake-1' },
    })

    const targetInput = screen.getByTestId('calc-target-weight-input') as HTMLInputElement
    await waitFor(() => {
      expect(targetInput.value).toBe('1')
      expect(screen.getByTestId('calc-multiplier-value').textContent).toBe('1')
    })

    fireEvent.change(targetInput, { target: { value: '2' } })
    await waitFor(() => {
      expect(screen.getByTestId('calc-multiplier-value').textContent).toBe('2')
    })
  })

  it('scales the ingredient quantities by the coefficient', async () => {
    render(<CalculationPage state={createMockState()} />)
    fireEvent.change(screen.getByTestId('calc-cake-select'), {
      target: { value: 'cake-1' },
    })

    const targetInput = screen.getByTestId('calc-target-weight-input') as HTMLInputElement
    fireEvent.change(targetInput, { target: { value: '2' } })

    await waitFor(() => {
      const rows = screen.getAllByTestId('calc-ingredient-row')
      const flourRows = rows.filter((r) => r.textContent?.includes('Мука'))
      const eggRows = rows.filter((r) => r.textContent?.includes('Яйца'))

      expect(flourRows.some((r) => r.textContent?.includes('600 г'))).toBe(true)
      expect(flourRows.some((r) => r.textContent?.includes('200 г'))).toBe(true)
      expect(eggRows.some((r) => r.textContent?.includes('4 шт'))).toBe(true)
    })
  })

  it('blocks typing more than three digits after the decimal point', async () => {
    render(<CalculationPage state={createMockState()} />)
    fireEvent.change(screen.getByTestId('calc-cake-select'), {
      target: { value: 'cake-1' },
    })

    const targetInput = screen.getByTestId('calc-target-weight-input') as HTMLInputElement
    fireEvent.change(targetInput, { target: { value: '1.234' } })
    await waitFor(() => {
      expect(targetInput.value).toBe('1.234')
    })

    fireEvent.change(targetInput, { target: { value: '1.2345' } })
    await waitFor(() => {
      expect(targetInput.value).toBe('1.234')
    })

    fireEvent.change(targetInput, { target: { value: '12.345' } })
    await waitFor(() => {
      expect(targetInput.value).toBe('12.345')
    })

    fireEvent.change(targetInput, { target: { value: '12.3456' } })
    await waitFor(() => {
      expect(targetInput.value).toBe('12.345')
    })
  })

  it('applies pan scaling and updates the target weight and coefficient', async () => {
    render(<CalculationPage state={createMockState()} />)
    fireEvent.change(screen.getByTestId('calc-cake-select'), {
      target: { value: 'cake-1' },
    })

    fireEvent.click(screen.getByTestId('calc-toggle-pan-calc'))
    fireEvent.click(screen.getByTestId('calc-apply-pan-scaling'))

    await waitFor(() => {
      const targetInput = screen.getByTestId('calc-target-weight-input') as HTMLInputElement
      expect(targetInput.value).toBe('1.5625')
      expect(screen.getByTestId('calc-multiplier-value').textContent).toBe('1.563')
    })
  })
})
