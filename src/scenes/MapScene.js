export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  preload() {
    this.load.image('map', 'assets/map.png');
    this.load.json('locations', 'data/locations.json');
  }

  create() {
    const map = this.add.image(400, 300, 'map').setDisplaySize(800, 600);

    const { locations } = this.cache.json.get('locations');

    for (const loc of locations) {
      const { x, y, width, height } = loc.mapHotspot;

      const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });

      // Label
      const label = this.add.text(x, y, loc.name, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5);

      zone.on('pointerover', () => label.setStyle({ color: '#ffdd57' }));
      zone.on('pointerout', () => label.setStyle({ color: '#ffffff' }));

      zone.on('pointerup', () => {
        this.scene.start('PuzzleScene', { location: loc, levelId: loc.levels[0] });
      });
    }

    this.add.text(400, 30, 'Select a Location', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5);
  }
}
