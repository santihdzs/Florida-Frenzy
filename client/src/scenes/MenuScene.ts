import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Title
    this.add.text(centerX, 150, 'Florida Frenzy', {
      fontSize: '56px',
      color: '#00ff88',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Menu buttons
    const buttons = [
      { text: 'Start', y: 280, action: () => this.startGame() },
      { text: 'Multiplayer', y: 360, action: () => console.log('Multiplayer - coming soon') },
      { text: 'Store', y: 440, action: () => console.log('Store - coming soon') },
      { text: 'Settings', y: 520, action: () => console.log('Settings - coming soon') }
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
