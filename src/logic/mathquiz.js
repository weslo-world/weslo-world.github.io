/**
 * MathQuizEngine — generates multiplication quiz tasks.
 *
 * Queue-based adaptive selection:
 * - Tasks are pre-queued a few ahead.
 * - On a wrong answer, the same task is re-inserted 1–3 positions later
 *   so the player sees it again soon without it being the very next one.
 * - Designed for future upgrade (e.g. weighted difficulty, spaced repetition)
 *   without touching scene code.
 */

const QUEUE_MIN = 5;  // refill when queue drops below this

export class MathQuizEngine {
  constructor() {
    this._queue = [];
    this._fillQueue(QUEUE_MIN);
  }

  /**
   * Returns the next task: { a, b, answer, points }
   */
  generateTask() {
    if (this._queue.length < QUEUE_MIN) this._fillQueue(QUEUE_MIN);
    return this._queue.shift();
  }

  /**
   * Call after each answer. On wrong, re-inserts the task 1–3 positions ahead.
   */
  recordResult(task, correct) {
    if (!correct) {
      const r = Math.random();
      const delay = r < 0.5 ? 1 : r < 0.8 ? 2 : 3; // 50% / 30% / 20%
      const retry = this._makeTask(task.a, task.b);
      while (this._queue.length < delay) this._queue.push(this._randomTask());
      this._queue.splice(delay, 0, retry);
    }
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  _fillQueue(n) {
    for (let i = 0; i < n; i++) this._queue.push(this._randomTask());
  }

  _randomTask() {
    const a = Math.floor(Math.random() * 8) + 2;  // 2–9
    const b = Math.floor(Math.random() * 8) + 2;  // 2–9
    return this._makeTask(a, b);
  }

  _makeTask(a, b) {
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { a, b, label: `${a}  ×  ${b}  =`, answer: a * b, points: this._pointsFor(a, b) };
  }

  _pointsFor(a, b) {
    // 2×N, N×2 → easy (4pt)
    // 5×N, N×5 → medium (6pt)
    // other → hard (8pt)
    if (a === 2 || b === 2) return 4;
    if (a === 5 || b === 5) return 6;
    return 8;
  }
}
