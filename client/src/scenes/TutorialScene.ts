import Phaser from 'phaser';
import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.js';
import evTilesUrl from '../assets/maps/everglades.webp';
// Import cropped Clancy image
import clanUrl from '../assets/sprites/Klan.webp';
import music from '../assets/music/Lowland_Hymn.mp3';
import { getPlayer } from '../utils/auth.js';

import christianSheet from '../assets/characters/christian/Christian_SpriteSheet.webp';
import gavinSheet     from '../assets/characters/gavin/Gavin_SpriteSheet.webp';
import gustavSheet    from '../assets/characters/gustav/Gustav_SpriteSheet.webp';
import eddySheet      from '../assets/characters/eddy/Eddy_SpriteSheet.webp';

const TILE = 48;
const WORLD_W = 1200;
const WORLD_H = 800;

const KEY_EV_TILES = 'ev-tiles';
const KEY_SPR_PROJ = 'spr-projectile';
const KEY_CLAN = 'spr-clan'; // portrait key

const PLAYER_SIZE = 48;
const PLAYER_SPEED = 220;
const PLAYER_SPRINT = 340;

const CHAR_SHEET_URLS: Partial<Record<string, string>> = {
    christian: christianSheet,
    gavin:     gavinSheet,
    gustav:    gustavSheet,
    eddy:      eddySheet,
};

const CHAR_SHEETS = {
    christian: { xCuts: [0, 293, 587, 880],   yCuts: [0, 300, 600, 900,  1200] },
    gavin:     { xCuts: [0, 292, 584, 876],    yCuts: [0, 304, 608, 912,  1216] },
    gustav:    { xCuts: [0, 292, 584, 875],    yCuts: [0, 304, 608, 912,  1216] },
    eddy:      { xCuts: [0, 293, 587, 880],    yCuts: [0, 300, 599, 899,  1198] },
} as const;
type CharSheetKey = keyof typeof CHAR_SHEETS;

const PROJ_SIZE = 8;
const PROJ_SPEED = 420;

