/**
 * Recipe-level scaling: the main entry points the UI calls.
 */
import type { Recipe, ScaleResult } from './types';
import { scaleIngredient } from './scale';
import { buildAdvisories } from './advisories';
import { deriveFactorFromAnchor, type AnchorInput } from './anchor';

/** Scale a recipe by an explicit factor. */
export function scaleByFactor(recipe: Recipe, factor: number): ScaleResult {
  if (!(factor > 0) || !Number.isFinite(factor)) {
    throw new Error(`Invalid scaling factor: ${factor}`);
  }

  const ingredients = recipe.ingredients.map((ing) => scaleIngredient(ing, factor));
  const advisories = buildAdvisories(recipe.ingredients, ingredients, factor);

  return {
    baseServings: recipe.baseServings,
    targetServings: recipe.baseServings * factor,
    factor,
    ingredients,
    advisories,
  };
}

/** Scale a recipe to a target number of servings. */
export function scaleToServings(recipe: Recipe, targetServings: number): ScaleResult {
  if (recipe.baseServings <= 0) {
    throw new Error('Recipe baseServings must be positive');
  }
  const factor = targetServings / recipe.baseServings;
  const result = scaleByFactor(recipe, factor);
  // Prefer the exact requested servings over float drift from the division.
  return { ...result, targetServings };
}

/** Scale a recipe by anchoring on "I have X of ingredient Y". */
export function scaleByAnchor(recipe: Recipe, anchor: AnchorInput): ScaleResult {
  const factor = deriveFactorFromAnchor(recipe, anchor);
  return scaleByFactor(recipe, factor);
}
