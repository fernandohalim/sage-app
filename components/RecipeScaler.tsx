"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Recipe, ScaledIngredient, Advisory } from "@/lib/engine";
import {
  scaleToServings,
  scaleByFactor,
  scaleByAnchor,
  SCALING_CEILING,
} from "@/lib/engine";
import { formatAmount, formatQuantity } from "@/lib/format";

type Mode = "servings" | "anchor";

/** Amounts within this of the base factor are treated as "not scaled". */
const AT_BASE = 1e-6;

/**
 * The signature interaction: drive the pure scaling engine from the UI. A yield
 * slider or an "I have X" anchor sets the factor; the engine returns class-aware
 * amounts plus advisories. This component only presents them — the math and the
 * heuristics all live in `lib/engine`.
 */
export function RecipeScaler({ recipe }: { recipe: Recipe }) {
  const [mode, setMode] = useState<Mode>("servings");
  const [servings, setServings] = useState(recipe.baseServings);

  // Anchor state. Only non-fixed ingredients with a real base amount can define
  // a factor, so those are the only ones offered.
  const anchorable = useMemo(
    () =>
      recipe.ingredients.filter(
        (i) => i.scalingClass !== "fixed" && i.amount > 0,
      ),
    [recipe.ingredients],
  );
  const [anchorId, setAnchorId] = useState(anchorable[0]?.id ?? "");
  const [haveDraft, setHaveDraft] = useState("");

  // Slider bounds: down to a single serving, up past the ceiling so the cook can
  // see the rust warning appear rather than being silently capped.
  const minServings = 1;
  const maxServings = Math.max(recipe.baseServings * 4, recipe.baseServings + 4);

  const result = useMemo(() => {
    try {
      if (mode === "anchor" && anchorId) {
        const have = Number.parseFloat(haveDraft);
        if (Number.isFinite(have) && have > 0) {
          return scaleByAnchor(recipe, {
            ingredientId: anchorId,
            haveAmount: have,
          });
        }
        return scaleByFactor(recipe, 1);
      }
      return scaleToServings(recipe, servings);
    } catch {
      // Bad anchor (e.g. zero base) — fall back to the untouched recipe.
      return scaleByFactor(recipe, 1);
    }
  }, [mode, servings, anchorId, haveDraft, recipe]);

  const { factor } = result;
  const atBase = Math.abs(factor - 1) < AT_BASE;
  const anchorIng = anchorable.find((i) => i.id === anchorId);

  function setPreset(multiple: number) {
    setMode("servings");
    const next = Math.round(recipe.baseServings * multiple);
    setServings(Math.min(maxServings, Math.max(minServings, next)));
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Ingredients
        </h2>
        {/* Mode toggle */}
        <div className="flex rounded-full border border-line p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("servings")}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === "servings"
                ? "bg-terracotta text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            Servings
          </button>
          <button
            type="button"
            onClick={() => setMode("anchor")}
            disabled={anchorable.length === 0}
            className={`rounded-full px-3 py-1 transition-colors disabled:opacity-40 ${
              mode === "anchor"
                ? "bg-terracotta text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            I have…
          </button>
        </div>
      </div>

      {/* Control card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="num font-display text-3xl font-semibold text-ink">
              {formatAmount(result.targetServings)}
            </span>
            <span className="text-sm text-muted">
              {result.targetServings === 1 ? "serving" : "servings"}
            </span>
          </div>
          <span
            className={`num rounded-full px-2.5 py-1 text-sm font-semibold ${
              atBase
                ? "bg-canvas text-muted"
                : "bg-terracotta/12 text-terracotta"
            }`}
          >
            {formatAmount(factor)}×
          </span>
        </div>

        {mode === "servings" ? (
          <div className="flex flex-col gap-3">
            <input
              type="range"
              min={minServings}
              max={maxServings}
              step={1}
              value={Math.min(maxServings, Math.max(minServings, servings))}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-full accent-terracotta"
              aria-label="Target servings"
            />
            <div className="flex gap-2">
              {[0.5, 1, 2, 3].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPreset(m)}
                  className="num flex-1 rounded-full border border-line py-1.5 text-xs font-medium text-muted transition-colors hover:border-terracotta hover:text-terracotta"
                >
                  {formatAmount(m)}×
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted">
              I have this much of…
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={haveDraft}
                onChange={(e) => setHaveDraft(e.target.value)}
                placeholder="amount"
                className="num w-24 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
              />
              <select
                value={anchorId}
                onChange={(e) => setAnchorId(e.target.value)}
                className="flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
              >
                {anchorable.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                    {ing.unit ? ` (${ing.unit})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted">
              {anchorIng
                ? `Recipe uses ${formatQuantity(anchorIng.amount, anchorIng.unit)}. Everything else scales to match.`
                : "Pick an ingredient to scale from."}
            </p>
          </div>
        )}
      </div>

      {/* Scaled ingredient list */}
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {result.ingredients.map((s) => (
          <IngredientRow key={s.ingredient.id} scaled={s} atBase={atBase} />
        ))}
      </ul>

      {/* Advisories */}
      {result.advisories.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Good to know
          </h3>
          {result.advisories.map((a, i) => (
            <AdvisoryCard key={`${a.type}-${i}`} advisory={a} />
          ))}
        </div>
      )}

      {/* Carry the chosen scale straight into cook mode */}
      {recipe.steps.length > 0 && (
        <Link
          href={`/recipe/${recipe.id}/cook?factor=${factor}`}
          className="rounded-full bg-terracotta py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start cooking{atBase ? "" : ` at ${formatAmount(factor)}×`}
        </Link>
      )}
    </section>
  );
}

