import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import music from '../assets/music/Lowland_Hymn.mp3';
import { translations } from '../utils/translations.ts';

// Klancy full-body expressions
import klancyNeutralUrl from '../assets/characters/klancy/Klancy_v1_resized.webp';
import klancyExplain1Url from '../assets/characters/klancy/Klancy_explain1_compressed.webp';
import klancyExplain2Url from '../assets/characters/klancy/Klancy_explain2_compressed.webp';
import klancyAngryUrl from '../assets/characters/klancy/Klancy_angry_compressed.webp';
import klancyFightUrl from '../assets/characters/klancy/Klancy_fight_compressed.webp';
import klancySadUrl from '../assets/characters/klancy/Klancy_sad_compressed.webp';
import klancyShockedUrl from '../assets/characters/klancy/Klancy_schocked_compressed.webp';
import klancyVictoryUrl from '../assets/characters/klancy/Klancy_victory_compressed.webp';

interface DialogueLine {
  text: string;
  expression: string;
}

const KLANCY_CONFIG: Record<string, { key: string; name: string }> = { //sprite keys and speaker names for each expression
  neutral: { key: 'spr-klancy-neutral', name: 'Klancy' },
  explain1: { key: 'spr-klancy-explain1', name: 'Klancy' },
  explain2: { key: 'spr-klancy-explain2', name: 'Klancy' },
  angry: { key: 'spr-klancy-angry', name: 'Klancy' },
  fight: { key: 'spr-klancy-fight', name: 'Klancy' },
  sad: { key: 'spr-klancy-sad', name: 'Klancy' },
  shocked: { key: 'spr-klancy-shocked', name: 'Klancy' },
  victory: { key: 'spr-klancy-victory', name: 'Klancy' },
};

// Expressions only — text is loaded from translations at runtime
const DIALOGUE_EXPRESSIONS = [
  'neutral', 'explain1', 'shocked', 'explain2', 'sad', 'angry', 'fight', 'victory', 'neutral',
];

export class IntroScene extends Phaser.Scene {
  private currentLine = 0;
  private nameText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private dialogueContainer!: Phaser.GameObjects.Container;
  private klancySprite!: Phaser.GameObjects.Image;
  private bgMusic!: Phaser.Sound.BaseSound;
  private isTransitioning = false;
  private currentExpression = 'neutral';
  private t: Record<string, any> = {};
  private dialogueLines: DialogueLine[] = [];

  private tf(key: string, ...args: any[]): string {
    const val = this.t[key];
    if (typeof val === 'function') return val(...args);
    return val ?? key;
  }

  constructor() {
    super({ key: 'IntroScene' });
  }

  preload() {
    this.load.image('intro-bg', titleBackground);
    this.load.audio('intro-music', music);

    // Load all Klancy expressions
    this.load.image('spr-klancy-neutral', klancyNeutralUrl);
    this.load.image('spr-klancy-explain1', klancyExplain1Url);
    this.load.image('spr-klancy-explain2', klancyExplain2Url);
    this.load.image('spr-klancy-angry', klancyAngryUrl);
    this.load.image('spr-klancy-fight', klancyFightUrl);
    this.load.image('spr-klancy-sad', klancySadUrl);
    this.load.image('spr-klancy-shocked', klancyShockedUrl);
    this.load.image('spr-klancy-victory', klancyVictoryUrl);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const langKey = this.registry.get('language') || 'en';
    this.t = translations[langKey];
    this.dialogueLines = DIALOGUE_EXPRESSIONS.map((expression, i) => ({
      expression,
      text: this.tf(`intro_line_${i}`),
    }));
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // Background with slight zoom-in tween
    const bg = this.add.image(cx, cy, 'intro-bg').setDisplaySize(W, H);
    this.tweens.add({
      targets: bg,
      scale: 1.1,
      duration: 20000,
      ease: 'Sine.easeInOut',
    });

    // Dark vignette overlay
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0);

    // Music
    const savedVolume = parseFloat(localStorage.getItem('gameVolume') || '1');
    this.sound.volume = savedVolume;
    if (!this.sound.get('intro-music')) {
      this.bgMusic = this.sound.add('intro-music', { loop: true, volume: 0.4 });
      this.bgMusic.play();
    }

    // Klancy sprite (centered, large)
    this.klancySprite = this.add
      .image(cx, H - 40, 'spr-klancy-neutral')
      .setOrigin(0.5, 1)
      .setAlpha(1);
    this.fitSpriteHeight(this.klancySprite, 480);

