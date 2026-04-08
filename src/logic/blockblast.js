/**
 * Pure grid logic for Block Blast.
 * Grid is a 2D array: grid[row][col] = false (empty) or true (filled).
 * All functions are immutable — they return new grids.
 */

/**
 * Creates a new empty grid.
 */
export function createGrid(rows = 8, cols = 8) {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

/**
 * Returns true if the piece can be placed at (row, col) on the grid.
 */
export function canPlacePiece(grid, cells, row, col) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (const [dr, dc] of cells) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    if (grid[r][c]) return false;
  }
  return true;
}

/**
 * Returns a new grid with the piece placed at (row, col).
 * Assumes canPlacePiece is true.
 */
export function placePiece(grid, cells, row, col) {
  const next = grid.map(r => [...r]);
  for (const [dr, dc] of cells) {
    next[row + dr][col + dc] = true;
  }
  return next;
}

/**
 * Returns indices of fully completed rows and columns.
 */
export function findCompletedLines(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const completedRows = [];
  const completedCols = [];

  for (let r = 0; r < rows; r++) {
    if (grid[r].every(cell => cell)) completedRows.push(r);
  }
  for (let c = 0; c < cols; c++) {
    if (grid.every(row => row[c])) completedCols.push(c);
  }

  return { rows: completedRows, cols: completedCols };
}

/**
 * Returns a new grid with the specified rows and columns cleared.
 */
export function removeLines(grid, completedRows, completedCols) {
  const rows = grid.length;
  const cols = grid[0].length;
  const next = grid.map(r => [...r]);

  for (const r of completedRows) {
    for (let c = 0; c < cols; c++) next[r][c] = false;
  }
  for (const c of completedCols) {
    for (let r = 0; r < rows; r++) next[r][c] = false;
  }

  return next;
}

/**
 * Returns true if at least one piece from the list can be placed anywhere on the grid.
 */
export function canAnyPieceFit(grid, pieceList) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (const piece of pieceList) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (canPlacePiece(grid, piece.cells, r, c)) return true;
      }
    }
  }
  return false;
}

/**
 * Blast clear: clears the 2 densest rows and 2 densest columns.
 * Returns { newGrid, clearedCells: [[r,c], ...] }
 */
export function blastClear(grid) {
  const rows = grid.length;
  const cols = grid[0].length;

  // Rank rows by fill count, pick top 2
  const rowCounts = Array.from({ length: rows }, (_, r) => ({
    r, count: grid[r].filter(Boolean).length,
  })).sort((a, b) => b.count - a.count);
  const blastRows = new Set(rowCounts.slice(0, 2).map(x => x.r));

  // Rank columns by fill count, pick top 2
  const colCounts = Array.from({ length: cols }, (_, c) => ({
    c, count: grid.filter(row => row[c]).length,
  })).sort((a, b) => b.count - a.count);
  const blastCols = new Set(colCounts.slice(0, 2).map(x => x.c));

  const clearedCells = [];
  const next = grid.map(r => [...r]);

  for (const r of blastRows) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c]) { next[r][c] = false; clearedCells.push([r, c]); }
    }
  }
  for (const c of blastCols) {
    for (let r = 0; r < rows; r++) {
      if (next[r][c]) { next[r][c] = false; clearedCells.push([r, c]); }
    }
  }

  return { newGrid: next, clearedCells };
}

/**
 * Returns all valid placement positions for a piece on the grid.
 * Used for hint or validation.
 */
export function getValidPlacements(grid, cells) {
  const rows = grid.length;
  const cols = grid[0].length;
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (canPlacePiece(grid, cells, r, c)) positions.push([r, c]);
    }
  }
  return positions;
}
