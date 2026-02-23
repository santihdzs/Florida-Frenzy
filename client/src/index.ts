import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.image('placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }

  create() {
    this.add.text(400, 300, 'Florida Frenzy', {
      fontSize: '48px',
      color: '#00ff88',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(400, 360, 'Click to start', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.input.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.add.text(400, 300, 'Game Started!', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

new Phaser.Game(config);
