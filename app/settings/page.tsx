"use client";

import { useState } from "react";
import { useRecipes } from "@/components/RecipesProvider";

export default function SettingsPage() {
  const { recipes } = useRecipes();
  const [confirming, setConfirming] = useState(false);

  function resetToSamples() {
    try {
      localStorage.removeItem("sage:recipes");
      localStorage.removeItem("sage:seeded");
    } catch {
      // ignore
    }
    // Reload so the store re-seeds and the provider re-reads from scratch.
    window.location.href = "/";
  }

  return (
    <div className="flex flex-col gap-7">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Settings
      </h1>

      <section className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-ink">About Sage</h2>
        <p className="text-sm leading-relaxed text-muted">
          Sage scales recipes by giving each ingredient its own rule — salt,
          aromatics, leavening, and time don&rsquo;t grow like flour does.
          Scaling is a heuristic, not exact science: always taste and adjust.
        </p>
        <p className="num mt-1 text-xs text-muted">
          {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} stored
          on this device
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Data</h2>
        <p className="text-sm leading-relaxed text-muted">
          Recipes live in this browser only. Restore the two sample recipes —
          this replaces everything currently saved.
        </p>
        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToSamples}
              className="rounded-full bg-rust px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Yes, replace everything
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="self-start rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-rust hover:text-rust"
          >
            Reset to sample recipes
          </button>
        )}
      </section>
    </div>
  );
}
