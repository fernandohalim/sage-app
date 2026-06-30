"use client";

import { useRouter } from "next/navigation";
import { RecipeForm } from "@/components/RecipeForm";
import { useRecipes } from "@/components/RecipesProvider";
import type { RecipeInput } from "@/lib/store";

export default function AddRecipePage() {
  const router = useRouter();
  const { createRecipe } = useRecipes();

  async function handleSubmit(input: RecipeInput) {
    const created = await createRecipe(input);
    router.push(`/recipe/${created.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        New recipe
      </h1>
      <RecipeForm submitLabel="Save recipe" onSubmit={handleSubmit} />
    </div>
  );
}
