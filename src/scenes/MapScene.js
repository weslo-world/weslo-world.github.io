import { computeLayout } from '../utils/layout.js';

export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  preload() {
    this.load.image('map', 'assets/map.png');
    this.load.json('locations', 'data/locations.json');
  }

  create() {
    const { locations } = this.cache.json.get('locations');
    const L = computeLayout(this.scale.width, this.scale.height);

    // Preload all location background images so BlockBlastScene can use them instantly
    let pending = 0;
    for (const loc of locations) {
      if (!this.textures.exists(loc.id)) {
        this.load.image(loc.id, loc.image);
        pending++;
      }
    }
    if (pending > 0) {
      this.load.once('complete', () => this._buildMap(locations, L));
      this.load.start();
    } else {
      this._buildMap(locations, L);
    }
  }

  _buildMap(locations, L) {
    // Map background — scale to fill
    this.add.image(L.centerX, L.centerY, 'map').setDisplaySize(L.W, L.H);

    // Title
    this.add.text(L.centerX, 30, 'Select a Location', {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { x: 14, y: 6 },
    }).setOrigin(0.5);

    for (const loc of locations) {
      const { x, y, width, height } = loc.mapHotspot;

      // Scale hotspot coords proportionally to current screen size
      const scaleX = L.W / 800;
      const scaleY = L.H / 600;
      const sx = x * scaleX;
      const sy = y * scaleY;
      const sw = width * scaleX;
      const sh = height * scaleY;

      const zone = this.add.zone(sx, sy, sw, sh).setInteractive({ useHandCursor: true });

      const label = this.add.text(sx, sy, loc.name, {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 10, y: 5 },
      }).setOrigin(0.5);

      zone.on('pointerover', () => label.setStyle({ color: '#ffd700' }));
      zone.on('pointerout', () => label.setStyle({ color: '#ffffff' }));
      zone.on('pointerup', () => {
        this.scene.start('BlockBlast', { location: loc });
      });
    }
  }
}
