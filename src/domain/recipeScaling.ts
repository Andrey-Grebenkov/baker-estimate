export type PanShape = 'round' | 'rectangular'

export interface RoundPan {
  shape: 'round'
  diameter: number
}

export interface RectangularPan {
  shape: 'rectangular'
  length: number
  width: number
}

export type Pan = RoundPan | RectangularPan

/** Calculates the area of a baking pan. */
export function panArea(pan: Pan): number {
  if (pan.shape === 'round') {
    const radius = pan.diameter / 2
    return Math.PI * radius * radius
  }
  return pan.length * pan.width
}

/**
 * Calculates the scaling coefficient from a source pan to a target pan.
 * Works across shapes (round to rectangular, etc.) by comparing areas.
 */
export function calculateScalingCoefficient(source: Pan, target: Pan): number {
  const sourceArea = panArea(source)
  if (sourceArea === 0) return 0
  return panArea(target) / sourceArea
}

/** Rounds a value to a given number of decimal places. */
export function roundToDecimal(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Scales a single ingredient quantity by the coefficient and rounds to 1 decimal. */
export function scaleIngredientQuantity(quantity: number, coefficient: number): number {
  return roundToDecimal(quantity * coefficient, 1)
}
