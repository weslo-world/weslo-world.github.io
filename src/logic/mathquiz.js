/**
 * MathQuizEngine — generates multiplication quiz tasks.
 *
 * v1: random selection from 1–10 tables.
 * Designed for future replacement with spaced-repetition or educational-order
 * algorithm. Swap out generateTask() and recordResult() without touching scenes.
 */
export class MathQuizEngine {
  /**
   * Returns a quiz task object:
   * { a, b, answer, options: number[4], points }
   *
   * options contains 4 values, shuffled, including the correct answer.
   * points is determined by difficulty (max factor).
   */
  generateTask() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const answer = a * b;
    const points = this._pointsFor(a, b);
    const options = this._buildOptions(answer, a, b);
    return { a, b, answer, options, points };
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
    const max = Math.max(a, b);
    // Collect all applicable point values and return the minimum
    // 1×N, N×1, 10×N, N×10 → trivial (2pt)
    // 2×N, N×2 → easy (4pt)
    // 5×N, N×5 → medium (6pt)
    // other → hard (8pt)
    const pts = [];
    if (a === 1 || b === 1 || a === 10 || b === 10) pts.push(2);
    if (a === 2 || b === 2) pts.push(4);
    if (a === 5 || b === 5) pts.push(6);
    if (pts.length === 0) pts.push(8);
    return Math.min(...pts);
  }

  _buildOptions(answer, a, b) {
    const distractors = new Set();

    // Plausible wrong answers: nearby products, common mistakes
    const candidates = [
      answer + 1, answer - 1,
      answer + 2, answer - 2,
      answer + a, answer - a,
      answer + b, answer - b,
      (a + 1) * b, a * (b + 1),
      (a - 1) * b, a * (b - 1),
    ];

    for (const c of candidates) {
      if (c > 0 && c !== answer) distractors.add(c);
      if (distractors.size >= 3) break;
    }

    // Fallback: just offset if we didn't get enough
    let offset = 1;
    while (distractors.size < 3) {
      if (offset !== answer) distractors.add(Math.abs(answer + offset));
      offset++;
    }

    const options = [answer, ...[...distractors].slice(0, 3)];
    return this._shuffle(options);
  }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
