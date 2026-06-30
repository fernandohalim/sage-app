/**
 * Constraint / anchor scaling.
 *
 * Instead of "scale to N servings", the cook says "I have X of ingredient Y".
 * We derive the factor from that one ingredient, then everything else scales
 * through the same class-aware engine.
 *
 * Important: the factor is derived from the ANCHOR ingredient's own class. If
 * you anchor on 2 eggs and eggs are linear, factor = have / base. If you anchor
 * on a dampened ingredient, we invert its exponent so that the dampened
 * ingredient actually lands on the amount you have.
 */
import type { Recipe } from './types';
import { CLASS_BEHAVIOR } from './classes';

export interface AnchorInput {
  ingredientId: string;
  /** The amount the cook actually has of that ingredient. */
  haveAmount: number;
}

/**
 * Derive the global scaling factor from an anchor.
 *
 * scaledAnchor = baseAnchor * factor^k  ==>  factor = (have / base)^(1/k)
 *
 * For k = 1 (linear) this is simply have / base. For a dampened class we take
 * the inverse-exponent root so the anchor ingredient ends up at `haveAmount`.
 */
export function deriveFactorFromAnchor(recipe: Recipe, anchor: AnchorInput): number {
  const ing = recipe.ingredients.find((i) => i.id === anchor.ingredientId);
  if (!ing) {
    throw new Error(`Anchor ingredient not found: ${anchor.ingredientId}`);
  }
  if (ing.amount <= 0) {
    throw new Error(`Cannot anchor on an ingredient with no base amount: ${ing.name}`);
  }
  if (anchor.haveAmount < 0) {
    throw new Error('Anchor amount cannot be negative');
  }

  const behavior = CLASS_BEHAVIOR[ing.scalingClass];

  // A fixed ingredient never scales, so it cannot define a factor.
  if (behavior.fixed || behavior.k === 0) {
    throw new Error(`Cannot anchor on a fixed ingredient: ${ing.name}`);
  }

  const ratio = anchor.haveAmount / ing.amount;
  return Math.pow(ratio, 1 / behavior.k);
}
