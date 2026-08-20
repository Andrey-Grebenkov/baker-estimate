import { describe, expect, it } from 'vitest'
import { buildIngredient } from '../domain/ingredient'
import { buildRecipe } from '../domain/recipe'
import { buildCake } from '../domain/cake'
import {
  analyzeBackup,
  BACKUP_VERSION,
  createBackup,
  importBackupWithSelection,
  validateBackup,
} from './backup'

const userId = 'user-123'

function makeIngredient(id: string, name: string, price = 100, quantity = 1000) {
  return buildIngredient({
    id,
    user_id: userId,
    name,
    pricePerPackage: price,
    packageQuantity: quantity,
    unit: 'g',
  })
}

function makeRecipe(id: string, name: string, ingredient: ReturnType<typeof makeIngredient>) {
  return buildRecipe(
    {
      id,
      user_id: userId,
      name,
      ingredients: [{ ingredientId: ingredient.id, quantityUsed: 200 }],
    },
    { [ingredient.id]: ingredient },
  )
}

function makeCake(id: string, name: string, recipe: ReturnType<typeof makeRecipe>) {
  return buildCake(
    {
      id,
      user_id: userId,
      name,
      recipes: [{ recipeId: recipe.id, multiplier: 1 }],
      packaging: [],
      decor: [],
      overheads: { workHours: 1, hourlyRate: 100, fixedCosts: 0 },
      marginPercent: 30,
    },
    { [recipe.id]: recipe },
  )
}

describe('createBackup & validateBackup', () => {
  it('creates and validates a valid backup object', () => {
    const ingredient = makeIngredient('ing-1', 'Сахар')
    const recipe = makeRecipe('rec-1', 'Бисквит', ingredient)
    const cake = makeCake('cake-1', 'Торт', recipe)

    const backup = createBackup([ingredient], [recipe], [cake], userId)
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(backup.ingredients).toHaveLength(1)
    expect(backup.recipes).toHaveLength(1)
    expect(backup.cakes).toHaveLength(1)

    const validated = validateBackup(backup)
    expect(validated.ingredients[0].name).toBe('Сахар')
  })

  it('throws on unsupported version', () => {
    expect(() => validateBackup({ version: 99 })).toThrow(/версия/)
  })

  it('throws on invalid ingredients array', () => {
    expect(() => validateBackup({ version: BACKUP_VERSION, ingredients: [{}] })).toThrow(
      /ингредиентов/,
    )
  })

  it('throws on missing recipe references during analysis', () => {
    const backup = {
      version: BACKUP_VERSION,
      ingredients: [],
      recipes: [
        { id: 'rec-1', name: 'Бисквит', ingredients: [{ ingredientId: 'missing', quantityUsed: 100 }] },
      ],
      cakes: [],
    }
    expect(() =>
      analyzeBackup(backup, { ingredients: [], recipes: [], cakes: [] }, userId),
    ).toThrow(/ингредиент/)
  })
})

