import { createGrid, findMatches, removeMatches, applyGravity, swapTiles, isAdjacent, isValidSwap } from '../logic/grid.js';
import { calculateScore } from '../logic/scoring.js';
import { loadLevel } from '../logic/levels.js';

const TILE_SIZE = 52;
const TILE_GAP = 4;
const STEP = TILE_SIZE + TILE_GAP;

const TILE_COLORS = {
  train:  0xe74c3c,
  ticket: 0xf39c12,
  bench:  0x8b4513,
  tree:   0x27ae60,
  clock:  0x3498db,
  bag:    0x9b59b6,
  cart:   0x1abc9c,
  shoe:   0xe67e22,
  gift:   0xe91e63,
  coffee: 0x795548,
  star:   0xf1c40f,
  heart:  0xff4081,
  gem:    0x00bcd4,
  moon:   0x607d8b,
  flame:  0xff5722,
};

const TILE_SYMBOLS = {
  train:  '\u{1F689}',
  ticket: '\u{1F3AB}',
  bench:  '\u{1FA91}',
  tree:   '\u{1F333}',
  clock:  '\u{1F553}',
  bag:    '\u{1F6CD}',
  cart:   '\u{1F6D2}',
  shoe:   '\u{1F45F}',
  gift:   '\u{1F381}',
  coffee: '\u2615',
  star:   '\u2B50',
  heart:  '\u2764\uFE0F',
  gem:    '\u{1F48E}',
  moon:   '\u{1F319}',
  flame:  '\u{1F525}',
};

// Animation durations (ms)
const DUR_SWAP    = 200;
const DUR_REMOVE  = 160;
const DUR_FALL    = 250;
const DUR_FALL_NEW = 280;

