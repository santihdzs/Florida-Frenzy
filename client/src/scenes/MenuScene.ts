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

    //text design
    const textStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '40px',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
      letterSpacing: -1
    };

    // Menu buttons
    const buttons = [
      { text: 'START', y: 320, action: () => this.startGame() },
      { text: 'MULTIPLAYER', y: 405, action: () => console.log('Multiplayer - coming soon') },
      { text: 'STORE', y: 490, action: () => console.log('Store - coming soon') },
      { text: 'SETTINGS', y: 575, action: () => console.log('Settings - coming soon') }
    ];

    //dimnesions for buttons
    const buttonWidth = 350;
    const buttonHeight = 70;

    buttons.forEach(btn => {
      this.createButton(centerX, btn.y, buttonWidth, buttonHeight, btn.text, btn.action, textStyle);
    });
  }

  // Custom button creation method
  createButton(x: number, y: number, width: number, height: number, label: string, callback: () => void, style: any) {
    //container
    const container = this.add.container(x, y);

    // Create button background
    const graphics = this.add.graphics();
    this.drawMetalPlate(graphics, width, height, false); // false = normal state

    //text
    const text = this.add.text(0, 0, label, style).setOrigin(0.5);

    //add to container
    container.add([graphics, text]);

    // Interactivity of container
    container.setSize(width, height);
    container.setInteractive({useHandCursor: true});

    //events and animations
    container.on('pointerover',() => {
      text.setColor('#b0c4de');
      this.tweens.add({ targets: container, scale: 1.03, duration: 100 });
    });

    container.on('pointerout',() => {
      text.setColor('#c2baba');
      this.drawMetalPlate(graphics, width, height, false);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
      text.y = 0;
    });

    container.on('pointerdown', () => {
      this.drawMetalPlate(graphics, width, height, true); // true = pressed state
      text.y = 4; // button press effect
    });

    container.on('pointerup', () => {
      this.drawMetalPlate(graphics, width, height, false);
      text.y = 0;
      callback();
    });
  }

  drawMetalPlate(graphics: Phaser.GameObjects.Graphics, width: number, height: number, pressed: boolean) {
    graphics.clear();
    const w = width;
    const h = height;
    const x = -w / 2;
    const y = -h / 2;

    // 1. Sombra de profundidad trasera
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRoundedRect(x + 4, y + 4, w, h, 6);

    // 2. Marco exterior (Biselado oscuro)
    graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
    graphics.fillRoundedRect(x, y, w, h, 4);

    // 3. Cara de la placa (Efecto gradiente de dos tonos)
    const topColor = pressed ? 0x333333 : 0x999999;
    const bottomColor = pressed ? 0x111111 : 0x666666;
    
    // Mitad superior clara
    graphics.fillStyle(topColor, 1);
    graphics.fillRect(x + 4, y + 4, w - 8, (h / 2) - 4);
    // Mitad inferior oscura
    graphics.fillStyle(bottomColor, 1);
    graphics.fillRect(x + 4, y + (h / 2), w - 8, (h / 2) - 4);

    // 4. Brillo superior (Línea de luz)
    if (!pressed) {
      graphics.lineStyle(2, 0xffffff, 0.3);
      graphics.lineBetween(x + 5, y + 5, x + w - 5, y + 5);
    }

    // 5. Remaches industriales
    const rivetColor = pressed ? 0x000000 : 0x222222;
    const offset = 12;
    const rSize = 4;
    
    graphics.fillStyle(rivetColor, 1);
    // Dibujar remaches con un pequeño punto de brillo cada uno
    [ [x+offset, y+offset], [x+w-offset, y+offset], [x+offset, y+h-offset], [x+w-offset, y+h-offset] ].forEach(pos => {
      graphics.fillCircle(pos[0], pos[1], rSize);
      if(!pressed) {
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(pos[0] - 1, pos[1] - 1, rSize / 2);
        graphics.fillStyle(rivetColor, 1);
      }
    });
  }

  startGame() {
    this.scene.start('PlatformerScene');
  }
}
