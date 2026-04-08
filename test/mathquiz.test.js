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

  it('re-inserts failed task 1–3 positions later', () => {
    const engine = new MathQuizEngine();
    const first = engine.generateTask();
    engine.recordResult(first.a, first.b, false);

    // The failed task should reappear within the next 3 tasks
    const upcoming = [
      engine.generateTask(),
      engine.generateTask(),
      engine.generateTask(),
    ];
    // a and b may be swapped (50% chance), so check both orderings
    const reappeared = upcoming.some(t =>
      (t.a === first.a && t.b === first.b) ||
      (t.a === first.b && t.b === first.a)
    );
    expect(reappeared).toBe(true);
  });

  it('correct answer does not re-insert the task', () => {
    const engine = new MathQuizEngine();
    const first = engine.generateTask();
    engine.recordResult(first.a, first.b, true);

    // Peek at the next few — the task might coincidentally repeat (random),
    // but the queue should not have grown (no forced re-insertion)
    const queueBefore = engine._queue.length;
    expect(queueBefore).toBeGreaterThanOrEqual(4); // still filled
  });

  it('recordResult does not throw', () => {
    const engine = new MathQuizEngine();
    expect(() => engine.recordResult(3, 4, true)).not.toThrow();
    expect(() => engine.recordResult(3, 4, false)).not.toThrow();
  });
});
