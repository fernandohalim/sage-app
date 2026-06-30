/**
 * Public surface of the persistence layer.
 *
 * `recipeRepository` is the single binding the app uses. Phase 7 changes exactly
 * this one assignment (local → Firestore); nothing else moves.
 */
export type { RecipeRepository, RecipeInput } from "./repository";

import { localRecipeRepository } from "./localRepository";
import type { RecipeRepository } from "./repository";

export const recipeRepository: RecipeRepository = localRecipeRepository;
