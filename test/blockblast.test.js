import { describe, it, expect } from 'vitest';
import {
  createGrid, canPlacePiece, placePiece,
  findCompletedLines, removeLines, canAnyPieceFit, blastClear,
} from '../src/logic/blockblast.js';

describe('createGrid', () => {
  it('creates an 8×8 grid of false', () => {
    const g = createGrid();
    expect(g.length).toBe(8);
    expect(g[0].length).toBe(8);
    expect(g.every(row => row.every(c => c === false))).toBe(true);
  });
});

describe('canPlacePiece', () => {
  it('allows placing a piece on empty grid', () => {
    const g = createGrid();
    expect(canPlacePiece(g, [[0,0],[0,1]], 0, 0)).toBe(true);
  });

  it('rejects placement that goes out of bounds', () => {
    const g = createGrid();
    expect(canPlacePiece(g, [[0,0],[0,1]], 0, 7)).toBe(false); // col 8 out of range
  });

  it('rejects placement on occupied cell', () => {
    const g = createGrid();
    const g2 = placePiece(g, [[0,0]], 0, 0);
    expect(canPlacePiece(g2, [[0,0]], 0, 0)).toBe(false);
  });
});

describe('placePiece', () => {
  it('fills the correct cells', () => {
    const g = createGrid();
    const g2 = placePiece(g, [[0,0],[0,1],[1,0]], 2, 3);
    expect(g2[2][3]).toBe(true);
    expect(g2[2][4]).toBe(true);
    expect(g2[3][3]).toBe(true);
    expect(g2[2][2]).toBe(false);
  });

  it('does not mutate the original grid', () => {
    const g = createGrid();
    placePiece(g, [[0,0]], 0, 0);
    expect(g[0][0]).toBe(false);
  });
});

describe('findCompletedLines', () => {
  it('detects a completed row', () => {
    let g = createGrid();
    for (let c = 0; c < 8; c++) g = placePiece(g, [[0,0]], 0, c);
    const { rows, cols } = findCompletedLines(g);
    expect(rows).toContain(0);
    expect(cols).toHaveLength(0);
  });

  it('detects a completed column', () => {
    let g = createGrid();
    for (let r = 0; r < 8; r++) g = placePiece(g, [[0,0]], r, 3);
    const { rows, cols } = findCompletedLines(g);
    expect(cols).toContain(3);
    expect(rows).toHaveLength(0);
  });

  it('returns empty when no lines complete', () => {
    const g = createGrid();
    const { rows, cols } = findCompletedLines(g);
    expect(rows).toHaveLength(0);
    expect(cols).toHaveLength(0);
  });
});

describe('removeLines', () => {
  it('clears completed rows and columns', () => {
    let g = createGrid();
    for (let c = 0; c < 8; c++) g = placePiece(g, [[0,0]], 0, c);
    g = removeLines(g, [0], []);
    expect(g[0].every(c => c === false)).toBe(true);
  });
});

describe('canAnyPieceFit', () => {
  it('returns true on an empty grid', () => {
    const g = createGrid();
    const pieces = [{ cells: [[0,0],[0,1]] }];
    expect(canAnyPieceFit(g, pieces)).toBe(true);
  });

  it('returns false when no piece fits', () => {
    // Fill entire grid
    let g = createGrid();
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        g = placePiece(g, [[0,0]], r, c);
    const pieces = [{ cells: [[0,0]] }];
    expect(canAnyPieceFit(g, pieces)).toBe(false);
  });
});

describe('blastClear', () => {
  it('clears at least one cell', () => {
    let g = createGrid();
    g = placePiece(g, [[0,0],[1,0],[2,0]], 0, 0);
    const { newGrid, clearedCells } = blastClear(g);
    expect(clearedCells.length).toBeGreaterThan(0);
  });

  it('does not mutate original grid', () => {
    let g = createGrid();
    g = placePiece(g, [[0,0]], 0, 0);
    const original = g[0][0];
    blastClear(g);
    expect(g[0][0]).toBe(original);
  });
});
