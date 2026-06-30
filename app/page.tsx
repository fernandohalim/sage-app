"use client";

import Link from "next/link";
import { useRecipes } from "@/components/RecipesProvider";

export default function LibraryPage() {
  const { recipes, loading } = useRecipes();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Library
        </h1>
        {!loading && recipes.length > 0 && (
          <span className="num text-sm text-muted">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </span>
        )}
      </div>

      {loading ? (
        <ul className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-line bg-surface"
            />
          ))}
        </ul>
      ) : recipes.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link
                href={`/recipe/${recipe.id}`}
                className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-terracotta/50"
              >
                <h2 className="font-display text-xl font-semibold text-ink">
                  {recipe.title}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  <span className="num">{recipe.baseServings}</span> servings ·{" "}
                  <span className="num">{recipe.ingredients.length}</span>{" "}
                  ingredients ·{" "}
                  <span className="num">{recipe.steps.length}</span> steps
                </p>
                {recipe.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <p className="font-display text-xl font-semibold text-ink">
        Nothing here yet.
      </p>
      <p className="max-w-xs text-sm text-muted">
        Add a recipe and Sage will scale it correctly — salt, aromatics, and
        leavening included.
      </p>
      <Link
        href="/add"
        className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Add your first recipe
      </Link>
    </div>
  );
}
