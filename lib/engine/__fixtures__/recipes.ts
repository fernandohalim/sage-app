import type { Ingredient, Recipe } from '../types';

let counter = 0;
const id = (prefix: string) => `${prefix}-${counter++}`;

export function ing(
  name: string,
  amount: number,
  scalingClass: Ingredient['scalingClass'],
  unit?: string,
): Ingredient {
  return { id: id('ing'), name, amount, unit, scalingClass };
}

export function recipe(partial: Partial<Recipe> & { ingredients: Ingredient[] }): Recipe {
  return {
    id: id('recipe'),
    title: 'Test Recipe',
    baseServings: 4,
    tags: [],
    steps: [],
    createdAt: 0,
    ...partial,
  };
}
