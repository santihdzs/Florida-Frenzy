import Phaser from 'phaser';

// Import assets directly for Vite
// Estos errores se arreglarian con un d.ts file, pero funciona bien
import titleBackground from '../assets/title-background.png'; 
import titleLogo from '../assets/logos/logo.png';
import music from '../assets/music/Tailgate_Troubles.mp3';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);
    this.load.image('title-logo', titleLogo);
    this.load.audio('menu-music', music);
  }

  create() {

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const savedVolume = parseFloat(localStorage.getItem('gameVolume') || '1');
    this.sound.volume = savedVolume;

    let music = this.registry.get('music');
    if(!music){
      music = this.sound.add('menu-music', { loop: true, volume: 0.5 });
      this.registry.set('music', music);
      music.play();
    }

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

    this.add.image(centerX, centerY, 'title-background');
    this.add.image(centerX, 150, 'title-logo').setScale(0.5);

    const textStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '40px',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
      letterSpacing: -1
    };

    const buttons = [
      { text: 'START', y: 320, action: () => this.startGame() },
      { text: 'MULTIPLAYER', y: 405, action: () => console.log('Multiplayer - coming soon') },
      { text: 'STORE', y: 490, action: () => console.log('Store - coming soon') },
      { text: 'SETTINGS', y: 575, action: () => this.settingsScene() },
      { text: 'LOG OUT', y: 660, action: () => this.showExit() }
    ];

    const buttonInstructions = this.createButton(centerX + 410, 670, 280, 50, 'HOW TO PLAY', () => this.instruction(), textStyle);

    const buttonWidth = 350;
    const buttonHeight = 70;

    buttons.forEach(btn => {
      this.createButton(centerX, btn.y, buttonWidth, buttonHeight, btn.text, btn.action, textStyle);
    });
  }

  createButton(x: number, y: number, width: number, height: number, label: string, callback: () => void, style: any) {
    const container = this.add.container(x, y);

    const graphics = this.add.graphics();
    this.drawMetalPlate(graphics, width, height, false);

    const text = this.add.text(0, 0, label, style).setOrigin(0.5);

    container.add([graphics, text]);

    container.setSize(width, height);
    container.setInteractive({useHandCursor: true});

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
      this.drawMetalPlate(graphics, width, height, true);
      text.y = 4;
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

    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRoundedRect(x + 4, y + 4, w, h, 6);

    graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
    graphics.fillRoundedRect(x, y, w, h, 4);

    const topColor = pressed ? 0x333333 : 0x999999;
    const bottomColor = pressed ? 0x111111 : 0x666666;
    
    graphics.fillStyle(topColor, 1);
    graphics.fillRect(x + 4, y + 4, w - 8, (h / 2) - 4);
    graphics.fillStyle(bottomColor, 1);
    graphics.fillRect(x + 4, y + (h / 2), w - 8, (h / 2) - 4);

    if (!pressed) {
      graphics.lineStyle(2, 0xffffff, 0.3);
      graphics.lineBetween(x + 5, y + 5, x + w - 5, y + 5);
    }

    const rivetColor = pressed ? 0x000000 : 0x222222;
    const offset = 12;
    const rSize = 4;
    
    graphics.fillStyle(rivetColor, 1);
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
    this.sound.stopByKey('menu-music');
    this.scene.start('LoginScene');
  }

  settingsScene(){
    this.scene.start('SettingsScene');
  }

  instruction(){
    this.scene.start('InstructionScene');
  }
  
  exitGame() {
    this.sound.stopByKey('menu-music');
     this.input.enabled = false;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlay.setAlpha(0);
    overlay.setDepth(100);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 800,
        ease: 'Power2',
        onComplete: () => {
          window.location.reload();
        }
    });
  }

  showExit() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6)
        .setOrigin(0)
        .setDepth(90)
        .setInteractive();

    const modal = this.add.container(centerX, centerY).setDepth(101);
    const width = 500;
    const height = 280;

    const background = this.add.graphics();
    this.drawMetalPlate(background, width, height, false);

    const text = this.add.text(0, -50, 'ARE YOU SURE?', {
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