/**
 * MathQuizEngine — generates multiplication quiz tasks.
 *
 * v1: random selection from 2–9 tables.
 * Designed for future replacement with spaced-repetition or educational-order
 * algorithm. Swap out generateTask() and recordResult() without touching scenes.
 */
export class MathQuizEngine {
  /**
   * Returns a quiz task object:
   * { a, b, answer, points }
   *
   * points is determined by difficulty.
   */
  generateTask() {
    const a = Math.floor(Math.random() * 8) + 2;  // 2–9
    const b = Math.floor(Math.random() * 8) + 2;  // 2–9
    const answer = a * b;
    const points = this._pointsFor(a, b);
    return { a, b, answer, points };
  }

  /**
   * Hook for v2 adaptive algorithm. Records whether the player answered correctly.
   * No-op in v1.
   */
  // eslint-disable-next-line no-unused-vars
  recordResult(a, b, correct) {
    // v2: update spaced-repetition state here
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
