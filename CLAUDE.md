# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Browser-based Block Blast puzzle game with multiplication quiz mechanics, built with Phaser 3. The player selects a real-world location (Holmlia neighborhood) from a map screen, then plays a block-placement puzzle. Completing lines triggers a math quiz — answer correctly to earn points. Goal: reach 100 points to unlock screen time or a reward.

Target audience: primary school children (~6–10 years old). Designed to be played on iPhone (portrait), iPad, or desktop browser.

## Tech Stack

- **Phaser 3 via CDN** (`<script>` tag in index.html) — no npm install needed for the framework
- **Vanilla JavaScript** — ES modules, no build step, no bundler
- **Vitest** — unit tests for pure game logic
- **JSON** — location configuration (`data/locations.json`)

## Commands

```sh
./dev.sh                            # start Python HTTP server on port 8000
npm test                            # run all tests
npm test -- test/blockblast.test.js # run a single test file
npm run test:watch                  # watch mode
```

No build step — serve `index.html` via any HTTP server (needed for ES module imports and JSON fetch).

## Architecture

- **`src/logic/`** — Pure functions and classes. No Phaser dependency. Tested with Vitest.
- **`src/scenes/`** — Phaser scenes. Depend on logic modules for all game rules.
- **`src/utils/layout.js`** — Dynamic layout computation. All scenes use `computeLayout(W, H)` instead of hardcoded positions.
- **`data/locations.json`** — map hotspots and background image paths.
- **`assets/`** — Photo-based PNGs for map and scene backgrounds.

**Key design rule:** all game logic lives in `src/logic/` as pure, testable functions. Scenes only handle rendering and input.

### Scene Flow

`MapScene` → (player taps location) → `BlockBlastScene` + `UIScene` overlay → (lines cleared) → `QuizOverlayScene` → (result) → back to `BlockBlastScene` → (score ≥ 100) → win screen → back to `MapScene`

- **MapScene** — loads `locations.json`, preloads all location background images, renders map with tappable hotspot zones.
- **BlockBlastScene** — main game. 8×8 grid, 3-piece tray, drag-to-place. Detects line clears, stuck state, win condition. Launches QuizOverlayScene when needed. Emits `updateHUD` to UIScene.
- **UIScene** — HUD overlay parallel to BlockBlastScene. Shows location name, score progress bar (X/100), back button.
- **QuizOverlayScene** — modal quiz overlay. Pauses BlockBlastScene while active. Shows multiplication problem, 4 options, 5-second timer bar. Emits `quizComplete` on finish.

### Game Loop (BlockBlastScene)

1. Player drags a piece from tray onto the 8×8 grid
2. Ghost preview shows valid (green) / invalid (red) placement
3. On valid drop: place piece, check for completed lines (horizontal + vertical)
4. If lines completed: flash cells → pause → launch QuizOverlayScene
5. QuizOverlayScene result:
   - **Correct**: confetti animation, award `basePoints × linesCleared`, resume
   - **Wrong**: shake + show correct answer 5s (tap to dismiss) → 0 points, resume
6. When all 3 tray pieces placed: replenish with new set of 3
7. If no piece in tray can fit anywhere on grid: show "No room!" → rescue quiz
   - Correct → blast clears densest row+column cross → continue
   - Wrong → show answer → retry same quiz (loop until correct)
8. Win when score ≥ 100: congratulations screen with date/time stamp

### Points System

Base points determined by the harder factor in the multiplication task:

| Max factor | Base points |
|---|---|
| 1 | 1 pt |
| 2–3 | 2 pt |
| 4–5 | 4 pt |
| 6–7 | 6 pt |
| 8–10 | 8 pt |

**Final = base × lines cleared** (e.g. clearing 2 lines with a 7×8 task → 6 × 2 = 12 pts)

### MathQuizEngine (`src/logic/mathquiz.js`)

Encapsulated class. v1 is random selection from 1–10 multiplication tables. Designed for future replacement with spaced-repetition or educational-order algorithm without touching scene code.

```js
class MathQuizEngine {
  generateTask()              // → { a, b, answer, options[4], points }
  recordResult(a, b, correct) // hook for v2 adaptive algorithm (no-op in v1)
}
```

Options array always contains exactly 4 plausible wrong answers + correct answer, shuffled.

### Pieces (`src/logic/pieces.js`)

~18 standard Block Blast shapes defined as arrays of `[row, col]` offsets from top-left. Includes: dots, lines (1×2 through 1×5 and rotations), 2×2 square, L/J/T/S/Z shapes and rotations, corner pieces.

`getRandomPieceSet()` returns 3 randomly selected piece shapes.

### Dynamic Layout (`src/utils/layout.js`)

Phaser config uses `width: window.innerWidth, height: window.innerHeight` and `scale.mode: RESIZE` so the canvas always fills the full screen.

`computeLayout(W, H)` is called at `create()` time and returns all positions and sizes. No hardcoded coordinates anywhere in scenes.

```
cellSize = floor( min(W - padding*2, H * 0.70) / 8 )
gridX    = (W - cellSize*8) / 2    ← centered
gridY    = HUD_H + padding
trayY    = gridY + cellSize*8 + padding
```

Background image always fills the full canvas (`setDisplaySize(W, H)`). On wide screens (iPad/web), more of the location photo is visible on the sides. The game column sits centered on top.

Approximate cell sizes by device:

| Device | Approx cell size |
|---|---|
| iPhone SE (375×667) | 43px |
| iPhone 14 (393×852) | 46px |
| iPad mini (768×1024) | 83px |
| Web 1440×900 | 73px |

### Background Images

`locations.json` defines `"image"` path per location. MapScene preloads all background images by `loc.id` key in its `create()` phase so they are available to BlockBlastScene immediately. BlockBlastScene uses `this.add.image(W/2, H/2, loc.id).setDisplaySize(W, H)` for scale-to-fill (cover crop).

### Win Screen

Shown directly within BlockBlastScene as an overlay container:
- Large congratulations text
- Date and time of completion (proof for the child to show parent)
- "Back to Map" button

### Location Config (`data/locations.json`)

```json
{
  "locations": [
    {
      "id": "station",
      "name": "Holmlia Stasjon",
      "image": "assets/scene1.png",
      "mapHotspot": { "x": 280, "y": 420, "width": 200, "height": 80 }
    }
  ]
}
```

`levels` array removed — Block Blast has no per-location level config. The game is the same everywhere; only the background changes.
