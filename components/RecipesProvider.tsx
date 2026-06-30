"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Recipe } from "@/lib/engine";
import { recipeRepository, type RecipeInput } from "@/lib/store";

interface RecipesContextValue {
  recipes: Recipe[];
  /** True until the first load from storage resolves. */
  loading: boolean;
  getRecipe: (id: string) => Recipe | undefined;
  createRecipe: (input: RecipeInput) => Promise<Recipe>;
  updateRecipe: (id: string, input: RecipeInput) => Promise<Recipe>;
  removeRecipe: (id: string) => Promise<void>;
}

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    recipeRepository.list().then((loaded) => {
      if (active) {
        setRecipes(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const getRecipe = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes],
  );

  const createRecipe = useCallback(async (input: RecipeInput) => {
    const created = await recipeRepository.create(input);
    setRecipes((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateRecipe = useCallback(async (id: string, input: RecipeInput) => {
    const updated = await recipeRepository.update(id, input);
    setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const removeRecipe = useCallback(async (id: string) => {
    await recipeRepository.remove(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo<RecipesContextValue>(
    () => ({
      recipes,
      loading,
      getRecipe,
      createRecipe,
      updateRecipe,
      removeRecipe,
    }),
    [recipes, loading, getRecipe, createRecipe, updateRecipe, removeRecipe],
  );

  return (
    <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>
  );
}

export function useRecipes(): RecipesContextValue {
  const ctx = useContext(RecipesContext);
  if (!ctx) {
    throw new Error("useRecipes must be used within a RecipesProvider");
  }
  return ctx;
}
