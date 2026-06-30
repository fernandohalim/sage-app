import { describe, it, expect } from 'vitest';
import { scaleByFactor, scaleToServings, scaleByAnchor } from './recipe';
import { ing, recipe } from './__fixtures__/recipes';

const stew = () =>
  recipe({
    baseServings: 4,
    ingredients: [
      ing('chicken', 600, 'linear', 'g'),
      ing('salt', 8, 'seasoning', 'g'),
      ing('garlic', 3, 'aromatic_strong', 'cloves'),
      ing('bay leaf', 1, 'discrete_aromatic'),
      ing('searing oil', 15, 'surface', 'ml'),
      ing('oven temp', 180, 'fixed', 'C'),
    ],
  });

describe('scaleToServings', () => {
  it('preserves exact requested servings', () => {
    const r = scaleToServings(stew(), 6);
    expect(r.factor).toBe(1.5);
    expect(r.targetServings).toBe(6);
  });

  it('scales linear ingredients by the raw factor', () => {
    const r = scaleToServings(stew(), 8); // factor 2
    const chicken = r.ingredients.find((i) => i.ingredient.name === 'chicken')!;
    expect(chicken.scaledAmount).toBe(1200);
  });

  it('dampens salt below the linear amount', () => {
    const r = scaleToServings(stew(), 8); // factor 2
    const salt = r.ingredients.find((i) => i.ingredient.name === 'salt')!;
    expect(salt.scaledAmount).toBeLessThan(16);
    expect(salt.wasAdjusted).toBe(true);
  });

  it('keeps oven temp fixed', () => {
    const r = scaleToServings(stew(), 12);
    const temp = r.ingredients.find((i) => i.ingredient.name === 'oven temp')!;
    expect(temp.scaledAmount).toBe(180);
  });

  it('throws on non-positive base servings', () => {
    expect(() => scaleToServings(recipe({ baseServings: 0, ingredients: [] }), 4)).toThrow();
  });
});

describe('scaleByFactor — validation', () => {
  it('rejects zero, negative, NaN and Infinity', () => {
    const r = stew();
    expect(() => scaleByFactor(r, 0)).toThrow();
    expect(() => scaleByFactor(r, -1)).toThrow();
    expect(() => scaleByFactor(r, NaN)).toThrow();
    expect(() => scaleByFactor(r, Infinity)).toThrow();
  });
});

describe('advisories', () => {
  it('emits seasoning checkpoint when seasoning is dampened', () => {
    const r = scaleByFactor(stew(), 2);
    expect(r.advisories.some((a) => a.type === 'seasoning_checkpoint')).toBe(true);
  });

  it('emits pan-size + later-time hints when scaling up', () => {
    const r = scaleByFactor(stew(), 2);
    const types = r.advisories.map((a) => a.type);
    expect(types).toContain('pan_size');
    const time = r.advisories.find((a) => a.type === 'time_nonlinear')!;
    expect(time.message.toLowerCase()).toContain('later');
  });

  it('emits earlier-time hint when scaling down, no pan-size', () => {
    const r = scaleByFactor(stew(), 0.5);
    const types = r.advisories.map((a) => a.type);
    expect(types).not.toContain('pan_size');
    const time = r.advisories.find((a) => a.type === 'time_nonlinear')!;
    expect(time.message.toLowerCase()).toContain('earlier');
  });

  it('emits the ceiling warning past ~3.5x as "serious"', () => {
    const r = scaleByFactor(stew(), 4);
    const ceiling = r.advisories.find((a) => a.type === 'scaling_ceiling');
    expect(ceiling).toBeDefined();
    expect(ceiling!.severity).toBe('serious');
  });

  it('does not emit the ceiling warning at 2x', () => {
    const r = scaleByFactor(stew(), 2);
    expect(r.advisories.some((a) => a.type === 'scaling_ceiling')).toBe(false);
  });

  it('emits leavening sensitivity past 2x and points at the leavening', () => {
    const bread = recipe({
      ingredients: [ing('flour', 500, 'linear'), ing('yeast', 7, 'leavening')],
    });
    const r = scaleByFactor(bread, 3);
    const adv = r.advisories.find((a) => a.type === 'leavening_sensitive');
    expect(adv).toBeDefined();
    expect(adv!.ingredientIds).toHaveLength(1);
  });

  it('no advisories at factor 1', () => {
    const r = scaleByFactor(stew(), 1);
    expect(r.advisories).toHaveLength(0);
  });
});

describe('scaleByAnchor', () => {
  it('anchoring on a linear ingredient gives have/base', () => {
    const eggs = recipe({
      baseServings: 3,
      ingredients: [ing('eggs', 3, 'linear'), ing('flour', 300, 'linear')],
    });
    const eggId = eggs.ingredients[0].id;
    const r = scaleByAnchor(eggs, { ingredientId: eggId, haveAmount: 2 });
    expect(r.factor).toBeCloseTo(2 / 3, 6);
    const flour = r.ingredients.find((i) => i.ingredient.name === 'flour')!;
    expect(flour.scaledAmount).toBeCloseTo(200, 6);
  });

  it('the anchored ingredient lands exactly on the amount you have', () => {
    // Anchor on a dampened ingredient: inverse-exponent must land salt on 4.
    const r0 = recipe({ ingredients: [ing('salt', 8, 'seasoning'), ing('water', 1000, 'linear')] });
    const saltId = r0.ingredients[0].id;
    const r = scaleByAnchor(r0, { ingredientId: saltId, haveAmount: 4 });
    const salt = r.ingredients.find((i) => i.ingredient.name === 'salt')!;
    expect(salt.scaledAmount).toBeCloseTo(4, 6);
  });

  it('throws when anchoring on a fixed ingredient', () => {
    const r0 = recipe({ ingredients: [ing('oven temp', 180, 'fixed')] });
    const id = r0.ingredients[0].id;
    expect(() => scaleByAnchor(r0, { ingredientId: id, haveAmount: 200 })).toThrow();
  });

  it('throws on unknown anchor ingredient', () => {
    expect(() => scaleByAnchor(stew(), { ingredientId: 'nope', haveAmount: 1 })).toThrow();
  });
});
