import { describe, expect, it } from 'vitest'
import { buildIngredient } from './ingredient'
import { buildRecipe } from './recipe'
import { generateShoppingList, formatShoppingList, type ShoppingListItem } from './shoppingList'

function makeIngredient(
  id: string,
  name: string,
  price = 100,
  quantity = 1000,
  inStock?: number,
) {
  return buildIngredient({
    id,
    user_id: 'user',
    name,
    pricePerPackage: price,
    packageQuantity: quantity,
    unit: 'g',
    inStock,
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

    const result = generateShoppingList(
      [
        { recipeId: recipe1.id, multiplier: 1 },
        { recipeId: recipe2.id, multiplier: 1 },
      ],
      { [recipe1.id]: recipe1, [recipe2.id]: recipe2 },
      { [sugar.id]: sugar, [flour.id]: flour },
    )

    expect(result.hasIngredients).toBe(true)
    expect(result.toBuy).toHaveLength(2)

    const sugarItem = result.toBuy.find((i) => i.ingredientId === sugar.id)
    expect(sugarItem?.toBuy).toBe(150)
    expect(sugarItem?.packagesToBuy).toBe(1)
    expect(sugarItem?.purchaseQuantity).toBe(1000)
    expect(sugarItem?.purchasePrice).toBe(100)

    const flourItem = result.toBuy.find((i) => i.ingredientId === flour.id)
    expect(flourItem?.toBuy).toBe(20)
    expect(flourItem?.packagesToBuy).toBe(1)
    expect(flourItem?.purchaseQuantity).toBe(1000)
    expect(flourItem?.purchasePrice).toBe(150)
  })

  it('scales quantities by recipe multiplier and rounds up to whole packages', () => {
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

    const result = generateShoppingList(
      [{ recipeId: recipe.id, multiplier: 2.5 }],
      { [recipe.id]: recipe },
      { [sugar.id]: sugar },
    )

    expect(result.toBuy[0].toBuy).toBe(250)
    expect(result.toBuy[0].packagesToBuy).toBe(1)
    expect(result.toBuy[0].purchaseQuantity).toBe(1000)
    expect(result.toBuy[0].purchasePrice).toBe(200)
  })

  it('buys multiple whole packages when the deficit exceeds one package', () => {
    const sugar = makeIngredient('ing-1', 'Сахар', 100, 1000)
    const recipe = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Бисквит',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 2500 }],
      },
      { [sugar.id]: sugar },
    )

    const result = generateShoppingList(
      [{ recipeId: recipe.id, multiplier: 1 }],
      { [recipe.id]: recipe },
      { [sugar.id]: sugar },
    )

    expect(result.toBuy[0].toBuy).toBe(2500)
    expect(result.toBuy[0].packagesToBuy).toBe(3)
    expect(result.toBuy[0].purchaseQuantity).toBe(3000)
    expect(result.toBuy[0].purchasePrice).toBe(300)
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

    const result = generateShoppingList(
      [{ recipeId: 'missing', multiplier: 1 }],
      { [recipe.id]: recipe },
      { [sugar.id]: sugar },
    )

    expect(result.hasIngredients).toBe(false)
    expect(result.toBuy).toHaveLength(0)
    expect(result.inStock).toHaveLength(0)
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

    const result = generateShoppingList(
      [{ recipeId: recipe.id, multiplier: 1 }],
      { [recipe.id]: recipe },
      { [ingA.id]: ingA, [ingB.id]: ingB },
    )

    expect(result.toBuy[0].name).toBe('Абрикос')
    expect(result.toBuy[1].name).toBe('Банан')
  })

  it('moves fully covered ingredients to the in-stock section', () => {
    const sugar = makeIngredient('ing-1', 'Сахар', 100, 1000, 200)
    const recipe = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Бисквит',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 150 }],
      },
      { [sugar.id]: sugar },
    )

    const result = generateShoppingList(
      [{ recipeId: recipe.id, multiplier: 1 }],
      { [recipe.id]: recipe },
      { [sugar.id]: sugar },
    )

    expect(result.toBuy).toHaveLength(0)
    expect(result.inStock).toHaveLength(1)
    expect(result.inStock[0].ingredientId).toBe(sugar.id)
    expect(result.inStock[0].required).toBe(150)
    expect(result.inStock[0].inStock).toBe(200)
    expect(result.inStock[0].packagesToBuy).toBe(0)
  })

  it('adds only deficit when stock partially covers the need', () => {
    const sugar = makeIngredient('ing-1', 'Сахар', 100, 1000, 50)
    const recipe = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Бисквит',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 150 }],
      },
      { [sugar.id]: sugar },
    )

    const result = generateShoppingList(
      [{ recipeId: recipe.id, multiplier: 1 }],
      { [recipe.id]: recipe },
      { [sugar.id]: sugar },
    )

    expect(result.toBuy).toHaveLength(1)
    expect(result.inStock).toHaveLength(0)
    expect(result.toBuy[0].toBuy).toBe(100)
    expect(result.toBuy[0].required).toBe(150)
    expect(result.toBuy[0].inStock).toBe(50)
    expect(result.toBuy[0].packagesToBuy).toBe(1)
    expect(result.toBuy[0].purchaseQuantity).toBe(1000)
    expect(result.toBuy[0].purchasePrice).toBe(100)
  })

  it('treats undefined stock as zero and buys one whole package', () => {
    const sugar = makeIngredient('ing-1', 'Сахар', 100, 1000)
    const recipe = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Бисквит',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 80 }],
      },
      { [sugar.id]: sugar },
    )

    const result = generateShoppingList(
      [{ recipeId: recipe.id, multiplier: 1 }],
      { [recipe.id]: recipe },
      { [sugar.id]: sugar },
    )

    expect(result.toBuy[0].toBuy).toBe(80)
    expect(result.toBuy[0].packagesToBuy).toBe(1)
    expect(result.toBuy[0].purchaseQuantity).toBe(1000)
    expect(result.toBuy[0].purchasePrice).toBe(100)
  })

  it('deducts stock across multiple recipes for the same ingredient', () => {
    const sugar = makeIngredient('ing-1', 'Сахар', 100, 1000, 80)

    const recipe1 = buildRecipe(
      {
        id: 'rec-1',
        user_id: 'user',
        name: 'Бисквит',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 100 }],
      },
      { [sugar.id]: sugar },
    )

    const recipe2 = buildRecipe(
      {
        id: 'rec-2',
        user_id: 'user',
        name: 'Крем',
        ingredients: [{ ingredientId: sugar.id, quantityUsed: 50 }],
      },
      { [sugar.id]: sugar },
    )

    const result = generateShoppingList(
      [
        { recipeId: recipe1.id, multiplier: 1 },
        { recipeId: recipe2.id, multiplier: 1 },
      ],
      { [recipe1.id]: recipe1, [recipe2.id]: recipe2 },
      { [sugar.id]: sugar },
    )

    expect(result.toBuy).toHaveLength(1)
    expect(result.toBuy[0].toBuy).toBe(70)
    expect(result.toBuy[0].packagesToBuy).toBe(1)
    expect(result.toBuy[0].purchaseQuantity).toBe(1000)
    expect(result.toBuy[0].purchasePrice).toBe(100)
  })
})

