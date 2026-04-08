import { describe, it, expect } from 'vitest';
import { MathQuizEngine } from '../src/logic/mathquiz.js';

describe('MathQuizEngine', () => {
  const engine = new MathQuizEngine();

  it('generates factors in range 2–9', () => {
    for (let i = 0; i < 30; i++) {
      const { a, b } = engine.generateTask();
      expect(a).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it('answer equals a × b', () => {
    for (let i = 0; i < 20; i++) {
      const { a, b, answer } = engine.generateTask();
      expect(answer).toBe(a * b);
    }
  });

  it('points are 4 when either factor is 2', () => {
    expect(engine._pointsFor(2, 7)).toBe(4);
    expect(engine._pointsFor(7, 2)).toBe(4);
  });

  it('points are 6 when either factor is 5 (and not 2)', () => {
    expect(engine._pointsFor(5, 7)).toBe(6);
    expect(engine._pointsFor(7, 5)).toBe(6);
  });

  it('points are 4 when factors are 2 and 5 (minimum wins)', () => {
    expect(engine._pointsFor(2, 5)).toBe(4);
  });

  it('points are 8 for other factors', () => {
    expect(engine._pointsFor(3, 7)).toBe(8);
    expect(engine._pointsFor(4, 6)).toBe(8);
    expect(engine._pointsFor(9, 9)).toBe(8);
  });

  it('points are in valid range', () => {
    for (let i = 0; i < 20; i++) {
      const { points } = engine.generateTask();
      expect([4, 6, 8]).toContain(points);
    }
  });

  it('recordResult does not throw', () => {
    expect(() => engine.recordResult(3, 4, true)).not.toThrow();
    expect(() => engine.recordResult(3, 4, false)).not.toThrow();
  });
});
