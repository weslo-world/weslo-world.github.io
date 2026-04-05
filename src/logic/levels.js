const REQUIRED_FIELDS = ['gridSize', 'tileTypes', 'moves', 'scoreGoal'];

export function loadLevel(levelData) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in levelData)) {
      throw new Error(`Level missing required field: ${field}`);
    }
  }
  const { gridSize, tileTypes, moves, scoreGoal } = levelData;
  if (gridSize.rows < 3 || gridSize.cols < 3) {
    throw new Error('Grid must be at least 3x3');
  }
  if (tileTypes.length < 3) {
    throw new Error('Need at least 3 tile types');
  }
  return { gridSize, tileTypes, moves, scoreGoal };
}
