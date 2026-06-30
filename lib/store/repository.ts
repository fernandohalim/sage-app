/**
 * Persistence contract for recipes.
 *
 * Everything above this line (UI, hooks) talks to a `RecipeRepository`, never to
 * storage directly. Phase 3 ships a localStorage implementation; Phase 7 swaps in
 * Firestore by providing a different implementation of this same interface — no
 * caller changes. The methods are async on purpose so that swap stays clean.
 */
import type { Recipe } from "@/lib/engine";

/** A recipe as authored, before the store assigns identity + timestamps. */
export type RecipeInput = Omit<Recipe, "id" | "createdAt">;

export interface RecipeRepository {
  /** All recipes, newest first. */
  list(): Promise<Recipe[]>;
  /** A single recipe by id, or `null` if it doesn't exist. */
  get(id: string): Promise<Recipe | null>;
  /** Persist a new recipe; the store assigns `id` and `createdAt`. */
  create(input: RecipeInput): Promise<Recipe>;
  /** Overwrite an existing recipe's content, preserving `id` and `createdAt`. */
  update(id: string, input: RecipeInput): Promise<Recipe>;
  /** Delete a recipe. No-op if it doesn't exist. */
  remove(id: string): Promise<void>;
}
