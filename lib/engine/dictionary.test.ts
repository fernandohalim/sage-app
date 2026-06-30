import { describe, it, expect } from 'vitest';
import { classifyByName, classifyOrDefault, normalizeName } from './dictionary';

describe('normalizeName', () => {
  it('lowercases, trims and collapses whitespace', () => {
    expect(normalizeName('  Kosher   Salt ')).toBe('kosher salt');
  });
});

describe('classifyByName — exact', () => {
  it('salt -> seasoning', () => expect(classifyByName('salt')).toBe('seasoning'));
  it('garlic -> aromatic_strong', () =>
    expect(classifyByName('garlic')).toBe('aromatic_strong'));
  it('baking soda -> leavening', () =>
    expect(classifyByName('baking soda')).toBe('leavening'));
  it('bay leaf -> discrete_aromatic', () =>
    expect(classifyByName('bay leaf')).toBe('discrete_aromatic'));
});

describe('classifyByName — keyword fallback', () => {
  it('kosher salt -> seasoning', () =>
    expect(classifyByName('Kosher salt')).toBe('seasoning'));
  it('fresh garlic cloves -> aromatic_strong', () =>
    expect(classifyByName('fresh garlic cloves')).toBe('aromatic_strong'));
  it('dried bay leaves -> discrete_aromatic', () =>
    expect(classifyByName('dried bay leaves')).toBe('discrete_aromatic'));
  it('active dry yeast -> leavening', () =>
    expect(classifyByName('active dry yeast')).toBe('leavening'));
});

describe('classifyByName — unknown', () => {
  it('returns undefined for an unmapped ingredient', () => {
    expect(classifyByName('carrot')).toBeUndefined();
  });
});

describe('classifyOrDefault', () => {
  it('defaults unknowns to linear', () => {
    expect(classifyOrDefault('carrot')).toBe('linear');
  });
  it('respects a provided fallback', () => {
    expect(classifyOrDefault('carrot', 'fixed')).toBe('fixed');
  });
  it('still classifies known names', () => {
    expect(classifyOrDefault('salt')).toBe('seasoning');
  });
});
