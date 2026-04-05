import { MapScene } from './scenes/MapScene.js';
import { PuzzleScene } from './scenes/PuzzleScene.js';
import { UIScene } from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [MapScene, PuzzleScene, UIScene],
};

new Phaser.Game(config);
