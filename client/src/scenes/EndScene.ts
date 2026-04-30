import Phaser from 'phaser';
import { transitionTo } from '../utils/sceneTransition.js';
import pythraUrl from '../assets/characters/pythra/Pythra_damage-2.webp';
import music from '../assets/music/Blackwater_Shuffle.mp3';
import backgroundImg from '../assets/backgrounds/sewers_topdown.webp';
import type { RunData } from './RunScene';

// Constantes para las líneas de diálogo
const DIALOGUE_LINES = [
  "So you managed to survive the Everglades... Heh, don't get cocky, rookie.",
  'This swamp has been claiming runners for centuries. What you just experienced was only the beginning — one cycle in an endless spiral.',
  'Every time you fall, the Run resets... but the swamp remembers. The deeper you go, the hungrier it gets.',
  'There is no "final boss" waiting to grant you peace. There is only the next Run, and the next, and the next... semi-infinite, just like the hunger of the creatures that dwell here.',
  'Get stronger. Adapt. Or become another pile of bones beneath the cypress trees.',
  'See you in the next Run, Crock... if you make it that far.',
] as const;

export class EndScene extends Phaser.Scene {
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogText!: Phaser.GameObjects.Text;
  private typewriterEvent?: Phaser.Time.TimerEvent;
  private currentLineIndex = 0;
  private isTransitioning = false;
  private nextBtn!: Phaser.GameObjects.Text;
  private skipHint!: Phaser.GameObjects.Text;
  private nextRunData: RunData = { level: 1, step: 0, totalCoins: 0, totalXp: 0, runId: 0 };

  constructor() {
    super({ key: 'EndScene' });
  }

  init(data: Partial<RunData>) {
    this.nextRunData = {
      level:       data.level       ?? 1,
      step:        data.step        ?? 0,
      totalCoins:  data.totalCoins  ?? 0,
      totalXp:     data.totalXp     ?? 0,
      runId:       data.runId       ?? 0,
      currentMap:  data.currentMap,
    };
    this.currentLineIndex = 0;
    this.isTransitioning = false;
  }

  preload() {
    this.load.image('pythra', pythraUrl);
    this.load.audio('end-music', music);
    this.load.image('end-bg', backgroundImg);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Music
    let currentMusic = this.registry.get('music');
    if (currentMusic && currentMusic.key !== 'end-music') {
      currentMusic.stop();
      currentMusic = null;
    }
    if (!currentMusic || !currentMusic.isPlaying) {
      const endMusic = this.sound.add('end-music', { loop: true, volume: 0.5 });
      this.registry.set('music', endMusic);
      endMusic.play();
    }

    this.events.once('shutdown', () => {
      const currentMusic = this.registry.get('music');
      if (currentMusic) {
        currentMusic.stop();
      }
    });

    // Darkened background
    this.add.image(centerX, centerY, 'end-bg').setDisplaySize(width, height).setDepth(0);
    this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.35).setDepth(1);

    // Title
    this.add.text(centerX, 60, 'THE JOURNEY CONTINUES...', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '48px',
      color: '#ff3333',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(5).setShadow(2, 2, '#000000', 4, false, true);

    // Pythra sprite
    this.add.image(centerX, centerY, 'pythra').setScale(0.5).setDepth(2);

    // Dialog HUD
    const hudX = centerX;
    const hudY = 610;
    const hudW = 500;
    const hudH = 140;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(0, 0, hudW, hudH, 12);
    bg.lineStyle(2, 0xcc4444).strokeRoundedRect(0, 0, hudW, hudH, 12);

    this.dialogText = this.add.text(20, 20, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: hudW - 40 },
    });

    this.dialogContainer = this.add.container(hudX - hudW / 2, hudY - hudH / 2, [bg, this.dialogText]);
    this.dialogContainer.setDepth(10);

    // Skip hint
    this.skipHint = this.add.text(centerX, height - 30, 'Click or press SPACE or ENTER to continue', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(10);

    // next button (initially hidden), will be shown after dialogue ends to return to menu
    this.nextBtn = this.add.text(centerX, height - 100, 'NEXT', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(10).setVisible(false).setInteractive({ useHandCursor: true });

    this.nextBtn.on('pointerdown', () => {
      transitionTo(this, 'RunScene', this.nextRunData);
    });

    // Start first line
    this.startLine(0);

    // Global click to advance dialog
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
      this.advanceOrSkip();
    });
    
    //enter key to advance dialog
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.advanceOrSkip();
    });

    // space key to advance dialog   
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.advanceOrSkip();
    });

    // Pause button
    const pauseBtn = this.add.text(width - 20, 20, 'PAUSE', {
      fontSize: '28px',
      color: '#feec00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { left: 10, right: 10, top: 4, bottom: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(1000).setScrollFactor(0);

    pauseBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      if (this.scene.isActive('PauseScene')) return;
      this.scene.pause();
      this.scene.bringToTop('PauseScene');
      this.scene.launch('PauseScene', { returnScene: 'EndScene' });
    });

    // ESC to pause
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      if (this.scene.isActive('PauseScene')) return;
      this.scene.pause();
      this.scene.bringToTop('PauseScene');
      this.scene.launch('PauseScene', { returnScene: 'EndScene' });
    });
  }

  private startLine(index: number) {
    if (index >= DIALOGUE_LINES.length) {
      this.showMenuButton();
      return;
    }
    this.currentLineIndex = index;
    const fullText = DIALOGUE_LINES[index];
    this.dialogText.setText('');
    let charIndex = 0;

    this.typewriterEvent?.remove();
    this.typewriterEvent = this.time.addEvent({
      delay: 35,
      callback: () => {
        if (charIndex < fullText.length) {
          this.dialogText.setText(fullText.substring(0, charIndex + 1));
          charIndex++;
        } else {
          this.typewriterEvent?.remove();
          this.typewriterEvent = undefined;
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  private advanceOrSkip() {
    if (this.isTransitioning) return;

    // If currently typing, skip to end of line
    if (this.typewriterEvent) {
      this.typewriterEvent.remove();
      this.typewriterEvent = undefined;
      this.dialogText.setText(DIALOGUE_LINES[this.currentLineIndex]);
      return;
    }

    // Otherwise advance to next line
    const nextIndex = this.currentLineIndex + 1;
    if (nextIndex < DIALOGUE_LINES.length) {
      this.startLine(nextIndex);
    } else {
      this.showMenuButton();
    }
  }

  private showMenuButton() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.skipHint.setVisible(false);
    this.nextBtn.setVisible(true);
    this.tweens.add({
      targets: this.nextBtn,
      alpha: { from: 0, to: 1 },
      duration: 600,
    });
  }
}