    // Dialogue box
    const boxW = 900;
    const boxH = 160;
    const boxX = cx - boxW / 2;
    const boxY = H - boxH - 20;

    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x000000, 0.88);
    bgGraphics.fillRoundedRect(0, 0, boxW, boxH, 14);
    bgGraphics.lineStyle(3, 0x66ff88);
    bgGraphics.strokeRoundedRect(0, 0, boxW, boxH, 14);

    // Speaker name tag background
    const nameTagW = 200;
    const nameTagH = 38;
    const nameTagBg = this.add.graphics();
    nameTagBg.fillStyle(0x000000, 0.95);
    nameTagBg.fillRoundedRect(0, 0, nameTagW, nameTagH, 8);
    nameTagBg.lineStyle(2, 0x66ff88);
    nameTagBg.strokeRoundedRect(0, 0, nameTagW, nameTagH, 8);

    // Speaker name text
    this.nameText = this.add
      .text(nameTagW / 2, nameTagH / 2, '', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '22px',
        color: '#66ff88',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Dialogue text
    this.dialogueText = this.add
      .text(24, 52, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#dddddd',
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: boxW - 48 },
        lineSpacing: 6,
      });

    // Container
    this.dialogueContainer = this.add.container(boxX, boxY, [
      bgGraphics,
      nameTagBg,
      this.nameText,
      this.dialogueText,
    ]);
    this.dialogueContainer.setAlpha(0);
    this.dialogueContainer.setDepth(100);

    // Input handling
    this.input.on('pointerdown', () => this.advanceDialogue());
    this.input.keyboard?.on('keydown-SPACE', () => this.advanceDialogue());
    this.input.keyboard?.on('keydown-ENTER', () => this.advanceDialogue());

    // Skip hint
    this.add
      .text(W - 20, H - 20, this.tf('intro_hint'), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#888888',
      })
      .setOrigin(1, 1)
      .setAlpha(0.7);

    // Skip button (top-right corner)
    const skipBtn = this.add
      .text(W - 20, 20, this.tf('intro_skip'), {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '20px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(101);

    skipBtn.on('pointerover', () => skipBtn.setColor('#ffffff'));
    skipBtn.on('pointerout', () => skipBtn.setColor('#aaaaaa'));
    skipBtn.on('pointerup', () => this.finishIntro());

    // Start first line
    this.showLine(0);
  }

  private fitSpriteHeight(sprite: Phaser.GameObjects.Image, height: number) { // Utility to fit sprite to a specific height while maintaining aspect ratio
    const texture = this.textures.get(sprite.texture.key);
    const src = texture.getSourceImage();
    const ratio = src.width / src.height;
    const w = height * ratio;
    sprite.setDisplaySize(w, height);
  }

  private showLine(index: number) { // Show a specific dialogue line by index
    if (index >= this.dialogueLines.length) {
      this.finishIntro();
      return;
    }

    const line = this.dialogueLines[index]; // Get config for current expression
    const config = KLANCY_CONFIG[line.expression]; // config for current expression

    // Update speaker name
    this.nameText.setText(config.name);

    // Swap Klancy expression if needed
    if (this.currentExpression !== line.expression) {
      this.currentExpression = line.expression;
      this.tweens.add({
        targets: this.klancySprite,
        alpha: 0,
        duration: 150,
        ease: 'Sine.easeInOut',
        onComplete: () => { // After fading out, change the texture and fade back in
          this.klancySprite.setTexture(config.key);
          this.fitSpriteHeight(this.klancySprite, 480);
          this.tweens.add({
            targets: this.klancySprite,
            alpha: 1,
            duration: 150,
            ease: 'Sine.easeInOut',
          });
        },
      });
    }

    // Fade in container on first line
    if (index === 0) {
      this.tweens.add({
        targets: this.dialogueContainer,
        alpha: 1,
        duration: 800,
        ease: 'Sine.easeInOut',
      });
    }

    // Typewriter effect
    this.dialogueText.setText('');
    this.typewriteText(this.dialogueText, line.text, 35, () => {
      // Small bounce on Klancy when done
      this.tweens.add({
        targets: this.klancySprite,
        scaleX: this.klancySprite.scaleX * 1.02,
        scaleY: this.klancySprite.scaleY * 1.02,
        duration: 150,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    });
  }

  // Utility for typewriter text effect
  private typewriteText(
    textObj: Phaser.GameObjects.Text,
    fullText: string,
    speed: number,
    onComplete?: () => void
  ) {
    let i = 0; // Reset text and clear any existing timers
    textObj.setText('');
    this.time.removeAllEvents();

    const timer = this.time.addEvent({
      delay: speed,
      callback: () => {
        textObj.setText(fullText.substring(0, i + 1));
        i++;
        if (i >= fullText.length) {
          timer.destroy();
          onComplete?.();
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  // Handle advancing dialogue: if currently typing, skip to end; otherwise go to next line
  private advanceDialogue() {
    if (this.isTransitioning) return;

    // If currently typing, skip to end of current line
    const currentFull = this.dialogueLines[this.currentLine];
    if (this.dialogueText.text !== currentFull.text) {
      this.time.removeAllEvents();
      this.dialogueText.setText(currentFull.text);
      return;
    }

    this.currentLine++;
    this.showLine(this.currentLine); // Show next line or finish if at the end
  }

  private finishIntro() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Fade out music
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.tweens.add({
        targets: this.bgMusic,
        volume: 0,
        duration: 1000,
        onComplete: () => this.bgMusic.stop(),
      });
    }

    // Fade out everything
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }
}

