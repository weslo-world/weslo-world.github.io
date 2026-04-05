# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Browser-based 2D match-3 puzzle game using Phaser 3. The player selects a real-world location (Holmlia neighborhood) from a map screen, then plays a location-themed puzzle with grid-based tile matching, combo scoring, and move-limited goals.

## Tech Stack

- **Phaser 3 via CDN** (`<script>` tag in index.html) — no npm install needed for the framework
- **Vanilla JavaScript** — ES modules, no build step, no bundler
- **Vitest** — unit tests for pure game logic
- **JSON** — level and location configuration

## Commands

```sh
./dev.sh                       # start Python HTTP server on port 8000
npm test                       # run all tests
npm test -- test/grid.test.js  # run a single test file
npm run test:watch             # watch mode
```

No build step — serve `index.html` via any HTTP server (needed for ES module imports and JSON fetch).

## Architecture

- **`src/logic/`** — Pure functions (grid, scoring, levels). No Phaser dependency. Tested with Vitest.
- **`src/scenes/`** — Phaser scenes. Depend on logic modules for all game rules.
- **`data/`** — JSON config: `locations.json` defines map hotspots; `levels/*.json` define per-level settings.
- **`assets/`** — Photo-based PNGs for map and scene backgrounds.

**Key design rule:** all game logic lives in `src/logic/` as pure, testable functions. Scenes only handle rendering and input.

### Scene Flow

`MapScene` → (player clicks location) → `PuzzleScene` + `UIScene` overlay → (game ends) → back to `MapScene`

- **MapScene** — loads `locations.json`, renders map with clickable hotspot zones, starts PuzzleScene with location data and first level ID.
- **PuzzleScene** — loads level JSON, runs match-3 gameplay loop (select → swap → match → gravity → cascade). Communicates score/moves to UIScene via events (`updateHUD`).
- **UIScene** — HUD overlay launched parallel to PuzzleScene. Displays score, moves, goal. Listens for `updateHUD` events.

### Game Loop (in PuzzleScene)

1. Player selects two adjacent tiles
2. `isValidSwap` checks if swap produces a match
3. On valid swap: decrement moves, swap tiles, then enter cascade loop
4. Cascade: `findMatches` → `calculateScore` (with combo multiplier) → `removeMatches` → `applyGravity` → repeat until no matches
5. Check win (score ≥ goal) or loss (moves = 0)

### Level Config Format (`data/levels/*.json`)

```json
{
  "gridSize": { "rows": 7, "cols": 7 },
  "tileTypes": ["train", "ticket", "bench", "tree", "clock"],
  "moves": 20,
  "scoreGoal": 500
}
```

Each location in `locations.json` references level files by ID (filename without extension). Tile types are strings mapped to colors and emoji symbols in PuzzleScene.

### Scoring

- Base: 10 points per matched tile
- Combo multiplier: `1 + (combo - 1) * 0.5` — cascading matches from a single swap increase the combo counter
