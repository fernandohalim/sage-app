/**
 * First-run seed recipes. Without URL import (Phase 6), a brand-new library
 * would be empty — these give the app something to scale and demonstrate the
 * full range of scaling classes. Seeded once; deleting them won't re-seed.
 */
import type { Recipe } from "@/lib/engine";

type SeedIngredient = Omit<Recipe["ingredients"][number], "id">;
type SeedStep = Omit<Recipe["steps"][number], "id" | "ingredientRefs"> & {
  /** Indices into the recipe's ingredient list this step refers to. */
  refs?: number[];
};
type SeedRecipe = Omit<
  Recipe,
  "id" | "createdAt" | "ingredients" | "steps"
> & {
  ingredients: SeedIngredient[];
  steps: SeedStep[];
};

const SEEDS: SeedRecipe[] = [
  {
    title: "Weeknight Tomato Soup",
    baseServings: 4,
    tags: ["soup", "vegetarian"],
    ingredients: [
      { name: "Ripe tomatoes", amount: 700, unit: "g", scalingClass: "linear" },
      { name: "Yellow onion", amount: 140, unit: "g", scalingClass: "linear" },
      { name: "Garlic", amount: 3, unit: "cloves", scalingClass: "aromatic_strong" },
      { name: "Olive oil", amount: 30, unit: "ml", scalingClass: "linear" },
      { name: "Vegetable stock", amount: 500, unit: "ml", scalingClass: "linear" },
      { name: "Fine sea salt", amount: 1, unit: "tsp", scalingClass: "seasoning" },
      { name: "Bay leaf", amount: 1, scalingClass: "discrete_aromatic" },
    ],
    steps: [
      {
        title: "Sweat the aromatics",
        text: "Warm the oil over medium heat. Add onion and a pinch of salt; cook until soft, then add garlic for a minute.",
        refs: [1, 2, 3, 5],
      },
      {
        title: "Simmer",
        text: "Add tomatoes, stock, and the bay leaf. Simmer 25 minutes.",
        timerSeconds: 25 * 60,
        refs: [0, 4, 6],
      },
      {
        title: "Blend and season",
        text: "Remove the bay leaf and blend smooth. Taste and adjust salt at the end.",
        refs: [5, 6],
      },
    ],
  },
  {
    title: "Soft Sandwich Bread",
    baseServings: 12,
    tags: ["bread", "baking"],
    ingredients: [
      { name: "Bread flour", amount: 500, unit: "g", scalingClass: "linear" },
      { name: "Water", amount: 320, unit: "ml", scalingClass: "linear" },
      { name: "Instant yeast", amount: 7, unit: "g", scalingClass: "leavening" },
      { name: "Fine sea salt", amount: 10, unit: "g", scalingClass: "seasoning" },
      { name: "Sugar", amount: 25, unit: "g", scalingClass: "linear" },
      { name: "Butter", amount: 30, unit: "g", scalingClass: "linear" },
    ],
    steps: [
      {
        title: "Mix and knead",
        text: "Combine everything and knead until smooth and elastic, about 10 minutes.",
        timerSeconds: 10 * 60,
        refs: [0, 1, 2, 3, 4, 5],
      },
      {
        title: "First rise",
        text: "Cover and let rise until doubled.",
        timerSeconds: 60 * 60,
      },
      {
        title: "Shape and bake",
        text: "Shape into a loaf, proof, then bake at 200°C until golden and hollow-sounding.",
      },
    ],
  },
];

function newId(): string {
  return crypto.randomUUID();
}

/** Materialise the seeds into full Recipes with ids, refs, and timestamps. */
export function buildSeedRecipes(): Recipe[] {
  const base = Date.now();
  return SEEDS.map((seed, i) => {
    const ingredients = seed.ingredients.map((ing) => ({ ...ing, id: newId() }));
    const steps = seed.steps.map(({ refs, ...step }) => ({
      ...step,
      id: newId(),
      ingredientRefs: (refs ?? []).map((idx) => ingredients[idx].id),
    }));
    return {
      ...seed,
      id: newId(),
      // Stagger timestamps so ordering is stable (first seed shows first).
      createdAt: base - i,
      ingredients,
      steps,
    };
  });
}
