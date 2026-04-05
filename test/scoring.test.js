import { describe, it, expect } from 'vitest';
import { calculateScore, checkGoal } from '../src/logic/scoring.js';

describe('calculateScore', () => {
  it('scores 10 points per matched tile at combo 1', () => {
    expect(calculateScore(3)).toBe(30);
    expect(calculateScore(4)).toBe(40);
  });

  it('applies combo multiplier', () => {
    // combo 2 → 1.5x, combo 3 → 2.0x
    expect(calculateScore(3, 2)).toBe(45);
    expect(calculateScore(3, 3)).toBe(60);
  });

  it('defaults to combo 1', () => {
    expect(calculateScore(5)).toBe(50);
  });
});

describe('checkGoal', () => {
  it('returns true when score meets goal', () => {
    expect(checkGoal(500, 500)).toBe(true);
  });

  it('returns true when score exceeds goal', () => {
    expect(checkGoal(600, 500)).toBe(true);
  });

  it('returns false when score is below goal', () => {
    expect(checkGoal(499, 500)).toBe(false);
  });
});
