/**
 * Core scaling: turn a base amount + factor into a class-aware scaled amount.
 *
 * scaledAmount = baseAmount * factor ^ k   (k from the ingredient's class)
 *
 * `fixed` ingredients ignore the factor entirely. `discrete_aromatic` rounds
 * after applying the exponent.
 */
import type { Ingredient, ScaledIngredient } from './types';
import { CLASS_BEHAVIOR } from './classes';
import { roundDiscrete } from './round';

/** Amounts within this relative tolerance are treated as "not adjusted". */
const ADJUST_EPSILON = 1e-6;

export function scaleAmount(
  baseAmount: number,
  factor: number,
  scalingClass: Ingredient['scalingClass'],
): { scaledAmount: number; rounded: boolean } {
  const behavior = CLASS_BEHAVIOR[scalingClass];

  if (behavior.fixed) {
    return { scaledAmount: baseAmount, rounded: false };
  }

  const raw = baseAmount * Math.pow(factor, behavior.k);

  if (behavior.round) {
    return { scaledAmount: roundDiscrete(raw, baseAmount), rounded: true };
  }

  return { scaledAmount: raw, rounded: false };
}

export function scaleIngredient(ingredient: Ingredient, factor: number): ScaledIngredient {
  const { scaledAmount, rounded } = scaleAmount(
    ingredient.amount,
    factor,
    ingredient.scalingClass,
  );
  const linearAmount = ingredient.amount * factor;

  const denom = Math.max(Math.abs(linearAmount), ADJUST_EPSILON);
  const wasAdjusted = Math.abs(scaledAmount - linearAmount) / denom > ADJUST_EPSILON;

  return {
    ingredient,
    scaledAmount,
    linearAmount,
    wasAdjusted,
    rounded,
  };
}
