"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useRecipes } from "@/components/RecipesProvider";
import { CookMode } from "@/components/CookMode";

function CookModeLoader() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { getRecipe, loading } = useRecipes();

  if (loading) {
    return (
      <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />
    );
  }

  const recipe = getRecipe(params.id);
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

  const parsed = Number.parseFloat(searchParams.get("factor") ?? "");
  const factor = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

  return <CookMode recipe={recipe} factor={factor} />;
}

export default function CookPage() {
  return (
    <Suspense fallback={null}>
      <CookModeLoader />
    </Suspense>
  );
}
