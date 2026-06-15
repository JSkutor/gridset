// @ts-nocheck
import { test, describe } from 'vitest';
import assert from 'node:assert/strict';
import { swapItems } from './array.js';

describe('array utility: swapItems', () => {
  test('swaps two elements in an array immutably', () => {
    const original = ['a', 'b', 'c', 'd'];
    const result = swapItems(original, 1, 3);
    
    assert.deepEqual(result, ['a', 'd', 'c', 'b']);
    // Confirm immutability
    assert.deepEqual(original, ['a', 'b', 'c', 'd']);
    assert.notEqual(original, result);
  });

  test('returns a copy of the array even if indices are same', () => {
    const original = [1, 2, 3];
    const result = swapItems(original, 1, 1);
    
    assert.deepEqual(result, [1, 2, 3]);
    assert.notEqual(original, result);
  });
});
