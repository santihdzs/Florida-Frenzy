import Phaser from 'phaser';
import { getSocket } from '../utils/socket.js';
import { getPlayer } from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';
import { MAP_CONFIGS, type TileRect } from '../utils/mapConfig.js';
import { showLoadingScreen } from '../utils/loadingScreen.js';

import chrisAvatarUrl   from '../assets/sprites/Chris.webp';

import christianSheet from '../assets/characters/christian/Christian_SpriteSheet.webp';
import gavinSheet     from '../assets/characters/gavin/Gavin_SpriteSheet.webp';
import gustavSheet    from '../assets/characters/gustav/Gustav_SpriteSheet.webp';
import eddySheet      from '../assets/characters/eddy/Eddy_SpriteSheet.webp';
import rackoSheet   from '../assets/characters/top-down_enemies/shooter/Racko_SpriteSheet.webp';
import rhondaSheet  from '../assets/characters/top-down_enemies/shooter/Rhonda_SpriteSheet.webp';
import riccSheet    from '../assets/characters/top-down_enemies/shooter/Ricc_SpriteSheet.webp';
import rittaSheet   from '../assets/characters/top-down_enemies/shooter/Ritta_SpriteSheet.webp';
import blurdSheet   from '../assets/characters/top-down_enemies/tank/Blurd_SpriteSheet.webp';
import brandonSheet from '../assets/characters/top-down_enemies/tank/Brandon_SpriteSheet.webp';
import brimSheet    from '../assets/characters/top-down_enemies/tank/Brim_SpriteSheet.webp';
import brookSheet   from '../assets/characters/top-down_enemies/tank/Brook_SpriteSheet.webp';
import schremySheet from '../assets/characters/top-down_enemies/warrior/Schremy_SpriteSheet.webp';
import skullySheet  from '../assets/characters/top-down_enemies/warrior/Skully_SpriteSheet.webp';
import stirrSheet   from '../assets/characters/top-down_enemies/warrior/Stirr_SpriteSheet.webp';

// ── Constants ──────────────────────────────────────────────────────────────

const TILE    = 48;
const COLS    = 105;
const ROWS    = 18;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;

const PLAYER_SIZE   = 48;
const PLAYER_SPEED  = 220;
const PLAYER_SPRINT = Math.round(PLAYER_SPEED * 1.55);

const STAMINA_MAX         = 100;
const STAMINA_DRAIN       = 40;
const STAMINA_REGEN       = 25;
const STAMINA_REGEN_DELAY = 10000;

const ENEMY_SIZE  = 48;
const ENEMY_BAR_W = 30;
const ENEMY_BAR_H = 4;
const ENEMY_BAR_Y = -6;

const PROJ_SIZE  = 8;
const PROJ_SPEED = 420;

const ENEMY_PROJ_SIZE     = 8;
const ENEMY_PROJ_SPEED    = 200;
const ENEMY_PROJ_DMG      = 10;
const SHOOTER_FIRE_INTERVAL = 2000;

const HEAL_PER_SEC       = 12;
const CAMERA_SCROLL_BASE = 100;

const START_COLS = 4;
const END_COL    = COLS - 1;

const FLOOR   = 0;
const BARRIER = 1;
const HOLE    = 2;
const PUDDLE  = 3;

const SHOOTER_SKINS = ['racko', 'rhonda', 'ricc', 'ritta'] as const;
const TANK_SKINS    = ['blurd', 'brandon', 'brim', 'brook'] as const;
const SWIFT_SKINS   = ['schremy', 'skully', 'stirr'] as const;

// ── Sprite sheets ──────────────────────────────────────────────────────────

const CHAR_SHEET_URLS: Partial<Record<string, string>> = {
  christian: christianSheet,
  gavin:     gavinSheet,
  gustav:    gustavSheet,
  eddy:      eddySheet,
  racko:   rackoSheet,
  rhonda:  rhondaSheet,
  ricc:    riccSheet,
  ritta:   rittaSheet,
  blurd:   blurdSheet,
  brandon: brandonSheet,
  brim:    brimSheet,
  brook:   brookSheet,
  schremy: schremySheet,
  skully:  skullySheet,
  stirr:   stirrSheet,
};

const CHAR_SHEETS = {
  christian: { xCuts: [0, 293, 587, 880],   yCuts: [0, 300, 600, 900,  1200] },
  gavin:     { xCuts: [0, 292, 584, 876],    yCuts: [0, 304, 608, 912,  1216] },
  gustav:    { xCuts: [0, 292, 584, 875],    yCuts: [0, 304, 608, 912,  1216] },
  eddy:      { xCuts: [0, 293, 587, 880],    yCuts: [0, 300, 599, 899,  1198] },
  racko:     { xCuts: [0, 355, 711, 1066],   yCuts: [0, 369, 738, 1106, 1475] },
  rhonda:    { xCuts: [0, 356, 713, 1069],   yCuts: [0, 368, 736, 1104, 1472] },
  ricc:      { xCuts: [0, 355, 710, 1065],   yCuts: [0, 369, 738, 1108, 1477] },
  ritta:     { xCuts: [0, 355, 710, 1065],   yCuts: [0, 369, 738, 1108, 1477] },
  blurd:     { xCuts: [0, 358, 716, 1074],   yCuts: [0, 366, 732, 1099, 1465] },
  brandon:   { xCuts: [0, 358, 716, 1074],   yCuts: [0, 366, 732, 1098, 1464] },
  brim:      { xCuts: [0, 359, 717, 1076],   yCuts: [0, 366, 731, 1096, 1462] },
  brook:     { xCuts: [0, 358, 715, 1073],   yCuts: [0, 366, 732, 1099, 1465] },
  schremy:   { xCuts: [0, 362, 724, 1086],   yCuts: [0, 362, 724, 1086, 1448] },
  skully:    { xCuts: [0, 362, 724, 1086],   yCuts: [0, 362, 724, 1086, 1448] },
  stirr:     { xCuts: [0, 362, 724, 1086],   yCuts: [0, 362, 724, 1086, 1448] },
} as const;
type CharSheetKey = keyof typeof CHAR_SHEETS;

