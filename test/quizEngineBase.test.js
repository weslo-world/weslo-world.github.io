import { describe, it, expect } from 'vitest';
import { MathQuizEngine } from '../src/logic/mathquiz.js';
import { AdditionQuizEngine } from '../src/logic/addition.js';
import { TIMER_MAX_FACTOR } from '../src/logic/quizEngineBase.js';

// Behavior shared by every engine via QuizEngineBase — run against each one.
const ENGINES = [
  ['MathQuizEngine', MathQuizEngine, 10],
  ['AdditionQuizEngine', AdditionQuizEngine, 20],
];

describe.each(ENGINES)('%s (shared engine behavior)', (_name, Engine, baseSeconds) => {
  it('re-inserts failed task 1–3 positions later', () => {
    const engine = new Engine();
    const first = engine.generateTask();
    engine.recordResult(first, false);

    // splice(delay, 0, retry) with delay=3 places retry at index 3 → 4th draw
    const upcoming = [
      engine.generateTask(),
      engine.generateTask(),
      engine.generateTask(),
      engine.generateTask(),
    ];
    // a and b may be swapped (50% chance), so check both orderings
    const reappeared = upcoming.some(t =>
      (t.a === first.a && t.b === first.b) || (t.a === first.b && t.b === first.a)
    );
    expect(reappeared).toBe(true);
  });

  it('correct answer does not re-insert the task', () => {
    const engine = new Engine();
    const first = engine.generateTask();
    const queueBefore = engine._queue.length;
    engine.recordResult(first, true);
    expect(engine._queue.length).toBe(queueBefore);
  });

  it('timer starts at the engine base', () => {
    const engine = new Engine();
    expect(engine.timerSeconds).toBe(baseSeconds);
    expect(engine.currentTimerSeconds).toBe(baseSeconds);
  });

  it('timer grows on wrong answers, capped at TIMER_MAX_FACTOR × base', () => {
    const engine = new Engine();
    const task = engine.generateTask();
    engine.recordResult(task, false);
    expect(engine.currentTimerSeconds).toBeGreaterThan(baseSeconds);
    expect(engine.currentTimerSeconds).toBeLessThanOrEqual(baseSeconds * TIMER_MAX_FACTOR);

    for (let i = 0; i < 20; i++) engine.recordResult(task, false);
    expect(engine.currentTimerSeconds).toBe(baseSeconds * TIMER_MAX_FACTOR);
  });

  it('timer shrinks on correct answers, floored at base', () => {
    const engine = new Engine();
    const task = engine.generateTask();
    for (let i = 0; i < 5; i++) engine.recordResult(task, false);
    const grown = engine.currentTimerSeconds;

    engine.recordResult(task, true);
    expect(engine.currentTimerSeconds).toBeLessThan(grown);

    for (let i = 0; i < 40; i++) engine.recordResult(task, true);
    expect(engine.currentTimerSeconds).toBe(baseSeconds);
  });
});
