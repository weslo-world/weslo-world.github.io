/**
 * AdditionQuizEngine — generates 2-digit addition tasks.
 *
 * Same interface as MathQuizEngine: generateTask() / recordResult(task, correct).
 * Tasks: one operand 10–20, one operand 2–9 (answers 12–29), shown as "A + B =".
 * Points scale with answer size.
 */

const QUEUE_MIN = 5;

export class AdditionQuizEngine {
  constructor() {
    this._queue = [];
    this._fillQueue(QUEUE_MIN);
  }

  generateTask() {
    if (this._queue.length < QUEUE_MIN) this._fillQueue(QUEUE_MIN);
    return this._queue.shift();
  }

  recordResult(task, correct) {
    if (!correct) {
      const r = Math.random();
      const delay = r < 0.5 ? 1 : r < 0.8 ? 2 : 3;
      const retry = this._makeTask(task.a, task.b);
      while (this._queue.length < delay) this._queue.push(this._randomTask());
      this._queue.splice(delay, 0, retry);
    }
  }

  _fillQueue(n) {
    for (let i = 0; i < n; i++) this._queue.push(this._randomTask());
  }

  _randomTask() {
    const a = Math.floor(Math.random() * 11) + 10; // 10–20
    const b = Math.floor(Math.random() * 8) + 2;   // 2–9
    return this._makeTask(a, b);
  }

  _makeTask(a, b) {
    if (Math.random() < 0.5) [a, b] = [b, a];
    const answer = a + b;
    return { a, b, label: `${a}  +  ${b}  =`, answer, points: this._pointsFor(answer) };
  }

  _pointsFor(answer) {
    if (answer <= 15) return 3;
    if (answer <= 20) return 5;
    return 7;
  }
}
