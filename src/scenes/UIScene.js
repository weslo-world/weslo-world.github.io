export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init(data) {
    this.hud = data;
  }

  create() {
    // Semi-transparent top bar
    this.add.rectangle(400, 22, 800, 44, 0x000000, 0.6);

    this.locationText = this.add.text(16, 12, this.hud.locationName, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffdd57',
    });

    this.scoreText = this.add.text(400, 12, `Score: ${this.hud.score} / ${this.hud.goal}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    this.movesText = this.add.text(784, 12, `Moves: ${this.hud.moves}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(1, 0);

    // Back button
    const backBtn = this.add.text(16, 570, '< Back', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 8, y: 4 },
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerup', () => {
      this.scene.stop('PuzzleScene');
      this.scene.stop('UIScene');
      this.scene.start('MapScene');
    });

    // Listen for HUD updates from PuzzleScene
    this.events.on('updateHUD', ({ score, moves, goal }) => {
      this.scoreText.setText(`Score: ${score} / ${goal}`);
      this.movesText.setText(`Moves: ${moves}`);
      if (moves <= 3) {
        this.movesText.setColor('#e74c3c');
      }
    });
  }
}
