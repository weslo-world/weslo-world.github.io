import { describe, it, expect } from 'vitest';
import { createGrid, findMatches, removeMatches, applyGravity, swapTiles, isAdjacent, isValidSwap } from '../src/logic/grid.js';

const TYPES = ['A', 'B', 'C', 'D', 'E'];

describe('createGrid', () => {
  it('creates a grid with the correct dimensions', () => {
    const grid = createGrid(5, 6, TYPES);
    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(6);
  });

  it('only uses provided tile types', () => {
    const grid = createGrid(5, 5, TYPES);
    for (const row of grid) {
      for (const tile of row) {
        expect(TYPES).toContain(tile);
      }
    }
  });

  it('generates no initial matches', () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 20; i++) {
      const grid = createGrid(7, 7, TYPES);
      const matches = findMatches(grid);
      expect(matches.length).toBe(0);
    }
  });
});

describe('findMatches', () => {
  it('finds a horizontal match of 3', () => {
    const grid = [
      ['A', 'A', 'A', 'B'],
      ['C', 'D', 'E', 'C'],
    ];
    const matches = findMatches(grid);
    expect(matches.length).toBe(3);
    expect(matches).toEqual(expect.arrayContaining([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]));
  });

  it('finds a vertical match of 3', () => {
    const grid = [
      ['A', 'B'],
      ['A', 'C'],
      ['A', 'D'],
    ];
    const matches = findMatches(grid);
    expect(matches.length).toBe(3);
  });

  it('finds a match of 4', () => {
    const grid = [
      ['A', 'A', 'A', 'A'],
      ['B', 'C', 'D', 'E'],
    ];
    const matches = findMatches(grid);
    expect(matches.length).toBe(4);
  });

  it('finds overlapping horizontal and vertical matches', () => {
    const grid = [
      ['A', 'A', 'A'],
      ['B', 'A', 'C'],
      ['D', 'A', 'E'],
    ];
    const matches = findMatches(grid);
    // 3 horizontal (row 0) + 3 vertical (col 1) - 1 overlap at (0,1) = 5 unique
    expect(matches.length).toBe(5);
  });

  it('returns empty array when no matches', () => {
    const grid = [
      ['A', 'B', 'A'],
      ['B', 'A', 'B'],
      ['A', 'B', 'A'],
    ];
    expect(findMatches(grid).length).toBe(0);
  });
});

describe('removeMatches', () => {
  it('sets matched positions to null', () => {
    const grid = [
      ['A', 'A', 'A'],
      ['B', 'C', 'D'],
    ];
    const matches = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
    const result = removeMatches(grid, matches);
    expect(result[0]).toEqual([null, null, null]);
    expect(result[1]).toEqual(['B', 'C', 'D']);
  });

  it('does not mutate the original grid', () => {
    const grid = [['A', 'B'], ['C', 'D']];
    removeMatches(grid, [{ row: 0, col: 0 }]);
    expect(grid[0][0]).toBe('A');
  });
});

describe('applyGravity', () => {
  it('drops tiles down to fill gaps', () => {
    const grid = [
      [null, 'B'],
      ['A', null],
    ];
    // Use a seeded rng that always returns type index 0
    const result = applyGravity(grid, TYPES, () => 0);
    // Column 0: null drops, A falls to bottom → [new, A]
    expect(result[1][0]).toBe('A');
    // Column 1: null drops, B falls to bottom → [new, B]
    expect(result[1][1]).toBe('B');
    // Top row should be filled with new tiles
    expect(result[0][0]).not.toBeNull();
    expect(result[0][1]).not.toBeNull();
  });
});

describe('swapTiles', () => {
  it('swaps two positions', () => {
    const grid = [['A', 'B'], ['C', 'D']];
    const result = swapTiles(grid, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(result[0]).toEqual(['B', 'A']);
  });

  it('does not mutate the original grid', () => {
    const grid = [['A', 'B']];
    swapTiles(grid, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(grid[0]).toEqual(['A', 'B']);
  });
});

describe('isAdjacent', () => {
  it('returns true for horizontally adjacent', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
  });

  it('returns true for vertically adjacent', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true);
  });

  it('returns false for diagonal', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(false);
  });

  it('returns false for distant tiles', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
  });
});

describe('isValidSwap', () => {
  it('returns true when swap creates a match', () => {
    const grid = [
      ['A', 'B', 'A'],
      ['A', 'C', 'D'],
      ['B', 'C', 'E'],
    ];
    // Swapping (0,1) B with (1,1) C should create vertical C-C-? no...
    // Let's use a clearer case:
    const grid2 = [
      ['A', 'A', 'B'],
      ['C', 'D', 'A'],
    ];
    // Swap (0,2) B with (1,2) A → row 0 becomes A,A,A = match
    expect(isValidSwap(grid2, { row: 0, col: 2 }, { row: 1, col: 2 })).toBe(true);
  });

  it('returns false when swap creates no match', () => {
    const grid = [
      ['A', 'B', 'C'],
      ['D', 'E', 'A'],
    ];
    expect(isValidSwap(grid, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
  });

  it('returns false for non-adjacent tiles', () => {
    const grid = [
      ['A', 'A', 'B'],
      ['C', 'D', 'A'],
    ];
    expect(isValidSwap(grid, { row: 0, col: 0 }, { row: 1, col: 2 })).toBe(false);
  });
});
