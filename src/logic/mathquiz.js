/**
 * MathQuizEngine — generates multiplication quiz tasks.
 *
 * Factors are always 2–9 (no ×1 / ×10). Each task has a 50% chance of
 * showing as a×b or b×a to reinforce commutativity.
 *
 * Queueing, wrong-answer re-insertion and the adaptive timer come from
 * QuizEngineBase.
 */

import { QuizEngineBase } from './quizEngineBase.js';

export class MathQuizEngine extends QuizEngineBase {
  get timerSeconds() {
    return 10;
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
