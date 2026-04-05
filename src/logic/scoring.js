export function calculateScore(matchCount, combo = 1) {
  const basePoints = matchCount * 10;
  const multiplier = 1 + (combo - 1) * 0.5;
  return Math.floor(basePoints * multiplier);
}

export function checkGoal(score, goal) {
  return score >= goal;
}
