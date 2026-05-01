// Santiago Hernandez, Yael Ordaz

import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import titleLogo from '../assets/logos/logo.webp';
import music from '../assets/music/Tailgate_Troubles.mp3';
import { isLoggedIn, getPlayer, logout, hasCompletedTutorial, markTutorialComplete } from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.ts'; // util for fetching translations based on current language
import { fetchActiveDeck } from '../api/deckApi';

export class MenuScene extends Phaser.Scene {
  private t: Record<string, string> = {}; // Translations for current language
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);
    this.load.image('title-logo', titleLogo);
    this.load.audio('menu-music', music); // Placeholder music, replace with actual track for final game
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // Get current language for translations
    const langKey = this.registry.get('language') || 'en'; // Default to English if not set
    this.t = translations[langKey]; // Load translations for this scene

    const savedVolume = parseFloat(localStorage.getItem('gameVolume') || '1'); // Default to full volume if not set
    this.sound.volume = savedVolume; // Apply saved volume level

    let bgMusic = this.registry.get('music'); // Check if music is already playing (from another scene)
    if (!bgMusic) { // If not, create and play it
      bgMusic = this.sound.add('menu-music', { loop: true, volume: 0.5 }); // Start at half volume, user can adjust in settings
      this.registry.set('music', bgMusic); // Store in registry so it can be accessed across scenes without restarting
      bgMusic.play(); // Play music when menu is created
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

    // text style for main buttons
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
    const logoutLabel  = isLoggedIn() ? this.t.logout_btn : this.t.login_btn;
    const logoutAction = isLoggedIn()
      ? () => { logout(); this.scene.restart(); }
      : () => this.scene.launch('LoginScene', { mode: 'login' });

    const mainW = 320;
    const mainH = 68;

    this.createButton(cx, 320, mainW, mainH, this.t.play,        () => this.startGame(),                 textStyle);
    this.createButton(cx, 410, mainW, mainH, this.t.multiplayer, () => this.goMultiplayer(), textStyle);
    this.createButton(cx, 490, mainW, mainH, this.t.shop,         () => transitionTo(this, 'ShopScene'),    textStyle);
    this.createButton(cx, 570, mainW, mainH, this.t.friends,     () => transitionTo(this, 'FriendsScene'), textStyle);
    this.createButton(cx, 650, mainW, mainH, logoutLabel,   logoutAction,                            textStyle);
  }

  // Utility to create a button with consistent style and behavior
  createButton(
    x: number, y: number, width: number, height: number,
    label: string, callback: () => void,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ) {
    const container = this.add.container(x, y); // Button container to hold background and text, and handle interactions
    const graphics  = this.add.graphics(); // Background graphics for the button, drawn with a custom "metal plate" style in drawMetalPlate()
    this.drawMetalPlate(graphics, width, height, false); // Initial draw of the button background in unpressed state
    const text = this.add.text(0, 0, label, style).setOrigin(0.5); // Button label text, centered in the button
    container.add([graphics, text]); // Add background and text to the container so they move together
    container.setSize(width, height); // Set the size of the container for input hit testing
    container.setInteractive({ useHandCursor: true }); // Make the container interactive so it can respond to pointer events, and show hand cursor on hover

    container.on('pointerover', () => { 
      text.setColor('#226d1b');
      this.tweens.add({ targets: container, scale: 1.03, duration: 100 }); // Slightly enlarge the button on hover for a nice interactive feel
    });
    container.on('pointerout', () => {
      text.setColor('#c2baba');
      this.drawMetalPlate(graphics, width, height, false);
      this.tweens.add({ targets: container, scale: 1, duration: 100 }); // Return to normal size when not hovering
      text.y = 0;
    });
    container.on('pointerdown', () => {
      this.drawMetalPlate(graphics, width, height, true); // Redraw the button background in "pressed" state when clicked
      text.y = 4;
    });
    container.on('pointerup', () => {
      this.drawMetalPlate(graphics, width, height, false); // Redraw the button background back to unpressed state when released
      text.y = 0;
      callback();
    });

    return container;
  }

  // Custom method to draw a stylized "metal plate" background for buttons, with different appearance based on whether it's pressed or not
  // IA was used to creat the style, but the implementation was hand-coded by us based on the generated design
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

  async startGame() {
    if (!isLoggedIn()) {
      this.scene.launch('LoginScene', { mode: 'register' });
      return;
    }

    const player = getPlayer();
    if (!player) {
      this.showNoDeckModal();
      return;
    }

    try {
      const activeDeck = await fetchActiveDeck(Number(player.id));
      const cards = activeDeck?.deck?.cards;
      if (
        !cards ||
        cards.length === 0 ||
        cards.length !== activeDeck.deck.slotLimit
      ) {
        this.showNoDeckModal();
        return;
      }
    } catch {
      this.showNoDeckModal();
      return;
    }

    this.sound.stopByKey('menu-music');
    const skipTutorial = hasCompletedTutorial() || Number(player.totalGamesPlayed ?? 0) > 0;
    if (skipTutorial) {
      if (!hasCompletedTutorial()) markTutorialComplete();
      transitionTo(this, 'RunScene', { level: 1, step: 0, totalCoins: 0, totalXp: 0, runId: 0 });
    } else {
      transitionTo(this, 'TutorialScene');
    }
  }

  showNoDeckModal() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6)
      .setOrigin(0).setDepth(90).setInteractive();

    const modal = this.add.container(centerX, centerY).setDepth(101);
    const width = 500; const height = 200;
    const background = this.add.graphics();
    this.drawMetalPlate(background, width, height, false);

    const text = this.add.text(0, -30, 'You need to build a deck before playing.', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '22px', color: '#c2baba',
      stroke: '#000000', strokeThickness: 3, align: 'center',
      wordWrap: { width: 440 },
    }).setOrigin(0.5);

    const goBtn = this.createButton(0, 50, 200, 60, 'BUILD DECK', () => {
      overlay.destroy();
      modal.destroy();
      this.input.enabled = true;
      (window as any).sidebarNav?.('DeckScene', null);
    }, { fontFamily: 'Impact, Arial black, sans-serif', fontSize: '20px', color: '#c2baba', stroke: '#000000', strokeThickness: 2 });

    modal.add([background, text, goBtn]);
    modal.setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: modal, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    goBtn.setDepth(101);
  }

  goMultiplayer() {
    if (!isLoggedIn()) {
      this.scene.launch('LoginScene', { mode: 'login' });
      return;
    }
    transitionTo(this, 'MultiplayerLobbyScene');
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

    const text = this.add.text(0, -20, this.t.multi_coming_soon, {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '24px', color: '#c2baba',
      stroke: '#000000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5);

    const okBtn = this.createButton(0, 40, 140, 60, this.t.confirm_ok, () => {
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
