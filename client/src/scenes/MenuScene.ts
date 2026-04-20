import Phaser from 'phaser';
import titleBackground from '../assets/title-background.png';
import titleLogo from '../assets/logos/logo.png';
import music from '../assets/music/Tailgate_Troubles.mp3';
import { isLoggedIn, getPlayer, logout, hasCompletedTutorial } from '../utils/auth.js';

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
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    const savedVolume = parseFloat(localStorage.getItem('gameVolume') || '1');
    this.sound.volume = savedVolume;

    let bgMusic = this.registry.get('music');
    if (!bgMusic) {
      bgMusic = this.sound.add('menu-music', { loop: true, volume: 0.5 });
      this.registry.set('music', bgMusic);
      bgMusic.play();
    }

    // Disable input briefly to prevent click bleed from scene transitions
    this.input.enabled = false;
    if (isLoggedIn()) {
      // Skip popup entirely — user is logged in, welcome screen never exists for them
      this.time.delayedCall(100, () => { this.input.enabled = true; });
    } else {
      // ALL popup / welcome-screen code here — never runs for logged-in users
      const welcomeScreen = document.getElementById('welcome-screen');
      if (welcomeScreen) {
        window.addEventListener('game-start-click', () => {
          this.time.delayedCall(300, () => {
            if (this.input) this.input.enabled = true;
          });
        }, { once: true });
      } else {
        this.time.delayedCall(100, () => { this.input.enabled = true; });
      }
    }

    this.add.image(cx, cy, 'title-background');
    this.add.image(cx, 150, 'title-logo').setScale(0.5);

    // Username top-right (with admin badge if applicable — 7E)
    if (isLoggedIn()) {
      const player = getPlayer();
      if (player) {
        const isAdmin = player.isAdmin === true;
        const label = `${String(player.username)}${isAdmin ? '  (Admin)' : ''}`;
        this.add.text(W - 20, 20, label, {
          fontFamily: 'Impact, Arial black, sans-serif',
          fontSize: '20px',
          color: isAdmin ? '#ffd700' : '#c2baba',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(1, 0);
      }
    }

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '40px',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
      letterSpacing: -1,
    };

    // Apply mute state
    const isMuted = localStorage.getItem('ff_muted') === 'true';
    if (isMuted) this.sound.mute = true;

    // ── Main area buttons: MULTIPLAYER, SHOP, FRIENDS, LOG IN/OUT ──
    const logoutLabel  = isLoggedIn() ? 'LOG OUT' : 'LOG IN';
    const logoutAction = isLoggedIn()
      ? () => logout()
      : () => this.scene.launch('LoginScene', { mode: 'login' });

    const mainW = 320;
    const mainH = 68;

    this.createButton(cx, 320, mainW, mainH, 'PLAY',        () => this.startGame(),                 textStyle);
    this.createButton(cx, 410, mainW, mainH, 'MULTIPLAYER', () => this.showMultiplayerComingSoon(), textStyle);
    this.createButton(cx, 490, mainW, mainH, 'SHOP',         () => this.scene.start('ShopScene'),    textStyle);
    this.createButton(cx, 570, mainW, mainH, 'FRIENDS',     () => this.scene.start('FriendsScene'), textStyle);
    this.createButton(cx, 650, mainW, mainH, logoutLabel,   logoutAction,                            textStyle);
  }

  createButton(
    x: number, y: number, width: number, height: number,
    label: string, callback: () => void,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ) {
    const container = this.add.container(x, y);
    const graphics  = this.add.graphics();
    this.drawMetalPlate(graphics, width, height, false);
    const text = this.add.text(0, 0, label, style).setOrigin(0.5);
    container.add([graphics, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      text.setColor('#226d1b');
      this.tweens.add({ targets: container, scale: 1.03, duration: 100 });
    });
    container.on('pointerout', () => {
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
    const w = width; const h = height;
    const x = -w / 2; const y = -h / 2;

    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRoundedRect(x + 4, y + 4, w, h, 6);
    graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
    graphics.fillRoundedRect(x, y, w, h, 4);

    const topColor    = pressed ? 0x333333 : 0x999999;
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
    const rSize  = 4;
    graphics.fillStyle(rivetColor, 1);
    [[x + offset, y + offset], [x + w - offset, y + offset],
     [x + offset, y + h - offset], [x + w - offset, y + h - offset]].forEach(pos => {
      graphics.fillCircle(pos[0], pos[1], rSize);
      if (!pressed) {
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(pos[0] - 1, pos[1] - 1, rSize / 2);
        graphics.fillStyle(rivetColor, 1);
      }
    });
  }

  startGame() {
    if (!isLoggedIn()) {
      this.scene.launch('LoginScene', { mode: 'register' });
      return;
    }
    this.sound.stopByKey('menu-music');
    if (hasCompletedTutorial()) {
      this.scene.start('RunScene', { level: 1, step: 0, totalCoins: 0, totalXp: 0, runId: 0 });
    } else {
      this.scene.start('TutorialScene');
    }
  }

  showMultiplayerComingSoon() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6)
      .setOrigin(0).setDepth(90).setInteractive();

    const modal = this.add.container(centerX, centerY).setDepth(101);
    const width = 500; const height = 180;
    const background = this.add.graphics();
    this.drawMetalPlate(background, width, height, false);

    const text = this.add.text(0, -20, 'Multiplayer mode is coming soon! Stay tuned.', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '24px', color: '#c2baba',
      stroke: '#000000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5);

    const okBtn = this.createButton(0, 40, 140, 60, 'OK', () => {
      overlay.destroy();
      modal.destroy();
      this.input.enabled = true;
    }, { fontFamily: 'Impact, Arial black, sans-serif', fontSize: '20px', color: '#c2baba', stroke: '#000000', strokeThickness: 2 });

    modal.add([background, text, okBtn]);
    modal.setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: modal, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    okBtn.setDepth(101);
  }

}
