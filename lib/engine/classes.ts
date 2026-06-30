/**
 * Per-class scaling behavior.
 *
 * A single exponent formula covers the whole spectrum:
 *
 *   scaledAmount = baseAmount * factor ^ k
 *
 * k = 1 is naive linear scaling. k < 1 dampens (the amount grows/shrinks more
 * slowly than the recipe), which is what we want for things that compound or
 * over-season when multiplied. This behaves correctly scaling DOWN too: a
 * dampened ingredient is reduced less aggressively than linear, so a half-batch
 * still tastes seasoned.
 *
 * These exponents are heuristics, not exact science. They are deliberately easy
 * to tweak — adjust here and the whole engine follows.
 */
import type { ScalingClass } from './types';

export interface ClassBehavior {
  /** Scaling exponent k in factor^k. */
  k: number;
  /** Round the scaled amount to a sensible integer (discrete items). */
  round: boolean;
  /** Never scale — return the base amount unchanged. */
  fixed: boolean;
  /**
   * Emit a "sensitive past this factor" advisory when the factor exceeds this.
   * Undefined = no per-class ceiling advisory.
   */
  warnAbove?: number;
}

export const CLASS_BEHAVIOR: Record<ScalingClass, ClassBehavior> = {
  linear: { k: 1.0, round: false, fixed: false },
  seasoning: { k: 0.8, round: false, fixed: false },
  aromatic_strong: { k: 0.7, round: false, fixed: false },
  leavening: { k: 0.95, round: false, fixed: false, warnAbove: 2 },
  // Searing oil / pan coating tracks pan area, not portions. Heavily damped so
  // doubling the recipe barely moves it; the cook is reminded it's pan-bound.
  surface: { k: 0.25, round: false, fixed: false },
  // Sub-linear like a strong aromatic, then rounded to whole pieces.
  discrete_aromatic: { k: 0.7, round: true, fixed: false },
  fixed: { k: 0, round: false, fixed: true },
};

/** Convenience: the exponent for a class. */
export function exponentFor(scalingClass: ScalingClass): number {
  return CLASS_BEHAVIOR[scalingClass].k;
}
