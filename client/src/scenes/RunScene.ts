/*
* Santiago Hernandez - A01787550
* Manuel Montero - A01660761
* Yael Ordaz - A01786776
* 
* This is the main script for the RunScene, which handles the core gameplay 
* loop of the endless runner mode in Florida Frenzy. 
* It manages player movement, enemy spawning and behavior, coin collection, 
* level progression, and the duel boss encounter. 
* The scene also communicates with the server to create run records 
* and update player stats.
* 
* - AI was used to help us with sprite handling, and all everglades sprites came from https://opengameart.org/
* - AI was used to handle login check before displaying popups
*/

import Phaser from 'phaser';
import { MAP_CONFIGS, selectMap, type MapConfig, type TileRect } from '../utils/mapConfig.js';
import { completeRun, createRun, getPlayer, unlockLegendaryRunCard } from '../utils/auth.js';
import { fetchCharacterByKey, type CharacterGameData } from '../api/characterApi.js';
import { fetchDeckBootstrap } from '../api/deckApi.js';
import type { DuelBossData } from '../utils/bossTypes.js';
import { fetchRandomDuelBoss } from '../api/enemyApi.js';
import { showLoadingScreen } from '../utils/loadingScreen.js';
import { transitionTo } from '../utils/sceneTransition.js';
import { CHARACTER_VISUALS, resolveCharacterSkinKey, type CharacterSkinKey } from '../utils/characterVisuals.js';

import skawlSheet from '../assets/characters/skawl/Skawl_SpriteSheet.webp';
import rabyzSheet from '../assets/characters/rabyz/Rabyz_SpriteSheet-v2.webp';
import boldearSheet from '../assets/characters/boldear/Boldear_SpriteSheet.webp';

import rackoSheet from '../assets/characters/top-down_enemies/shooter/Racko_SpriteSheet.webp';
import rhondaSheet from '../assets/characters/top-down_enemies/shooter/Rhonda_SpriteSheet.webp';
import riccSheet from '../assets/characters/top-down_enemies/shooter/Ricc_SpriteSheet.webp';
import rittaSheet from '../assets/characters/top-down_enemies/shooter/Ritta_SpriteSheet.webp';
import blurdSheet from '../assets/characters/top-down_enemies/tank/Blurd_SpriteSheet.webp';
import brandonSheet from '../assets/characters/top-down_enemies/tank/Brandon_SpriteSheet.webp';
import brimSheet from '../assets/characters/top-down_enemies/tank/Brim_SpriteSheet.webp';
import brookSheet from '../assets/characters/top-down_enemies/tank/Brook_SpriteSheet.webp';
import schremySheet from '../assets/characters/top-down_enemies/warrior/Schremy_SpriteSheet.webp';
import skullySheet from '../assets/characters/top-down_enemies/warrior/Skully_SpriteSheet.webp';
import stirrSheet from '../assets/characters/top-down_enemies/warrior/Stirr_SpriteSheet.webp';

const TILE    = 48;
const COLS    = 105;
const ROWS    = 18;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;

const KEY_SPR_ENEMY      = 'spr-enemy';
const KEY_SPR_COIN       = 'spr-coin';

const SHOOTER_SKINS = ['racko', 'rhonda', 'ricc', 'ritta'] as const;
const TANK_SKINS    = ['blurd', 'brandon', 'brim', 'brook'] as const;
const SWIFT_SKINS   = ['schremy', 'skully', 'stirr'] as const;
const KEY_SPR_PROJECTILE = 'spr-projectile';
const KEY_SPR_ENEMY_PROJ = 'spr-enemy-proj';


const PLAYER_SIZE   = 48;
const PLAYER_SPEED  = 220;
const PLAYER_SPRINT = Math.round(PLAYER_SPEED * 1.55); // 341; ~1.55× base
const MAX_HP        = 100;

const STAMINA_MAX         = 100;
const STAMINA_DRAIN       = 40;
const STAMINA_REGEN       = 25;
const STAMINA_REGEN_DELAY = 10000;

const ENEMY_SIZE      = 48;
const ENEMY_SPEED     = 113; // was 75; increased 50%
const ENEMY_DPS       = 20;
const ENEMY_HP        = 100;
const ENEMY_COUNT_MIN = 3;
const ENEMY_COUNT_MAX = 6;
const ENEMY_REPATH_MS = 800;
const ENEMY_BAR_W     = 30;
const ENEMY_BAR_H     = 4;
const ENEMY_BAR_Y     = -6;

const SHOOTER_FIRE_INTERVAL = 2000; // ms between shots
const ENEMY_PROJ_SIZE  = 8;
const ENEMY_PROJ_SPEED = 200;
const ENEMY_PROJ_DMG   = 10;

const COIN_SIZE      = 12;
const COIN_COUNT_MIN = 8;
const COIN_COUNT_MAX = 15;
const COIN_COLLECT_R = 24;
const LEGENDARY_DROP_SPAWN_CHANCE = 0.05;

const PROJ_SIZE  = 8;
const PROJ_SPEED = 420;

const HEAL_PER_SEC = 12;

const CAMERA_SCROLL_BASE = 100; // was 90; cap raised to match PLAYER_SPEED (220)

const RUNS_PER_CYCLE = 3;
const END_COL         = COLS - 1;
const START_COLS      = 4;

const FLOOR   = 0;
const BARRIER = 1;
const HOLE    = 2;
const PUDDLE  = 3;

const BARRIER_SEEDS = 22;
const HOLE_SEEDS    = 7;
const PUDDLE_SEEDS  = 2;


function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

interface GridCell { row: number; col: number }

function astar(
  grid: number[][], sr: number, sc: number, er: number, ec: number
): GridCell[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const key = (r: number, c: number) => r * cols + c;

  if (sr === er && sc === ec) return [];

  const gScore   = new Map<number, number>();
  const parent   = new Map<number, number>();
  const openSet  = new Set<number>();
  const closedSet = new Set<number>();

  const sk = key(sr, sc);
  const gk = key(er, ec);
  gScore.set(sk, 0);
  openSet.add(sk);

  const h = (r: number, c: number) => Math.abs(er - r) + Math.abs(ec - c);
  let iters = 0;

  while (openSet.size > 0 && iters < 300) {
    iters++;

    let best = -1;
    let bestF = Infinity;
    for (const n of openSet) {
      const g = gScore.get(n)!;
      const r = Math.floor(n / cols);
      const c = n % cols;
      const f = g + h(r, c);
      if (f < bestF) { bestF = f; best = n; }
    }

    if (best === gk) break;
    openSet.delete(best);
    closedSet.add(best);

    const cr = Math.floor(best / cols);
    const cc = best % cols;
    const cg = gScore.get(best)!;

    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as const) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === BARRIER || grid[nr][nc] === HOLE) continue;

      const nk = key(nr, nc);
      if (closedSet.has(nk)) continue;

      const ng = cg + 1;
      const prev = gScore.get(nk);
      if (prev === undefined || ng < prev) {
        gScore.set(nk, ng);
        parent.set(nk, best);
        openSet.add(nk);
      }
    }
  }

  if (!parent.has(gk)) return [];

  const path: GridCell[] = [];
  let cur = gk;
  while (cur !== sk) {
    path.push({ row: Math.floor(cur / cols), col: cur % cols });
    cur = parent.get(cur)!;
  }
  path.reverse();
  return path;
}

interface Rect { x: number; y: number; w: number; h: number }

const EnemyType = {
  SHOOTER: 'SHOOTER',
  TANK:    'TANK',
  SWIFT:   'SWIFT',
} as const;
type EnemyType = typeof EnemyType[keyof typeof EnemyType];

const CHAR_SHEETS = {
  christian: CHARACTER_VISUALS.christian.run,
  gavin:     CHARACTER_VISUALS.gavin.run,
  gustav:    CHARACTER_VISUALS.gustav.run,
  eddy:      CHARACTER_VISUALS.eddy.run,
  racko:     { xCuts: [0, 355, 711, 1066], yCuts: [0, 369, 738, 1106, 1475] },
  rhonda:    { xCuts: [0, 356, 713, 1069], yCuts: [0, 368, 736, 1104, 1472] },
  ricc:      { xCuts: [0, 355, 710, 1065], yCuts: [0, 369, 738, 1108, 1477] },
  ritta:     { xCuts: [0, 355, 710, 1065], yCuts: [0, 369, 738, 1108, 1477] },
  blurd:     { xCuts: [0, 358, 716, 1074], yCuts: [0, 366, 732, 1099, 1465] },
  brandon:   { xCuts: [0, 358, 716, 1074], yCuts: [0, 366, 732, 1098, 1464] },
  brim:      { xCuts: [0, 359, 717, 1076], yCuts: [0, 366, 731, 1096, 1462] },
  brook:     { xCuts: [0, 358, 715, 1073], yCuts: [0, 366, 732, 1099, 1465] },
  schremy:   { xCuts: [0, 362, 724, 1086], yCuts: [0, 362, 724, 1086, 1448] },
  skully:    { xCuts: [0, 362, 724, 1086], yCuts: [0, 362, 724, 1086, 1448] },
  stirr:     { xCuts: [0, 362, 724, 1086], yCuts: [0, 362, 724, 1086, 1448] },
} as const;
type CharSheetKey = keyof typeof CHAR_SHEETS;

