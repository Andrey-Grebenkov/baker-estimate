import { describe, expect, it } from 'vitest'
import { buildIngredient } from './ingredient'
import { buildRecipe } from './recipe'
import { generateShoppingList, formatShoppingList } from './shoppingList'

function makeIngredient(id: string, name: string, price = 100, quantity = 1000) {
  return buildIngredient({
    id,
    user_id: 'user',
    name,
    pricePerPackage: price,
    packageQuantity: quantity,
    unit: 'g',
  })
}

describe('generateShoppingList', () => {
  it('aggregates the same ingredient across multiple recipes', () => {
    const sugar = makeIngredient('ing-1', 'Сахар', 100, 1000)
    const flour = makeIngredient('ing-2', 'Мука', 150, 1000)

    const recipe1 = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Бисквит',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 100 }],
      },
      { [sugar.id]: sugar, [flour.id]: flour },
    )

    const recipe2 = buildRecipe(
      {
        id: 'rec-2',
        user_id: 'user',
        name: 'Крем',
        ingredients: [
          { ingredientId: sugar.id, quantityUsed: 50 },
          { ingredientId: flour.id, quantityUsed: 20 },
        ],
      },
      { [sugar.id]: sugar, [flour.id]: flour },
    )

    const items = generateShoppingList(
      [
        { recipeId: recipe1.id, multiplier: 1 },
        { recipeId: recipe2.id, multiplier: 1 },
      ],
      { [recipe1.id]: recipe1, [recipe2.id]: recipe2 },
      { [sugar.id]: sugar, [flour.id]: flour },
    )

    expect(items).toHaveLength(2)
    const sugarItem = items.find((i) => i.ingredientId === sugar.id)
    expect(sugarItem?.totalQuantity).toBe(150)
    expect(sugarItem?.estimatedCost).toBe(15)
    const flourItem = items.find((i) => i.ingredientId === flour.id)
    expect(flourItem?.totalQuantity).toBe(20)
    expect(flourItem?.estimatedCost).toBe(3)
  })

  it('scales quantities by recipe multiplier', () => {
    const sugar = makeIngredient('ing-1', 'Сахар', 200, 1000)
    const recipe = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Бисквит',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 100 }],
      },
      { [sugar.id]: sugar },
    )

    const items = generateShoppingList(
      [{ recipeId: recipe.id, multiplier: 2.5 }],
      { [recipe.id]: recipe },
      { [sugar.id]: sugar },
    )

    expect(items[0].totalQuantity).toBe(250)
    expect(items[0].estimatedCost).toBe(50)
  })

  it('skips recipes with missing references', () => {
    const sugar = makeIngredient('ing-1', 'Сахар', 100, 1000)
    const recipe = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Бисквит',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 100 }],
      },
      { [sugar.id]: sugar },
    )

    const items = generateShoppingList(
      [{ recipeId: 'missing', multiplier: 1 }],
      { [recipe.id]: recipe },
      { [sugar.id]: sugar },
    )

    expect(items).toHaveLength(0)
  })

  it('sorts items alphabetically', () => {
    const ingB = makeIngredient('ing-2', 'Банан', 100, 1000)
    const ingA = makeIngredient('ing-1', 'Абрикос', 100, 1000)

    const recipe = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Фруктовый',
        ingredients: [
          { ingredientId: ingB.id, quantityUsed: 100 },
          { ingredientId: ingA.id, quantityUsed: 100 },
        ],
      },
      { [ingA.id]: ingA, [ingB.id]: ingB },
    )

    const items = generateShoppingList(
      [{ recipeId: recipe.id, multiplier: 1 }],
      { [recipe.id]: recipe },
      { [ingA.id]: ingA, [ingB.id]: ingB },
    )

    expect(items[0].name).toBe('Абрикос')
    expect(items[1].name).toBe('Банан')
  })
})

describe('formatShoppingList', () => {
  it('formats shopping list as plain text', () => {
    const text = formatShoppingList([
      { ingredientId: '1', name: 'Сахар', totalQuantity: 150, unit: 'g', estimatedCost: 15 },
      { ingredientId: '2', name: 'Мука', totalQuantity: 200, unit: 'g', estimatedCost: 30 },
    ])
    expect(text).toContain('Сахар: 150 г — 15.00 ₽')
    expect(text).toContain('Мука: 200 г — 30.00 ₽')
  })
})
