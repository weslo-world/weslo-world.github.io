/**
 * AdditionQuizEngine — generates 2-digit + 2-digit addition tasks.
 *
 * Tasks: both operands 10–99 (answers 20–198), shown as "A + B =".
 * Points scale with number of carries (decimal transfers):
 *   0 carries → 3 pt  (e.g. 12 + 21 = 33)
 *   1 carry   → 5 pt  (e.g. 11 + 19 = 30, ones overflow)
 *   2 carries → 7 pt  (e.g. 99 + 99 = 198, ones + tens both overflow)
 *
 * Queueing, wrong-answer re-insertion and the adaptive timer come from
 * QuizEngineBase.
 */

import { QuizEngineBase } from './quizEngineBase.js';

export class AdditionQuizEngine extends QuizEngineBase {
  get timerSeconds() {
    return 20;
  }

  _randomTask() {
    const a = Math.floor(Math.random() * 90) + 10; // 10–99
    const b = Math.floor(Math.random() * 90) + 10; // 10–99
    return this._makeTask(a, b);
  }

  _makeTask(a, b) {
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { a, b, label: `${a}  +  ${b}  =`, answer: a + b, points: this._pointsFor(a, b) };
  }

  /** Count how many carries occur when adding a + b (0, 1, or 2). */
  _countCarries(a, b) {
    const onesCarry = (a % 10) + (b % 10) >= 10 ? 1 : 0;
    const tensCarry = Math.floor(a / 10) + Math.floor(b / 10) + onesCarry >= 10 ? 1 : 0;
    return onesCarry + tensCarry;
  }

  _pointsFor(a, b) {
    const c = this._countCarries(a, b);
    if (c === 0) return 3;
    if (c === 1) return 5;
    return 7;
  }
}