const RUN_BOSS_SHEETS = {
  Skawl: {
    textureKey: 'boss-skawl-run-sheet',
    framePrefix: 'boss-skawl-run',
    xCuts: [0, 299, 597, 896],
    yCuts: [0, 299, 598, 896, 1195],
  },
  Rabyz: {
    textureKey: 'boss-rabyz-run-sheet',
    framePrefix: 'boss-rabyz-run',
    xCuts: [0, 354, 707, 1061],
    yCuts: [0, 371, 742, 1112, 1483],
  },
  Boldear: {
    textureKey: 'boss-boldear-run-sheet',
    framePrefix: 'boss-boldear-run',
    xCuts: [0, 293, 587, 880],
    yCuts: [0, 300, 599, 899, 1198],
  },
} as const;

interface Enemy {
  x: number; y: number;
  hp: number;
  maxHp: number;
  speed: number;
  contactDmgRate: number; // damage/sec on contact; 0 for SHOOTER
  enemyType: EnemyType;
  shootTimer: number;     // ms until next shot (SHOOTER only)
  img: Phaser.GameObjects.Sprite;
  skinKey: string;
  lastDir: string;
  hpBar: Phaser.GameObjects.Graphics;
  pathTimer: number;
  path: GridCell[];
  pathIdx: number;
}

interface Coin {
  x: number; y: number;
  img: Phaser.GameObjects.Image;
  collected: boolean;
  kind: 'coin' | 'legendary';
  legendaryName?: LegendaryDropName;
}

const LEGENDARY_DROPS = [
  { name: 'Crocodile', tint: 0x1f5d2f },
  { name: 'Alligator', tint: 0xd9d9d9 },
  { name: 'Gavial', tint: 0x8b5a2b },
  { name: 'Caiman', tint: 0x7ed957 },
  { name: 'Sarcosuchus', tint: 0xffdf00 },
] as const; // the pool of legendary drops that can be found in runs; each has a unique name and tint color for the coin sprite
type LegendaryDropName = typeof LEGENDARY_DROPS[number]['name'];

interface Projectile {
  x: number; y: number;
  vx: number; vy: number;
  img: Phaser.GameObjects.Image;
}

interface EnemyProjectile {
  x: number; y: number;
  vx: number; vy: number;
  dmg: number;
  img: Phaser.GameObjects.Image;
}

type DeathReason = 'hp' | 'hole' | 'camera';

function getEnemyStats(type: EnemyType, level: number): {
  hp: number; maxHp: number; speed: number; contactDmgRate: number;
} {
  if (type === EnemyType.SHOOTER) {
    const la = level - 1;
    const hp = Math.round(ENEMY_HP * Math.min(3, Math.pow(1.1, la)));
    const speed = ENEMY_SPEED * Math.min(1.5, Math.pow(1.03, la));
    return { hp, maxHp: hp, speed, contactDmgRate: 0 };
  }
  if (type === EnemyType.TANK) {
    const la = Math.max(0, level - 2);
    const hp = Math.round(ENEMY_HP * Math.min(5, 3 * Math.pow(1.15, la)));
    const contactDmgRate = ENEMY_DPS * Math.min(2, Math.pow(1.05, la));
    return { hp, maxHp: hp, speed: ENEMY_SPEED, contactDmgRate };
  }
  // SWIFT
  const la = Math.max(0, level - 3);
  const speed = ENEMY_SPEED * Math.min(2, 1.5 * Math.pow(1.05, la));
  const contactDmgRate = ENEMY_DPS * Math.min(4, 3 * Math.pow(1.03, la));
  return { hp: 1, maxHp: 1, speed, contactDmgRate };
}

function getSpawnPool(level: number): EnemyType[] {
  const r = (t: EnemyType, n: number): EnemyType[] => Array.from({ length: n }, () => t);
  if (level <= 1) return r(EnemyType.SHOOTER, 10);
  if (level === 2) return [...r(EnemyType.SHOOTER, 7), ...r(EnemyType.TANK, 3)];
  return [...r(EnemyType.SHOOTER, 4), ...r(EnemyType.TANK, 2), ...r(EnemyType.SWIFT, 2)];
}

export interface RunData {
  level: number;
  step: number;
  totalCoins: number;
  totalXp: number;
  runId: number;
  selectedBoss?: DuelBossData;
  currentMap?: string;
}

export class RunScene extends Phaser.Scene {
  private availableLegendaryDrops: LegendaryDropName[] = LEGENDARY_DROPS.map(drop => drop.name);

  private px = 0;
  private py = 0;
  private maxHp = MAX_HP;
  private hp = MAX_HP;
  private playerImg!: Phaser.GameObjects.Sprite;
  private lastPlayerDir = 'down';
  private sprinting = false;
  private stamina = STAMINA_MAX; // replaced by this.maxStamina at runtime via init()
  private lastSprintTime = -STAMINA_REGEN_DELAY;

  private activeMap!: MapConfig;

