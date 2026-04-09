import { MathQuizEngine } from './mathquiz.js';
import { AdditionQuizEngine } from './addition.js';

const ENGINES = {
  multiplication: MathQuizEngine,
  addition: AdditionQuizEngine,
};

/**
 * Returns a quiz engine instance for the given type string.
 * Defaults to multiplication if type is unknown.
 */
export function createQuizEngine(type) {
  const Engine = ENGINES[type] || MathQuizEngine;
  return new Engine();
}
