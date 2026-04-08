import { computeLayout } from '../utils/layout.js';
import { getRandomPieceSet, getPieceBounds } from '../logic/pieces.js';
import {
  createGrid, canPlacePiece, placePiece,
  findCompletedLines, removeLines, canAnyPieceFit, blastClear,
} from '../logic/blockblast.js';
import { MathQuizEngine } from '../logic/mathquiz.js';

// Tile fill color for placed blocks
const CELL_COLOR = 0x5577ee;
const CELL_STROKE = 0x8899ff;
const EMPTY_COLOR = 0x111133;
const EMPTY_STROKE = 0x222255;
const GHOST_VALID = 0x44ee88;
const GHOST_INVALID = 0xee4444;
const TRAY_COLORS = [0x5577ee, 0xee7755, 0x55bb77];

export class BlockBlastScene extends Phaser.Scene {
  constructor() {
    super('BlockBlast');
  }

  init(data) {
    this.locationData = data.location;
    this.score = 0;
    this.grid = createGrid(8, 8);
    this.quizEngine = new MathQuizEngine();
    this._dragging = null;       // { pieceIndex, graphics, offsetX, offsetY }
    this._ghostCells = [];       // current ghost rect objects
    this._ghostPos = null;       // { row, col } or null
    this._quizPending = false;
    this._trayPieces = [];       // [{ piece, container, placed }]
    this._cellRects = [];        // 2D array of Phaser rectangles for the grid
  }

  preload() {
    // Background already loaded by MapScene; nothing extra needed
  }

  create() {
    this.L = computeLayout(this.scale.width, this.scale.height);

    this._drawBackground();
    this._buildGrid();
    this._dealPieces();
    this._setupDrag();

    // Launch HUD overlay
    this.scene.launch('UIScene', {
      locationName: this.locationData.name,
      score: this.score,
      goal: 100,
    });

    this.scale.on('resize', () => {
      this.L = computeLayout(this.scale.width, this.scale.height);
      this.scene.restart({ location: this.locationData });
    });
  }

  // ─── Background ───────────────────────────────────────────────────────────