  private level = 0;
  private step = 0;
  private runId = 0;
  private runCreationPromise: Promise<void> = Promise.resolve();
  private totalCoins = 0;
  private totalXp = 0;
  private leftStart = false;
  private done = false;
  private runEnded = false;
  private isShowingQuitDialog = false;
  private sidebarNavHandler: EventListener | null = null;
  private beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    if (this.done) return;
    e.preventDefault();
    e.returnValue = '';
  };
  private timer = 0;
  private coinsCollected = 0;
  private deathReason: DeathReason = 'hp';
  private enemiesKilledThisRun = 0;

  private bulletDamage = 10;
  private fireRateLevel = 1;
  private reloadTimeLevel = 1;
  private hasNoReloadUpgrade = false;
  private maxAmmo = 10;
  private ammo = 10;
  private staminaPoolLevel = 1;
  private staminaRegenLevel = 1;
  private maxStamina = STAMINA_MAX;
  private reloading = false;
  private lastShootTime = 0;
  private reloadingText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private levelIndicator!: Phaser.GameObjects.Text;

  private grid: number[][] = [];
  private barrierRects: Rect[] = [];
  private holeRects:    Rect[] = [];
  private puddleRects:  Rect[] = [];
  private endZone: Rect = { x: 0, y: 0, w: 0, h: 0 };

  private enemies:          Enemy[]           = [];
  private coins:            Coin[]            = [];
  private projectiles:      Projectile[]      = [];
  private enemyProjectiles: EnemyProjectile[] = [];

  private selectedBoss?: DuelBossData;
  private duelBossSprite?: Phaser.GameObjects.Sprite;
  private duelBossDirection = 1;
  private duelBossBaseY = 0;
  private waitingForBossTouch = false;

  private hudContainer!: Phaser.GameObjects.Container;
  private hpBar!:      Phaser.GameObjects.Graphics;
  private hpLabel!:    Phaser.GameObjects.Text;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private coinText!:   Phaser.GameObjects.Text;
  private levelText!:  Phaser.GameObjects.Text;
  private avatarMask!: Phaser.GameObjects.Graphics;

  private playerSkin: CharacterSkinKey = 'christian';
  private selectedCharacter?: CharacterGameData;
  private playerAttackBonus = 0;

  private cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!:     Phaser.Input.Keyboard.Key;
  private keyA!:     Phaser.Input.Keyboard.Key;
  private keyS!:     Phaser.Input.Keyboard.Key;
  private keyD!:     Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyP!:     Phaser.Input.Keyboard.Key;

  constructor() { super({ key: 'RunScene' }); }

  init(data: Partial<RunData>) {
    this.level          = data.level ?? 1;
    this.step           = data.step ?? 0;
    this.runId          = data.runId ?? 0;

    // Select a new map only at the start of a level (step 0); restore it for subsequent steps
    if (this.step === 0) {
      this.activeMap = selectMap(data.currentMap);
    } else {
      this.activeMap =
        Object.values(MAP_CONFIGS).find(m => m.key === data.currentMap) ??
        MAP_CONFIGS['everglades'];
    }
    this.totalCoins     = data.totalCoins ?? 0;
    this.totalXp        = data.totalXp ?? 0;
    this.done           = false;
    this.runEnded       = false;
    this.lastPlayerDir  = 'down';
    const equipped = (getPlayer()?.equippedCharacter as string | undefined) ?? 'christian';
    this.playerSkin = resolveCharacterSkinKey(equipped);
    this.maxHp          = MAX_HP;
    this.hp             = this.maxHp;
    this.lastSprintTime = -STAMINA_REGEN_DELAY;
    this.sprinting      = false;
    this.leftStart      = false;
    this.timer          = 0;
    this.coinsCollected        = 0;
    this.deathReason           = 'hp';
    this.enemiesKilledThisRun  = 0;
    this.bulletDamage          = (getPlayer()?.bulletDamage as number | undefined) ?? 10;
    this.fireRateLevel         = (getPlayer()?.fireRate as number | undefined) ?? 1;
    this.reloadTimeLevel       = (getPlayer()?.reloadTime as number | undefined) ?? 1;
    this.hasNoReloadUpgrade    = (getPlayer()?.hasNoReload as boolean | undefined) ?? false;
    this.maxAmmo               = (getPlayer()?.magSize as number | undefined) ?? 10;
    this.ammo                  = this.maxAmmo;
    this.staminaPoolLevel      = (getPlayer()?.staminaPool as number | undefined) ?? 1;
    this.staminaRegenLevel     = (getPlayer()?.staminaRegen as number | undefined) ?? 1;
    this.maxStamina            = STAMINA_MAX + (STAMINA_MAX * 0.15 * (this.staminaPoolLevel - 1));
    this.stamina               = this.maxStamina;
    this.reloading             = false;
    this.lastShootTime         = 0;
    this.barrierRects   = [];
    this.holeRects      = [];
    this.puddleRects    = [];
    this.enemies          = [];
    this.coins            = [];
    this.projectiles      = [];
    this.enemyProjectiles = [];
    this.availableLegendaryDrops = LEGENDARY_DROPS.map(drop => drop.name); // reset available legendary drops at the start of each run since they are consumed when picked up

    // Create a server-side run record at the start of each new run.
    // We store the promise so endRun() can chain off it — avoids the race condition
    // where the player dies before the async response arrives and runId is still 0.
    if (this.level === 1 && this.step === 0) {
      this.runCreationPromise = createRun().then(id => { this.runId = id ?? 0; });
    } else {
      this.runCreationPromise = Promise.resolve();
    }
  }

  preload() {
    showLoadingScreen(this);

    if (!this.textures.exists(this.activeMap.key))
      this.load.spritesheet(this.activeMap.key, this.activeMap.url, {
        frameWidth: this.activeMap.tileWidth, frameHeight: this.activeMap.tileHeight,
      });
    const avatarUrl = CHARACTER_VISUALS[this.playerSkin].avatarUrl;
    if (!this.textures.exists(`${this.playerSkin}-avatar`))
      this.load.image(`${this.playerSkin}-avatar`, avatarUrl);
    if (!this.textures.exists('boss-skawl-run-sheet'))
      this.load.image('boss-skawl-run-sheet', skawlSheet);
    if (!this.textures.exists('boss-rabyz-run-sheet'))
      this.load.image('boss-rabyz-run-sheet', rabyzSheet);
    if (!this.textures.exists('boss-boldear-run-sheet'))
      this.load.image('boss-boldear-run-sheet', boldearSheet);

    const skinUrl = CHARACTER_VISUALS[this.playerSkin].sheetUrl;
    if (!this.textures.exists(this.playerSkin))
      this.load.image(this.playerSkin, skinUrl);
    if (!this.textures.exists('racko'))
      this.load.image('racko',    rackoSheet);
    if (!this.textures.exists('rhonda'))
      this.load.image('rhonda',   rhondaSheet);
    if (!this.textures.exists('ricc'))
      this.load.image('ricc',     riccSheet);
    if (!this.textures.exists('ritta'))
      this.load.image('ritta',    rittaSheet);
    if (!this.textures.exists('blurd'))
      this.load.image('blurd',    blurdSheet);
    if (!this.textures.exists('brandon'))
      this.load.image('brandon',  brandonSheet);
    if (!this.textures.exists('brim'))
      this.load.image('brim',     brimSheet);
    if (!this.textures.exists('brook'))
      this.load.image('brook',    brookSheet);
    if (!this.textures.exists('schremy'))
      this.load.image('schremy',  schremySheet);
    if (!this.textures.exists('skully'))
      this.load.image('skully',   skullySheet);
    if (!this.textures.exists('stirr'))
      this.load.image('stirr',    stirrSheet);
  }

  async create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    if (this.input.keyboard) this.input.keyboard.enabled = true;

    // Reset all flags — these persist across scene restarts since Phaser reuses the instance
    this.done = false;
    this.runEnded = false;
    this.isShowingQuitDialog = false;
    this.sidebarNavHandler = null;

    // Initialize input immediately to prevent null reference errors in update()
    this.setupInput();

    // Load character data in the background (don't await)
    void this.loadPlayerCharacterData();

    this.cameras.main.setBackgroundColor(0x1a1a2e);
    this.generateTextures();
    this.createPlayerAnimations();
    this.createBossRunFrames(); // dynamically slice boss run spritesheets into frames for animation
    this.createBossRunAnimations(); // create Phaser animations for boss running using the frames we just sliced

    this.grid = this.generateGrid();
    this.buildWorld(this.grid);
    this.spawnEnemies(this.grid);
    
    // Create playerImg BEFORE awaiting loadLegendaryDropPool to prevent update() from crashing
    this.px = TILE * 2;
    this.py = Math.floor(ROWS / 2) * TILE;
    const playerScale = PLAYER_SIZE / (CHARACTER_VISUALS[this.playerSkin].run.xCuts[1] - CHARACTER_VISUALS[this.playerSkin].run.xCuts[0]);
    this.playerImg = this.add.sprite(this.px, this.py, this.playerSkin, `${this.playerSkin}-walk-down-1`)
      .setOrigin(0, 0).setDepth(5).setScale(playerScale);
    this.playerImg.play(`${this.playerSkin}-walk-down`);

    // Create HUD BEFORE awaiting, so update() has valid references
    const cw = this.cameras.main.width;
    this.levelIndicator = this.add.text(cw / 2, 30, `Level ${this.level}`, {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '22px',
      color: '#c0ccd8',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15);

    this.buildHud();

    this.reloadingText = this.add.text(0, 0, 'Reloading...', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '16px',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(15).setVisible(false);

    // Now safe to await async operations
    await this.loadLegendaryDropPool();
    this.spawnCoins(this.grid);

    if (this.step === RUNS_PER_CYCLE - 1) {
      void this.spawnDuelBossAtGoal();
    }

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); // key for opening the pause menu
    escKey?.on('down', () => {
      if (this.scene.isActive('PauseScene')) return; // prevent opening multiple pause menus
      this.scene.pause(); // pause the duel scene
      this.scene.launch('PauseScene', { returnScene: 'RunScene', runId: this.runId, totalCoins: this.totalCoins + this.coinsCollected, totalXp: this.totalXp, level: this.level }); // open the pause menu and tell it to return here when resuming
    });

    const pauseBg   = this.add.graphics();
    pauseBg.fillStyle(0x000000, 0.7);
    pauseBg.fillRoundedRect(-45, -18, 90, 36, 6);
    const pauseLabel = this.add.text(0, 0, 'PAUSE', {
      fontSize: '22px', color: '#feec00', fontStyle: 'bold',
    }).setOrigin(0.5);
    const pauseContainer = this.add.container(1140, 30, [pauseBg, pauseLabel]);
    pauseContainer.setScrollFactor(0).setDepth(1000).setSize(90, 36).setInteractive({ useHandCursor: true });

    pauseContainer.on('pointerdown', () => {
      if (this.scene.isActive('PauseScene')) return; // prevent opening multiple pause menus
      this.scene.launch('PauseScene', { returnScene: 'RunScene', runId: this.runId, totalCoins: this.totalCoins + this.coinsCollected, totalXp: this.totalXp, level: this.level }); // open the pause menu and tell it to return here when resuming
      this.scene.pause(); // pause the duel scene
    });

    // Sidebar navigation guard — show quit confirmation instead of hard-switching
    const onSidebarNavRequest = ((e: Event) => {
      if (this.isShowingQuitDialog) return;
      this.isShowingQuitDialog = true;
      const target = (e as CustomEvent<{ target: string }>).detail.target;
      const cx = this.cameras.main.centerX;
      const cy = this.cameras.main.centerY;
      const W  = this.cameras.main.width;
      const H  = this.cameras.main.height;

      // Dark overlay
      const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.7)
        .setDepth(9999).setScrollFactor(0);

      // Dialog box background
      const boxBg = this.add.graphics().setDepth(10000).setScrollFactor(0);
      boxBg.fillStyle(0x1a1a1a, 0.9);
      boxBg.fillRoundedRect(cx - 200, cy - 100, 400, 200, 12);

      // Title and subtitle
      const promptText = this.add.text(cx, cy - 48, 'Quit current game?', {
        fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);

      const subText = this.add.text(cx, cy - 10, 'Your current run will end', {
        fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);

      // YES button
      const yesBtn = this.add.text(cx - 75, cy + 58, 'YES', {
        fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
        backgroundColor: '#8b0000', padding: { x: 30, y: 10 },
      }).setOrigin(0.5).setDepth(10001).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      // NO button
      const noBtn = this.add.text(cx + 75, cy + 58, 'NO', {
        fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
        backgroundColor: '#006400', padding: { x: 30, y: 10 },
      }).setOrigin(0.5).setDepth(10001).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      const destroyDialog = () => {
        overlay.destroy(); boxBg.destroy();
        promptText.destroy(); subText.destroy();
        yesBtn.destroy(); noBtn.destroy();
      };

      yesBtn.on('pointerup', () => {
        destroyDialog();
        this.endRun();
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
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    this.events.on('shutdown', () => {
      this.time.removeAllEvents();
      this.tweens.killAll();
      this.input.keyboard?.removeAllKeys(true);
      this.input.removeAllListeners();
      if (this.sidebarNavHandler) {
        window.removeEventListener('sidebar-nav-request', this.sidebarNavHandler);
        this.sidebarNavHandler = null;
      }
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    });
  }

  private async loadPlayerCharacterData(): Promise<void> {
    const player = getPlayer();
    const equipped = (player?.equippedCharacter as string | undefined) ?? 'christian';

    try {
      this.selectedCharacter = await fetchCharacterByKey(equipped);
    } catch (error) {
      console.error('Failed to load character data from backend, using profile fallback.', error);
      this.selectedCharacter = {
        id: 0,
        characterKey: equipped,
        chName: equipped.charAt(0).toUpperCase() + equipped.slice(1),
        chDesc: null,
        baseHp: (player?.maxHp as number | undefined) ?? 50,
        baseAttack: (player?.bulletDamage as number | undefined) ?? 10,
        baseDefense: 0,
        chUltimate: '',
        chUltimateDesc: null,
        isDefaultUnlocked: true,
      };
    }

    const hpUpgradeBonus = Math.max(0, ((player?.maxHp as number | undefined) ?? 50) - 50);
    const attackUpgradeBonus = Math.max(0, ((player?.bulletDamage as number | undefined) ?? 10) - 10);

    this.maxHp = Math.max(1, this.selectedCharacter.baseHp + hpUpgradeBonus);
    this.hp = this.maxHp;
    this.playerAttackBonus = this.selectedCharacter.baseAttack + attackUpgradeBonus;
    this.bulletDamage = Math.max(1, this.playerAttackBonus);
  }

  private async loadLegendaryDropPool(): Promise<void> {
    this.availableLegendaryDrops = LEGENDARY_DROPS.map(drop => drop.name);
    if (!this.playerCanFindLegendaryDrops()) return; // condition to check if the player is eligible to find legendary drops

    const player = getPlayer();
    const playerId = Number(player?.id ?? 0);
    if (!Number.isFinite(playerId) || playerId <= 0) return;

    try {
      const bootstrap = await fetchDeckBootstrap(playerId);
      const allCards = Array.isArray(bootstrap.allCards)
        ? (bootstrap.allCards as Array<{ id?: number; cardName?: string; cardRarity?: string }> )
        : [];

      const legendaryById = new Map<number, LegendaryDropName>();
      for (const card of allCards) {
        if ((card.cardRarity ?? '').toUpperCase() !== 'LEGENDARY') continue;
        const name = card.cardName as LegendaryDropName | undefined;
        const id = Number(card.id ?? 0);
        if (!name || !Number.isFinite(id) || id <= 0) continue;
        if (!LEGENDARY_DROPS.some(drop => drop.name === name)) continue;
        legendaryById.set(id, name);
      } // build a map of cardGameId to LegendaryDropName for all legendary cards in the game

      const unlockedLegendaryNames = new Set<LegendaryDropName>();
      for (const owned of bootstrap.ownedCards) {
        if (!owned.isUnlocked || owned.numCardsOwned <= 0) continue;
        const name = legendaryById.get(owned.cardGameId);
        if (name) unlockedLegendaryNames.add(name);
      } // iterate through the player's owned cards and add the corresponding LegendaryDropName

      this.availableLegendaryDrops = LEGENDARY_DROPS
        .map(drop => drop.name)
        .filter(name => !unlockedLegendaryNames.has(name)); // the final pool of legendary drops the player can find is all legendary drops minus the ones they already have unlocked
    } 
    
    catch (error) {
      console.error('Failed to load legendary drop pool; using fallback pool.', error);
      this.availableLegendaryDrops = LEGENDARY_DROPS.map(drop => drop.name);
    }
  }

  update(time: number, delta: number) {
    if (this.done) return;
    if ((this as any).__transitioning) return; // guard: don't update during scene transition
    if (this.isShowingQuitDialog) return;
    if (this.duelBossSprite && this.waitingForBossTouch) {
      this.duelBossSprite.y += this.duelBossDirection * 0.5; // bob up and down to indicate interactivity
      if (this.duelBossSprite.y > this.duelBossBaseY + 20) this.duelBossDirection = -1;
      if (this.duelBossSprite.y < this.duelBossBaseY - 20) this.duelBossDirection = 1;
      
      const bossWidth = this.duelBossSprite.displayWidth;
      const bossHeight = this.duelBossSprite.displayHeight;

      const overlap = rectsOverlap(
        this.px, this.py, PLAYER_SIZE, PLAYER_SIZE,
        this.duelBossSprite.x, this.duelBossSprite.y, bossWidth, bossHeight
      ); // simple AABB check for touching the boss to start the duel; no need for pixel-perfect collision here since the boss is large and has a big hitbox

      if (overlap) {
        this.startBossDuel();
      } // if the player touches the boss, transition to the DuelScene and pass the selected boss data along with the current run stats
    }

    this.timer += delta;
    this.handleMovement(time, delta);
    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.updateEnemyProjectiles(delta);
    this.checkPuddle(delta);
    this.checkCoins();
    this.updateCamera(delta);
    this.checkEndZone();
    this.checkHoleDeath();
    this.refreshHud();
  }

  // ── Textures ──

  private generateTextures() {
    const make = (key: string, w: number, h: number, color: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics();
      g.fillStyle(color);
      g.fillRect(0, 0, w, h);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    make(KEY_SPR_ENEMY, ENEMY_SIZE, ENEMY_SIZE, 0xcc2222);

    if (!this.textures.exists(KEY_SPR_COIN)) {
      const g = this.make.graphics();
      g.fillStyle(0xffd700);
      g.fillCircle(COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2);
      g.lineStyle(1.5, 0x997700);
      g.strokeCircle(COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2 - 1);
      g.generateTexture(KEY_SPR_COIN, COIN_SIZE, COIN_SIZE);
      g.destroy();
    }
    if (!this.textures.exists(KEY_SPR_PROJECTILE)) {
      const g = this.make.graphics();
      g.fillStyle(0x44aaff);
      g.fillCircle(PROJ_SIZE / 2, PROJ_SIZE / 2, PROJ_SIZE / 2);
      g.generateTexture(KEY_SPR_PROJECTILE, PROJ_SIZE, PROJ_SIZE);
      g.destroy();
    }
    if (!this.textures.exists(KEY_SPR_ENEMY_PROJ)) {
      const g = this.make.graphics();
      g.fillStyle(0xff3333);
      g.fillCircle(ENEMY_PROJ_SIZE / 2, ENEMY_PROJ_SIZE / 2, ENEMY_PROJ_SIZE / 2);
      g.generateTexture(KEY_SPR_ENEMY_PROJ, ENEMY_PROJ_SIZE, ENEMY_PROJ_SIZE);
      g.destroy();
    }
  }

  // ── Grid generation ──

  private generateGrid(): number[][] {
    const grid: number[][] = Array.from({ length: ROWS }, () =>
      new Array<number>(COLS).fill(FLOOR)
    );
    const onPath: boolean[][] = Array.from({ length: ROWS }, () =>
      new Array<boolean>(COLS).fill(false)
    );

    let pathRow = Math.floor(ROWS / 2);
    for (let col = 0; col < COLS; col++) {
      for (let dr = -1; dr <= 1; dr++) {
        const r = pathRow + dr;
        if (r >= 0 && r < ROWS) onPath[r][col] = true;
      }
      if (col > 4 && col < COLS - 5) {
        const roll = Math.random();
        if (roll < 0.2 && pathRow > 3) pathRow--;
        else if (roll < 0.4 && pathRow < ROWS - 4) pathRow++;
      }
    }

    const safe = (r: number, c: number) =>
      onPath[r][c] || c < START_COLS || c >= END_COL;
    const blocked = (r: number, c: number) =>
      safe(r, c) || grid[r][c] !== FLOOR;

    for (let i = 0; i < BARRIER_SEEDS; i++) {
      const sr = randInt(0, ROWS - 1);
      const sc = randInt(START_COLS, END_COL - 2);
      if (!blocked(sr, sc)) this.growCluster(grid, sr, sc, BARRIER, randInt(3, 9), blocked);
    }
    for (let i = 0; i < HOLE_SEEDS; i++) {
      const sr = randInt(0, ROWS - 1);
      const sc = randInt(START_COLS, END_COL - 2);
      if (!blocked(sr, sc)) this.growCluster(grid, sr, sc, HOLE, randInt(1, 3), blocked);
    }
    for (let i = 0; i < PUDDLE_SEEDS; i++) {
      const sr = randInt(1, ROWS - 2);
      const sc = randInt(10, END_COL - 10);
      if (!blocked(sr, sc)) this.growCluster(grid, sr, sc, PUDDLE, randInt(2, 5), blocked);
    }

    return grid;
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

  private createPlayerAnimations() {
    this.sliceCharSheetFrames(this.playerSkin);
    this.createWalkAnimations(this.playerSkin);
  }

  private createEnemyAnimations(skinKey: CharSheetKey) {
    this.sliceCharSheetFrames(skinKey);
    this.createWalkAnimations(skinKey);
  }

  private sliceBossSheetFrames(
    textureKey: string,
    framePrefix: string,
    xCuts: readonly number[],
    yCuts: readonly number[],
  ) {
    const texture = this.textures.get(textureKey); // get the loaded texture for the boss sprite sheet
    const directions = ['down', 'left', 'right', 'up']; // the sprite sheets are organized in 4 rows for each movement direction, and 3 columns for the animation frames, so we loop through and create individual frames for each one using the provided cut coordinates

    for (let row = 0; row < 4; row++) { // loop through the 4 rows (directions)
      for (let col = 0; col < 3; col++) {
        const x = xCuts[col];
        const y = yCuts[row];
        const w = xCuts[col + 1] - xCuts[col];
        const h = yCuts[row + 1] - yCuts[row];

        const frameName = `${framePrefix}-${directions[row]}-${col}`; // construct a unique frame name for this direction and animation index, e.g. "boss-skawl-run-down-0"
        if (!texture.has(frameName)) { // only add the frame if it doesn't already exist to avoid duplicates when replaying runs
          texture.add(frameName, 0, x, y, w, h);
        }
      }
    }
  }

  private createBossRunFrames() {
    this.sliceBossSheetFrames(
      RUN_BOSS_SHEETS.Skawl.textureKey,
      RUN_BOSS_SHEETS.Skawl.framePrefix,
      RUN_BOSS_SHEETS.Skawl.xCuts,
      RUN_BOSS_SHEETS.Skawl.yCuts,
    );

    this.sliceBossSheetFrames(
      RUN_BOSS_SHEETS.Rabyz.textureKey,
      RUN_BOSS_SHEETS.Rabyz.framePrefix,
      RUN_BOSS_SHEETS.Rabyz.xCuts,
      RUN_BOSS_SHEETS.Rabyz.yCuts,
    );

    this.sliceBossSheetFrames(
      RUN_BOSS_SHEETS.Boldear.textureKey,
      RUN_BOSS_SHEETS.Boldear.framePrefix,
      RUN_BOSS_SHEETS.Boldear.xCuts,
      RUN_BOSS_SHEETS.Boldear.yCuts,
    );
  }

  private getRunBossSpriteKey(): string {
    switch (this.selectedBoss?.enemyName) {
      case 'Skawl': return 'boss-skawl-run-sheet';
      case 'Rabyz': return 'boss-rabyz-run-sheet';
      case 'Boldear': return 'boss-boldear-run-sheet';
      default: return KEY_SPR_ENEMY; // fallback to generic enemy sprite if something goes wrong with fetching boss data
    }
  }

  private getRunBossAnimationKey(): string {
    switch (this.selectedBoss?.enemyName) {
      case 'Skawl': return 'boss-skawl-run-down';
      case 'Rabyz': return 'boss-rabyz-run-down';
      case 'Boldear': return 'boss-boldear-run-down';
      default: return ''; // fallback to generic idle animation
    }
  }

  private createBossRunAnimations() {
    if (!this.anims.exists('boss-skawl-run-down')) {
      this.anims.create({
        key: 'boss-skawl-run-down',
        frames: [
          { key: 'boss-skawl-run-sheet', frame: 'boss-skawl-run-down-0' },
          { key: 'boss-skawl-run-sheet', frame: 'boss-skawl-run-down-1' },
          { key: 'boss-skawl-run-sheet', frame: 'boss-skawl-run-down-2' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.anims.exists('boss-rabyz-run-down')) {
      this.anims.create({
        key: 'boss-rabyz-run-down',
        frames: [
          { key: 'boss-rabyz-run-sheet', frame: 'boss-rabyz-run-down-0' },
          { key: 'boss-rabyz-run-sheet', frame: 'boss-rabyz-run-down-1' },
          { key: 'boss-rabyz-run-sheet', frame: 'boss-rabyz-run-down-2' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.anims.exists('boss-boldear-run-down')) {
      this.anims.create({
        key: 'boss-boldear-run-down',
        frames: [
          { key: 'boss-boldear-run-sheet', frame: 'boss-boldear-run-down-0' },
          { key: 'boss-boldear-run-sheet', frame: 'boss-boldear-run-down-1' },
          { key: 'boss-boldear-run-sheet', frame: 'boss-boldear-run-down-2' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }
  }


  // ── Boss Duel Start Point ──
  private async spawnDuelBossAtGoal() {
    try {
      this.selectedBoss = await fetchRandomDuelBoss();
      console.log('Boss fetched for RunScene:', this.selectedBoss);

      this.waitingForBossTouch = true;

      const bossX = WORLD_W - TILE * 3;
      const bossY = Math.floor(ROWS / 2) * TILE;

      this.duelBossBaseY = bossY;
      const bossKey = this.getRunBossSpriteKey();
      const bossAnim = this.getRunBossAnimationKey();

      console.log('bossKey:', bossKey, 'bossAnim:', bossAnim);

      if (!bossAnim) {
        this.duelBossSprite = this.add.sprite(bossX, bossY, KEY_SPR_ENEMY)
          .setOrigin(0, 0)
          .setDepth(6);
        return;
      }

      const framePrefix =
        this.selectedBoss?.enemyName === 'Skawl' ? 'boss-skawl-run' :
        this.selectedBoss?.enemyName === 'Rabyz' ? 'boss-rabyz-run' :
        this.selectedBoss?.enemyName === 'Boldear' ? 'boss-boldear-run' :
        '';

      this.duelBossSprite = this.add.sprite(
        bossX,
        bossY,
        bossKey,
        `${framePrefix}-down-1`
      )
        .setOrigin(0, 0)
        .setDepth(6)
        .setScale(0.18);

      this.duelBossSprite.play(bossAnim);
    } // try to fetch boss data and spawn the boss sprite at the end of the level; if anything goes wrong, log the error and skip spawning the boss so it doesn't block the player from finishing the run
    
    catch (error) {
      console.error('spawnDuelBossAtGoal failed:', error);
    }
  }

  // ── Boss Duel Transition ──
  private startBossDuel() {
    if (!this.selectedBoss || this.done) return; // guard against multiple triggers

    this.done = true;

    transitionTo(this, 'DuelScene', {
      level: this.level,
      step: this.step,
      totalCoins: this.totalCoins + this.coinsCollected,
      totalXp: this.totalXp,
      runId: this.runId,
      selectedBoss: this.selectedBoss,
      currentMap: this.activeMap.key,
    }); // transition to the DuelScene and pass along the current run stats and selected boss data
  }

  private growCluster(
    grid: number[][], sr: number, sc: number,
    type: number, size: number,
    blocked: (r: number, c: number) => boolean
  ) {
    const frontier = [{ r: sr, c: sc }];
    const visited = new Set<string>([`${sr},${sc}`]);
    let placed = 0;

    while (placed < size && frontier.length > 0) {
      const idx = Math.floor(Math.random() * frontier.length);
      const { r, c } = frontier.splice(idx, 1)[0];
      if (blocked(r, c)) continue;
      grid[r][c] = type;
      placed++;
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        const k = `${nr},${nc}`;
        if (!visited.has(k) && nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          visited.add(k);
          frontier.push({ r: nr, c: nc });
        }
      }
    }
  }

  // ── World building ──

  private buildWorld(grid: number[][]) {
    const { key: mapKey, frames: mapFrames } = this.activeMap;

    // Register named frames from TileRect values so tileSprite and image can reference them by name
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

    this.endZone = {
      x: END_COL * TILE, y: 0,
      w: (COLS - END_COL) * TILE, h: WORLD_H,
    };

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = grid[row][col];
        const px   = col * TILE;
        const py   = row * TILE;

        if (tile === BARRIER) {
          this.add.image(px, py, mapKey, `${mapKey}-barrier`)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(2);
          this.barrierRects.push({ x: px, y: py, w: TILE, h: TILE });

        } else if (tile === HOLE) {
          const nb = this.tileNeighbors(grid, row, col, HOLE);
          this.add.image(px, py, mapKey, `${mapKey}-hole`)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(2);
          this.holeRects.push({
            x: nb.w ? px       : px + 8,
            y: nb.n ? py       : py + 8,
            w: TILE - (nb.w ? 0 : 8) - (nb.e ? 0 : 8),
            h: TILE - (nb.n ? 0 : 8) - (nb.s ? 0 : 8),
          });

        } else if (tile === PUDDLE) {
          this.add.image(px, py, mapKey, `${mapKey}-puddle`)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(2);
          this.puddleRects.push({ x: px, y: py, w: TILE, h: TILE });
        }
      }
    }
  }

  private tileNeighbors(grid: number[][], row: number, col: number, type: number) {
    return {
      n: row > 0        && grid[row - 1][col] === type,
      s: row < ROWS - 1 && grid[row + 1][col] === type,
      w: col > 0        && grid[row][col - 1] === type,
      e: col < COLS - 1 && grid[row][col + 1] === type,
    };
  }

  // ── Spawning ──

  private spawnEnemies(grid: number[][]) {
    const pool  = getSpawnPool(this.level);
    const extra = Math.min(20, 2 * (this.level - 1));
    const count = randInt(ENEMY_COUNT_MIN + extra, ENEMY_COUNT_MAX + extra);
    let placed = 0, attempts = 0;

    while (placed < count && attempts < 300) {
      attempts++;
      const col = randInt(10, END_COL - 2);
      const row = randInt(0, ROWS - 1);
      if (grid[row][col] !== FLOOR) continue;

      const ex   = col * TILE;
      const ey   = row * TILE;
      const type = pool[Math.floor(Math.random() * pool.length)];
      const s    = getEnemyStats(type, this.level);
      const skins = type === EnemyType.TANK  ? TANK_SKINS :
                    type === EnemyType.SWIFT ? SWIFT_SKINS : SHOOTER_SKINS;
      const skinKey = skins[Math.floor(Math.random() * skins.length)] as CharSheetKey;
      this.createEnemyAnimations(skinKey);

      const eSheet = CHAR_SHEETS[skinKey];
      const eScale = ENEMY_SIZE / (eSheet.xCuts[1] - eSheet.xCuts[0]);
      const sprite = this.add.sprite(ex, ey, skinKey, `${skinKey}-walk-down-1`)
        .setOrigin(0, 0).setDepth(4).setScale(eScale);
      sprite.play(`${skinKey}-walk-down`);

      this.enemies.push({
        x: ex, y: ey,
        hp: s.hp, maxHp: s.maxHp,
        speed: s.speed,
        contactDmgRate: s.contactDmgRate,
        enemyType: type,
        shootTimer: Math.random() * SHOOTER_FIRE_INTERVAL, // stagger initial shots
        img: sprite,
        skinKey,
        lastDir: 'down',
        hpBar: this.add.graphics().setDepth(5),
        pathTimer: 0,
        path: [],
        pathIdx: 0,
      });
      placed++;
    }
  }

  private spawnCoins(grid: number[][]) {
    const count = randInt(COIN_COUNT_MIN, COIN_COUNT_MAX);
    let placed = 0, attempts = 0;

    while (placed < count && attempts < 500) { // coins are less critical to place than enemies, so we allow more attempts to find valid locations for them without blocking the path
      attempts++;
      const col = randInt(START_COLS + 1, END_COL - 2);
      const row = randInt(0, ROWS - 1);
      if (grid[row][col] !== FLOOR) continue;

      const cx = col * TILE + (TILE - COIN_SIZE) / 2;
      const cy = row * TILE + (TILE - COIN_SIZE) / 2;
      this.coins.push({
        x: cx, y: cy,
        img: this.add.image(cx, cy, KEY_SPR_COIN).setOrigin(0, 0).setDepth(2),
        collected: false,
        kind: 'coin',
      });
      placed++;
    }

    this.trySpawnLegendaryDrop(grid); // after placing regular coins, attempt to place a legendary drop if the player is eligible to find them and there are still some left in the pool
  }

  private playerCanFindLegendaryDrops(): boolean {
    const player = getPlayer();
    const clanRank = ((player?.clanRank as string | undefined) ?? '').toUpperCase();
    return clanRank === 'LEGEND'; // only players with LEGEND clan rank can find legendary drops
  }

  private trySpawnLegendaryDrop(grid: number[][]): void {
    if (!this.playerCanFindLegendaryDrops()) return;
    if (this.availableLegendaryDrops.length === 0) return;
    if (Math.random() > LEGENDARY_DROP_SPAWN_CHANCE) return;

    const dropName = this.availableLegendaryDrops[randInt(0, this.availableLegendaryDrops.length - 1)]; // pick a random legendary drop from the pool of available drops that the player hasn't unlocked
    const drop = LEGENDARY_DROPS.find(candidate => candidate.name === dropName); // find the full drop data for the selected legendary drop
    if (!drop) return;
    let attempts = 0;

    while (attempts < 500) {
      attempts += 1;
      const col = randInt(START_COLS + 1, END_COL - 2);
      const row = randInt(0, ROWS - 1);
      if (grid[row][col] !== FLOOR) continue;

      const cx = col * TILE + (TILE - COIN_SIZE) / 2;
      const cy = row * TILE + (TILE - COIN_SIZE) / 2;
      const overlapsCoin = this.coins.some(c => !c.collected && dist(cx, cy, c.x, c.y) < COIN_SIZE);
      if (overlapsCoin) continue;

      const img = this.add.image(cx, cy, KEY_SPR_COIN).setOrigin(0, 0).setDepth(2);
      img.setTint(drop.tint);

      this.coins.push({
        x: cx,
        y: cy,
        img,
        collected: false,
        kind: 'legendary',
        legendaryName: drop.name,
      });
      return;
    }
  } // attempt to spawn a legendary drop at a random valid location on the map, ensuring it doesn't overlap with existing coins

  // ── HUD ──

  private buildHud() {
    const BAR_X = 75;

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.55);
    panel.fillRoundedRect(0, 0, 340, 140, 10);

    const avatarOutline = this.add.graphics();
    avatarOutline.lineStyle(2, 0x8899cc);
    avatarOutline.strokeCircle(35, 55, 30);

    const avatarSprite = this.add.image(35, 55, `${this.playerSkin}-avatar`);
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
    this.coinText   = this.add.text(BAR_X, 80, '', { fontSize: '15px', color: '#ffd700' });
    this.levelText  = this.add.text(170, -20, '', { fontSize: '13px', color: '#c0ccd8' });
    this.ammoText   = this.add.text(BAR_X, 100, '', { fontSize: '14px', color: '#aaddff' });

    this.hudContainer = this.add.container(10, 10, [
      panel, avatarSprite, avatarOutline, this.hpBar, this.staminaBar, this.hpLabel, this.coinText, this.levelText, this.ammoText,
    ]);
    this.hudContainer.setScrollFactor(0).setDepth(10);

    this.refreshHud();
  }

  private refreshHud() {
    // Guard: HUD elements may be null/destroyed during scene transition
    if (!this.hpLabel || !this.coinText || !this.ammoText || !this.levelIndicator) return;

    const BAR_X = 75;
    const BAR_W = 248;

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const hpCol   = hpRatio > 0.5 ? 0x44cc66 : hpRatio > 0.25 ? 0xffaa00 : 0xff3333;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRoundedRect(BAR_X, 30, BAR_W, 16, 3);
    this.hpBar.fillStyle(hpCol);
    this.hpBar.fillRoundedRect(BAR_X, 30, BAR_W * hpRatio, 16, 3);
    this.hpLabel.setText(`HP  ${Math.ceil(this.hp)} / ${this.maxHp}`);

    const stRatio = this.stamina / this.maxStamina;
    const stCol   = this.sprinting ? 0xffcc00 : 0x5599ff;
    this.staminaBar.clear();
    this.staminaBar.fillStyle(0x333333);
    this.staminaBar.fillRoundedRect(BAR_X, 54, BAR_W, 10, 2);
    this.staminaBar.fillStyle(stCol);
    this.staminaBar.fillRoundedRect(BAR_X, 54, BAR_W * stRatio, 10, 2);

    this.coinText.setText(`Coins: ${this.totalCoins + this.coinsCollected}`);
    this.levelText.setText(`Level ${this.level}`);
    if (this.hasNoReloadUpgrade) {
      this.ammoText.setText('Ammo: ∞');
    } else {
      this.ammoText.setText(`Ammo: ${this.ammo}/${this.maxAmmo}`);
    }
    this.ammoText.setColor(this.reloading ? '#ffaa00' : '#aaddff');
    this.levelIndicator.setText(`Level ${this.level}`);
    if (this.reloadingText?.visible) {
      this.reloadingText.setPosition(this.px + PLAYER_SIZE / 2, this.py - 6);
    }
  }

  // ── Input ──

  private setupInput() {
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.keyW     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyShift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyP     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    this.keyP.on('down', () => {
      const player = getPlayer();
      if (player?.isAdmin && !this.done && !(this as any).__transitioning) {
        this.done = true;
        this.totalCoins += this.coinsCollected + 100;
        this.totalXp += 250;
        this.coinsCollected = 0;
        this.advanceStage(); // transitionTo() will handle __transitioning flag
      }
    });

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.done) return;
      if (this.reloading) return;
      if (this.ammo <= 0) { this.startReload(); return; }
      const baseCooldown = 300;
      if (this.time.now - this.lastShootTime < baseCooldown / this.fireRateLevel) return;
      this.lastShootTime = this.time.now;
      this.ammo--;
      this.fireProjectile(ptr);
      if (this.ammo <= 0) this.startReload();
    });
  }

  // ── Movement & collision ──

  private handleMovement(time: number, delta: number) {
    // Guard: playerImg may not be ready yet during async create(), or destroyed during transition
    if (!this.playerImg || !this.playerImg.anims || !this.cursors) return;

    const dt = delta / 1000;

    const movingX = this.cursors.left.isDown || this.keyA.isDown ||
                    this.cursors.right.isDown || this.keyD.isDown;
    const movingY = this.cursors.up.isDown || this.keyW.isDown ||
                    this.cursors.down.isDown || this.keyS.isDown;

    this.sprinting = this.keyShift.isDown && this.stamina > 0 && (movingX || movingY);

    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * dt);
      this.lastSprintTime = time;
    } else if (time - this.lastSprintTime >= STAMINA_REGEN_DELAY / this.staminaRegenLevel) {
      this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN * this.staminaRegenLevel * dt);
    }

    const speed = this.sprinting ? PLAYER_SPRINT : PLAYER_SPEED;
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.keyA.isDown) dx = -speed * dt;
    if (this.cursors.right.isDown || this.keyD.isDown) dx =  speed * dt;
    if (this.cursors.up.isDown    || this.keyW.isDown) dy = -speed * dt;
    if (this.cursors.down.isDown  || this.keyS.isDown) dy =  speed * dt;

    this.px += dx;
    this.px = clamp(this.px, 0, WORLD_W - PLAYER_SIZE);
    if (dx !== 0) this.resolveBarriers(dx, 0);

    this.py += dy;
    this.py = clamp(this.py, 0, WORLD_H - PLAYER_SIZE);
    if (dy !== 0) this.resolveBarriers(0, dy);

    const cam = this.cameras.main;
    const rightLimit = cam.scrollX + cam.width - PLAYER_SIZE;
    if (this.px > rightLimit) this.px = rightLimit;

    this.playerImg.setPosition(this.px, this.py);

    if (dx !== 0 || dy !== 0) {
      const dir = Math.abs(dx) >= Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      if (dir !== this.lastPlayerDir || !this.playerImg.anims.isPlaying) {
        this.lastPlayerDir = dir;
        this.playerImg.play(`${this.playerSkin}-walk-${dir}`, true);
      }
      this.playerImg.anims.timeScale = this.sprinting ? 1.8 : 1;
    } else {
      this.playerImg.anims.stop();
      this.playerImg.setFrame(`${this.playerSkin}-walk-${this.lastPlayerDir}-1`);
    }

    if (!this.leftStart && this.px > START_COLS * TILE) {
      this.leftStart = true;
    }
  }

  private resolveBarriers(dx: number, dy: number) {
    for (const b of this.barrierRects) {
      if (!rectsOverlap(this.px, this.py, PLAYER_SIZE, PLAYER_SIZE, b.x, b.y, b.w, b.h))
        continue;
      if (dx > 0) this.px = b.x - PLAYER_SIZE;
      if (dx < 0) this.px = b.x + b.w;
      if (dy > 0) this.py = b.y - PLAYER_SIZE;
      if (dy < 0) this.py = b.y + b.h;
    }
  }

  // ── Shooting ──

  private startReload() {
    if (this.reloading) return;
    if (this.hasNoReloadUpgrade) { this.ammo = this.maxAmmo; return; }
    this.reloading = true;
    this.reloadingText.setPosition(this.px + PLAYER_SIZE / 2, this.py - 6);
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
    const wx = ptr.x / cam.zoom + cam.scrollX;
    const wy = ptr.y / cam.zoom + cam.scrollY;
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;

    const raw = Math.atan2(wy - cy, wx - cx);
    const ang = Math.round(raw / (Math.PI / 4)) * (Math.PI / 4);

    const img = this.add.image(cx, cy, KEY_SPR_PROJECTILE).setOrigin(0.5).setDepth(6);
    this.projectiles.push({
      x: cx - PROJ_SIZE / 2,
      y: cy - PROJ_SIZE / 2,
      vx: Math.cos(ang) * PROJ_SPEED,
      vy: Math.sin(ang) * PROJ_SPEED,
      img,
    });
  }

  private updateProjectiles(delta: number) {
    const dt = delta / 1000;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < 0 || p.x + PROJ_SIZE > WORLD_W || p.y < 0 || p.y + PROJ_SIZE > WORLD_H) {
        p.img.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      let hit = false;
      for (const b of this.barrierRects) {
        if (rectsOverlap(p.x, p.y, PROJ_SIZE, PROJ_SIZE, b.x, b.y, b.w, b.h)) {
          hit = true;
          break;
        }
      }

      if (!hit) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (rectsOverlap(p.x, p.y, PROJ_SIZE, PROJ_SIZE, e.x, e.y, ENEMY_SIZE, ENEMY_SIZE)) {
            if (this.leftStart) {
              e.hp -= this.bulletDamage;
              if (e.hp <= 0) {
                e.img.destroy();
                e.hpBar.destroy();
                this.enemies.splice(j, 1);
                this.enemiesKilledThisRun++;
              }
            }
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        p.img.destroy();
        this.projectiles.splice(i, 1);
      } else {
        p.img.setPosition(p.x + PROJ_SIZE / 2, p.y + PROJ_SIZE / 2);
      }
    }
  }

  // ── Enemy projectiles ──

  private fireEnemyProjectile(e: Enemy) {
    const ex = e.x + ENEMY_SIZE / 2;
    const ey = e.y + ENEMY_SIZE / 2;
    const px = this.px + PLAYER_SIZE / 2;
    const py = this.py + PLAYER_SIZE / 2;
    const dx = px - ex;
    const dy = py - ey;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d === 0) return;
    const scaledDmg = ENEMY_PROJ_DMG * Math.min(2.5, Math.pow(1.08, Math.floor((this.level - 1) / 2)));
    const eImg = this.add.image(ex, ey, KEY_SPR_ENEMY_PROJ).setOrigin(0.5).setDepth(6);
    this.enemyProjectiles.push({
      x: ex - ENEMY_PROJ_SIZE / 2,
      y: ey - ENEMY_PROJ_SIZE / 2,
      vx: (dx / d) * ENEMY_PROJ_SPEED,
      vy: (dy / d) * ENEMY_PROJ_SPEED,
      dmg: scaledDmg,
      img: eImg,
    });
  }

  private updateEnemyProjectiles(delta: number) {
    if (this.done) return;
    const dt = delta / 1000;
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < 0 || p.x + ENEMY_PROJ_SIZE > WORLD_W ||
          p.y < 0 || p.y + ENEMY_PROJ_SIZE > WORLD_H) {
        p.img.destroy();
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      let hit = false;
      for (const b of this.barrierRects) {
        if (rectsOverlap(p.x, p.y, ENEMY_PROJ_SIZE, ENEMY_PROJ_SIZE, b.x, b.y, b.w, b.h)) {
          hit = true;
          break;
        }
      }

      if (!hit && rectsOverlap(p.x, p.y, ENEMY_PROJ_SIZE, ENEMY_PROJ_SIZE,
          this.px, this.py, PLAYER_SIZE, PLAYER_SIZE)) {
        this.hp -= p.dmg;
        hit = true;
        if (this.hp <= 0) {
          p.img.destroy();
          this.enemyProjectiles.splice(i, 1);
          this.hp = 0;
          this.deathReason = 'hp';
          this.showGameOver();
          return;
        }
      }

      if (hit) {
        p.img.destroy();
        this.enemyProjectiles.splice(i, 1);
      } else {
        p.img.setPosition(p.x + ENEMY_PROJ_SIZE / 2, p.y + ENEMY_PROJ_SIZE / 2);
      }
    }
  }

  // ── Enemies (A*) ──

  private updateEnemies(delta: number) {
    const dt = delta / 1000;
    const startWall = START_COLS * TILE;

    if (!this.leftStart) {
      for (const e of this.enemies) {
        e.img.setPosition(e.x, e.y);
        this.drawEnemyBar(e);
      }
      return;
    }

    const playerCol = Math.floor((this.px + PLAYER_SIZE / 2) / TILE);
    const playerRow = Math.floor((this.py + PLAYER_SIZE / 2) / TILE);

    for (const e of this.enemies) {
      e.pathTimer -= delta;
      if (e.pathTimer <= 0) {
        e.pathTimer = ENEMY_REPATH_MS;
        const eCol = Math.floor((e.x + ENEMY_SIZE / 2) / TILE);
        const eRow = Math.floor((e.y + ENEMY_SIZE / 2) / TILE);
        e.path = astar(this.grid, eRow, eCol, playerRow, playerCol);
        e.pathIdx = 0;
      }

      if (e.path.length > 0 && e.pathIdx < e.path.length) {
        const target = e.path[e.pathIdx];
        const tx = target.col * TILE;
        const ty = target.row * TILE;
        const dx = tx - e.x;
        const dy = ty - e.y;
        const d  = Math.sqrt(dx * dx + dy * dy);

        if (d < 4) {
          e.pathIdx++;
        } else {
          const step = e.speed * dt;
          e.x += (dx / d) * step;
          e.y += (dy / d) * step;

          const dir = Math.abs(dx) >= Math.abs(dy)
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down' : 'up');
          if (dir !== e.lastDir || !e.img.anims.isPlaying) {
            e.lastDir = dir;
            e.img.play(`${e.skinKey}-walk-${dir}`, true);
          }
        }
      } else if (e.img.anims.isPlaying) {
        e.img.anims.stop();
        e.img.setFrame(`${e.skinKey}-walk-${e.lastDir}-1`);
      }

      e.x = clamp(e.x, startWall, WORLD_W - ENEMY_SIZE);
      e.y = clamp(e.y, 0, WORLD_H - ENEMY_SIZE);

      for (const b of this.barrierRects) {
        if (!rectsOverlap(e.x, e.y, ENEMY_SIZE, ENEMY_SIZE, b.x, b.y, b.w, b.h)) continue;
        const ol = (e.x + ENEMY_SIZE) - b.x;
        const or_ = (b.x + b.w) - e.x;
        const ot = (e.y + ENEMY_SIZE) - b.y;
        const ob = (b.y + b.h) - e.y;
        const min = Math.min(ol, or_, ot, ob);
        if      (min === ol)  e.x = b.x - ENEMY_SIZE;
        else if (min === or_) e.x = b.x + b.w;
        else if (min === ot)  e.y = b.y - ENEMY_SIZE;
        else                  e.y = b.y + b.h;
      }

      // SHOOTER: fire projectile on timer, no contact damage
      if (e.enemyType === EnemyType.SHOOTER) {
        e.shootTimer -= delta;
        if (e.shootTimer <= 0) {
          e.shootTimer = SHOOTER_FIRE_INTERVAL;
          this.fireEnemyProjectile(e);
        }
      }

      // TANK / SWIFT: deal contact damage
      if (e.contactDmgRate > 0) {
        const touching = rectsOverlap(
          this.px, this.py, PLAYER_SIZE, PLAYER_SIZE,
          e.x, e.y, ENEMY_SIZE, ENEMY_SIZE
        );
        if (touching) {
          this.hp -= e.contactDmgRate * dt;
          if (this.hp <= 0) {
            this.hp = 0;
            this.deathReason = 'hp';
            this.showGameOver();
            return;
          }
        }
      }

      e.img.setPosition(e.x, e.y);
      this.drawEnemyBar(e);
    }
  }

  private drawEnemyBar(e: Enemy) {
    const barX = e.x + (ENEMY_SIZE - ENEMY_BAR_W) / 2;
    const barY = e.y + ENEMY_BAR_Y;
    const ratio = Math.max(0, e.hp / e.maxHp);
    e.hpBar.clear();
    e.hpBar.fillStyle(0x333333);
    e.hpBar.fillRect(barX, barY, ENEMY_BAR_W, ENEMY_BAR_H);
    e.hpBar.fillStyle(0xcc2222);
    e.hpBar.fillRect(barX, barY, ENEMY_BAR_W * ratio, ENEMY_BAR_H);
  }

  // ── Puddle healing ──

  private checkPuddle(delta: number) {
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    for (const p of this.puddleRects) {
      if (cx > p.x && cx < p.x + p.w && cy > p.y && cy < p.y + p.h) {
        this.hp = Math.min(this.maxHp, this.hp + HEAL_PER_SEC * (delta / 1000));
        break;
      }
    }
  }

  // ── Coins ──

  private checkCoins() {
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    const coinReward = this.level >= 15 ? 40 : this.level >= 5 ? 20 : 10;

    for (const c of this.coins) {
      if (c.collected) continue;
      if (dist(cx, cy, c.x + COIN_SIZE / 2, c.y + COIN_SIZE / 2) < COIN_COLLECT_R) {
        c.collected = true;
        c.img.destroy();

        if (c.kind === 'legendary' && c.legendaryName) {
          void unlockLegendaryRunCard(c.legendaryName).catch(() => {
            // silent by design: collectible unlocks are meant to be discovered indirectly in the deck browser
          });
          continue;
        }

        this.coinsCollected += coinReward;
      }
    }
  }

  // ── Camera ──

  private updateCamera(delta: number) {
    // Guard: camera may be destroyed during scene transition
    if (!this.cameras.main) return;

    const cam  = this.cameras.main;
    const camW = cam.width;
    const camH = cam.height;
    const spd  = CAMERA_SCROLL_BASE * Math.min(2.2, 1 + 0.05 * (this.level - 1));
    const maxX = Math.max(0, WORLD_W - camW);
    const maxY = Math.max(0, WORLD_H - camH);

    if (this.leftStart) {
      cam.scrollX = clamp(cam.scrollX + spd * (delta / 1000), 0, maxX);
      cam.scrollY = clamp(this.py + PLAYER_SIZE / 2 - camH / 2, 0, maxY);
      if (cam.scrollX >= this.px) {
        this.deathReason = 'camera';
        this.showGameOver();
      }
    } else {
      cam.scrollX = clamp(this.px + PLAYER_SIZE / 2 - camW / 2, 0, maxX);
      cam.scrollY = clamp(this.py + PLAYER_SIZE / 2 - camH / 2, 0, maxY);
    }
  }

  // ── Win / Lose ──

  private checkEndZone() {
    if (this.waitingForBossTouch) return;
    const ez = this.endZone;
    if (rectsOverlap(this.px, this.py, PLAYER_SIZE, PLAYER_SIZE, ez.x, ez.y, ez.w, ez.h)) {
      this.showLevelComplete();
    }
  }

  private checkHoleDeath() {
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    for (const h of this.holeRects) {
      if (cx > h.x && cx < h.x + h.w && cy > h.y && cy < h.y + h.h) {
        this.deathReason = 'hole';
        this.showGameOver();
        return;
      }
    }
  }

  // ── Stage progression ──

  private advanceStage() {
    const nextStep = this.step + 1;
    const runData: RunData = {
      level: this.level,
      step: nextStep,
      totalCoins: this.totalCoins,
      totalXp: this.totalXp,
      runId: this.runId,
      selectedBoss: this.selectedBoss,
      currentMap: this.activeMap.key,
    };

    if (nextStep >= RUNS_PER_CYCLE) {
      transitionTo(this, 'DuelScene', runData);
    }

    else {
      transitionTo(this, 'RunScene', runData);
    }
  }

  // ── Overlays ──

  private showLevelComplete() {
    if (this.done) return;
    this.done = true;

    // Commit stage completion rewards to RunData
    const collectedThisStage = this.coinsCollected;
    const bonusCoins = this.level >= 15 ? 300 : this.level >= 10 ? 250 : this.level >= 5 ? 150 : 100;
    const bonusXp    = this.level >= 15 ? 500 : this.level >= 10 ? 400 : this.level >= 5 ? 300 : 250;
    this.totalCoins += collectedThisStage + bonusCoins;
    this.totalXp    += bonusXp;
    this.coinsCollected = 0;

    const w  = this.cameras.main.width;
    const h  = this.cameras.main.height;
    const cx = w / 2, cy = h / 2;

    const ov = this.add.graphics().setScrollFactor(0).setDepth(20);
    ov.fillStyle(0x000000, 0.88);
    ov.fillRect(0, 0, w, h);

    const s = Math.floor(this.timer / 1000);
    const timeStr = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    this.add.text(cx, cy - 110, 'Stage Complete!', { fontSize: '28px', color: '#00ff88', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy - 55,  `Time: ${timeStr}`, { fontSize: '28px', color: '#aaffcc', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy - 10,  `+${bonusXp} XP`, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy + 34,  `+${collectedThisStage + bonusCoins} Coins`, { fontSize: '28px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

    const btn = this.add.text(cx, cy + 100, 'Continue', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setColor('#00ff88'))
      .on('pointerout',  () => btn.setColor('#ffffff'))
      .on('pointerdown', () => this.advanceStage());
  }

  endRun() {
    if (this.runEnded) return;
    this.runEnded = true;
    this.done = true;
    // Commit any coins physically collected during the current incomplete stage
    this.totalCoins += this.coinsCollected;
    this.coinsCollected = 0;
    // Chain off runCreationPromise so we never call completeRun before the run ID
    // is assigned from the server (guards the race condition on very fast deaths in step 0).
    const coins = this.totalCoins;
    const xp    = this.totalXp;
    const level = this.level;
    const kills = this.enemiesKilledThisRun;
    this.runCreationPromise.then(() => {
      completeRun(this.runId, coins, xp, level, kills)
        .catch((err: unknown) => console.error('completeRun failed:', err));
    });
    if (this.sidebarNavHandler) {
      window.removeEventListener('sidebar-nav-request', this.sidebarNavHandler);
      this.sidebarNavHandler = null;
    }
  }

  private showGameOver() {
    if (this.done) return;
    // endRun() commits coinsCollected, sets done=true, saves run — display-only after this
    this.endRun();

    const w  = this.cameras.main.width;
    const h  = this.cameras.main.height;
    const cx = w / 2, cy = h / 2;

    const ov = this.add.graphics().setScrollFactor(0).setDepth(20);
    ov.fillStyle(0x000000, 0.88);
    ov.fillRect(0, 0, w, h);

    const reasons: Record<DeathReason, string> = {
      hp:     'Defeated!',
      hole:   'Fell in a Hole!',
      camera: 'Left Behind!',
    };

    this.add.text(cx, cy - 100, reasons[this.deathReason], { fontSize: '48px', color: '#ff4444', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy - 40, `Level ${this.level}`, { fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy, `Total Coins: ${this.totalCoins}  |  Total XP: ${this.totalXp}`, { fontSize: '18px', color: '#ffd700' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);

    const retry = this.add.text(cx, cy + 50, 'Try Again', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => retry.setColor('#00ff88'))
      .on('pointerout',  () => retry.setColor('#ffffff'))
      .on('pointerdown', () => transitionTo(this, 'RunScene', { level: 1, step: 0, totalCoins: 0, totalXp: 0, runId: 0 }));

    const menu = this.add.text(cx, cy + 120, 'Menu', { fontSize: '24px', color: '#888888' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menu.setColor('#ffffff'))
      .on('pointerout',  () => menu.setColor('#888888'))
      .on('pointerdown', () => { this.time.delayedCall(100, () => { transitionTo(this, 'MenuScene'); }); });
  }
}