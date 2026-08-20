import { describe, expect, it } from 'vitest'
import {
  calculateScalingCoefficient,
  panArea,
  roundToDecimal,
  scaleIngredientQuantity,
  type Pan,
} from './recipeScaling'

const round16: Pan = { shape: 'round', diameter: 16 }
const round20: Pan = { shape: 'round', diameter: 20 }
const round18: Pan = { shape: 'round', diameter: 18 }
const rect20x30: Pan = { shape: 'rectangular', length: 20, width: 30 }
const rect25x35: Pan = { shape: 'rectangular', length: 25, width: 35 }

describe('panArea', () => {
  it('calculates round pan area', () => {
    expect(panArea(round16)).toBeCloseTo(Math.PI * 64, 6)
    expect(panArea(round20)).toBeCloseTo(Math.PI * 100, 6)
  })

  it('calculates rectangular pan area', () => {
    expect(panArea(rect20x30)).toBe(600)
    expect(panArea(rect25x35)).toBe(875)
  })
})

describe('calculateScalingCoefficient', () => {
  it('round 16cm to round 20cm is exactly 1.5625', () => {
    const k = calculateScalingCoefficient(round16, round20)
    expect(k).toBe(1.5625)
  })

  it('round 20cm to round 16cm is exactly 0.64', () => {
    const k = calculateScalingCoefficient(round20, round16)
    expect(k).toBe(0.64)
  })

  it('round 18cm to round 18cm is exactly 1', () => {
    const k = calculateScalingCoefficient(round18, round18)
    expect(k).toBe(1)
  })

  it('rectangular 20x30 to rectangular 25x35 is exactly 35/24', () => {
    const k = calculateScalingCoefficient(rect20x30, rect25x35)
    expect(k).toBeCloseTo(875 / 600, 10)
  })

  it('scales from round to rectangular using area ratio', () => {
    const k = calculateScalingCoefficient(round16, rect20x30)
    const expected = 600 / (Math.PI * 64)
    expect(k).toBeCloseTo(expected, 10)
  })

  it('returns 0 when source area is 0', () => {
    const k = calculateScalingCoefficient({ shape: 'round', diameter: 0 }, round20)
    expect(k).toBe(0)
  })
})

describe('roundToDecimal', () => {
  it('rounds to 1 decimal place', () => {
    expect(roundToDecimal(187.45, 1)).toBe(187.5)
    expect(roundToDecimal(187.44, 1)).toBe(187.4)
  })

  it('rounds to 2 decimal places', () => {
    expect(roundToDecimal(1.5625, 2)).toBe(1.56)
  })
})

describe('scaleIngredientQuantity', () => {
  it('scales and rounds ingredient quantity to 1 decimal', () => {
    expect(scaleIngredientQuantity(100, 1.5625)).toBe(156.3)
    expect(scaleIngredientQuantity(120, 1.5625)).toBe(187.5)
    expect(scaleIngredientQuantity(100, 0.64)).toBe(64)
  })
})