export class TutorialScene extends Phaser.Scene {
    private t: Record<string, any> = {};
    private px = 100;
    private py = 300;
    private playerImg!: Phaser.GameObjects.Sprite;
    private playerSkin: CharSheetKey = 'christian';
    private lastPlayerDir = 'down';
    private clanPortrait!: Phaser.GameObjects.Image; // cutted photo
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private instructionText!: Phaser.GameObjects.Text;
    private step = 0;
    private keys!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        SHIFT: Phaser.Input.Keyboard.Key;
        SPACE: Phaser.Input.Keyboard.Key;
    };
    private projectiles: any[] = [];
    private dialogContainer!: Phaser.GameObjects.Container; //HUB container

    constructor() {
        super({ key: 'TutorialScene' });
    }

    init() {
        const equipped = (getPlayer()?.equippedCharacter as string | undefined) ?? 'christian';
        this.playerSkin = (equipped in CHAR_SHEETS) ? equipped as CharSheetKey : 'christian';
        this.lastPlayerDir = 'down';
    }

    preload() {
        this.load.spritesheet(KEY_EV_TILES, evTilesUrl, { frameWidth: 16, frameHeight: 16 });
        // Load portrait image
        this.load.image(KEY_CLAN, clanUrl);
        this.load.audio('tutorial-music', music);

        const skinUrl = CHAR_SHEET_URLS[this.playerSkin] ?? christianSheet;
        if (!this.textures.exists(this.playerSkin))
            this.load.image(this.playerSkin, skinUrl);
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);
        if (this.input.keyboard) this.input.keyboard.enabled = true;
        this.generateTextures();

        // Get current language for translations
        const langKey = this.registry.get('language') || 'en';
        this.t = translations[langKey];

        //music
        let currentMusic = this.registry.get('music');
        if (currentMusic && currentMusic.key !== 'tutorial-music') {
            currentMusic.stop();
            currentMusic = null; // Limpiamos para crear la nueva
        }
        if (!currentMusic || !currentMusic.isPlaying) {
            const tutorialMusic = this.sound.add('tutorial-music', { loop: true, volume: 0.5 });
            this.registry.set('music', tutorialMusic);
            tutorialMusic.play();
        }
        
        // background
        this.add.tileSprite(0, 0, WORLD_W, WORLD_H, KEY_EV_TILES, 75)
            .setOrigin(0, 0).setDisplaySize(WORLD_W, WORLD_H).setTileScale(TILE/16);

        // player
        this.sliceCharSheetFrames(this.playerSkin);
        this.createWalkAnimations(this.playerSkin);
        const playerScale = PLAYER_SIZE / (CHAR_SHEETS[this.playerSkin].xCuts[1] - CHAR_SHEETS[this.playerSkin].xCuts[0]);
        this.playerImg = this.add.sprite(this.px, this.py, this.playerSkin, `${this.playerSkin}-walk-down-1`)
            .setOrigin(0, 0).setDepth(5).setScale(playerScale);
        this.playerImg.play(`${this.playerSkin}-walk-down`);

        //HUB Clan
        const HUD_X = 800; // X position
        const HUD_Y = 50;  // Y position 
        const HUD_W = 380; // widht
        const HUD_H = 100; // height 

        // Dark styled dialog background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85); // Nearly opaque fill
        bg.fillRoundedRect(0, 0, HUD_W, HUD_H, 12);
        bg.lineStyle(2, 0x8899cc).strokeRoundedRect(0, 0, HUD_W, HUD_H, 12); // Blue border

        // Clan portrait in the corner
        this.clanPortrait = this.add.image(10, 10, KEY_CLAN)
            .setOrigin(0, 0)
            .setDisplaySize(80, 80); // space in the corner

        // Style text
        const textStyle = {
            fontFamily: 'Impact, Arial black, sans-serif',
            fontSize: '18px', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: 270 }
        };

        // instructions text
        this.instructionText = this.add.text(100, 15, this.t.tut_dialog_0, textStyle)
            .setAlign('left');

        // Container grouping the HUD background, portrait, and text
        this.dialogContainer = this.add.container(HUD_X, HUD_Y, [bg, this.clanPortrait, this.instructionText]);
        this.dialogContainer.setScrollFactor(0).setDepth(100);

        this.setupInput();

        // Pause handling
        const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey?.on('down', () => {
            if (this.scene.isActive('PauseScene')) return;
            this.scene.launch('PauseScene', { returnScene: 'TutorialScene' });
            this.scene.bringToTop('PauseScene');
            this.scene.pause();
        });

        const pauseButton = this.add.text(20, 20, this.t.pause, {
            fontSize: '28px',
            color: '#feec00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { left: 10, right: 10, top: 4, bottom: 4 },
        }).setInteractive({ useHandCursor: true }).setDepth(1000).setScrollFactor(0);

        pauseButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation(); // Prevent the click from propagating to the scene and causing unintended interactions
            if (this.scene.isActive('PauseScene')) return;
            this.scene.launch('PauseScene', { returnScene: 'TutorialScene' });
            this.scene.bringToTop('PauseScene'); // Ensure the pause scene is above all others
            this.scene.pause();
        });
    }

    private setupInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
        }) as {
            W: Phaser.Input.Keyboard.Key;
            A: Phaser.Input.Keyboard.Key;
            S: Phaser.Input.Keyboard.Key;
            D: Phaser.Input.Keyboard.Key;
            SHIFT: Phaser.Input.Keyboard.Key;
            SPACE: Phaser.Input.Keyboard.Key;
        };

        // click shooting tutorial
        this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
            if (this.step >= 2) {
                this.fireProjectile(ptr);
                if (this.step === 2) {
                    this.step = 3;
                    this.clanDialog(this.t.tut_dialog_3, '#00ff88');
                }
            }
        });

        // Continue to next tutorial scene
        this.keys.SPACE.on('down', () => {
            if (this.step >= 3) {
                transitionTo(this, 'TutorialScene2');
            }
        });
    }

    // Helper: update Clancy's dialog text and color with a brief flash effect
    private clanDialog(text: string, color: string = '#ffffff') {
        this.instructionText.setText(text);
        this.instructionText.setColor(color);

        // Brief flash effect on dialog change
        this.tweens.add({
            targets: this.instructionText,
            alpha: 0.5,
            duration: 80,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    private generateTextures() {
        if (this.textures.exists(KEY_SPR_PROJ)) return;
        const g = this.make.graphics();
        g.fillStyle(0x44aaff);
        g.fillRect(0, 0, PROJ_SIZE, PROJ_SIZE);
        g.generateTexture(KEY_SPR_PROJ, PROJ_SIZE, PROJ_SIZE);
        g.destroy();
    }

    private sliceCharSheetFrames(skinKey: CharSheetKey) {
        const sheet = CHAR_SHEETS[skinKey];
        const texture = this.textures.get(skinKey);
        const dirs = ['down', 'left', 'right', 'up'];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const frameName = `${skinKey}-walk-${dirs[row]}-${col}`;
                if (!texture.has(frameName)) {
                    texture.add(
                        frameName, 0,
                        sheet.xCuts[col], sheet.yCuts[row],
                        sheet.xCuts[col + 1] - sheet.xCuts[col],
                        sheet.yCuts[row + 1] - sheet.yCuts[row],
                    );
                }
            }
        }
    }

    private createWalkAnimations(skinKey: CharSheetKey) {
        const dirs = ['down', 'left', 'right', 'up'];
        for (const dir of dirs) {
            const animKey = `${skinKey}-walk-${dir}`;
            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    frames: [
                        { key: skinKey, frame: `${skinKey}-walk-${dir}-0` },
                        { key: skinKey, frame: `${skinKey}-walk-${dir}-1` },
                        { key: skinKey, frame: `${skinKey}-walk-${dir}-2` },
                    ],
                    frameRate: 8,
                    repeat: -1,
                });
            }
        }
    }

    private fireProjectile(ptr: Phaser.Input.Pointer) {
        const cx = this.px + PLAYER_SIZE / 2;
        const cy = this.py + PLAYER_SIZE / 2;
        const raw = Math.atan2(ptr.y - cy, ptr.x - cx);
        const ang = Math.round(raw / (Math.PI / 4)) * (Math.PI / 4);

        const proj = {
            x: cx - PROJ_SIZE / 2,
            y: cy - PROJ_SIZE / 2,
            vx: Math.cos(ang) * PROJ_SPEED,
            vy: Math.sin(ang) * PROJ_SPEED,
            img: this.add.image(cx, cy, KEY_SPR_PROJ).setOrigin(0.5).setDepth(10)
        };
        this.projectiles.push(proj);
    }

    update(_time: number, delta: number) {
        const dt = delta / 1000;
        const speed = this.keys.SHIFT.isDown ? PLAYER_SPRINT : PLAYER_SPEED;

        // Movement
        let dx = 0;
        let dy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx = -speed * dt;
        else if (this.cursors.right.isDown || this.keys.D.isDown) dx = speed * dt;
        if (this.cursors.up.isDown || this.keys.W.isDown) dy = -speed * dt;
        else if (this.cursors.down.isDown || this.keys.S.isDown) dy = speed * dt;

        this.px += dx;
        this.py += dy;
        this.px = Phaser.Math.Clamp(this.px, 0, WORLD_W - PLAYER_SIZE);
        this.py = Phaser.Math.Clamp(this.py, 0, WORLD_H - PLAYER_SIZE);
        this.playerImg.setPosition(this.px, this.py);

        if (dx !== 0 || dy !== 0) {
            const dir = Math.abs(dx) >= Math.abs(dy)
                ? (dx > 0 ? 'right' : 'left')
                : (dy > 0 ? 'down' : 'up');
            if (dir !== this.lastPlayerDir || !this.playerImg.anims.isPlaying) {
                this.lastPlayerDir = dir;
                this.playerImg.play(`${this.playerSkin}-walk-${dir}`, true);
            }
            this.playerImg.anims.timeScale = this.keys.SHIFT.isDown ? 1.8 : 1;
        } else {
            this.playerImg.anims.stop();
            this.playerImg.setFrame(`${this.playerSkin}-walk-${this.lastPlayerDir}-1`);
        }

        // Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.img.setPosition(p.x, p.y);
            if (p.x < 0 || p.x > WORLD_W || p.y < 0 || p.y > WORLD_H) {
                p.img.destroy();
                this.projectiles.splice(i, 1);
            }
        }

        this.updateTutorialProgress();
    }

    private updateTutorialProgress() {
        // Sequential step progression
        if (this.step === 0 && this.px > 350) {
            this.step = 1;
            this.clanDialog(this.t.tut_dialog_1, '#ff8844');
        } 
        else if (this.step === 1 && this.px > 700) {
            this.step = 2;
            this.clanDialog(this.t.tut_dialog_2, '#00ff88');
        } 
    }
}