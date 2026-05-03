// Yael Ordaz, Santiago Hernandez

import Phaser from 'phaser';
import { getPlayer, updatePreferences, isLoggedIn } from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.ts'; // Importing translations for multilingual support

export class SettingsScene extends Phaser.Scene {
  private fromPause = false; // track if we came from the pause menu
  private returnScene = 'MenuScene'; // default return scene if not coming from pause menu

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    // Get current language for translations
    const langKey = this.registry.get('language') || 'en'; // Default to English if not set
    const t = translations[langKey]; // Get the translations for the current language

    this.cameras.main.setBackgroundColor('#1a1a1a');

    const isMuted = localStorage.getItem('ff_muted') === 'true'; // Set initial mute state based on localStorage
    this.sound.mute = isMuted; // Ensure the sound manager's mute state is in sync with localStorage on scene creation

    const titleStyle = {
      fontFamily: 'Impact, sans-serif',
      fontSize: '48px',
      color: '#c2baba',
      stroke: '#000',
      strokeThickness: 4,
    };
    const labelStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
      color: '#e0e0e0',
    };
    const sectionStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '14px',
      color: '#888888',
    };

    // Title
    this.add.text(centerX, 80, t.settings, titleStyle).setOrigin(0.5);

    // ── SOUND ────────────────────────────────────────────────────────────────
    this.add.text(centerX, 118, t.sound, sectionStyle).setOrigin(0.5);

    // Volume
    let currentVolume = parseFloat(localStorage.getItem('gameVolume') || '1');
    const music = this.registry.get('music');
    if (music) music.setVolume(currentVolume); // Ensure music volume is set to the current volume level on scene creation

    this.add.text(centerX - 190, 158, t.audio_vol, labelStyle).setOrigin(0.5);
    const volDisplay = this.add.text(centerX - 190, 203, `${Math.round(currentVolume * 100)}%`, labelStyle).setOrigin(0.5);

    this.createMetalBtn(centerX - 260, 203, 60, 50, '-', () => {
      currentVolume = Math.max(0, currentVolume - 0.1);
      this.updateVolume(currentVolume, volDisplay); // Update the volume and the display text when the button is clicked
    });
    this.createMetalBtn(centerX - 120, 203, 60, 50, '+', () => {
      currentVolume = Math.min(1, currentVolume + 0.1);
      this.updateVolume(currentVolume, volDisplay); // Update the volume and the display text when the button is clicked
    });

    // Mute toggle
    this.add.text(centerX + 190, 158, t.sound, labelStyle).setOrigin(0.5);
    let currentMuted = localStorage.getItem('ff_muted') === 'true';
    const muteBtn = this.createMetalBtn(centerX + 190, 203, 180, 60, currentMuted ? t.off : t.on, () => {
      currentMuted = !currentMuted;
      localStorage.setItem('ff_muted', currentMuted ? 'true' : 'false');
      this.sound.mute = currentMuted;
      (muteBtn.getAt(1) as Phaser.GameObjects.Text).setText(currentMuted ? t.off : t.on);
      if (isLoggedIn()) {
        const player = getPlayer();
        if (player) updatePreferences({ isMuted: currentMuted }).catch(() => {});
      }
    });

    // ── LANGUAGE ───────────────────────────────────────────────────────────
    this.add.text(centerX, 240, t.lang, sectionStyle).setOrigin(0.5);
    const updateLang = (newLang: string) => {
      localStorage.setItem('gameLanguage', newLang); // Save the selected language in localStorage so it persists across sessions
      this.registry.set('language', newLang); // Update the registry with the new language so it can be accessed by other scenes
      this.scene.restart(); // Restart the scene to apply the new language immediately (in a more complex app, you might want to update text objects directly instead of restarting)
    };
    // Language selection buttons
    const langEBtn = this.createMetalBtn(centerX - 91, 288, 180, 60, t.english, () => updateLang('en'));
    const langSBtn = this.createMetalBtn(centerX + 91, 288, 180, 60, t.spanish, () => updateLang('es'));
    if(langKey === 'en') langEBtn.setAlpha(0.7); else langSBtn.setAlpha(0.7);

    // ── SCREEN RESOLUTION ─────────────────────────────────────────────────────
    const resolutions = [
      { label: t.res_s, width: 1024, height: 640 },
      { label: t.res_n, width: 1200, height: 750 },
      { label: t.res_g, width: 1440, height: 900 },
    ];
    let currentResIndex = parseInt(localStorage.getItem('gameResolution') || '1');

    // IA was used in this section for the logic of cycling through resolutions and applying them
    this.add.text(centerX, 372, t.res, sectionStyle).setOrigin(0.5);
    this.createMetalBtn(centerX, 416, 300, 60, resolutions[currentResIndex].label, () => {
      this.input.enabled = false;
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        currentResIndex = (currentResIndex + 1) % resolutions.length;
        const target = resolutions[currentResIndex];
        localStorage.setItem('gameResolution', currentResIndex.toString());
        this.scale.setGameSize(target.width, target.height);
        this.scene.restart();
      });
    });

    // ── DISPLAY MODE ──────────────────────────────────────────────────────────
    this.add.text(centerX, 490, t.display, sectionStyle).setOrigin(0.5);

    const initialfslabel = this.scale.isFullscreen ? t.exit_fs : t.window_fs;
    const fullScreenBtn = this.createMetalBtn(centerX, 533, 300, 60, initialfslabel, () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        (fullScreenBtn.getAt(1) as Phaser.GameObjects.Text).setText(t.window_fs);
      } else {
        document.getElementById('game-container')?.requestFullscreen();
        (fullScreenBtn.getAt(1) as Phaser.GameObjects.Text).setText(t.exit_fs);
      }
    });

    // ── ACCOUNT ───────────────────────────────────────────────────────────────
    this.add.text(centerX, 608, t.account, sectionStyle).setOrigin(0.5);
    this.createMetalBtn(centerX, 651, 280, 55, t.account_settings, () => {
      transitionTo(this, 'AccountScene', { fromPause: this.fromPause, returnScene: this.returnScene });
    });
  }

  init(data: { fromPause?: boolean, returnScene?: string }) {
    this.fromPause = data.fromPause ?? false;
    this.returnScene = data.returnScene ?? 'MenuScene';
  }

  updateVolume(val: number, textObj: Phaser.GameObjects.Text) {
    textObj.setText(`${Math.round(val * 100)}%`);
    localStorage.setItem('gameVolume', val.toString());
    // Update the global volume immediately
    this.sound.volume = val;

    const music = this.registry.get('music');
    if (music) {
      music.setVolume(val);
    }   
  }

  // Custom method to draw a stylized "metal plate" background for buttons, with different appearance based on whether it's pressed or not
  // IA was used to creat the style, but the implementation was hand-coded by us based on the generated design
  createMetalBtn(x: number, y: number, w: number, h: number, label: string, callback: () => void) {
    const container = this.add.container(x, y);
    const graphics = this.add.graphics();

    const draw = (pressed: boolean) => { // Draw button background with layered rectangles for a metallic effect
      graphics.clear();
      graphics.fillStyle(0x000000, 0.4);
      graphics.fillRoundedRect(-w/2 + 3, -h/2 + 3, w, h, 6);
      graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
      graphics.fillRoundedRect(-w/2, -h/2, w, h, 4);
      graphics.fillStyle(pressed ? 0x333333 : 0x999999, 1);
      graphics.fillRect(-w/2 + 4, -h/2 + 4, w - 8, h/2 - 4);
      graphics.fillStyle(pressed ? 0x111111 : 0x666666, 1);
      graphics.fillRect(-w/2 + 4, 0, w - 8, h/2 - 4);
    };

    draw(false);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Impact', fontSize: '22px', color: '#fff',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    container.add([graphics, text]);
    container.setSize(w, h).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { draw(true); text.y = 2; })
      .on('pointerup', () => { draw(false); text.y = 0; callback(); })
      .on('pointerout', () => { draw(false); text.y = 0; });

    return container;
  }
}