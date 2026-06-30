"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  classifyOrDefault,
  type Recipe,
  type ScalingClass,
} from "@/lib/engine";
import type { RecipeInput } from "@/lib/store";
import {
  SCALING_CLASS_HINT,
  SCALING_CLASS_LABEL,
  SCALING_CLASS_ORDER,
} from "@/lib/format";

interface IngredientDraft {
  id: string;
  name: string;
  amount: string;
  unit: string;
  scalingClass: ScalingClass;
  /** Once the user picks a class by hand, stop auto-classifying on name edits. */
  classTouched: boolean;
}

interface StepDraft {
  id: string;
  title: string;
  text: string;
  timerMinutes: string;
  ingredientRefs: string[];
}

function uid(): string {
  return crypto.randomUUID();
}

function blankIngredient(): IngredientDraft {
  return {
    id: uid(),
    name: "",
    amount: "",
    unit: "",
    scalingClass: "linear",
    classTouched: false,
  };
}

function blankStep(): StepDraft {
  return { id: uid(), title: "", text: "", timerMinutes: "", ingredientRefs: [] };
}

function toIngredientDraft(ing: Recipe["ingredients"][number]): IngredientDraft {
  return {
    id: ing.id,
    name: ing.name,
    amount: String(ing.amount),
    unit: ing.unit ?? "",
    scalingClass: ing.scalingClass,
    classTouched: true,
  };
}

function toStepDraft(step: Recipe["steps"][number]): StepDraft {
  return {
    id: step.id,
    title: step.title,
    text: step.text,
    timerMinutes: step.timerSeconds ? String(Math.round(step.timerSeconds / 60)) : "",
    ingredientRefs: step.ingredientRefs,
  };
}

