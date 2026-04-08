/**
 * Piece shape definitions for Block Blast.
 * Each shape is an array of [row, col] offsets from the top-left bounding corner.
 */

export const PIECES = [
  // Singles
  { id: 'dot', cells: [[0, 0]] },

  // Horizontal lines
  { id: 'h2', cells: [[0, 0], [0, 1]] },
  { id: 'h3', cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 'h4', cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: 'h5', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },

  // Vertical lines
  { id: 'v2', cells: [[0, 0], [1, 0]] },
  { id: 'v3', cells: [[0, 0], [1, 0], [2, 0]] },
  { id: 'v4', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { id: 'v5', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },

  // 2×2 square
  { id: 'sq2', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },

  // 3×3 square
  { id: 'sq3', cells: [
    [0,0],[0,1],[0,2],
    [1,0],[1,1],[1,2],
    [2,0],[2,1],[2,2],
  ]},

  // L shapes
  { id: 'lA', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: 'lB', cells: [[0, 0], [0, 1], [1, 0], [2, 0]] },
  { id: 'lC', cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  { id: 'lD', cells: [[0, 2], [1, 0], [1, 1], [1, 2]] },

  // J shapes (mirror of L)
  { id: 'jA', cells: [[0, 1], [1, 1], [2, 0], [2, 1]] },
  { id: 'jB', cells: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  { id: 'jC', cells: [[0, 0], [0, 1], [0, 2], [1, 0]] },
  { id: 'jD', cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },

  // T shapes
  { id: 'tA', cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: 'tB', cells: [[0, 0], [1, 0], [1, 1], [2, 0]] },
  { id: 'tC', cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  { id: 'tD', cells: [[0, 0], [0, 1], [1, 0], [2, 0]] },

  // Corners (2×2 minus one)
  { id: 'cTL', cells: [[0, 0], [0, 1], [1, 0]] },
  { id: 'cTR', cells: [[0, 0], [0, 1], [1, 1]] },
  { id: 'cBL', cells: [[0, 0], [1, 0], [1, 1]] },
  { id: 'cBR', cells: [[0, 1], [1, 0], [1, 1]] },
];

/**
 * Returns the bounding box size of a piece shape.
 */
export function getPieceBounds(cells) {
  const maxRow = Math.max(...cells.map(([r]) => r));
  const maxCol = Math.max(...cells.map(([, c]) => c));
  return { rows: maxRow + 1, cols: maxCol + 1 };
}

/**
 * Returns a new set of 3 randomly selected piece shapes.
 */
export function getRandomPieceSet() {
  const pool = [...PIECES];
  const result = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
