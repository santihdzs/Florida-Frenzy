import Phaser from 'phaser';
import evTilesUrl from '../assets/maps/everglades.png';
// Importamos la imagen recortada de Klancy
import klanUrl from '../assets/sprites/Klan.png';

const TILE = 48;
const WORLD_W = 1200;
const WORLD_H = 800;

const KEY_EV_TILES = 'ev-tiles';
const KEY_SPR_PLAYER = 'spr-player';
const KEY_SPR_PROJ = 'spr-projectile';
const KEY_KLAN = 'spr-klan'; // photo key

const PLAYER_SIZE = 48;
const PLAYER_SPEED = 220;
const PLAYER_SPRINT = 340;

const PROJ_SIZE = 8;
const PROJ_SPEED = 420;

export class TutorialScene extends Phaser.Scene {
    private px = 100;
    private py = 300;
    private playerImg!: Phaser.GameObjects.Image;
    private klanPortrait!: Phaser.GameObjects.Image; // cutted photo
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private instructionText!: Phaser.GameObjects.Text;
    private step = 0;
    private keys!: any;
    private projectiles: any[] = [];
    private dialogContainer!: Phaser.GameObjects.Container; //HUB container

    constructor() {
        super({ key: 'TutorialScene' });
    }

    preload() {
        this.load.spritesheet(KEY_EV_TILES, evTilesUrl, { frameWidth: 16, frameHeight: 16 });
        // Charge photo
        this.load.image(KEY_KLAN, klanUrl);
    }

    create() {
        if (this.input.keyboard) this.input.keyboard.enabled = true;
        this.generateTextures();
        
        // background
        this.add.tileSprite(0, 0, WORLD_W, WORLD_H, KEY_EV_TILES, 75)
            .setOrigin(0, 0).setDisplaySize(WORLD_W, WORLD_H).setTileScale(TILE/16);

        // player
        this.playerImg = this.add.image(this.px, this.py, KEY_SPR_PLAYER).setOrigin(0, 0).setDepth(5);

        //HUB Klan
        const HUD_X = 800; // X position
        const HUD_Y = 50;  // Y position 
        const HUD_W = 380; // widht
        const HUD_H = 100; // height 

        // Fondo del recuadro (oscuro y estilizado)
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85); // Fondo casi opaco
        bg.fillRoundedRect(0, 0, HUD_W, HUD_H, 12);
        bg.lineStyle(2, 0x8899cc).strokeRoundedRect(0, 0, HUD_W, HUD_H, 12); // Borde azul

        // Klan photo in the corner
        this.klanPortrait = this.add.image(10, 10, KEY_KLAN)
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
        this.instructionText = this.add.text(100, 15, 'Hey Crock, ¡Let´s do it!\nUse WASD or the arrow keys to move.', textStyle)
            .setAlign('left');

        // container for the HUD and agrup by the text
        this.dialogContainer = this.add.container(HUD_X, HUD_Y, [bg, this.klanPortrait, this.instructionText]);
        this.dialogContainer.setScrollFactor(0).setDepth(100);

        this.setupInput();
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
        }) as any;

        // click shooting tutorial
        this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
            if (this.step >= 2) {
                this.fireProjectile(ptr);
                if (this.step === 2) {
                    this.step = 3;
                    this.klanDialog('¡Crock-Níal! Press the spacebar to continue.', '#00ff88');
                }
            }
        });

        // Continue to next tutorial scene
        this.keys.SPACE.on('down', () => {
            if (this.step >= 3) {
                this.scene.start('TutorialScene2');
            }
        });
    }

    // Función auxiliar para que Klancy "hable" (cambie de texto y color)
    private klanDialog(text: string, color: string = '#ffffff') {
        this.instructionText.setText(text);
        this.instructionText.setColor(color);
        
        // Pequeño efecto de brillo al cambiar de diálogo
        this.tweens.add({
            targets: this.instructionText,
            alpha: 0.5,
            duration: 80,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    private generateTextures() {
        const makeRect = (key: string, w: number, h: number, color: number) => {
            if (this.textures.exists(key)) return;
            const g = this.make.graphics();
            g.fillStyle(color);
            g.fillRect(0, 0, w, h);
            g.generateTexture(key, w, h);
            g.destroy();
        };

        makeRect(KEY_SPR_PLAYER, PLAYER_SIZE, PLAYER_SIZE, 0x3366ff);
        makeRect(KEY_SPR_PROJ, PROJ_SIZE, PROJ_SIZE, 0x44aaff);
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

        // Movimiento
        if (this.cursors.left.isDown || this.keys.A.isDown) this.px -= speed * dt;
        else if (this.cursors.right.isDown || this.keys.D.isDown) this.px += speed * dt;
        if (this.cursors.up.isDown || this.keys.W.isDown) this.py -= speed * dt;
        else if (this.cursors.down.isDown || this.keys.S.isDown) this.py += speed * dt;

        this.playerImg.setPosition(this.px, this.py);
        this.px = Phaser.Math.Clamp(this.px, 0, WORLD_W - PLAYER_SIZE);
        this.py = Phaser.Math.Clamp(this.py, 0, WORLD_H - PLAYER_SIZE);

        // Proyectiles
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
        // Lógica secuencial (else if)
        if (this.step === 0 && this.px > 350) {
            this.step = 1;
            this.klanDialog('¡Good! Hold SHIFT to run.\nBe careful with your stamina, Crock.');
        } 
        else if (this.step === 1 && this.px > 700) {
            this.step = 2;
            this.klanDialog('Click to shoot.\nAim with the mouse (8 directions).');
        } 
    }
}