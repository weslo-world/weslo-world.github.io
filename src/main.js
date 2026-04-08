import { MapScene } from './scenes/MapScene.js';
import { BlockBlastScene } from './scenes/BlockBlastScene.js';
import { UIScene } from './scenes/UIScene.js';
import { QuizOverlayScene } from './scenes/QuizOverlayScene.js';

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [MapScene, BlockBlastScene, UIScene, QuizOverlayScene],
};

new Phaser.Game(config);