/** Decide how a single ingredient's scaling should read. */
function IngredientRow({
  scaled,
  atBase,
}: {
  scaled: ScaledIngredient;
  atBase: boolean;
}) {
  const { ingredient, scaledAmount, linearAmount, wasAdjusted, rounded } =
    scaled;
  const isFixed = ingredient.scalingClass === "fixed";

  // At base scale there are no adjustments to explain.
  const showFixed = isFixed && !atBase;
  const showRounded = rounded && !atBase;
  const showDampened = !isFixed && !rounded && wasAdjusted && !atBase;

  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <span
        className={`num w-20 shrink-0 text-right text-[15px] font-semibold ${
          showDampened ? "text-saffron" : "text-ink"
        }`}
      >
        {formatQuantity(scaledAmount, ingredient.unit)}
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-[15px] text-ink">{ingredient.name}</span>
        {showDampened && (
          <span className="num text-xs text-muted">
            full scale would be {formatQuantity(linearAmount, ingredient.unit)}
          </span>
        )}
        {showRounded && (
          <span className="text-xs text-muted">rounded to whole pieces</span>
        )}
        {showFixed && (
          <span className="text-xs text-muted">kept unchanged</span>
        )}
      </div>
      {showDampened && (
        <span className="shrink-0 rounded-full bg-saffron/15 px-2 py-0.5 text-[11px] font-medium text-saffron">
          dampened
        </span>
      )}
    </li>
  );
}

const SEVERITY_STYLE: Record<
  Advisory["severity"],
  { box: string; dot: string }
> = {
  info: { box: "border-line bg-canvas", dot: "bg-olive" },
  heads_up: { box: "border-saffron/30 bg-saffron/10", dot: "bg-saffron" },
  serious: { box: "border-rust/30 bg-rust/10", dot: "bg-rust" },
};

function AdvisoryCard({ advisory }: { advisory: Advisory }) {
  const style = SEVERITY_STYLE[advisory.severity];
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${style.box}`}
    >
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${style.dot}`} />
      <p className="text-[13px] leading-relaxed text-ink/90">
        {advisory.message}
        {advisory.type === "scaling_ceiling" && (
          <span className="num text-muted"> (past ~{formatAmount(SCALING_CEILING)}×)</span>
        )}
      </p>
    </div>
  );
}