export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super('PuzzleScene');
  }

  init(data) {
    this.locationData = data.location;
    this.levelId = data.levelId;
  }

  preload() {
    const key = `bg-${this.locationData.id}`;
    if (!this.textures.exists(key)) {
      this.load.image(key, this.locationData.image);
    }
    this.load.json(this.levelId, `data/levels/${this.levelId}.json`);
  }

  create() {
    // Background
    this.add.image(400, 300, `bg-${this.locationData.id}`)
      .setDisplaySize(800, 600)
      .setAlpha(0.3);

    // Load level
    const levelData = this.cache.json.get(this.levelId);
    this.level = loadLevel(levelData);
    this.score = 0;
    this.movesLeft = this.level.moves;
    this.combo = 0;
    this.selected = null;
    this.processing = false;
    this.highlightSprite = null;

    // Create grid
    this.grid = createGrid(this.level.gridSize.rows, this.level.gridSize.cols, this.level.tileTypes);

    // Calculate grid offset to center it
    const { rows, cols } = this.level.gridSize;
    const gridWidth = cols * STEP - TILE_GAP;
    const gridHeight = rows * STEP - TILE_GAP;
    this.gridOffsetX = (800 - gridWidth) / 2;
    this.gridOffsetY = (600 - gridHeight) / 2 + 20;

    // tileSprites[r][c] = { rect, symbol } or null
    this.tileSprites = Array.from({ length: rows }, () => new Array(cols).fill(null));
    this.buildInitialGrid();

    // Launch UI overlay
    this.scene.launch('UIScene', {
      score: this.score,
      moves: this.movesLeft,
      goal: this.level.scoreGoal,
      locationName: this.locationData.name,
    });
  }

  // --- Coordinate helper ---

  tileXY(row, col) {
    return {
      x: this.gridOffsetX + col * STEP + TILE_SIZE / 2,
      y: this.gridOffsetY + row * STEP + TILE_SIZE / 2,
    };
  }

  // --- Sprite management ---

  createTileSprite(row, col, type) {
    const { x, y } = this.tileXY(row, col);
    const color = TILE_COLORS[type] || 0x888888;
    const rect = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color, 0.9)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });
    const symbol = this.add.text(x, y, TILE_SYMBOLS[type] || '?', { fontSize: '28px' }).setOrigin(0.5);
    rect.on('pointerup', () => this.onTileClick(row, col));
    return { rect, symbol };
  }

  updateSpriteHandler(r, c) {
    const sprite = this.tileSprites[r][c];
    if (!sprite) return;
    sprite.rect.off('pointerup');
    sprite.rect.on('pointerup', () => this.onTileClick(r, c));
  }

  buildInitialGrid() {
    const { rows, cols } = this.level.gridSize;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = this.grid[r][c];
        if (tile) this.tileSprites[r][c] = this.createTileSprite(r, c, tile);
      }
    }
  }

  // --- Input ---

  onTileClick(row, col) {
    if (this.processing) return;

    if (this.selected === null) {
      this.selected = { row, col };
      this.highlightTile(row, col);
    } else {
      const pos1 = this.selected;
      const pos2 = { row, col };
      this.selected = null;
      this.clearHighlight();

      if (!isAdjacent(pos1, pos2) || !isValidSwap(this.grid, pos1, pos2)) {
        return;
      }

      this.movesLeft--;
      this.processing = true;
      this.combo = 0;
      this.animateSwap(pos1, pos2, () => {
        this.grid = swapTiles(this.grid, pos1, pos2);
        this.processMatches();
      });
    }
  }

  // --- Match cascade ---

  processMatches() {
    const matches = findMatches(this.grid);
    if (matches.length === 0) {
      this.processing = false;
      this.updateUI();
      this.checkEndCondition();
      return;
    }

    this.combo++;
    this.score += calculateScore(matches.length, this.combo);

    // 1. Animate tiles disappearing
    this.animateRemove(matches, () => {
      this.grid = removeMatches(this.grid, matches);

      // Snapshot surviving sprites per column (top→bottom) before clearing tileSprites
      const { rows, cols } = this.level.gridSize;
      const survivorsByCol = [];
      for (let c = 0; c < cols; c++) {
        survivorsByCol[c] = [];
        for (let r = 0; r < rows; r++) {
          if (this.tileSprites[r][c] !== null) survivorsByCol[c].push(this.tileSprites[r][c]);
          this.tileSprites[r][c] = null;
        }
      }

      this.grid = applyGravity(this.grid, this.level.tileTypes);

      // 2. Animate tiles falling; continue cascade after animations settle
      const fallDuration = this.animateFall(survivorsByCol);
      this.time.delayedCall(fallDuration + 40, () => {
        this.updateUI();
        this.processMatches();
      });
    });
  }

  // --- Animations ---

  animateSwap(pos1, pos2, onComplete) {
    const xy1 = this.tileXY(pos1.row, pos1.col);
    const xy2 = this.tileXY(pos2.row, pos2.col);
    const s1 = this.tileSprites[pos1.row][pos1.col];
    const s2 = this.tileSprites[pos2.row][pos2.col];

    // Swap sprite references and handlers now (processing=true so no clicks during animation)
    this.tileSprites[pos1.row][pos1.col] = s2;
    this.tileSprites[pos2.row][pos2.col] = s1;
    this.updateSpriteHandler(pos1.row, pos1.col);
    this.updateSpriteHandler(pos2.row, pos2.col);

    let done = 0;
    const finish = () => { if (++done === 2) onComplete(); };
    this.tweens.add({ targets: [s1.rect, s1.symbol], x: xy2.x, y: xy2.y, duration: DUR_SWAP, ease: 'Power2', onComplete: finish });
    this.tweens.add({ targets: [s2.rect, s2.symbol], x: xy1.x, y: xy1.y, duration: DUR_SWAP, ease: 'Power2', onComplete: finish });
  }

  // Fires tweens and calls onComplete after DUR_REMOVE + small buffer
  animateRemove(matches, onComplete) {
    for (const { row, col } of matches) {
      const sprite = this.tileSprites[row][col];
      this.tileSprites[row][col] = null;
      if (!sprite) continue;
      this.tweens.add({
        targets: [sprite.rect, sprite.symbol],
        scaleX: 0, scaleY: 0, alpha: 0,
        duration: DUR_REMOVE,
        ease: 'Power2',
        onComplete: () => {
          sprite.rect.destroy();
          sprite.symbol.destroy();
        },
      });
    }
    // Always call onComplete via timer — avoids any counter/callback edge cases
    this.time.delayedCall(DUR_REMOVE + 20, onComplete);
  }

  // Starts all fall tweens, returns total duration so caller can schedule next step
  animateFall(survivorsByCol) {
    const { rows, cols } = this.level.gridSize;
    let maxDuration = 0;

    for (let c = 0; c < cols; c++) {
      const survivors = survivorsByCol[c];
      const newStartRow = rows - survivors.length; // top rows get new tiles

      // Move surviving sprites down to their new (compacted) positions
      for (let i = 0; i < survivors.length; i++) {
        const newRow = newStartRow + i;
        const { y } = this.tileXY(newRow, c);
        this.tileSprites[newRow][c] = survivors[i];
        this.updateSpriteHandler(newRow, c);

        if (Math.abs(survivors[i].rect.y - y) > 1) {
          this.tweens.add({
            targets: [survivors[i].rect, survivors[i].symbol],
            y,
            duration: DUR_FALL,
            ease: 'Bounce.easeOut',
          });
          maxDuration = Math.max(maxDuration, DUR_FALL);
        }
      }

      // Create new tiles above the grid and tween them down
      for (let i = 0; i < newStartRow; i++) {
        const tileType = this.grid[i][c];
        if (!tileType) continue;

        const sprite = this.createTileSprite(i, c, tileType);
        const { x, y } = this.tileXY(i, c);
        const startY = this.gridOffsetY - (newStartRow - i) * STEP;
        sprite.rect.setPosition(x, startY);
        sprite.symbol.setPosition(x, startY);

        this.tileSprites[i][c] = sprite;
        this.updateSpriteHandler(i, c);

        const delay = i * 20;
        const duration = DUR_FALL_NEW + (newStartRow - i - 1) * 30;
        this.tweens.add({
          targets: [sprite.rect, sprite.symbol],
          y,
          duration,
          ease: 'Bounce.easeOut',
          delay,
        });
        maxDuration = Math.max(maxDuration, delay + duration);
      }
    }

    return maxDuration;
  }

  // --- Highlight ---

  highlightTile(row, col) {
    this.clearHighlight();
    const { x, y } = this.tileXY(row, col);
    this.highlightSprite = this.add.rectangle(x, y, TILE_SIZE + 4, TILE_SIZE + 4)
      .setStrokeStyle(3, 0xffdd57)
      .setFillStyle(0xffdd57, 0.15);
  }

  clearHighlight() {
    if (this.highlightSprite) {
      this.highlightSprite.destroy();
      this.highlightSprite = null;
    }
  }

  // --- UI ---

  updateUI() {
    this.scene.get('UIScene').events.emit('updateHUD', {
      score: this.score,
      moves: this.movesLeft,
      goal: this.level.scoreGoal,
    });
  }

  checkEndCondition() {
    if (this.score >= this.level.scoreGoal) {
      this.showEndMessage('Level Complete!', '#27ae60');
    } else if (this.movesLeft <= 0) {
      this.showEndMessage('Out of Moves!', '#e74c3c');
    }
  }

  showEndMessage(text, color) {
    this.processing = true;

    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);
    this.add.text(400, 260, text, {
      fontSize: '40px',
      fontFamily: 'Arial',
      color,
    }).setOrigin(0.5);

    this.add.text(400, 310, `Score: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    const btn = this.add.text(400, 370, 'Back to Map', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(255,255,255,0.2)',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerup', () => {
      this.scene.stop('UIScene');
      this.scene.start('MapScene');
    });
  }
}
