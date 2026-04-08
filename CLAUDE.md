# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Browser-based Block Blast puzzle game with multiplication quiz mechanics, built with Phaser 3. The player selects a real-world location (Holmlia neighborhood) from a map screen, then plays a block-placement puzzle. Completing lines triggers a math quiz — type the answer on a phone-style numpad to earn points. Goal: reach 100 points to unlock screen time or a reward.

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
- **QuizOverlayScene** — modal quiz overlay. Pauses BlockBlastScene while active. Shows multiplication problem, phone-style numpad for typing the answer, 10-second timer bar. Emits `quizComplete` on finish.

### Game Loop (BlockBlastScene)

1. Player drags a piece from tray onto the 8×8 grid
2. Ghost preview shows valid (green) / invalid (red) placement
3. On valid drop: place piece, check for completed lines (horizontal + vertical)
4. If lines completed: flash cells → pause → launch QuizOverlayScene
5. QuizOverlayScene result:
   - **Correct**: confetti animation, award `basePoints × linesCleared`, resume
   - **Wrong**: shake + show correct answer (tap or 10s to dismiss) → 0 points, resume
6. When all 3 tray pieces placed: replenish with new set of 3
7. If no piece in tray can fit anywhere on grid: show "No room!" → rescue quiz
   - Correct → blast clears 2 densest rows + 2 densest columns → continue, **no points awarded**
   - Wrong → show answer → retry same quiz (loop until correct)
8. Win when score ≥ 100: congratulations screen with date/time stamp

### Points System

Points are determined by the factors in the multiplication task:

| Factor | Base points |
|---|---|
| Either factor is 2 | 4 pt |
| Either factor is 5 (and not 2) | 6 pt |
| All other combinations (3,4,6,7,8,9) | 8 pt |

Factors are always 2–9. No ×1 or ×10 tasks (too trivial).

**Final = base × lines cleared** (e.g. clearing 2 lines with a 3×7 task → 8 × 2 = 16 pts)

### Quiz UI (QuizOverlayScene)

- Shows the problem as `a × b =` with a 10-key numpad (1–9, 0, ⌫, AC)
- Child types the answer digit by digit; auto-submits when enough digits entered
- Answer display shows 1 or 2 digit boxes (answers range 4–81)
- Timer bar depletes over 10 seconds; expiry counts as wrong
- **Correct**: digit boxes turn green, confetti, "+N pts" message, auto-closes after 1.6s
- **Wrong**: camera shake, boxes turn red → 0.5s later boxes show correct answer in green, tap or 10s to dismiss

### MathQuizEngine (`src/logic/mathquiz.js`)

Queue-based adaptive selection. Factors are always 2–9.

```js
class MathQuizEngine {
  generateTask()              // → { a, b, answer, points }
  recordResult(a, b, correct) // wrong answer → re-inserts task 1–3 positions ahead in queue
}
```

- Pre-generates a queue of tasks; refills automatically when low.
- On a wrong answer the failed task is re-inserted 1–3 positions later so the player sees it again soon without it feeling mechanical.
- Each task has a 50% chance of showing as `a×b` or `b×a` to reinforce commutativity.

### Pieces (`src/logic/pieces.js`)

27 standard Block Blast shapes defined as arrays of `[row, col]` offsets from top-left. Includes: dot, lines (1×2 through 1×5 and rotations), 2×2 and 3×3 squares, L/J/T shapes, corner pieces.

`getRandomPieceSet()` returns 3 randomly selected piece shapes.

### Dynamic Layout (`src/utils/layout.js`)

Phaser config uses `width: window.innerWidth, height: window.innerHeight` and `scale.mode: RESIZE` so the canvas always fills the full screen. No resize-triggered restarts — the canvas adapts automatically and game state is never lost on orientation change.

`computeLayout(W, H)` is called at `create()` time and returns all positions and sizes. No hardcoded coordinates anywhere in scenes.

```
cellSize = floor( min(W - padding*2, H * 0.70) / 8 )
gridX    = (W - cellSize*8) / 2    ← centered
gridY    = HUD_H + padding
trayY    = gridY + cellSize*8 + padding
```

Background images use cover-scale (`scale = max(W/img.width, H/img.height)`) — proportions preserved, image crops to fill. On wide screens (iPad/web), more of the location photo is visible on the sides.

Approximate cell sizes by device:

| Device | Approx cell size |
|---|---|
| iPhone SE (375×667) | 43px |
| iPhone 14 (393×852) | 46px |
| iPad mini (768×1024) | 83px |
| Web 1440×900 | 73px |

### Background Images

`locations.json` defines `"image"` path per location. MapScene preloads all background images by `loc.id` key in its `create()` phase so they are available to BlockBlastScene immediately.

### Win Screen

Shown directly within BlockBlastScene as an overlay:
- Congratulations text + emoji
- Date and time of completion (proof for the child to show parent)
- Confetti animation
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

The game is identical across all locations — only the background image changes.
