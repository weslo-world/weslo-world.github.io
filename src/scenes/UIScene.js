import { computeLayout } from '../utils/layout.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init(data) {
    this.locationName = data.locationName;
    this.score = data.score || 0;
    this.goal = data.goal || 100;
  }

  create() {
    const L = computeLayout(this.scale.width, this.scale.height);

    // Semi-transparent top bar
    this.add.rectangle(L.centerX, L.HUD_H / 2, L.W, L.HUD_H, 0x000000, 0.65);

    // Location name (left)
    this.add.text(12, L.HUD_H / 2, this.locationName, {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffd700',
    }).setOrigin(0, 0.5);

    // Score text (center)
    this.scoreText = this.add.text(L.centerX, 14, `${this.score} / ${this.goal}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Progress bar (below text, inside HUD)
    const barW = Math.floor(L.W * 0.35);
    const barX = L.centerX - barW / 2;
    const barY = 34;
    this.add.rectangle(L.centerX, barY, barW, 8, 0x333366, 1);
    this.progressBar = this.add.rectangle(barX, barY, 1, 8, 0x44aaff, 1).setOrigin(0, 0.5);
    this._barW = barW;
    this._barX = barX;
    this._updateBar();

    // Back button (right)
    const backBtn = this.add.text(L.W - 12, L.HUD_H / 2, '✕', {
      fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerup', () => {
      this.scene.stop('BlockBlast');
      this.scene.stop('UIScene');
      this.scene.start('MapScene');
    });

    // Listen for score updates from BlockBlastScene
    this.events.on('updateHUD', ({ score, goal }) => {
      this.score = score;
      if (goal !== undefined) this.goal = goal;
      this.scoreText.setText(`${this.score} / ${this.goal}`);
      this._updateBar();
    });
  }

  _updateBar() {
    const fraction = Math.min(1, this.score / this.goal);
    const w = Math.max(2, Math.floor(this._barW * fraction));
    this.progressBar.width = w;
    this.progressBar.x = this._barX;
    if (fraction >= 0.8) this.progressBar.setFillStyle(0x44ee66);
    else if (fraction >= 0.5) this.progressBar.setFillStyle(0xffaa00);
    else this.progressBar.setFillStyle(0x44aaff);
  }
}
