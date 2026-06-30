/**
 * Core domain types for Sage.
 *
 * This module is pure: no React, no Firebase. Everything the scaling engine
 * needs is described here. UI and persistence import from this surface.
 */

/** How an ingredient responds to scaling. Drives the per-class exponent. */
export type ScalingClass =
  | 'linear' // flour, sugar, water, stock, oil, meat, veg — scale 1:1
  | 'seasoning' // salt, soy, fish sauce, acids — dampened, taste at end
  | 'aromatic_strong' // garlic, chili, ginger, cayenne — compounds, start low
  | 'leavening' // baking powder/soda, yeast — sensitive past ~2x
  | 'surface' // searing oil, pan coating — depends on pan, not portions
  | 'discrete_aromatic' // bay leaf, star anise, cinnamon stick — round sensibly
  | 'fixed'; // oven temp, "pinch", "to taste" — never scales

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit?: string;
  scalingClass: ScalingClass;
}

export interface Step {
  id: string;
  title: string;
  text: string;
  timerSeconds?: number;
  ingredientRefs: string[]; // Ingredient.id[]
}

export interface Recipe {
  id: string;
  title: string;
  baseServings: number;
  sourceUrl?: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  createdAt: number; // epoch ms
}

/** The result of scaling a single ingredient. */
export interface ScaledIngredient {
  ingredient: Ingredient;
  /** What the cook should actually use. */
  scaledAmount: number;
  /** What naive "multiply everything" scaling would have produced. */
  linearAmount: number;
  /** True when scaledAmount meaningfully differs from linearAmount. */
  wasAdjusted: boolean;
  /** True when discrete rounding was applied (e.g. bay leaf). */
  rounded: boolean;
}

/**
 * Advisories the engine emits alongside the numbers. These carry structured
 * data + a default message; the UI owns final copy and tone.
 */
export type AdvisoryType =
  | 'seasoning_checkpoint'
  | 'pan_size'
  | 'time_nonlinear'
  | 'leavening_sensitive'
  | 'scaling_ceiling';

/** Maps to the state-driven palette: quiet / saffron / rust. */
export type AdvisorySeverity = 'info' | 'heads_up' | 'serious';

export interface Advisory {
  type: AdvisoryType;
  severity: AdvisorySeverity;
  message: string;
  /** Ingredients this advisory points at, when relevant. */
  ingredientIds?: string[];
}

export interface ScaleResult {
  baseServings: number;
  targetServings: number;
  /** Global scaling factor (targetServings / baseServings, or anchor-derived). */
  factor: number;
  ingredients: ScaledIngredient[];
  advisories: Advisory[];
}