// ── Helpers ────────────────────────────────────────────────────────────────

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Rect { x: number; y: number; w: number; h: number }

interface ServerPlayer {
  playerId: number;
  username: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  skin: string;
}

interface ServerEnemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  type: 'SHOOTER' | 'TANK' | 'SWIFT';
}

interface Projectile {
  x: number; y: number;
  vx: number; vy: number;
  img: Phaser.GameObjects.Image;
}

interface EnemyProjectile {
  x: number; y: number;
  vx: number; vy: number;
  img: Phaser.GameObjects.Image;
}

interface PlayerSprite {
  img: Phaser.GameObjects.Sprite;
  nameLabel: Phaser.GameObjects.Text;
  lastDir: string;
  skin: CharSheetKey;
  renderX: number;
  renderY: number;
}

interface EnemySprite {
  img: Phaser.GameObjects.Sprite;
  skinKey: CharSheetKey;
  lastDir: string;
  hpBar: Phaser.GameObjects.Graphics;
  renderX: number;
  renderY: number;
  shootTimer: number;
}

export interface MultiplayerRunInitData {
  grid: number[][];
  enemies: ServerEnemy[];
  players: ServerPlayer[];
  level: number;
  mapKey: string;
}

// ── Scene ──────────────────────────────────────────────────────────────────

export class MultiplayerRunScene extends Phaser.Scene {

  // Init data (received from server at run:start / run:level_complete)
  private grid: number[][] = [];
  private serverEnemies: ServerEnemy[] = [];
  private serverPlayers: ServerPlayer[] = [];
  private level = 1;
  private mapKey = 'sewers';

  // Local player state
  private myPlayerId  = 0;
  private localX      = TILE * 2;
  private localY      = Math.floor(ROWS / 2) * TILE;
  private localHp     = 100;
  private maxHp       = 100;
  private localAlive  = true;
  private lastDir     = 'down';
  private spectating  = false;
  private endReached  = false;
  private done        = false;
  private sidebarNavHandler: EventListener | null = null;
  private isShowingQuitDialog = false;

  // Stamina
  private stamina          = STAMINA_MAX;
  private maxStamina       = STAMINA_MAX;
  private sprinting        = false;
  private lastSprintTime   = -STAMINA_REGEN_DELAY;

  // Ammo
  private bulletDamage     = 10;
  private maxAmmo          = 10;
  private ammo             = 10;
  private reloading        = false;
  private lastShootTime    = 0;
  private fireRateLevel    = 1;
  private reloadTimeLevel  = 1;
  private hasNoReloadUpgrade = false;
  private readonly SHOOT_CD  = 300;

  // World geometry
  private barrierRects: Rect[] = [];
  private holeRects:    Rect[] = [];
  private puddleRects:  Rect[] = [];
  private endZone: Rect = { x: 0, y: 0, w: 0, h: 0 };

