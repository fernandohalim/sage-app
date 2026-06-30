/**
 * Public surface of the Sage scaling engine.
 *
 * Pure, framework-agnostic, fully unit-tested. No React, no Firebase.
 */
export type {
  ScalingClass,
  Ingredient,
  Step,
  Recipe,
  ScaledIngredient,
  Advisory,
  AdvisoryType,
  AdvisorySeverity,
  ScaleResult,
} from './types';

export { CLASS_BEHAVIOR, exponentFor, type ClassBehavior } from './classes';
export { scaleAmount, scaleIngredient } from './scale';
export { scaleByFactor, scaleToServings, scaleByAnchor } from './recipe';
export { deriveFactorFromAnchor, type AnchorInput } from './anchor';
export { buildAdvisories, SCALING_CEILING } from './advisories';
export {
  classifyByName,
  classifyOrDefault,
  normalizeName,
} from './dictionary';