export function RecipeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Recipe;
  submitLabel: string;
  onSubmit: (input: RecipeInput) => Promise<void>;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [baseServings, setBaseServings] = useState(
    initial ? String(initial.baseServings) : "4",
  );
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    initial?.ingredients.map(toIngredientDraft) ?? [blankIngredient()],
  );
  const [steps, setSteps] = useState<StepDraft[]>(
    initial?.steps.map(toStepDraft) ?? [blankStep()],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- ingredient mutations -------------------------------------------------
  function patchIngredient(id: string, patch: Partial<IngredientDraft>) {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, ...patch } : ing)),
    );
  }

  function handleNameChange(id: string, name: string) {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;
        // Auto-classify until the cook overrides the class themselves.
        const scalingClass = ing.classTouched
          ? ing.scalingClass
          : classifyOrDefault(name);
        return { ...ing, name, scalingClass };
      }),
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, blankIngredient()]);
  }

  function removeIngredient(id: string) {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    // Drop any step references to the deleted ingredient.
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        ingredientRefs: step.ingredientRefs.filter((ref) => ref !== id),
      })),
    );
  }

  // ---- step mutations -------------------------------------------------------
  function patchStep(id: string, patch: Partial<StepDraft>) {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    );
  }

  function toggleRef(stepId: string, ingredientId: string) {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step;
        const has = step.ingredientRefs.includes(ingredientId);
        return {
          ...step,
          ingredientRefs: has
            ? step.ingredientRefs.filter((r) => r !== ingredientId)
            : [...step.ingredientRefs, ingredientId],
        };
      }),
    );
  }

  function addStep() {
    setSteps((prev) => [...prev, blankStep()]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((step) => step.id !== id));
  }

  // ---- submit ---------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give the recipe a title.");
      return;
    }
    const servings = Number.parseInt(baseServings, 10);
    if (!Number.isFinite(servings) || servings < 1) {
      setError("Base servings must be at least 1.");
      return;
    }

    const cleanedIngredients = ingredients
      .filter((ing) => ing.name.trim())
      .map((ing) => {
        const amount = Number.parseFloat(ing.amount);
        return {
          id: ing.id,
          name: ing.name.trim(),
          amount: Number.isFinite(amount) ? amount : 0,
          unit: ing.unit.trim() || undefined,
          scalingClass: ing.scalingClass,
        };
      });

    if (cleanedIngredients.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }

    const keptIds = new Set(cleanedIngredients.map((i) => i.id));
    const cleanedSteps = steps
      .filter((step) => step.text.trim() || step.title.trim())
      .map((step) => {
        const minutes = Number.parseFloat(step.timerMinutes);
        return {
          id: step.id,
          title: step.title.trim(),
          text: step.text.trim(),
          timerSeconds:
            Number.isFinite(minutes) && minutes > 0
              ? Math.round(minutes * 60)
              : undefined,
          ingredientRefs: step.ingredientRefs.filter((r) => keptIds.has(r)),
        };
      });

    const input: RecipeInput = {
      title: title.trim(),
      baseServings: servings,
      sourceUrl: initial?.sourceUrl,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ingredients: cleanedIngredients,
      steps: cleanedSteps,
    };

    setSaving(true);
    try {
      await onSubmit(input);
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-terracotta";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Basics */}
      <section className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Weeknight Tomato Soup"
            className={fieldClass}
          />
        </label>

        <div className="flex gap-3">
          <label className="flex w-32 flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Base servings</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={baseServings}
              onChange={(e) => setBaseServings(e.target.value)}
              className={`${fieldClass} num`}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Tags</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="soup, vegetarian"
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      {/* Ingredients */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Ingredients
          </h2>
          <span className="text-xs text-muted">
            class auto-detected — override anytime
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="rounded-xl border border-line bg-surface p-3"
            >
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  value={ing.amount}
                  onChange={(e) => patchIngredient(ing.id, { amount: e.target.value })}
                  placeholder="Amt"
                  aria-label="Amount"
                  className={`${fieldClass} num w-16 px-2 text-center`}
                />
                <input
                  value={ing.unit}
                  onChange={(e) => patchIngredient(ing.id, { unit: e.target.value })}
                  placeholder="unit"
                  aria-label="Unit"
                  className={`${fieldClass} w-20 px-2`}
                />
                <input
                  value={ing.name}
                  onChange={(e) => handleNameChange(ing.id, e.target.value)}
                  placeholder="Ingredient"
                  aria-label="Ingredient name"
                  className={`${fieldClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(ing.id)}
                  aria-label="Remove ingredient"
                  className="shrink-0 rounded-lg px-2 text-muted transition-colors hover:text-rust"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={ing.scalingClass}
                  onChange={(e) =>
                    patchIngredient(ing.id, {
                      scalingClass: e.target.value as ScalingClass,
                      classTouched: true,
                    })
                  }
                  aria-label="Scaling class"
                  className="rounded-lg border border-line bg-canvas px-2 py-1 text-xs text-ink outline-none focus:border-terracotta"
                >
                  {SCALING_CLASS_ORDER.map((cls) => (
                    <option key={cls} value={cls}>
                      {SCALING_CLASS_LABEL[cls]}
                    </option>
                  ))}
                </select>
                <span className="hidden text-xs text-muted sm:inline">
                  {SCALING_CLASS_HINT[ing.scalingClass]}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addIngredient}
          className="self-start rounded-lg border border-dashed border-line px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-terracotta hover:text-terracotta"
        >
          + Add ingredient
        </button>
      </section>

      {/* Steps */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Steps</h2>

        <div className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="rounded-xl border border-line bg-surface p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-terracotta/12 text-xs font-semibold text-terracotta">
                  {i + 1}
                </span>
                <input
                  value={step.title}
                  onChange={(e) => patchStep(step.id, { title: e.target.value })}
                  placeholder="Step title (optional)"
                  aria-label="Step title"
                  className={`${fieldClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  aria-label="Remove step"
                  className="shrink-0 rounded-lg px-2 text-muted transition-colors hover:text-rust"
                >
                  ✕
                </button>
              </div>

              <textarea
                value={step.text}
                onChange={(e) => patchStep(step.id, { text: e.target.value })}
                placeholder="What happens in this step…"
                rows={2}
                aria-label="Step instructions"
                className={`${fieldClass} resize-y`}
              />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  Timer
                  <input
                    inputMode="numeric"
                    value={step.timerMinutes}
                    onChange={(e) =>
                      patchStep(step.id, { timerMinutes: e.target.value })
                    }
                    placeholder="0"
                    aria-label="Timer minutes"
                    className={`${fieldClass} num w-14 px-2 py-1 text-center`}
                  />
                  min
                </label>
              </div>

              {ingredients.some((ing) => ing.name.trim()) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ingredients
                    .filter((ing) => ing.name.trim())
                    .map((ing) => {
                      const active = step.ingredientRefs.includes(ing.id);
                      return (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => toggleRef(step.id, ing.id)}
                          aria-pressed={active}
                          className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                            active
                              ? "border-terracotta bg-terracotta/12 text-terracotta"
                              : "border-line text-muted hover:text-ink"
                          }`}
                        >
                          {ing.name.trim()}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addStep}
          className="self-start rounded-lg border border-dashed border-line px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-terracotta hover:text-terracotta"
        >
          + Add step
        </button>
      </section>

      {error && (
        <p className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
