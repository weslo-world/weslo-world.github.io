import { describe, it, expect } from 'vitest';
import { AdditionQuizEngine } from '../src/logic/addition.js';

describe('AdditionQuizEngine', () => {
  it('generates operands in range 10–99', () => {
    const engine = new AdditionQuizEngine();
    for (let i = 0; i < 30; i++) {
      const { a, b } = engine.generateTask();
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(99);
      expect(b).toBeGreaterThanOrEqual(10);
      expect(b).toBeLessThanOrEqual(99);
    }
  });

  it('answer equals a + b', () => {
    const engine = new AdditionQuizEngine();
    for (let i = 0; i < 20; i++) {
      const { a, b, answer } = engine.generateTask();
      expect(answer).toBe(a + b);
    }
  });

  it('points are in valid range', () => {
    const engine = new AdditionQuizEngine();
    for (let i = 0; i < 20; i++) {
      const { points } = engine.generateTask();
      expect([3, 5, 7]).toContain(points);
    }
  });
});

describe('AdditionQuizEngine carry counting', () => {
  it('0 carries — no column overflows (e.g. 12 + 21)', () => {
    const engine = new AdditionQuizEngine();
    // 12 + 21: ones 2+1=3, tens 1+2=3 — no carries
    expect(engine._countCarries(12, 21)).toBe(0);
    expect(engine._countCarries(21, 12)).toBe(0);
    expect(engine._pointsFor(12, 21)).toBe(3);
  });

  it('1 carry — ones column overflows (e.g. 11 + 19)', () => {
    const engine = new AdditionQuizEngine();
    // 11 + 19: ones 1+9=10 (carry!), tens 1+1+1=3 — one carry
    expect(engine._countCarries(11, 19)).toBe(1);
    expect(engine._countCarries(19, 11)).toBe(1);
    expect(engine._pointsFor(11, 19)).toBe(5);
  });

  it('1 carry — tens column overflows without ones carry (e.g. 50 + 60)', () => {
    const engine = new AdditionQuizEngine();
    // 50 + 60: ones 0+0=0, tens 5+6=11 (carry!) — one carry
    expect(engine._countCarries(50, 60)).toBe(1);
    expect(engine._pointsFor(50, 60)).toBe(5);
  });

  it('2 carries — both columns overflow (e.g. 99 + 99)', () => {
    const engine = new AdditionQuizEngine();
    // 99 + 99: ones 9+9=18 (carry!), tens 9+9+1=19 (carry!) — two carries
    expect(engine._countCarries(99, 99)).toBe(2);
    expect(engine._pointsFor(99, 99)).toBe(7);
  });

  it('2 carries — ones carry pushes tens over (e.g. 95 + 16)', () => {
    const engine = new AdditionQuizEngine();
    // 95 + 16: ones 5+6=11 (carry!), tens 9+1+1=11 (carry!) — two carries
    expect(engine._countCarries(95, 16)).toBe(2);
    expect(engine._pointsFor(95, 16)).toBe(7);
  });
});