  _drawBackground() {
    const { W, H } = this.L;
    const key = this.locationData.id;
    if (this.textures.exists(key)) {
      this.add.image(W / 2, H / 2, key).setDisplaySize(W, H);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);
    }
    // Semi-transparent dark overlay to make grid readable
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45);
  }

  // ─── Grid ─────────────────────────────────────────────────────────────────

  _buildGrid() {
    const { gridX, gridY, cellSize, gridRows, gridCols } = this.L;
    this._cellRects = [];
    for (let r = 0; r < gridRows; r++) {
      this._cellRects[r] = [];
      for (let c = 0; c < gridCols; c++) {
        const x = gridX + c * cellSize + cellSize / 2;
        const y = gridY + r * cellSize + cellSize / 2;
        const rect = this.add.rectangle(x, y, cellSize - 2, cellSize - 2, EMPTY_COLOR)
          .setStrokeStyle(1, EMPTY_STROKE);
        this._cellRects[r][c] = rect;
      }
    }
  }

  _refreshGrid() {
    const { gridRows, gridCols } = this.L;
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const rect = this._cellRects[r][c];
        if (this.grid[r][c]) {
          rect.setFillStyle(CELL_COLOR).setStrokeStyle(1, CELL_STROKE);
        } else {
          rect.setFillStyle(EMPTY_COLOR).setStrokeStyle(1, EMPTY_STROKE);
        }
      }
    }
  }

  // ─── Tray ──────────────────────────────────────────────────────────────────

  _dealPieces() {
    // Clean up previous containers
    this._trayPieces.forEach(tp => tp.container && tp.container.destroy());
    this._trayPieces = [];

    const pieces = getRandomPieceSet();
    pieces.forEach((piece, i) => {
      this._trayPieces.push({ piece, placed: false, slotIndex: i });
    });
    this._renderTray();
  }

  _renderTray() {
    this._trayPieces.forEach((tp, i) => {
      if (tp.container) tp.container.destroy();
      if (tp.placed) { tp.container = null; return; }

      const { trayCellSize, traySlotW, trayY, trayH, W } = this.L;
      const slotCenterX = traySlotW * i + traySlotW / 2;
      const slotCenterY = trayY + trayH / 2;

      const bounds = getPieceBounds(tp.piece.cells);
      const pieceW = bounds.cols * trayCellSize;
      const pieceH = bounds.rows * trayCellSize;
      const originX = slotCenterX - pieceW / 2;
      const originY = slotCenterY - pieceH / 2;

      const container = this.add.container(0, 0);
      const color = TRAY_COLORS[i % TRAY_COLORS.length];

      tp.piece.cells.forEach(([dr, dc]) => {
        const rx = originX + dc * trayCellSize + trayCellSize / 2;
        const ry = originY + dr * trayCellSize + trayCellSize / 2;
        const rect = this.add.rectangle(rx, ry, trayCellSize - 2, trayCellSize - 2, color)
          .setStrokeStyle(1, 0xffffff);
        container.add(rect);
      });

      tp.container = container;
      tp.originX = originX;
      tp.originY = originY;
      tp.color = color;
      // Store hit bounds for pointer detection
      tp.hitBounds = {
        x: originX, y: originY,
        w: pieceW + trayCellSize, h: pieceH + trayCellSize,
      };
    });
  }

  // ─── Drag & Drop (raw pointer events — reliable on all platforms) ──────────

  _setupDrag() {
    this.input.on('pointerdown', (pointer) => {
      if (this._quizPending) return;
      const tp = this._trayPieces.find(t =>
        !t.placed && t.hitBounds &&
        pointer.x >= t.hitBounds.x - t.hitBounds.w / 4 &&
        pointer.x <= t.hitBounds.x + t.hitBounds.w * 1.25 &&
        pointer.y >= t.hitBounds.y - t.hitBounds.h / 4 &&
        pointer.y <= t.hitBounds.y + t.hitBounds.h * 1.25
      );
      if (tp) this._startDrag(tp, pointer);
    });

    this.input.on('pointermove', (pointer) => {
      if (!this._dragging || !pointer.isDown) return;
      this._updateDrag(pointer);
    });

    this.input.on('pointerup', (pointer) => {
      if (!this._dragging) return;
      this._endDrag();
    });
  }

  _startDrag(tp, pointer) {
    const g = this.add.graphics();
    this._dragging = { tp, graphics: g };
    tp.container.setAlpha(0.3);
    this._updateDrag(pointer);
  }

  _updateDrag(pointer) {
    const { tp, graphics } = this._dragging;
    const { cellSize } = this.L;
    graphics.clear();
    // Draw at grid cell size so it matches where it will land
    this._drawDragPiece(graphics, pointer.x, pointer.y, tp.piece.cells, cellSize, tp.color, 0.85);
    this._updateGhost(pointer.x, pointer.y, tp.piece.cells);
  }

  _endDrag() {
    const { tp, graphics } = this._dragging;
    // Capture ghostPos BEFORE clearing
    const ghostPos = this._ghostPos;

    graphics.destroy();
    this._clearGhost();
    this._dragging = null;

    if (ghostPos) {
      const { row, col } = ghostPos;
      if (canPlacePiece(this.grid, tp.piece.cells, row, col)) {
        this._placePiece(tp, row, col);
        return;
      }
    }

    // Invalid drop — restore tray piece
    tp.container.setAlpha(1);
  }

  _drawDragPiece(g, cx, cy, cells, size, color, alpha) {
    const bounds = getPieceBounds(cells);
    const offsetX = cx - (bounds.cols * size) / 2;
    const offsetY = cy - (bounds.rows * size) / 2;
    g.fillStyle(color, alpha);
    g.lineStyle(1, 0xffffff, alpha);
    cells.forEach(([dr, dc]) => {
      const x = offsetX + dc * size;
      const y = offsetY + dr * size;
      g.fillRect(x, y, size - 2, size - 2);
      g.strokeRect(x, y, size - 2, size - 2);
    });
  }

  _updateGhost(px, py, cells) {
    this._clearGhost();
    const { gridX, gridY, cellSize, gridRows, gridCols } = this.L;
    const bounds = getPieceBounds(cells);

    // Compute grid row/col under pointer center
    const pieceCenterOffX = (bounds.cols * cellSize) / 2;
    const pieceCenterOffY = (bounds.rows * cellSize) / 2;
    const col = Math.round((px - pieceCenterOffX - gridX) / cellSize);
    const row = Math.round((py - pieceCenterOffY - gridY) / cellSize);

    const valid = canPlacePiece(this.grid, cells, row, col);
    const ghostColor = valid ? GHOST_VALID : GHOST_INVALID;

    cells.forEach(([dr, dc]) => {
      const gr = row + dr;
      const gc = col + dc;
      if (gr >= 0 && gr < gridRows && gc >= 0 && gc < gridCols) {
        const x = gridX + gc * cellSize + cellSize / 2;
        const y = gridY + gr * cellSize + cellSize / 2;
        const rect = this.add.rectangle(x, y, cellSize - 2, cellSize - 2, ghostColor, 0.5);
        this._ghostCells.push(rect);
      }
    });

    this._ghostPos = { row, col };
  }

  _clearGhost() {
    this._ghostCells.forEach(r => r.destroy());
    this._ghostCells = [];
    this._ghostPos = null;
  }

  // ─── Placement Logic ──────────────────────────────────────────────────────

  _placePiece(tp, row, col) {
    this.grid = placePiece(this.grid, tp.piece.cells, row, col);
    tp.placed = true;
    tp.container.setAlpha(0);

    this._refreshGrid();

    const { rows: completedRows, cols: completedCols } = findCompletedLines(this.grid);
    const linesCleared = completedRows.length + completedCols.length;

    if (linesCleared > 0) {
      this._flashLines(completedRows, completedCols, () => {
        this.grid = removeLines(this.grid, completedRows, completedCols);
        this._refreshGrid();
        this._triggerQuiz(linesCleared, false);
      });
      return;
    }

    this._checkTrayAndRefill();
  }

  _checkTrayAndRefill() {
    const allPlaced = this._trayPieces.every(tp => tp.placed);
    if (allPlaced) {
      this._dealPieces();
    }

    const remaining = this._trayPieces.filter(tp => !tp.placed).map(tp => tp.piece);
    if (remaining.length > 0 && !canAnyPieceFit(this.grid, remaining)) {
      this._triggerRescue();
    }
  }

  // ─── Line flash animation ─────────────────────────────────────────────────

  _flashLines(completedRows, completedCols, onDone) {
    const { gridX, gridY, cellSize } = this.L;
    const flashRects = [];

    const allCells = new Set();
    completedRows.forEach(r => {
      for (let c = 0; c < 8; c++) allCells.add(`${r},${c}`);
    });
    completedCols.forEach(c => {
      for (let r = 0; r < 8; r++) allCells.add(`${r},${c}`);
    });

    allCells.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const x = gridX + c * cellSize + cellSize / 2;
      const y = gridY + r * cellSize + cellSize / 2;
      const rect = this.add.rectangle(x, y, cellSize - 2, cellSize - 2, 0xffffff);
      flashRects.push(rect);
    });

    this.tweens.add({
      targets: flashRects,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => {
        flashRects.forEach(r => r.destroy());
        onDone();
      },
    });
  }

  // ─── Quiz ─────────────────────────────────────────────────────────────────

  _triggerQuiz(linesCleared, isRescue) {
    if (this._quizPending) return;
    this._quizPending = true;

    const task = this.quizEngine.generateTask();
    this.scene.pause();
    this.scene.launch('QuizOverlay', { task, linesCleared, isRescue });

    const quizScene = this.scene.get('QuizOverlay');
    quizScene.events.once('quizComplete', ({ correct, points }) => {
      this.quizEngine.recordResult(task.a, task.b, correct);
      this._quizPending = false;
      this.scene.resume();

      if (isRescue && !correct) {
        // Wrong rescue answer: try again
        this.time.delayedCall(200, () => this._triggerRescue());
        return;
      }

      if (correct) {
        this.score += points;
        this._updateHUD();
        if (this.score >= 100) {
          this.time.delayedCall(300, () => this._showWin());
          return;
        }
        if (isRescue) {
          this._doBlast();
        }
      }

      this._checkTrayAndRefill();
    });
  }

  _triggerRescue() {
    this._showBanner('No room! Solve to blast!', 0xff8800, 1200, () => {
      this._triggerQuiz(1, true);
    });
  }

  _doBlast() {
    const { newGrid, clearedCells } = blastClear(this.grid);
    this.grid = newGrid;

    // Flash blasted cells
    const { gridX, gridY, cellSize } = this.L;
    const flashRects = clearedCells.map(([r, c]) => {
      const x = gridX + c * cellSize + cellSize / 2;
      const y = gridY + r * cellSize + cellSize / 2;
      return this.add.rectangle(x, y, cellSize - 2, cellSize - 2, 0xff6600);
    });

    this.tweens.add({
      targets: flashRects,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        flashRects.forEach(r => r.destroy());
        this._refreshGrid();
        this._dealPieces();
      },
    });
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  _updateHUD() {
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.emit('updateHUD', { score: this.score, goal: 100 });
    }
  }

  // ─── Banner ───────────────────────────────────────────────────────────────

  _showBanner(msg, color, duration, onDone) {
    const { W, centerY } = this.L;
    const bg = this.add.rectangle(W / 2, centerY, W * 0.8, 60, color, 0.9).setDepth(10);
    const txt = this.add.text(W / 2, centerY, msg, {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: [bg, txt],
      alpha: 0,
      delay: duration,
      duration: 400,
      onComplete: () => { bg.destroy(); txt.destroy(); onDone && onDone(); },
    });
  }

  // ─── Win screen ───────────────────────────────────────────────────────────

  _showWin() {
    this.scene.stop('UIScene');

    const { W, H, centerX, centerY } = this.L;

    // Full overlay
    this.add.rectangle(centerX, centerY, W, H, 0x000000, 0.75).setDepth(20);

    // Celebration text
    this.add.text(centerX, centerY - 120, '🎉', {
      fontSize: '80px',
    }).setOrigin(0.5).setDepth(21);

    this.add.text(centerX, centerY - 30, 'Well done!', {
      fontSize: '42px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);

    this.add.text(centerX, centerY + 40, 'You scored 100 points!', {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5).setDepth(21);

    // Date and time stamp
    const now = new Date();
    const stamp = now.toLocaleString();
    this.add.text(centerX, centerY + 85, stamp, {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaacc',
    }).setOrigin(0.5).setDepth(21);

    // Back button
    const btn = this.add.text(centerX, centerY + 150, 'Back to Map', {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#334499',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

    btn.on('pointerup', () => {
      this.scene.stop('BlockBlast');
      this.scene.start('MapScene');
    });

    // Confetti
    this._spawnWinConfetti();
  }

  _spawnWinConfetti() {
    const { W } = this.L;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 10, 6);
    g.generateTexture('win_confetti', 10, 6);
    g.destroy();

    const colors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff922b, 0xcc5de8];
    colors.forEach(tint => {
      const emitter = this.add.particles(0, 0, 'win_confetti', {
        x: { min: 0, max: W },
        y: { start: -20, end: 900 },
        speedY: { min: 200, max: 500 },
        speedX: { min: -60, max: 60 },
        rotate: { start: 0, end: 360 },
        lifespan: 3000,
        quantity: 3,
        tint,
      }).setDepth(22);
      this.time.delayedCall(3000, () => emitter.stop());
    });
  }
}
