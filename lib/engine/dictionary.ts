/**
 * Seed ingredient dictionary: name -> default scaling class.
 *
 * This is the moat. Keep it trivial to extend — add a line, get smarter
 * auto-classification. On recipe entry we match by normalized name; the editor
 * always allows a manual override.
 *
 * Matching strategy: exact normalized match first, then substring/keyword match
 * (so "kosher salt", "fine sea salt" all resolve to `seasoning` via "salt").
 * Order matters for keyword fallback — more specific keywords come first.
 */
import type { ScalingClass } from './types';

/** Exact normalized name -> class. Fast path. */
const EXACT: Record<string, ScalingClass> = {
  // seasoning
  salt: 'seasoning',
  'soy sauce': 'seasoning',
  'fish sauce': 'seasoning',
  'lemon juice': 'seasoning',
  'lime juice': 'seasoning',
  vinegar: 'seasoning',
  miso: 'seasoning',
  // aromatic_strong
  garlic: 'aromatic_strong',
  ginger: 'aromatic_strong',
  chili: 'aromatic_strong',
  chilli: 'aromatic_strong',
  'chili flakes': 'aromatic_strong',
  cayenne: 'aromatic_strong',
  'black pepper': 'aromatic_strong',
  // leavening
  'baking powder': 'leavening',
  'baking soda': 'leavening',
  yeast: 'leavening',
  // discrete_aromatic
  'bay leaf': 'discrete_aromatic',
  'star anise': 'discrete_aromatic',
  'cinnamon stick': 'discrete_aromatic',
  'cardamom pod': 'discrete_aromatic',
  clove: 'discrete_aromatic',
  // surface
  'cooking spray': 'surface',
  // fixed
  'oven temperature': 'fixed',
  pinch: 'fixed',
};

/**
 * Keyword fallback, evaluated in order. First substring hit wins.
 * Tuned so specific terms (e.g. "baking soda") are matched by EXACT before the
 * looser keywords here.
 */
const KEYWORDS: ReadonlyArray<readonly [string, ScalingClass]> = [
  ['baking powder', 'leavening'],
  ['baking soda', 'leavening'],
  ['yeast', 'leavening'],
  ['bay leaf', 'discrete_aromatic'],
  ['bay leaves', 'discrete_aromatic'],
  ['star anise', 'discrete_aromatic'],
  ['cinnamon stick', 'discrete_aromatic'],
  ['cardamom pod', 'discrete_aromatic'],
  ['salt', 'seasoning'],
  ['soy', 'seasoning'],
  ['fish sauce', 'seasoning'],
  ['vinegar', 'seasoning'],
  ['miso', 'seasoning'],
  ['garlic', 'aromatic_strong'],
  ['ginger', 'aromatic_strong'],
  ['chili', 'aromatic_strong'],
  ['chilli', 'aromatic_strong'],
  ['chile', 'aromatic_strong'],
  ['cayenne', 'aromatic_strong'],
];

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Classify an ingredient by name. Returns `undefined` when unknown so the
 * caller can decide a default (typically `linear`) and still flag it for review.
 */
export function classifyByName(name: string): ScalingClass | undefined {
  const normalized = normalizeName(name);
  if (normalized in EXACT) return EXACT[normalized];

  for (const [keyword, cls] of KEYWORDS) {
    if (normalized.includes(keyword)) return cls;
  }
  return undefined;
}

/** Classify with a fallback (defaults to `linear`). */
export function classifyOrDefault(
  name: string,
  fallback: ScalingClass = 'linear',
): ScalingClass {
  return classifyByName(name) ?? fallback;
}
