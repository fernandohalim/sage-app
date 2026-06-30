/**
 * Presentation helpers shared across the recipe UI. Pure formatting only — the
 * scaling math lives in `lib/engine`.
 */
import type { ScalingClass } from "@/lib/engine";

/** Render an amount without trailing-zero noise: 2 → "2", 1.5 → "1.5". */
export function formatAmount(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.round(n * 100) / 100;
  return rounded
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

/** Amount + optional unit, e.g. "320 ml" or "3". */
export function formatQuantity(amount: number, unit?: string): string {
  const a = formatAmount(amount);
  return unit ? `${a} ${unit}` : a;
}

/** Whole minutes from a timer in seconds, for compact display. */
export function formatTimer(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Short human label for each scaling class. */
export const SCALING_CLASS_LABEL: Record<ScalingClass, string> = {
  linear: "Scales 1:1",
  seasoning: "Seasoning",
  aromatic_strong: "Strong aromatic",
  leavening: "Leavening",
  surface: "Surface / pan",
  discrete_aromatic: "Whole spice",
  fixed: "Never scales",
};

/** One-line explanation of how each class behaves, for the editor select. */
export const SCALING_CLASS_HINT: Record<ScalingClass, string> = {
  linear: "Grows with the batch (flour, water, meat).",
  seasoning: "Dampened — taste at the end (salt, acids).",
  aromatic_strong: "Hold back, it compounds (garlic, chili).",
  leavening: "Sensitive past ~2× (yeast, baking powder).",
  surface: "Tied to the pan, not the portions.",
  discrete_aromatic: "Rounds to whole units (bay leaf, star anise).",
  fixed: "Stays put (oven temp, a pinch).",
};

/** Stable order for class selects and legends. */
export const SCALING_CLASS_ORDER: ScalingClass[] = [
  "linear",
  "seasoning",
  "aromatic_strong",
  "leavening",
  "discrete_aromatic",
  "surface",
  "fixed",
];
