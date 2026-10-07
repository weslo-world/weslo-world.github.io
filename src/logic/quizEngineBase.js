/**
 * QuizEngineBase — shared behavior for all quiz engines.
 *
 * Subclasses implement:
 *   _randomTask()   → a fresh random task
 *   _makeTask(a, b) → { a, b, label, answer, points } for given operands
 * and may override the `timerSeconds` getter (base seconds per quiz).
 * It must be a getter, not a class field: the base constructor reads it
 * before subclass fields are initialized.
 *
 * Provided here:
 * - Queue-based task delivery, pre-filled a few tasks ahead.
 * - On a wrong answer the same task is re-inserted 1–3 positions later
 *   so the player sees it again soon without it being the very next one.
 * - Adaptive timer: starts at `timerSeconds`; each wrong answer grows it
 *   by 20% (capped at TIMER_MAX_FACTOR × base), each correct answer
 *   shrinks it by 5% (floored at base).
 */

const QUEUE_MIN = 5;               // refill when queue drops below this
export const TIMER_MAX_FACTOR = 2; // adaptive timer cap relative to base
const TIMER_GROW = 1.20;
const TIMER_SHRINK = 0.95;

export class QuizEngineBase {
  /** Base seconds per quiz. Override as a getter in subclasses. */
  get timerSeconds() {
    return 10;
  }

  constructor() {
    this._currentTimerSeconds = this.timerSeconds;
    this._queue = [];
    this._fillQueue(QUEUE_MIN);
  }

  /** Seconds the next quiz should allow, after adaptive adjustment. */
  get currentTimerSeconds() {
    return this._currentTimerSeconds;
  }

  /** Returns the next task: { a, b, label, answer, points } */
  generateTask() {
    if (this._queue.length < QUEUE_MIN) this._fillQueue(QUEUE_MIN);
    return this._queue.shift();
  }

  /**
   * Call after each answer. Adjusts the adaptive timer and, on a wrong
   * answer, re-inserts the task 1–3 positions ahead.
   */
  recordResult(task, correct) {
    if (correct) {
      this._currentTimerSeconds = Math.max(
        this.timerSeconds,
        this._currentTimerSeconds * TIMER_SHRINK
      );
      return;
    }

    this._currentTimerSeconds = Math.min(
      this.timerSeconds * TIMER_MAX_FACTOR,
      this._currentTimerSeconds * TIMER_GROW
    );

    const r = Math.random();
    const delay = r < 0.5 ? 1 : r < 0.8 ? 2 : 3; // 50% / 30% / 20%
    const retry = this._makeTask(task.a, task.b);
    while (this._queue.length < delay) this._queue.push(this._randomTask());
    this._queue.splice(delay, 0, retry);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  _fillQueue(n) {
    for (let i = 0; i < n; i++) this._queue.push(this._randomTask());
  }

  _randomTask() {
    throw new Error('QuizEngineBase subclass must implement _randomTask()');
  }

  _makeTask(_a, _b) {
    throw new Error('QuizEngineBase subclass must implement _makeTask(a, b)');
  }
}
