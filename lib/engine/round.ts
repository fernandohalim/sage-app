/**
 * Rounding for discrete aromatics (bay leaf, star anise, cinnamon stick).
 *
 * Goal: round sensibly. Doubling a recipe should take 1 bay leaf to 2, not
 * leave it at 1 and not jump to 3. We never drop a present aromatic below 1 —
 * a recipe that called for a bay leaf should still get a bay leaf at half size.
 */

export function roundDiscrete(rawAmount: number, baseAmount: number): number {
  if (rawAmount <= 0) return 0;
  const rounded = Math.round(rawAmount);
  // A present aromatic never rounds away to zero.
  if (baseAmount > 0 && rounded < 1) return 1;
  return rounded;
}
