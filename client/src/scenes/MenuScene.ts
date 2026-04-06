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

    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
        this.input.enabled = false;
        window.addEventListener('game-start-click', () => {
            this.time.delayedCall(300, () => {
                if (this.input) this.input.enabled = true;
            });
        }, { once: true });
    } else {
        this.input.enabled = true;
    }

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
      { text: 'SETTINGS', y: 575, action: () => this.settingsScene() },
      { text: 'EXIT', y: 660, action: () => this.showExit() }
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
      text.setColor('#226d1b');
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

    return container;
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
    this.scene.start('DuelScene');
  }

  settingsScene(){
    this.scene.start('SettingsScene');
  }
  
  exitGame() {
    // Block input to prevent further interactions during the exit animation
     this.input.enabled = false;

    // Overlay for fade-out effect
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlay.setAlpha(0);
    overlay.setDepth(100);

    // Shutdown animation
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 800,
        ease: 'Power2',
        onComplete: () => {
          window.location.reload(); // Simulate game exit by reloading the page
        }
    });
  }

  confirmExit() {
    const confirmation = confirm('Are you sure you want to exit the game?');
    if (confirmation) {
      this.exitGame();
    }
  }

  showExit() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Overlay for modal background
    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6)
        .setOrigin(0)
        .setDepth(90)
        .setInteractive(); // Block interactions with the background

    const modal = this.add.container(centerX, centerY).setDepth(101);
    const width = 500;
    const height = 280;

    // body of the modal
    const background = this.add.graphics();
    this.drawMetalPlate(background, width, height, false);

    // Confirmation text
    const text = this.add.text(0, -50, '¿DESCONECTAR SISTEMA?', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '32px',
        color: '#c2baba',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
    }).setOrigin(0.5);

    const textStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '28px',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2
    };

    const yesBtn = this.createButton(-100, 60, 140, 60, 'YES', () => this.exitGame(), textStyle);
    const noBtn = this.createButton(100, 60, 140, 60, 'NO', () => {
      overlay.destroy();
      modal.destroy();
      this.input.enabled = true;
    }, textStyle);

    modal.add([background, text, yesBtn, noBtn]);

    // Pop-up animation
    modal.setScale(0.5);
    modal.setAlpha(0);
    this.tweens.add({
        targets: modal,
        scale: 1,
        alpha: 1,
        duration: 300,
        ease: 'Back.easeOut'
    });

    yesBtn.setDepth(101);
    noBtn.setDepth(101);
  }
}