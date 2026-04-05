/**
 * Pure match-3 grid logic. All functions are side-effect free —
 * they return new grids rather than mutating inputs.
 */

export function createGrid(rows, cols, tileTypes, rng = Math.random) {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () =>
      tileTypes[Math.floor(rng() * tileTypes.length)]
    )
  );
  // Remove any accidental initial matches by re-rolling conflicting cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      while (hasMatchAt(grid, r, c, rows, cols)) {
        grid[r][c] = tileTypes[Math.floor(rng() * tileTypes.length)];
      }
    }
  }
  return grid;
}

function hasMatchAt(grid, r, c, rows, cols) {
  const tile = grid[r][c];
  if (tile === null) return false;
  // Horizontal check
  if (c >= 2 && grid[r][c - 1] === tile && grid[r][c - 2] === tile) return true;
  // Vertical check
  if (r >= 2 && grid[r - 1][c] === tile && grid[r - 2][c] === tile) return true;
  return false;
}

export function findMatches(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const matched = new Set();

  // Horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 3; c++) {
      const tile = grid[r][c];
      if (tile !== null && grid[r][c + 1] === tile && grid[r][c + 2] === tile) {
        let end = c + 2;
        while (end + 1 < cols && grid[r][end + 1] === tile) end++;
        for (let k = c; k <= end; k++) matched.add(`${r},${k}`);
        c = end;
      }
    }
  }

  // Vertical
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r <= rows - 3; r++) {
      const tile = grid[r][c];
      if (tile !== null && grid[r + 1][c] === tile && grid[r + 2][c] === tile) {
        let end = r + 2;
        while (end + 1 < rows && grid[end + 1][c] === tile) end++;
        for (let k = r; k <= end; k++) matched.add(`${k},${c}`);
        r = end;
      }
    }
  }

  return [...matched].map(key => {
    const [r, c] = key.split(',').map(Number);
    return { row: r, col: c };
  });
}

export function removeMatches(grid, matches) {
  const next = grid.map(row => [...row]);
  for (const { row, col } of matches) {
    next[row][col] = null;
  }
  return next;
}

export function applyGravity(grid, tileTypes, rng = Math.random) {
  const rows = grid.length;
  const cols = grid[0].length;
  const next = grid.map(row => [...row]);

  for (let c = 0; c < cols; c++) {
    // Compact non-null tiles to the bottom
    const column = [];
    for (let r = 0; r < rows; r++) {
      if (next[r][c] !== null) column.push(next[r][c]);
    }
    const empties = rows - column.length;
    // Fill top with new random tiles
    const newTiles = Array.from({ length: empties }, () =>
      tileTypes[Math.floor(rng() * tileTypes.length)]
    );
    const filled = [...newTiles, ...column];
    for (let r = 0; r < rows; r++) {
      next[r][c] = filled[r];
    }
  }

  return next;
}

export function swapTiles(grid, pos1, pos2) {
  const next = grid.map(row => [...row]);
  const temp = next[pos1.row][pos1.col];
  next[pos1.row][pos1.col] = next[pos2.row][pos2.col];
  next[pos2.row][pos2.col] = temp;
  return next;
}

export function isAdjacent(pos1, pos2) {
  const dr = Math.abs(pos1.row - pos2.row);
  const dc = Math.abs(pos1.col - pos2.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

export function isValidSwap(grid, pos1, pos2) {
  if (!isAdjacent(pos1, pos2)) return false;
  const swapped = swapTiles(grid, pos1, pos2);
  return findMatches(swapped).length > 0;
}