describe('analyzeBackup', () => {
  it('marks all backup items as new when current data is empty', () => {
    const ingredient = makeIngredient('ing-1', 'Сахар')
    const recipe = makeRecipe('rec-1', 'Бисквит', ingredient)
    const cake = makeCake('cake-1', 'Торт', recipe)
    const backup = createBackup([ingredient], [recipe], [cake], userId)

    const analysis = analyzeBackup(backup, { ingredients: [], recipes: [], cakes: [] }, userId)

    expect(analysis.ingredients.new).toHaveLength(1)
    expect(analysis.ingredients.conflicts).toHaveLength(0)
    expect(analysis.recipes.new).toHaveLength(1)
    expect(analysis.recipes.conflicts).toHaveLength(0)
    expect(analysis.cakes.new).toHaveLength(1)
    expect(analysis.cakes.conflicts).toHaveLength(0)
  })

  it('detects conflicts when IDs overlap', () => {
    const ingredient = makeIngredient('ing-1', 'Сахар')
    const recipe = makeRecipe('rec-1', 'Бисквит', ingredient)
    const cake = makeCake('cake-1', 'Торт', recipe)
    const backup = createBackup([ingredient], [recipe], [cake], userId)

    const current = {
      ingredients: [makeIngredient('ing-1', 'Сахар (cloud)', 150)],
      recipes: [makeRecipe('rec-1', 'Бисквит (cloud)', makeIngredient('ing-1', 'Сахар (cloud)', 150))],
      cakes: [makeCake('cake-1', 'Торт (cloud)', makeRecipe('rec-1', 'Бисквит (cloud)', makeIngredient('ing-1', 'Сахар (cloud)', 150)))],
    }

    const analysis = analyzeBackup(backup, current, userId)

    expect(analysis.ingredients.new).toHaveLength(0)
    expect(analysis.ingredients.conflicts).toHaveLength(1)
    expect(analysis.ingredients.conflicts[0].item.name).toBe('Сахар')
    expect(analysis.ingredients.conflicts[0].current.name).toBe('Сахар (cloud)')

    expect(analysis.recipes.new).toHaveLength(0)
    expect(analysis.recipes.conflicts).toHaveLength(1)

    expect(analysis.cakes.new).toHaveLength(0)
    expect(analysis.cakes.conflicts).toHaveLength(1)
  })

  it('mixes new and conflicted items', () => {
    const ing1 = makeIngredient('ing-1', 'Сахар')
    const ing2 = makeIngredient('ing-2', 'Мука')
    const recipe = makeRecipe('rec-1', 'Бисквит', ing1)
    const backup = createBackup([ing1, ing2], [recipe], [], userId)

    const current = { ingredients: [ing1], recipes: [recipe], cakes: [] }

    const analysis = analyzeBackup(backup, current, userId)

    expect(analysis.ingredients.new).toHaveLength(1)
    expect(analysis.ingredients.new[0].id).toBe('ing-2')
    expect(analysis.ingredients.conflicts).toHaveLength(1)
    expect(analysis.ingredients.conflicts[0].item.id).toBe('ing-1')
  })
})

describe('importBackupWithSelection', () => {
  it('imports all items when current data is empty', async () => {
    const ingredient = makeIngredient('ing-1', 'Сахар')
    const recipe = makeRecipe('rec-1', 'Бисквит', ingredient)
    const cake = makeCake('cake-1', 'Торт', recipe)
    const backup = createBackup([ingredient], [recipe], [cake], userId)

    const result = await importBackupWithSelection(
      backup,
      userId,
      new Set(),
      { ingredients: [], recipes: [], cakes: [] },
    )

    expect(result.ingredients).toBe(1)
    expect(result.recipes).toBe(1)
    expect(result.cakes).toBe(1)
  })

  it('skips conflicted items when not selected', async () => {
    const ingredient = makeIngredient('ing-1', 'Сахар')
    const recipe = makeRecipe('rec-1', 'Бисквит', ingredient)
    const cake = makeCake('cake-1', 'Торт', recipe)
    const backup = createBackup([ingredient], [recipe], [cake], userId)

    const current = {
      ingredients: [ingredient],
      recipes: [recipe],
      cakes: [cake],
    }

    const result = await importBackupWithSelection(backup, userId, new Set(), current)

    expect(result.ingredients).toBe(0)
    expect(result.recipes).toBe(0)
    expect(result.cakes).toBe(0)
  })

  it('overwrites selected conflicted items', async () => {
    const ingredient = makeIngredient('ing-1', 'Сахар')
    const recipe = makeRecipe('rec-1', 'Бисквит', ingredient)
    const cake = makeCake('cake-1', 'Торт', recipe)
    const backup = createBackup([ingredient], [recipe], [cake], userId)

    const current = {
      ingredients: [makeIngredient('ing-1', 'Сахар (cloud)', 150)],
      recipes: [recipe],
      cakes: [cake],
    }

    const result = await importBackupWithSelection(
      backup,
      userId,
      new Set(['ing-1', 'rec-1', 'cake-1']),
      current,
    )

    expect(result.ingredients).toBe(1)
    expect(result.recipes).toBe(1)
    expect(result.cakes).toBe(1)
  })

  it('imports new items and overwrites selected conflicts', async () => {
    const ing1 = makeIngredient('ing-1', 'Сахар')
    const ing2 = makeIngredient('ing-2', 'Мука')
    const recipe = makeRecipe('rec-1', 'Бисквит', ing1)
    const backup = createBackup([ing1, ing2], [recipe], [], userId)

    const current = { ingredients: [ing1], recipes: [recipe], cakes: [] }

    const result = await importBackupWithSelection(backup, userId, new Set(['ing-1', 'rec-1']), current)

    expect(result.ingredients).toBe(2)
    expect(result.recipes).toBe(1)
    expect(result.cakes).toBe(0)
  })
})