describe('formatShoppingList', () => {
  it('formats shopping list as whole packages', () => {
    const items: ShoppingListItem[] = [
      {
        ingredientId: '1',
        name: 'Сахар',
        unit: 'g',
        required: 150,
        inStock: 0,
        toBuy: 150,
        packagesToBuy: 1,
        purchaseQuantity: 1000,
        purchasePrice: 100,
      },
      {
        ingredientId: '2',
        name: 'Мука',
        unit: 'g',
        required: 200,
        inStock: 0,
        toBuy: 200,
        packagesToBuy: 1,
        purchaseQuantity: 1000,
        purchasePrice: 150,
      },
    ]
    const text = formatShoppingList(items)
    expect(text).toContain('Сахар: 1 упак. (1000 г) — 100.00 ₽')
    expect(text).toContain('Мука: 1 упак. (1000 г) — 150.00 ₽')
  })

  it('omits in-stock items from the copied text', () => {
    const items: ShoppingListItem[] = [
      {
        ingredientId: '1',
        name: 'Сахар',
        unit: 'g',
        required: 150,
        inStock: 200,
        toBuy: 0,
        packagesToBuy: 0,
        purchaseQuantity: 0,
        purchasePrice: 0,
      },
    ]
    const text = formatShoppingList(items)
    expect(text).toBe('')
  })
})
