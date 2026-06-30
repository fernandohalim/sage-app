import { describe, it, expect } from 'vitest';
import { scaleAmount, scaleIngredient } from './scale';
import { ing } from './__fixtures__/recipes';

const approx = (n: number, digits = 3) => Number(n.toFixed(digits));

describe('scaleAmount — linear', () => {
  it('scales 1:1 up', () => {
    expect(scaleAmount(100, 2, 'linear').scaledAmount).toBe(200);
  });
  it('scales 1:1 down', () => {
    expect(scaleAmount(100, 0.5, 'linear').scaledAmount).toBe(50);
  });
  it('is identity at factor 1', () => {
    expect(scaleAmount(100, 1, 'linear').scaledAmount).toBe(100);
  });
});

describe('scaleAmount — seasoning (k=0.8, dampened)', () => {
  it('doubling lands below 2x', () => {
    // 1 * 2^0.8 = 1.741
    expect(approx(scaleAmount(1, 2, 'seasoning').scaledAmount)).toBe(1.741);
  });
  it('halving stays above half (still seasoned)', () => {
    // 1 * 0.5^0.8 = 0.574  (>0.5, so a half batch isn't under-seasoned)
    expect(scaleAmount(1, 0.5, 'seasoning').scaledAmount).toBeGreaterThan(0.5);
  });
  it('is identity at factor 1', () => {
    expect(scaleAmount(5, 1, 'seasoning').scaledAmount).toBe(5);
  });
});

describe('scaleAmount — aromatic_strong (k=0.7, compounds)', () => {
  it('doubling garlic stays well under 2x', () => {
    // 1 * 2^0.7 = 1.625
    expect(approx(scaleAmount(1, 2, 'aromatic_strong').scaledAmount)).toBe(1.625);
  });
  it('is more dampened than seasoning at the same factor', () => {
    const arom = scaleAmount(1, 3, 'aromatic_strong').scaledAmount;
    const seas = scaleAmount(1, 3, 'seasoning').scaledAmount;
    expect(arom).toBeLessThan(seas);
  });
});

describe('scaleAmount — leavening (k=0.95)', () => {
  it('barely dampened', () => {
    // 1 * 2^0.95 = 1.932
    expect(approx(scaleAmount(1, 2, 'leavening').scaledAmount)).toBe(1.932);
  });
});

describe('scaleAmount — surface (near flat)', () => {
  it('barely moves when doubling', () => {
    // 1 * 2^0.25 = 1.189
    expect(approx(scaleAmount(1, 2, 'surface').scaledAmount)).toBe(1.189);
  });
});

describe('scaleAmount — discrete_aromatic (round, never below 1)', () => {
  it('1 bay leaf at 2x rounds to 2', () => {
    // 1 * 2^0.7 = 1.625 -> 2
    expect(scaleAmount(1, 2, 'discrete_aromatic').scaledAmount).toBe(2);
  });
  it('1 bay leaf at 4x does not overshoot to 4', () => {
    // 1 * 4^0.7 = 2.639 -> 3
    expect(scaleAmount(1, 4, 'discrete_aromatic').scaledAmount).toBe(3);
  });
  it('1 bay leaf at 1.5x stays 1', () => {
    // 1 * 1.5^0.7 = 1.328 -> 1
    expect(scaleAmount(1, 1.5, 'discrete_aromatic').scaledAmount).toBe(1);
  });
  it('a present aromatic never rounds away at half batch', () => {
    // 1 * 0.5^0.7 = 0.616 -> would round to 1, not 0
    expect(scaleAmount(1, 0.5, 'discrete_aromatic').scaledAmount).toBe(1);
  });
});

describe('scaleAmount — fixed (never scales)', () => {
  it('ignores the factor entirely', () => {
    expect(scaleAmount(180, 3, 'fixed').scaledAmount).toBe(180);
    expect(scaleAmount(180, 0.5, 'fixed').scaledAmount).toBe(180);
  });
});

describe('scaleIngredient — flags and metadata', () => {
  it('linear is never flagged as adjusted', () => {
    const r = scaleIngredient(ing('flour', 200, 'linear'), 2);
    expect(r.scaledAmount).toBe(400);
    expect(r.linearAmount).toBe(400);
    expect(r.wasAdjusted).toBe(false);
  });

  it('seasoning is flagged and exposes the linear comparison', () => {
    const r = scaleIngredient(ing('salt', 1, 'seasoning'), 2);
    expect(r.wasAdjusted).toBe(true);
    expect(r.linearAmount).toBe(2); // what naive scaling would have done
    expect(r.scaledAmount).toBeLessThan(2);
  });

  it('nothing is flagged at factor 1', () => {
    const r = scaleIngredient(ing('salt', 1, 'seasoning'), 1);
    expect(r.wasAdjusted).toBe(false);
  });

  it('discrete reports rounded=true', () => {
    const r = scaleIngredient(ing('bay leaf', 1, 'discrete_aromatic'), 2);
    expect(r.rounded).toBe(true);
  });

  it('fixed is flagged as adjusted vs linear (it diverges from naive)', () => {
    const r = scaleIngredient(ing('oven temp', 180, 'fixed'), 2);
    expect(r.scaledAmount).toBe(180);
    expect(r.linearAmount).toBe(360);
    expect(r.wasAdjusted).toBe(true);
  });
});
