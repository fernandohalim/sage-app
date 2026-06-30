/**
 * Advisories: the heads-up the engine surfaces alongside the numbers.
 *
 * Voice here is a neutral default; the UI may override copy. Severity maps to
 * the state-driven palette — info (quiet), heads_up (saffron), serious (rust).
 * Nothing here alarms. Everything defers to "taste and adjust".
 */
import type { Advisory, Ingredient, ScaledIngredient } from './types';
import { CLASS_BEHAVIOR } from './classes';

/** Beyond this factor, emulsions / custards / pan-bound dishes may break. */
export const SCALING_CEILING = 3.5;

export function buildAdvisories(
  ingredients: Ingredient[],
  scaled: ScaledIngredient[],
  factor: number,
): Advisory[] {
  const advisories: Advisory[] = [];
  const scalingUp = factor > 1;
  const scalingDown = factor < 1;

  // --- Seasoning checkpoint: any seasoning that got dampened ---
  const dampenedSeasonings = scaled.filter(
    (s) => s.ingredient.scalingClass === 'seasoning' && s.wasAdjusted,
  );
  if (dampenedSeasonings.length > 0) {
    advisories.push({
      type: 'seasoning_checkpoint',
      severity: 'heads_up',
      message:
        'Seasoning was adjusted below the full multiple. Taste at the end and adjust.',
      ingredientIds: dampenedSeasonings.map((s) => s.ingredient.id),
    });
  }

  // --- Leavening sensitivity: present leavening past its per-class threshold ---
  const sensitiveLeavening = ingredients.filter((ing) => {
    const warnAbove = CLASS_BEHAVIOR[ing.scalingClass].warnAbove;
    return warnAbove !== undefined && factor > warnAbove;
  });
  if (sensitiveLeavening.length > 0) {
    advisories.push({
      type: 'leavening_sensitive',
      severity: 'heads_up',
      message:
        'Leavening gets unpredictable past ~2x. This also changes your pan and bake time.',
      ingredientIds: sensitiveLeavening.map((ing) => ing.id),
    });
  }

  // --- Pan size when scaling up ---
  if (scalingUp) {
    advisories.push({
      type: 'pan_size',
      severity: 'info',
      message:
        'Bigger batch — use a larger pan or split into batches so things cook evenly.',
    });
  }

  // --- Time is non-linear: never multiply time, just hint direction ---
  if (scalingUp) {
    advisories.push({
      type: 'time_nonlinear',
      severity: 'info',
      message: "Don't multiply cook time. Start checking a little later than the original.",
    });
  } else if (scalingDown) {
    advisories.push({
      type: 'time_nonlinear',
      severity: 'info',
      message: "Don't divide cook time. Start checking a little earlier than the original.",
    });
  }

  // --- Scaling ceiling ---
  if (factor >= SCALING_CEILING) {
    advisories.push({
      type: 'scaling_ceiling',
      severity: 'serious',
      message:
        'Past ~3–4x, sauces, custards and pan-bound dishes can break. Consider cooking in batches.',
    });
  }

  return advisories;
}
