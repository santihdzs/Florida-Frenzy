import Phaser from 'phaser';

// Import assets directly for Vite
// Estos errores se arreglarian con un d.ts file, pero funciona bien
import titleBackground from '../assets/title-background.png'; 
import titleLogo from '../assets/logos/logo.png';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);
    this.load.image('title-logo', titleLogo);
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Background
    this.add.image(centerX, centerY, 'title-background');

    // Title logo
    this.add.image(centerX, 150, 'title-logo').setScale(0.5);

    // Menu buttons
    const buttons = [
      { text: 'Start', y: 320, action: () => this.startGame() },
      { text: 'Multiplayer', y: 400, action: () => console.log('Multiplayer - coming soon') },
      { text: 'Store', y: 480, action: () => console.log('Store - coming soon') },
      { text: 'Settings', y: 560, action: () => console.log('Settings - coming soon') }
    ];

    buttons.forEach(btn => {
      const button = this.add.text(centerX, btn.y, btn.text, {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => button.setColor('#00ff88'))
        .on('pointerout', () => button.setColor('#ffffff'))
        .on('pointerdown', btn.action);
    });
  }

  startGame() {
    this.scene.start('DuelScene');
  }
}