  // Sprites
  private playerSprites = new Map<number, PlayerSprite>();
  private enemySprites  = new Map<number, EnemySprite>();
  private projectiles: Projectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];

  // Input
  private cursors!:   Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!:      Phaser.Input.Keyboard.Key;
  private keyA!:      Phaser.Input.Keyboard.Key;
  private keyS!:      Phaser.Input.Keyboard.Key;
  private keyD!:      Phaser.Input.Keyboard.Key;
  private keyShift!:  Phaser.Input.Keyboard.Key;

  // HUD
  private hudContainer!:  Phaser.GameObjects.Container;
  private hpBar!:         Phaser.GameObjects.Graphics;
  private staminaBar!:    Phaser.GameObjects.Graphics;
  private hpLabel!:       Phaser.GameObjects.Text;
  private ammoText!:      Phaser.GameObjects.Text;
  private levelText!:     Phaser.GameObjects.Text;
  private reloadingText!: Phaser.GameObjects.Text;
  private levelIndicator!: Phaser.GameObjects.Text;
  private avatarMask!:    Phaser.GameObjects.Graphics;

  // Camera
  private scrollX   = 0;
  private leftStart = false;

  constructor() { super({ key: 'MultiplayerRunScene' }); }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  init(data: Partial<MultiplayerRunInitData>) {
    this.grid          = data.grid    ?? [];
    this.serverEnemies = (data.enemies ?? []) as ServerEnemy[];
    this.serverPlayers = (data.players ?? []) as ServerPlayer[];
    this.level         = data.level   ?? 1;
    this.mapKey        = data.mapKey  ?? Object.keys(MAP_CONFIGS)[0]!;
    this.myPlayerId    = Number(getPlayer()?.id ?? 0);

    this.localAlive           = true;
    this.spectating           = false;
    this.endReached           = false;
    this.done                 = false;
    this.isShowingQuitDialog  = false;
    this.scrollX          = 0;
    this.leftStart        = false;
    this.lastDir          = 'down';
    this.projectiles      = [];
    this.enemyProjectiles = [];
    this.barrierRects = [];
    this.holeRects    = [];
    this.puddleRects  = [];
    this.playerSprites.clear();
    this.enemySprites.clear();

    this.maxHp             = (getPlayer()?.maxHp as number | undefined) ?? 100;
    this.localHp           = this.maxHp;
    this.maxStamina        = STAMINA_MAX;
    this.stamina           = this.maxStamina;
    this.sprinting         = false;
    this.lastSprintTime    = -STAMINA_REGEN_DELAY;
    this.bulletDamage      = (getPlayer()?.bulletDamage as number | undefined) ?? 10;
    this.fireRateLevel     = (getPlayer()?.fireRate as number | undefined) ?? 1;
    this.reloadTimeLevel   = (getPlayer()?.reloadTime as number | undefined) ?? 1;
    this.hasNoReloadUpgrade = (getPlayer()?.hasNoReload as boolean | undefined) ?? false;
    this.maxAmmo           = (getPlayer()?.magSize as number | undefined) ?? 10;
    this.ammo              = this.maxAmmo;
    this.reloading         = false;
    this.lastShootTime     = 0;

    const me = this.serverPlayers.find(p => p.playerId === this.myPlayerId);
    if (me) { this.localX = me.x; this.localY = me.y; }
    else     { this.localX = TILE * 2; this.localY = Math.floor(ROWS / 2) * TILE; }
  }

  preload() {
    showLoadingScreen(this);

    for (const [key, url] of Object.entries(CHAR_SHEET_URLS)) {
      if (url && !this.textures.exists(key)) this.load.image(key, url);
    }
    if (!this.textures.exists('chris-avatar'))
      this.load.image('chris-avatar', chrisAvatarUrl);

    const mapCfg = MAP_CONFIGS[this.mapKey] ?? Object.values(MAP_CONFIGS)[0]!;
    if (!this.textures.exists(mapCfg.key))
      this.load.spritesheet(mapCfg.key, mapCfg.url, {
        frameWidth: mapCfg.tileWidth, frameHeight: mapCfg.tileHeight,
      });
    if (!this.textures.exists(mapCfg.bgKey))
      this.load.image(mapCfg.bgKey, mapCfg.bgUrl);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.generateTextures();
    this.initAllAnimations();
    this.buildWorld();
    this.createPlayerSprites();
    this.createEnemySprites();
    this.buildHud();
    this.setupInput();
    this.setupSocketListeners();

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = Phaser.Math.Clamp(
      this.localY + PLAYER_SIZE / 2 - this.cameras.main.height / 2,
      0, WORLD_H - this.cameras.main.height,
    );

    // Pause button (top-right)
    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(0x000000, 0.7);
    pauseBg.fillRoundedRect(-45, -18, 90, 36, 6);
    const pauseLabel = this.add.text(0, 0, 'PAUSE', {
      fontSize: '22px', color: '#feec00', fontStyle: 'bold',
    }).setOrigin(0.5);
    const pauseBtn = this.add.container(1140, 30, [pauseBg, pauseLabel]);
    pauseBtn.setScrollFactor(0).setDepth(1000).setSize(90, 36).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => {
      if (this.scene.isActive('PauseScene')) return;
      this.scene.launch('PauseScene', { returnScene: 'MultiplayerRunScene' });
      this.scene.pause();
    });

    // ESC key pause
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      if (this.scene.isActive('PauseScene')) return;
      this.scene.launch('PauseScene', { returnScene: 'MultiplayerRunScene' });
      this.scene.bringToTop('PauseScene');
      this.scene.pause();
    });

    // Level indicator (top-center)
    const cw = this.cameras.main.width;
    this.levelIndicator = this.add.text(cw / 2, 30, `Level ${this.level} | MULTIPLAYER`, {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '22px', color: '#c0ccd8',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15);

    // Sidebar navigation guard — show quit confirmation before leaving multiplayer run
    const onSidebarNavRequest = ((e: Event) => {
      if (this.isShowingQuitDialog) return;
      this.isShowingQuitDialog = true;
      const target = (e as CustomEvent<{ target: string }>).detail.target;
      const cx = this.cameras.main.centerX;
      const cy = this.cameras.main.centerY;
      const W  = this.cameras.main.width;
      const H  = this.cameras.main.height;

      const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.7)
        .setDepth(9999).setScrollFactor(0);
      const boxBg = this.add.graphics().setDepth(10000).setScrollFactor(0);
      boxBg.fillStyle(0x1a1a1a, 0.9);
      boxBg.fillRoundedRect(cx - 200, cy - 100, 400, 200, 12);
      const promptText = this.add.text(cx, cy - 48, 'Leave multiplayer match?', {
        fontSize: '26px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
      const subText = this.add.text(cx, cy - 10, 'You will be returned to the lobby', {
        fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
      const yesBtn = this.add.text(cx - 75, cy + 58, 'YES', {
        fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
        backgroundColor: '#8b0000', padding: { x: 30, y: 10 },
      }).setOrigin(0.5).setDepth(10001).setScrollFactor(0).setInteractive({ useHandCursor: true });
      const noBtn = this.add.text(cx + 75, cy + 58, 'NO', {
        fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
        backgroundColor: '#006400', padding: { x: 30, y: 10 },
      }).setOrigin(0.5).setDepth(10001).setScrollFactor(0).setInteractive({ useHandCursor: true });
      const destroyDialog = () => {
        overlay.destroy(); boxBg.destroy();
        promptText.destroy(); subText.destroy();
        yesBtn.destroy(); noBtn.destroy();
      };
      yesBtn.on('pointerup', () => {
        destroyDialog();
        this.scene.stop();
        this.game.scene.start(target);
      });
      noBtn.on('pointerup', () => {
        destroyDialog();
        this.isShowingQuitDialog = false;
      });
    }) as EventListener;

    this.sidebarNavHandler = onSidebarNavRequest;
    window.addEventListener('sidebar-nav-request', this.sidebarNavHandler);

    this.events.on('shutdown', () => {
      this.time.removeAllEvents();
      this.tweens.killAll();
      this.input.keyboard?.removeAllKeys(true);
      this.input.removeAllListeners();
      if (this.sidebarNavHandler) {
        window.removeEventListener('sidebar-nav-request', this.sidebarNavHandler);
        this.sidebarNavHandler = null;
      }
    });
  }

  // ── Textures ──────────────────────────────────────────────────────────────

  private generateTextures() {
    if (!this.textures.exists('mp-proj')) {
      const g = this.make.graphics();
      g.fillStyle(0x44aaff);
      g.fillCircle(PROJ_SIZE / 2, PROJ_SIZE / 2, PROJ_SIZE / 2);
      g.generateTexture('mp-proj', PROJ_SIZE, PROJ_SIZE);
      g.destroy();
    }
    if (!this.textures.exists('mp-enemy-proj')) {
      const g = this.make.graphics();
      g.fillStyle(0xff4444);
      g.fillCircle(ENEMY_PROJ_SIZE / 2, ENEMY_PROJ_SIZE / 2, ENEMY_PROJ_SIZE / 2);
      g.generateTexture('mp-enemy-proj', ENEMY_PROJ_SIZE, ENEMY_PROJ_SIZE);
      g.destroy();
    }
  }

  // ── Animations ────────────────────────────────────────────────────────────

  private initAllAnimations() {
    for (const key of Object.keys(CHAR_SHEETS) as CharSheetKey[]) {
      if (this.textures.exists(key)) {
        this.sliceCharSheetFrames(key);
        this.createWalkAnimations(key);
      }
    }
  }

  private sliceCharSheetFrames(skinKey: CharSheetKey) {
    const sheet = CHAR_SHEETS[skinKey];
    const texture = this.textures.get(skinKey);
    const dirs = ['down', 'left', 'right', 'up'];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const fn = `${skinKey}-walk-${dirs[row]}-${col}`;
        if (!texture.has(fn)) {
          texture.add(fn, 0,
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
          frames: [0, 1, 2].map(j => ({ key: skinKey, frame: `${skinKey}-walk-${dir}-${j}` })),
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }

  // ── World ─────────────────────────────────────────────────────────────────

  private buildWorld() {
    const mapCfg = MAP_CONFIGS[this.mapKey] ?? Object.values(MAP_CONFIGS)[0]!;
    const { key: mapKey, frames: mapFrames } = mapCfg;

    const tex = this.textures.get(mapKey);
    const reg = (name: string, r: TileRect) => {
      if (!tex.has(name)) tex.add(name, 0, r.x, r.y, r.w, r.h);
    };
    reg(`${mapKey}-grass`,   mapFrames.grass);
    reg(`${mapKey}-barrier`, mapFrames.barrier);
    reg(`${mapKey}-hole`,    mapFrames.hole);
    reg(`${mapKey}-puddle`,  mapFrames.puddle);

    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, mapKey, `${mapKey}-grass`)
      .setOrigin(0, 0).setDepth(0)
      .setTileScale(TILE / mapFrames.grass.w, TILE / mapFrames.grass.h);

    const gfx = this.add.graphics().setDepth(1);
    gfx.fillStyle(0x336677, 0.3);
    gfx.fillRect(0, 0, START_COLS * TILE, WORLD_H);
    gfx.fillStyle(0x33cc33, 0.2);
    gfx.fillRect(END_COL * TILE, 0, TILE, WORLD_H);

    this.endZone = { x: END_COL * TILE, y: 0, w: (COLS - END_COL) * TILE, h: WORLD_H };

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = this.grid[row]?.[col] ?? FLOOR;
        const px   = col * TILE;
        const py   = row * TILE;

        if (cell === BARRIER) {
          this.add.image(px, py, mapKey, `${mapKey}-barrier`)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(2);
          this.barrierRects.push({ x: px, y: py, w: TILE, h: TILE });

        } else if (cell === HOLE) {
          const nb = this.tileNeighbors(row, col, HOLE);
          this.add.image(px, py, mapKey, `${mapKey}-hole`)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(2);
          this.holeRects.push({
            x: nb.w ? px       : px + 8,
            y: nb.n ? py       : py + 8,
            w: TILE - (nb.w ? 0 : 8) - (nb.e ? 0 : 8),
            h: TILE - (nb.n ? 0 : 8) - (nb.s ? 0 : 8),
          });

        } else if (cell === PUDDLE) {
          this.add.image(px, py, mapKey, `${mapKey}-puddle`)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(2);
          this.puddleRects.push({ x: px, y: py, w: TILE, h: TILE });
        }
      }
    }
  }

  private tileNeighbors(row: number, col: number, type: number) {
    return {
      n: row > 0        && (this.grid[row - 1]?.[col] ?? FLOOR) === type,
      s: row < ROWS - 1 && (this.grid[row + 1]?.[col] ?? FLOOR) === type,
      w: col > 0        && (this.grid[row]?.[col - 1] ?? FLOOR) === type,
      e: col < COLS - 1 && (this.grid[row]?.[col + 1] ?? FLOOR) === type,
    };
  }

  // ── Sprites ───────────────────────────────────────────────────────────────

  private createPlayerSprites() {
    this.serverPlayers.forEach(p => {
      const skin  = (p.skin in CHAR_SHEETS ? p.skin : 'christian') as CharSheetKey;
      const scale = PLAYER_SIZE / (CHAR_SHEETS[skin].xCuts[1] - CHAR_SHEETS[skin].xCuts[0]);
      const img   = this.add.sprite(p.x, p.y, skin, `${skin}-walk-down-1`)
        .setOrigin(0, 0).setDepth(5).setScale(scale);
      img.play(`${skin}-walk-down`);

      const nameLabel = this.add.text(p.x + PLAYER_SIZE / 2, p.y - 12, p.username, {
        fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#ffffff',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(6);

      this.playerSprites.set(p.playerId, { img, nameLabel, lastDir: 'down', skin, renderX: p.x, renderY: p.y });
    });
  }

  private createEnemySprites() {
    this.serverEnemies.forEach(e => {
      const pool   = e.type === 'TANK' ? TANK_SKINS : e.type === 'SWIFT' ? SWIFT_SKINS : SHOOTER_SKINS;
      const skinKey = pool[Math.floor(Math.random() * pool.length)] as CharSheetKey;
      const eSheet = CHAR_SHEETS[skinKey];
      const scale  = ENEMY_SIZE / (eSheet.xCuts[1] - eSheet.xCuts[0]);
      const img    = this.add.sprite(e.x, e.y, skinKey, `${skinKey}-walk-down-1`)
        .setOrigin(0, 0).setDepth(4).setScale(scale);
      img.play(`${skinKey}-walk-down`);

      const hpBar = this.add.graphics().setDepth(5);
      this.drawEnemyBar(e.x, e.y, e.hp / e.maxHp, hpBar);
      this.enemySprites.set(e.id, { img, skinKey, lastDir: 'down', hpBar, renderX: e.x, renderY: e.y, shootTimer: 0 });
    });
  }

  private drawEnemyBar(ex: number, ey: number, ratio: number, bar: Phaser.GameObjects.Graphics) {
    const bx = ex + (ENEMY_SIZE - ENEMY_BAR_W) / 2;
    const by = ey + ENEMY_BAR_Y;
    bar.clear();
    bar.fillStyle(0x333333);
    bar.fillRect(bx, by, ENEMY_BAR_W, ENEMY_BAR_H);
    bar.fillStyle(0xcc2222);
    bar.fillRect(bx, by, ENEMY_BAR_W * Math.max(0, ratio), ENEMY_BAR_H);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  private buildHud() {
    const BAR_X = 75;

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.55);
    panel.fillRoundedRect(0, 0, 340, 140, 10);

    const avatarOutline = this.add.graphics();
    avatarOutline.lineStyle(2, 0x8899cc);
    avatarOutline.strokeCircle(35, 55, 30);

    const avatarSprite = this.add.image(35, 55, 'chris-avatar');
    avatarSprite.setDisplaySize(56, 56);

    this.avatarMask = this.add.graphics();
    this.avatarMask.setScrollFactor(0);
    const mask = this.avatarMask.createGeometryMask();
    avatarSprite.setMask(mask);
    this.avatarMask.fillStyle(0xffffff);
    this.avatarMask.fillCircle(10 + 35, 10 + 55, 30);

    this.hpBar      = this.add.graphics();
    this.staminaBar = this.add.graphics();
    this.hpLabel    = this.add.text(BAR_X, 10, '', { fontSize: '14px', color: '#dddddd' });
    this.levelText  = this.add.text(170, -20, '', { fontSize: '13px', color: '#c0ccd8' });
    this.ammoText   = this.add.text(BAR_X, 100, '', { fontSize: '14px', color: '#aaddff' });

    this.hudContainer = this.add.container(10, 10, [
      panel, avatarSprite, avatarOutline,
      this.hpBar, this.staminaBar, this.hpLabel, this.levelText, this.ammoText,
    ]);
    this.hudContainer.setScrollFactor(0).setDepth(10);

    this.reloadingText = this.add.text(0, 0, 'Reloading...', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '16px', color: '#ffaa00',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(15).setVisible(false);

    this.refreshHud();
  }

  private refreshHud() {
    if (!this.hpBar) return;
    const BAR_X = 75;
    const BAR_W = 248;

    const hpRatio = Math.max(0, this.localHp / this.maxHp);
    const hpCol   = hpRatio > 0.5 ? 0x44cc66 : hpRatio > 0.25 ? 0xffaa00 : 0xff3333;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRoundedRect(BAR_X, 30, BAR_W, 16, 3);
    this.hpBar.fillStyle(hpCol);
    this.hpBar.fillRoundedRect(BAR_X, 30, BAR_W * hpRatio, 16, 3);
    this.hpLabel.setText(`HP  ${Math.ceil(this.localHp)} / ${this.maxHp}`);

    const stRatio = this.stamina / this.maxStamina;
    const stCol   = this.sprinting ? 0xffcc00 : 0x5599ff;
    this.staminaBar.clear();
    this.staminaBar.fillStyle(0x333333);
    this.staminaBar.fillRoundedRect(BAR_X, 54, BAR_W, 10, 2);
    this.staminaBar.fillStyle(stCol);
    this.staminaBar.fillRoundedRect(BAR_X, 54, BAR_W * stRatio, 10, 2);

    this.levelText.setText(`Level ${this.level}`);

    if (this.hasNoReloadUpgrade) {
      this.ammoText.setText('Ammo: ∞');
    } else {
      this.ammoText.setText(`Ammo: ${this.ammo}/${this.maxAmmo}`);
    }
    this.ammoText.setColor(this.reloading ? '#ffaa00' : '#aaddff');

    if (this.levelIndicator) this.levelIndicator.setText(`Level ${this.level} | MULTIPLAYER`);
    if (this.reloadingText?.visible) {
      this.reloadingText.setPosition(this.localX + PLAYER_SIZE / 2, this.localY - 6);
    }
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private setupInput() {
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.keyW     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyShift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (!this.localAlive || this.spectating) return;
      if (this.reloading) return;
      if (this.ammo <= 0) { this.startReload(); return; }
      if (this.time.now - this.lastShootTime < this.SHOOT_CD / this.fireRateLevel) return;
      this.lastShootTime = this.time.now;
      this.ammo--;
      this.fireProjectile(ptr);
      if (this.ammo <= 0) this.startReload();
    });
  }

  private startReload() {
    if (this.reloading) return;
    if (this.hasNoReloadUpgrade) { this.ammo = this.maxAmmo; return; }
    this.reloading = true;
    this.reloadingText.setPosition(this.localX + PLAYER_SIZE / 2, this.localY - 6);
    this.reloadingText.setVisible(true);
    const duration = 2000 / this.reloadTimeLevel;
    this.time.delayedCall(duration, () => {
      this.ammo = this.maxAmmo;
      this.reloading = false;
      this.reloadingText.setVisible(false);
    });
  }

  private fireProjectile(ptr: Phaser.Input.Pointer) {
    const cam = this.cameras.main;
    const wx  = ptr.x / cam.zoom + cam.scrollX;
    const wy  = ptr.y / cam.zoom + cam.scrollY;
    const cx  = this.localX + PLAYER_SIZE / 2;
    const cy  = this.localY + PLAYER_SIZE / 2;
    const raw = Math.atan2(wy - cy, wx - cx);
    const ang = Math.round(raw / (Math.PI / 4)) * (Math.PI / 4);

    const proj: Projectile = {
      x:  cx - PROJ_SIZE / 2,
      y:  cy - PROJ_SIZE / 2,
      vx: Math.cos(ang) * PROJ_SPEED,
      vy: Math.sin(ang) * PROJ_SPEED,
      img: this.add.image(cx, cy, 'mp-proj').setOrigin(0.5).setDepth(10),
    };
    this.projectiles.push(proj);
  }

  // ── Socket ────────────────────────────────────────────────────────────────

  private setupSocketListeners() {
    const socket = getSocket();
    socket.off('run:tick');
    socket.off('run:enemy_died');
    socket.off('run:player_died');
    socket.off('run:ended');
    socket.off('run:level_complete');

    socket.on('run:tick', (data: {
      enemies: { id: number; x: number; y: number; hp: number; alive: boolean }[];
      players: ServerPlayer[];
    }) => {
      data.enemies.forEach(e => {
        const existing = this.serverEnemies.find(se => se.id === e.id);
        if (existing) { existing.x = e.x; existing.y = e.y; existing.hp = e.hp; existing.alive = e.alive; }
      });
      data.players.forEach(p => {
        if (p.playerId === this.myPlayerId) return;
        const existing = this.serverPlayers.find(sp => sp.playerId === p.playerId);
        if (existing) { existing.x = p.x; existing.y = p.y; existing.hp = p.hp; existing.alive = p.alive; }
      });
    });

    socket.on('run:enemy_died', (data: { enemyId: number }) => {
      const e = this.serverEnemies.find(se => se.id === data.enemyId);
      if (e) e.alive = false;
      const sprite = this.enemySprites.get(data.enemyId);
      if (sprite) {
        sprite.img.destroy();
        sprite.hpBar.destroy();
        this.enemySprites.delete(data.enemyId);
      }
    });

    socket.on('run:player_died', (data: { playerId: number }) => {
      if (data.playerId === this.myPlayerId && this.localAlive) {
        this.localAlive = false;
        this.spectating = true;
        this.showSpectator();
      }
      const sprite = this.playerSprites.get(data.playerId);
      if (sprite) {
        sprite.img.setTint(0xff0000);
        sprite.img.anims.stop();
        sprite.img.setAlpha(0.4);
      }
    });

    socket.on('run:ended', (data: { level: number; allDead: boolean }) => {
      const msg = data.allDead ? 'All players died...' : `Level ${data.level} cleared!`;
      this.showEndScreen(msg, () => { transitionTo(this, 'MultiplayerLobbyScene'); });
    });

    socket.on('run:level_complete', (data: {
      level: number;
      grid: number[][];
      enemies: ServerEnemy[];
      players: ServerPlayer[];
    }) => {
      transitionTo(this, 'MultiplayerRunScene', {
        grid:    data.grid,
        enemies: data.enemies,
        players: data.players,
        level:   data.level,
        mapKey:  this.mapKey,
      });
    });
  }

  // ── Update loop ───────────────────────────────────────────────────────────

  update(time: number, delta: number) {
    if (this.done) return;
    const dt = delta / 1000;

    if (this.localAlive) {
      this.handleLocalMovement(time, delta);
      this.updateProjectiles(dt);
      this.checkHoleDeath();
      this.checkPuddle(dt);
      this.checkEndZone();
    }

    this.updateEnemyShooters(dt);
    this.updateEnemyProjectiles(dt);
    this.syncSpritePositions(dt);
    this.scrollCamera(dt);
    this.refreshHud();
  }

  // ── Movement ──────────────────────────────────────────────────────────────

  private handleLocalMovement(time: number, delta: number) {
    const dt = delta / 1000;

    const movingX = this.cursors.left.isDown  || this.keyA.isDown ||
                    this.cursors.right.isDown || this.keyD.isDown;
    const movingY = this.cursors.up.isDown    || this.keyW.isDown ||
                    this.cursors.down.isDown  || this.keyS.isDown;

    this.sprinting = this.keyShift.isDown && this.stamina > 0 && (movingX || movingY);
    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * dt);
      this.lastSprintTime = time;
    } else if (time - this.lastSprintTime >= STAMINA_REGEN_DELAY) {
      this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN * dt);
    }

    const speed = this.sprinting ? PLAYER_SPRINT : PLAYER_SPEED;
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.keyA.isDown) dx = -speed * dt;
    if (this.cursors.right.isDown || this.keyD.isDown) dx =  speed * dt;
    if (this.cursors.up.isDown    || this.keyW.isDown) dy = -speed * dt;
    if (this.cursors.down.isDown  || this.keyS.isDown) dy =  speed * dt;

    this.localX = Phaser.Math.Clamp(this.localX + dx, 0, WORLD_W - PLAYER_SIZE);
    if (dx !== 0) this.resolveBarriers(dx, 0);
    this.localY = Phaser.Math.Clamp(this.localY + dy, 0, WORLD_H - PLAYER_SIZE);
    if (dy !== 0) this.resolveBarriers(0, dy);

    // Don't let local player outrun the right edge of the camera
    const cam = this.cameras.main;
    const rightLimit = cam.scrollX + cam.width - PLAYER_SIZE;
    if (this.localX > rightLimit) this.localX = rightLimit;

    // Update sprite direction + animation
    const mySprite = this.playerSprites.get(this.myPlayerId);
    if (mySprite) {
      if (dx !== 0 || dy !== 0) {
        const dir = Math.abs(dx) >= Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');
        if (dir !== mySprite.lastDir || !mySprite.img.anims.isPlaying) {
          mySprite.lastDir = dir;
          mySprite.img.play(`${mySprite.skin}-walk-${dir}`, true);
        }
        mySprite.img.anims.timeScale = this.sprinting ? 1.8 : 1;
        this.lastDir = dir;
      } else {
        mySprite.img.anims.stop();
        mySprite.img.setFrame(`${mySprite.skin}-walk-${this.lastDir}-1`);
      }
    }

    getSocket().emit('run:move', { x: this.localX, y: this.localY });

    if (!this.leftStart && this.localX > START_COLS * TILE) this.leftStart = true;
  }

  private resolveBarriers(dx: number, dy: number) {
    for (const b of this.barrierRects) {
      if (!rectsOverlap(this.localX, this.localY, PLAYER_SIZE, PLAYER_SIZE, b.x, b.y, b.w, b.h)) continue;
      if (dx > 0) this.localX = b.x - PLAYER_SIZE;
      if (dx < 0) this.localX = b.x + b.w;
      if (dy > 0) this.localY = b.y - PLAYER_SIZE;
      if (dy < 0) this.localY = b.y + b.h;
    }
  }

  // ── Projectiles ───────────────────────────────────────────────────────────

  private updateProjectiles(dt: number) {
    const socket = getSocket();
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < 0 || p.x + PROJ_SIZE > WORLD_W || p.y < 0 || p.y + PROJ_SIZE > WORLD_H) {
        p.img.destroy(); this.projectiles.splice(i, 1); continue;
      }

      let hit = false;
      for (const b of this.barrierRects) {
        if (rectsOverlap(p.x, p.y, PROJ_SIZE, PROJ_SIZE, b.x, b.y, b.w, b.h)) { hit = true; break; }
      }
      if (!hit) {
        for (const e of this.serverEnemies) {
          if (!e.alive) continue;
          if (rectsOverlap(p.x, p.y, PROJ_SIZE, PROJ_SIZE, e.x, e.y, ENEMY_SIZE, ENEMY_SIZE)) {
            socket.emit('run:hit_enemy', { enemyId: e.id, damage: this.bulletDamage });
            hit = true; break;
          }
        }
      }

      if (hit) {
        p.img.destroy(); this.projectiles.splice(i, 1);
      } else {
        p.img.setPosition(p.x + PROJ_SIZE / 2, p.y + PROJ_SIZE / 2);
      }
    }
  }

  // ── Enemy shooting ────────────────────────────────────────────────────────

  private updateEnemyShooters(dt: number) {
    if (!this.localAlive) return;
    for (const e of this.serverEnemies) {
      if (!e.alive || e.type !== 'SHOOTER') continue;
      const sprite = this.enemySprites.get(e.id);
      if (!sprite) continue;
      sprite.shootTimer += dt * 1000;
      if (sprite.shootTimer < SHOOTER_FIRE_INTERVAL) continue;
      sprite.shootTimer = 0;
      const ex  = sprite.renderX + ENEMY_SIZE / 2;
      const ey  = sprite.renderY + ENEMY_SIZE / 2;
      const px  = this.localX + PLAYER_SIZE / 2;
      const py  = this.localY + PLAYER_SIZE / 2;
      const ang = Math.atan2(py - ey, px - ex);
      this.enemyProjectiles.push({
        x:   ex - ENEMY_PROJ_SIZE / 2,
        y:   ey - ENEMY_PROJ_SIZE / 2,
        vx:  Math.cos(ang) * ENEMY_PROJ_SPEED,
        vy:  Math.sin(ang) * ENEMY_PROJ_SPEED,
        img: this.add.image(ex, ey, 'mp-enemy-proj').setOrigin(0.5).setDepth(10),
      });
    }
  }

  private updateEnemyProjectiles(dt: number) {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      let remove = false;

      if (p.x < 0 || p.x + ENEMY_PROJ_SIZE > WORLD_W || p.y < 0 || p.y + ENEMY_PROJ_SIZE > WORLD_H) {
        remove = true;
      }

      if (!remove) {
        for (const b of this.barrierRects) {
          if (rectsOverlap(p.x, p.y, ENEMY_PROJ_SIZE, ENEMY_PROJ_SIZE, b.x, b.y, b.w, b.h)) {
            remove = true; break;
          }
        }
      }

      if (!remove && this.localAlive) {
        if (rectsOverlap(p.x, p.y, ENEMY_PROJ_SIZE, ENEMY_PROJ_SIZE, this.localX, this.localY, PLAYER_SIZE, PLAYER_SIZE)) {
          this.localHp = Math.max(0, this.localHp - ENEMY_PROJ_DMG);
          remove = true;
          if (this.localHp <= 0) {
            this.localAlive = false;
            this.spectating = true;
            getSocket().emit('run:player_died');
            this.showSpectator();
          }
        }
      }

      if (remove) {
        p.img.destroy();
        this.enemyProjectiles.splice(i, 1);
      } else {
        p.img.setPosition(p.x + ENEMY_PROJ_SIZE / 2, p.y + ENEMY_PROJ_SIZE / 2);
      }
    }
  }

  // ── World checks ──────────────────────────────────────────────────────────

  private checkHoleDeath() {
    const cx = this.localX + PLAYER_SIZE / 2;
    const cy = this.localY + PLAYER_SIZE / 2;
    for (const h of this.holeRects) {
      if (cx > h.x && cx < h.x + h.w && cy > h.y && cy < h.y + h.h) {
        this.localAlive = false;
        this.spectating = true;
        getSocket().emit('run:player_died');
        this.showSpectator();
        return;
      }
    }
  }

  private checkPuddle(dt: number) {
    const cx = this.localX + PLAYER_SIZE / 2;
    const cy = this.localY + PLAYER_SIZE / 2;
    for (const p of this.puddleRects) {
      if (cx > p.x && cx < p.x + p.w && cy > p.y && cy < p.y + p.h) {
        this.localHp = Math.min(this.maxHp, this.localHp + HEAL_PER_SEC * dt);
        break;
      }
    }
  }

  private checkEndZone() {
    if (this.endReached) return;
    const ez = this.endZone;
    if (rectsOverlap(this.localX, this.localY, PLAYER_SIZE, PLAYER_SIZE, ez.x, ez.y, ez.w, ez.h)) {
      this.endReached = true;
      getSocket().emit('run:reached_end');
    }
  }

  // ── Sprite sync ───────────────────────────────────────────────────────────

  private syncSpritePositions(dt: number) {
    // Local player — direct, no interpolation.
    // Also pin renderX/renderY and serverPlayers entry to localX/localY so that
    // if the remote lerp loop ever processes this player (e.g. ID type mismatch),
    // the lerp computes a zero delta and setPosition lands at localX/localY.
    const mySprite = this.playerSprites.get(this.myPlayerId);
    if (mySprite) {
      mySprite.img.setPosition(this.localX, this.localY);
      mySprite.nameLabel.setPosition(this.localX + PLAYER_SIZE / 2, this.localY - 12);
      mySprite.renderX = this.localX;
      mySprite.renderY = this.localY;
    }
    const myData = this.serverPlayers.find(p => p.playerId === this.myPlayerId);
    if (myData) { myData.x = this.localX; myData.y = this.localY; }

    // Lerp factor: frame-rate-independent, catches up to server target within ~2 frames
    const lerpFactor = Math.min(1, 20 * dt);

    // Remote players — lerp rendered position toward server target
    this.serverPlayers.forEach(p => {
      if (p.playerId === this.myPlayerId) return;
      const sprite = this.playerSprites.get(p.playerId);
      if (!sprite) return;

      if (!p.alive) {
        sprite.renderX = p.x;
        sprite.renderY = p.y;
        sprite.img.setPosition(p.x, p.y);
        sprite.nameLabel.setPosition(p.x + PLAYER_SIZE / 2, p.y - 12);
        sprite.img.setAlpha(0.3);
        sprite.img.anims.stop();
        return;
      }

      const prevRX = sprite.renderX;
      const prevRY = sprite.renderY;
      sprite.renderX += (p.x - sprite.renderX) * lerpFactor;
      sprite.renderY += (p.y - sprite.renderY) * lerpFactor;
      sprite.img.setPosition(sprite.renderX, sprite.renderY);
      sprite.nameLabel.setPosition(sprite.renderX + PLAYER_SIZE / 2, sprite.renderY - 12);

      const dx = sprite.renderX - prevRX;
      const dy = sprite.renderY - prevRY;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        const dir = Math.abs(dx) >= Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');
        if (dir !== sprite.lastDir || !sprite.img.anims.isPlaying) {
          sprite.lastDir = dir;
          sprite.img.play(`${sprite.skin}-walk-${dir}`, true);
        }
      } else if (sprite.img.anims.isPlaying) {
        sprite.img.anims.stop();
        sprite.img.setFrame(`${sprite.skin}-walk-${sprite.lastDir}-1`);
      }
    });

    // Enemies — lerp rendered position toward server target
    this.serverEnemies.forEach(e => {
      if (!e.alive) return;
      const sprite = this.enemySprites.get(e.id);
      if (!sprite) return;

      const prevRX = sprite.renderX;
      const prevRY = sprite.renderY;
      sprite.renderX += (e.x - sprite.renderX) * lerpFactor;
      sprite.renderY += (e.y - sprite.renderY) * lerpFactor;
      sprite.img.setPosition(sprite.renderX, sprite.renderY);

      const dx = sprite.renderX - prevRX;
      const dy = sprite.renderY - prevRY;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        const dir = Math.abs(dx) >= Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');
        if (dir !== sprite.lastDir || !sprite.img.anims.isPlaying) {
          sprite.lastDir = dir;
          sprite.img.play(`${sprite.skinKey}-walk-${dir}`, true);
        }
      } else if (sprite.img.anims.isPlaying) {
        sprite.img.anims.stop();
        sprite.img.setFrame(`${sprite.skinKey}-walk-${sprite.lastDir}-1`);
      }

      this.drawEnemyBar(sprite.renderX, sprite.renderY, e.hp / e.maxHp, sprite.hpBar);
    });
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  private scrollCamera(dt: number) {
    const cam  = this.cameras.main;
    const maxX = Math.max(0, WORLD_W - cam.width);
    const maxY = Math.max(0, WORLD_H - cam.height);
    const spd  = CAMERA_SCROLL_BASE * Math.min(2.2, 1 + 0.05 * (this.level - 1));

    if (!this.leftStart) {
      // Follow the local player until they cross into the level
      const trigger = this.localAlive && this.localX > START_COLS * TILE;
      const die     = !this.localAlive; // died before crossing — start scrolling anyway
      if (trigger || die) {
        this.leftStart = true;
        this.scrollX   = cam.scrollX;
      } else {
        cam.scrollX = Phaser.Math.Clamp(this.localX + PLAYER_SIZE / 2 - cam.width  / 2, 0, maxX);
        cam.scrollY = Phaser.Math.Clamp(this.localY + PLAYER_SIZE / 2 - cam.height / 2, 0, maxY);
        return;
      }
    }

    this.scrollX += spd * dt;
    cam.scrollX = Math.min(this.scrollX, maxX);

    // Y: track local player while alive, hold position while spectating
    if (this.localAlive) {
      cam.scrollY = Phaser.Math.Clamp(this.localY + PLAYER_SIZE / 2 - cam.height / 2, 0, maxY);
    }

    // Camera left-edge overtook local player → camera death
    if (this.localAlive && this.localX < cam.scrollX) {
      this.localAlive = false;
      this.spectating = true;
      getSocket().emit('run:player_died');
      this.showSpectator();
    }
  }

  // ── Overlays ──────────────────────────────────────────────────────────────

  private showSpectator() {
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;
    this.add.rectangle(cx, cy, W, H, 0x000000, 0.45).setScrollFactor(0).setDepth(150);
    this.add.text(cx, cy - 20, 'YOU DIED', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '48px', color: '#ff4444',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
    this.add.text(cx, cy + 40, 'SPECTATING', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '22px', color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
  }

  private showEndScreen(msg: string, onDone: () => void) {
    if (this.done) return;
    this.done = true;
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;
    this.add.rectangle(cx, cy, W, H, 0x000000, 0.88).setScrollFactor(0).setDepth(160);
    this.add.text(cx, cy - 50, msg, {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '42px', color: '#feec00',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(161);
    this.add.text(cx, cy + 30, 'Returning to lobby...', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '22px', color: '#c2baba',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(161);
    this.time.delayedCall(3000, onDone);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  shutdown() {
    const socket = getSocket();
    socket.off('run:tick');
    socket.off('run:enemy_died');
    socket.off('run:player_died');
    socket.off('run:ended');
    socket.off('run:level_complete');
  }
}
