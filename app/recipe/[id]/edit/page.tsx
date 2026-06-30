"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RecipeForm } from "@/components/RecipeForm";
import { useRecipes } from "@/components/RecipesProvider";
import type { RecipeInput } from "@/lib/store";

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getRecipe, updateRecipe, loading } = useRecipes();

  const recipe = getRecipe(params.id);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />;
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="font-display text-xl font-semibold text-ink">
          Recipe not found.
        </p>
        <Link href="/" className="text-sm font-medium text-terracotta">
          Back to library
        </Link>
      </div>
    );
  }

  async function handleSubmit(input: RecipeInput) {
    await updateRecipe(recipe!.id, input);
    router.push(`/recipe/${recipe!.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Edit recipe
      </h1>
      <RecipeForm
        initial={recipe}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
