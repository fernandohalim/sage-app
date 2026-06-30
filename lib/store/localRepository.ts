/**
 * localStorage-backed `RecipeRepository`.
 *
 * Single-device persistence for Phases 3–6. Synchronous storage wrapped in an
 * async interface so Phase 7 can drop in Firestore without touching callers.
 * Deliberately tiny: read whole array, mutate, write back. The library is small
 * enough that this never matters.
 */
import type { Recipe } from "@/lib/engine";
import type { RecipeInput, RecipeRepository } from "./repository";
import { buildSeedRecipes } from "./seed";

const RECIPES_KEY = "sage:recipes";
const SEEDED_KEY = "sage:seeded";

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readAll(): Recipe[] {
  if (!hasStorage()) return [];

  // Seed once on first ever run, so an emptied library is respected later.
  if (!localStorage.getItem(SEEDED_KEY)) {
    const seeded = buildSeedRecipes();
    writeAll(seeded);
    localStorage.setItem(SEEDED_KEY, "1");
    return seeded;
  }

  const raw = localStorage.getItem(RECIPES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Recipe[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(recipes: Recipe[]): void {
  if (!hasStorage()) return;
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
}

function byNewest(a: Recipe, b: Recipe): number {
  return b.createdAt - a.createdAt;
}

export const localRecipeRepository: RecipeRepository = {
  async list() {
    return readAll().slice().sort(byNewest);
  },

  async get(id) {
    return readAll().find((r) => r.id === id) ?? null;
  },

  async create(input: RecipeInput) {
    const recipe: Recipe = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    writeAll([recipe, ...readAll()]);
    return recipe;
  },

  async update(id, input: RecipeInput) {
    const all = readAll();
    const existing = all.find((r) => r.id === id);
    if (!existing) {
      throw new Error(`Recipe not found: ${id}`);
    }
    const updated: Recipe = {
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    writeAll(all.map((r) => (r.id === id ? updated : r)));
    return updated;
  },

  async remove(id) {
    writeAll(readAll().filter((r) => r.id !== id));
  },
};
