import { describe, it, expect } from 'vitest';
import { MathQuizEngine } from '../src/logic/mathquiz.js';

describe('MathQuizEngine', () => {
  it('generates factors in range 2–9', () => {
    const engine = new MathQuizEngine();
    for (let i = 0; i < 30; i++) {
      const { a, b } = engine.generateTask();
      expect(a).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it('answer equals a × b', () => {
    const engine = new MathQuizEngine();
    for (let i = 0; i < 20; i++) {
      const { a, b, answer } = engine.generateTask();
      expect(answer).toBe(a * b);
    }
  });

  it('points are in valid range', () => {
    const engine = new MathQuizEngine();
    for (let i = 0; i < 20; i++) {
      const { points } = engine.generateTask();
      expect([4, 6, 8]).toContain(points);
    }
  });

  it('points scale with difficulty', () => {
    const engine = new MathQuizEngine();
    expect(engine._pointsFor(2, 7)).toBe(4);
    expect(engine._pointsFor(7, 2)).toBe(4);
    expect(engine._pointsFor(5, 7)).toBe(6);
    expect(engine._pointsFor(7, 5)).toBe(6);
    expect(engine._pointsFor(2, 5)).toBe(4); // 2 wins over 5
    expect(engine._pointsFor(3, 7)).toBe(8);
    expect(engine._pointsFor(9, 9)).toBe(8);
  });
});
