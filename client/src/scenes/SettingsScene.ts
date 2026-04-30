// Yael Ordaz, Santiago Hernandez

import Phaser from 'phaser';
import { getPlayer, updatePreferences, isLoggedIn } from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';

export class SettingsScene extends Phaser.Scene {
  private fromPause = false; // track if we came from the pause menu
  private returnScene = 'MenuScene'; // default return scene if not coming from pause menu

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    this.cameras.main.setBackgroundColor('#1a1a1a');

    const isMuted = localStorage.getItem('ff_muted') === 'true';
    this.sound.mute = isMuted;

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

    // Back — top-left corner
    this.createMetalBtn(60, 42, 110, 44, '< BACK', () => {
      if (this.fromPause) {
        this.scene.stop();
        this.scene.launch('PauseScene', { returnScene: this.returnScene });
      } else {
        this.scene.start('MenuScene');
      }
    });

    // Title
    this.add.text(centerX, 55, 'SETTINGS', titleStyle).setOrigin(0.5);

    // ── SOUND ────────────────────────────────────────────────────────────────
    this.add.text(centerX, 118, 'SOUND', sectionStyle).setOrigin(0.5);

    // Volume
    let currentVolume = parseFloat(localStorage.getItem('gameVolume') || '1');
    const music = this.registry.get('music');
    if (music) music.setVolume(currentVolume);

    this.add.text(centerX, 158, 'AUDIO VOLUME', labelStyle).setOrigin(0.5);
    const volDisplay = this.add.text(centerX, 203, `${Math.round(currentVolume * 100)}%`, labelStyle).setOrigin(0.5);

    this.createMetalBtn(centerX - 80, 203, 60, 50, '-', () => {
      currentVolume = Math.max(0, currentVolume - 0.1);
      this.updateVolume(currentVolume, volDisplay);
    });
    this.createMetalBtn(centerX + 80, 203, 60, 50, '+', () => {
      currentVolume = Math.min(1, currentVolume + 0.1);
      this.updateVolume(currentVolume, volDisplay);
    });

    // Mute toggle
    this.add.text(centerX, 255, 'MUTE', labelStyle).setOrigin(0.5);
    let currentMuted = localStorage.getItem('ff_muted') === 'true';
    const muteBtn = this.createMetalBtn(centerX, 298, 180, 60, currentMuted ? 'OFF' : 'ON', () => {
      currentMuted = !currentMuted;
      localStorage.setItem('ff_muted', currentMuted ? 'true' : 'false');
      this.sound.mute = currentMuted;
      (muteBtn.getAt(1) as Phaser.GameObjects.Text).setText(currentMuted ? 'OFF' : 'ON');
      if (isLoggedIn()) {
        const player = getPlayer();
        if (player) updatePreferences({ isMuted: currentMuted }).catch(() => {});
      }
    });

    // ── SCREEN RESOLUTION ─────────────────────────────────────────────────────
    const resolutions = [
      { label: 'Pequeña 1024x640', width: 1024, height: 640 },
      { label: 'Normal 1200x750', width: 1200, height: 750 },
      { label: 'Grande 1440x900', width: 1440, height: 900 },
    ];
    let currentResIndex = parseInt(localStorage.getItem('gameResolution') || '1');

    this.add.text(centerX, 372, 'SCREEN RESOLUTION', sectionStyle).setOrigin(0.5);
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
    this.add.text(centerX, 490, 'DISPLAY MODE', sectionStyle).setOrigin(0.5);

    const initialfslabel = this.scale.isFullscreen ? 'EXIT FULLSCREEN' : 'WINDOWED / FULLSCREEN';
    const fullScreenBtn = this.createMetalBtn(centerX, 533, 300, 60, initialfslabel, () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        (fullScreenBtn.getAt(1) as Phaser.GameObjects.Text).setText('WINDOWED / FULLSCREEN');
      } else {
        document.getElementById('game-container')?.requestFullscreen();
        (fullScreenBtn.getAt(1) as Phaser.GameObjects.Text).setText('EXIT FULLSCREEN');
      }
    });

    // ── ACCOUNT ───────────────────────────────────────────────────────────────
    this.add.text(centerX, 608, 'ACCOUNT', sectionStyle).setOrigin(0.5);
    this.createMetalBtn(centerX, 651, 280, 55, 'Account Settings', () => {
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

  // metal button
  createMetalBtn(x: number, y: number, w: number, h: number, label: string, callback: () => void) {
    const container = this.add.container(x, y);
    const graphics = this.add.graphics();

    const draw = (pressed: boolean) => {
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