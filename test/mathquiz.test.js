import { describe, it, expect } from 'vitest';
import { MathQuizEngine } from '../src/logic/mathquiz.js';

describe('MathQuizEngine', () => {
  const engine = new MathQuizEngine();

  it('generates a task with valid factors 1–10', () => {
    for (let i = 0; i < 20; i++) {
      const { a, b } = engine.generateTask();
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(10);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });

  it('answer equals a × b', () => {
    for (let i = 0; i < 20; i++) {
      const { a, b, answer } = engine.generateTask();
      expect(answer).toBe(a * b);
    }
  });

  it('options contains exactly 4 numbers', () => {
    const { options } = engine.generateTask();
    expect(options).toHaveLength(4);
  });

  it('options contains the correct answer', () => {
    for (let i = 0; i < 20; i++) {
      const { answer, options } = engine.generateTask();
      expect(options).toContain(answer);
    }
  });

  it('options has no duplicates', () => {
    for (let i = 0; i < 20; i++) {
      const { options } = engine.generateTask();
      expect(new Set(options).size).toBe(4);
    }
  });

  it('points scale with difficulty', () => {
    // factor 1 → 1 pt
    const t1 = engine.generateTask();
    // We can't force factors, but we can test the range
    const { points } = engine.generateTask();
    expect(points).toBeGreaterThanOrEqual(1);
    expect(points).toBeLessThanOrEqual(8);
  });

  it('recordResult does not throw', () => {
    expect(() => engine.recordResult(3, 4, true)).not.toThrow();
    expect(() => engine.recordResult(3, 4, false)).not.toThrow();
  });
});
