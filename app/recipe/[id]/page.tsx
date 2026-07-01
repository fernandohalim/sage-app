"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRecipes } from "@/components/RecipesProvider";
import { RecipeScaler } from "@/components/RecipeScaler";
import { formatTimer } from "@/lib/format";

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getRecipe, removeRecipe, loading } = useRecipes();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    setDeleting(true);
    await removeRecipe(recipe!.id);
    router.push("/");
  }

  const ingredientName = (id: string) =>
    recipe.ingredients.find((ing) => ing.id === id)?.name;

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
              {recipe.title}
            </h1>
            <p className="num text-sm text-muted">
              {recipe.baseServings} servings
            </p>
          </div>
          <Link
            href={`/recipe/${recipe.id}/edit`}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            Edit
          </Link>
        </div>
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-olive/12 px-2 py-0.5 text-xs font-medium text-olive"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Ingredients + scaling (the signature interaction) */}
      <RecipeScaler recipe={recipe} />

      {/* Steps */}
      {recipe.steps.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Method</h2>
          <ol className="flex flex-col gap-3">
            {recipe.steps.map((step, i) => (
              <li
                key={step.id}
                className="rounded-2xl border border-line bg-surface p-4"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-terracotta/12 text-xs font-semibold text-terracotta">
                    {i + 1}
                  </span>
                  {step.title && (
                    <h3 className="font-medium text-ink">{step.title}</h3>
                  )}
                  {step.timerSeconds && (
                    <span className="num ml-auto rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
                      {formatTimer(step.timerSeconds)}
                    </span>
                  )}
                </div>
                {step.text && (
                  <p className="text-[15px] leading-relaxed text-ink/90">
                    {step.text}
                  </p>
                )}
                {step.ingredientRefs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {step.ingredientRefs
                      .map(ingredientName)
                      .filter(Boolean)
                      .map((name, j) => (
                        <span
                          key={`${name}-${j}`}
                          className="rounded-full bg-canvas px-2 py-0.5 text-xs text-muted"
                        >
                          {name}
                        </span>
                      ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Danger zone */}
      <section className="border-t border-line pt-5">
        {confirming ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-rust/30 bg-rust/8 p-4">
            <p className="text-sm text-ink">
              Delete <span className="font-semibold">{recipe.title}</span>? This
              can&rsquo;t be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-rust px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-sm font-medium text-muted transition-colors hover:text-rust"
          >
            Delete recipe
          </button>
        )}
      </section>
    </div>
  );
}
