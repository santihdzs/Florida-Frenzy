import Phaser from 'phaser';
import evTilesUrl from '../assets/maps/everglades.png';
import { completeRun, createRun, getPlayer } from '../utils/auth.js';

const TILE    = 48;
const COLS    = 105;
const ROWS    = 18;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;

const KEY_SPR_PLAYER     = 'spr-player';
const KEY_SPR_ENEMY      = 'spr-enemy';
const KEY_SPR_TANK       = 'spr-tank';
const KEY_SPR_SWIFT      = 'spr-swift';
const KEY_SPR_COIN       = 'spr-coin';
const KEY_SPR_PROJECTILE = 'spr-projectile';
const KEY_SPR_ENEMY_PROJ = 'spr-enemy-proj';

const KEY_EV_TILES       = 'ev-tiles';
const FRAME_GRASS        = 75;
const FRAME_BARRIER      = 32;
const FRAME_WATER_LIGHT  = 290;
const FRAME_HOLE         = 8;

const PLAYER_SIZE   = 48;
const PLAYER_SPEED  = 220;
const PLAYER_SPRINT = 340;
const MAX_HP        = 100;

const STAMINA_MAX         = 100;
const STAMINA_DRAIN       = 40;
const STAMINA_REGEN       = 25;
const STAMINA_REGEN_DELAY = 10000;

const ENEMY_SIZE      = 48;
const ENEMY_SPEED     = 75;
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
const COIN_VALUE     = 10;
const COIN_COLLECT_R = 24;

const PROJ_SIZE  = 8;
const PROJ_SPEED = 420;
const PROJ_DMG   = 20;

const HEAL_PER_SEC = 12;

const CAMERA_SCROLL_BASE = 30;

const EVERGLADES_PER_CYCLE = 3;
const END_COL         = COLS - 5;
const START_COLS      = 4;

const FLOOR   = 0;
const BARRIER = 1;
const HOLE    = 2;
const PUDDLE  = 3;

const BARRIER_SEEDS = 22;
const HOLE_SEEDS    = 7;
const PUDDLE_SEEDS  = 2;

const BASE_XP             = 100;
const BASE_COINS          = 50;
const TIME_BONUS_INTERVAL = 5;
const TIME_BONUS_XP       = 10;
const TIME_BONUS_COINS    = 5;

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

interface Enemy {
  x: number; y: number;
  hp: number;
  maxHp: number;
  speed: number;
  contactDmgRate: number; // damage/sec on contact; 0 for SHOOTER
  enemyType: EnemyType;
  shootTimer: number;     // ms until next shot (SHOOTER only)
  img: Phaser.GameObjects.Image;
  hpBar: Phaser.GameObjects.Graphics;
  pathTimer: number;
  path: GridCell[];
  pathIdx: number;
}

interface Coin {
  x: number; y: number;
  img: Phaser.GameObjects.Image;
  collected: boolean;
}

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
  const contactDmgRate = ENEMY_DPS * Math.min(4.5, 3 * Math.pow(1.03, la));
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
}

export class EvergladesScene extends Phaser.Scene {

  private px = 0;
  private py = 0;
  private maxHp = MAX_HP;
  private hp = MAX_HP;
  private playerImg!: Phaser.GameObjects.Image;
  private sprinting = false;
  private stamina = STAMINA_MAX;
  private lastSprintTime = -STAMINA_REGEN_DELAY;

  private level = 0;
  private step = 0;
  private runId = 0;
  private totalCoins = 0;
  private totalXp = 0;
  private leftStart = false;
  private done = false;
  private isShowingQuitDialog = false;
  private sidebarNavHandler: EventListener | null = null;
  private timer = 0;
  private coinsCollected = 0;
  private deathReason: DeathReason = 'hp';

  private grid: number[][] = [];
  private barrierRects: Rect[] = [];
  private holeRects:    Rect[] = [];
  private puddleRects:  Rect[] = [];
  private endZone: Rect = { x: 0, y: 0, w: 0, h: 0 };

  private enemies:          Enemy[]           = [];
  private coins:            Coin[]            = [];
  private projectiles:      Projectile[]      = [];
  private enemyProjectiles: EnemyProjectile[] = [];

  private hudContainer!: Phaser.GameObjects.Container;
  private hpBar!:      Phaser.GameObjects.Graphics;
  private hpLabel!:    Phaser.GameObjects.Text;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private coinText!:   Phaser.GameObjects.Text;

  private cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!:     Phaser.Input.Keyboard.Key;
  private keyA!:     Phaser.Input.Keyboard.Key;
  private keyS!:     Phaser.Input.Keyboard.Key;
  private keyD!:     Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyP!:     Phaser.Input.Keyboard.Key;

  constructor() { super({ key: 'EvergladesScene' }); }

  init(data: Partial<RunData>) {
    this.level          = data.level ?? 1;
    this.step           = data.step ?? 0;
    this.runId          = data.runId ?? 0;
    this.totalCoins     = data.totalCoins ?? 0;
    this.totalXp        = data.totalXp ?? 0;
    this.done           = false;
    this.maxHp          = (getPlayer()?.maxHp as number | undefined) ?? 50;
    this.hp             = this.maxHp;
    this.stamina        = STAMINA_MAX;
    this.lastSprintTime = -STAMINA_REGEN_DELAY;
    this.sprinting      = false;
    this.leftStart      = false;
    this.timer          = 0;
    this.coinsCollected = 0;
    this.deathReason    = 'hp';
    this.barrierRects   = [];
    this.holeRects      = [];
    this.puddleRects    = [];
    this.enemies          = [];
    this.coins            = [];
    this.projectiles      = [];
    this.enemyProjectiles = [];

    // Create a server-side run record at the start of each new run
    if (this.level === 1 && this.step === 0) {
      void createRun().then(id => { this.runId = id ?? 0; });
    }
  }

  preload() {
    this.load.spritesheet(KEY_EV_TILES, evTilesUrl, { frameWidth: 16, frameHeight: 16 });
  }

  create() {
    console.log('EvergladesScene create() called');
    console.log('Active scenes:', this.scene.manager.getScenes(true).map((s: Phaser.Scene) => s.scene.key));

    // Reset all flags — these persist across scene restarts since Phaser reuses the instance
    this.done = false;
    this.isShowingQuitDialog = false;
    this.sidebarNavHandler = null;

    this.cameras.main.setBackgroundColor(0x1a1a2e);
    this.generateTextures();

    this.grid = this.generateGrid();
    this.buildWorld(this.grid);
    this.spawnEnemies(this.grid);
    this.spawnCoins(this.grid);

    this.px = TILE * 2;
    this.py = Math.floor(ROWS / 2) * TILE;
    this.playerImg = this.add.image(this.px, this.py, KEY_SPR_PLAYER)
      .setOrigin(0, 0).setDepth(5);

    this.buildHud();
    this.setupInput();

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); // key for opening the pause menu
    escKey?.on('down', () => {
      if (this.scene.isActive('PauseScene')) return; // prevent opening multiple pause menus
      this.scene.pause(); // pause the duel scene
      this.scene.launch('PauseScene', { returnScene: 'EvergladesScene', runId: this.runId, totalCoins: this.totalCoins + this.coinsCollected, totalXp: this.totalXp, level: this.level }); // open the pause menu and tell it to return here when resuming
    });

    const pauseButton = this.add.text(20, 20, 'PAUSE', {
      fontSize: '28px',
      color: '#feec00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { left: 10, right: 10, top: 4, bottom: 4 },
    }).setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true }); // on-screen pause button in the top-left corner

    pauseButton.on('pointerdown', () => {
      if (this.scene.isActive('PauseScene')) return; // prevent opening multiple pause menus
      this.scene.launch('PauseScene', { returnScene: 'EvergladesScene', runId: this.runId, totalCoins: this.totalCoins + this.coinsCollected, totalXp: this.totalXp, level: this.level }); // open the pause menu and tell it to return here when resuming
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

  update(time: number, delta: number) {
    if (this.done) return;
    if (this.isShowingQuitDialog) return;
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

  private getRunData(): RunData {
    const { xp, coins } = this.calculateRewards();
    return {
      level: this.level,
      step: this.step,
      totalCoins: this.totalCoins + coins,
      totalXp: this.totalXp + xp,
      runId: this.runId,
    };
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
    make(KEY_SPR_PLAYER,     PLAYER_SIZE, PLAYER_SIZE, 0x3366ff);
    make(KEY_SPR_ENEMY,      ENEMY_SIZE,  ENEMY_SIZE,  0xcc2222);
    make(KEY_SPR_TANK,       ENEMY_SIZE,  ENEMY_SIZE,  0x9933cc);
    make(KEY_SPR_SWIFT,      ENEMY_SIZE,  ENEMY_SIZE,  0xff8800);
    make(KEY_SPR_COIN,       COIN_SIZE,   COIN_SIZE,   0xffd700);
    make(KEY_SPR_PROJECTILE, PROJ_SIZE,   PROJ_SIZE,   0x44aaff);
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
    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, KEY_EV_TILES, FRAME_GRASS)
      .setOrigin(0, 0).setDepth(0).setTileScale(TILE / 16, TILE / 16);

    const gfx = this.add.graphics().setDepth(1);
    gfx.fillStyle(0x336677, 0.3);
    gfx.fillRect(0, 0, START_COLS * TILE, WORLD_H);
    gfx.fillStyle(0x0e2e1a);
    gfx.fillRect(END_COL * TILE, 0, (COLS - END_COL) * TILE, WORLD_H);

    this.endZone = {
      x: END_COL * TILE, y: 0,
      w: (COLS - END_COL) * TILE, h: WORLD_H,
    };

    this.add.text(
      END_COL * TILE + ((COLS - END_COL) * TILE) / 2, WORLD_H / 2,
      'EXIT', { fontSize: '26px', color: '#8fcc60', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(1);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = grid[row][col];
        const px   = col * TILE;
        const py   = row * TILE;

        if (tile === BARRIER) {
          this.add.image(px, py, KEY_EV_TILES, FRAME_BARRIER)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(2);
          this.barrierRects.push({ x: px, y: py, w: TILE, h: TILE });

        } else if (tile === HOLE) {
          const nb = this.tileNeighbors(grid, row, col, HOLE);
          this.add.image(px, py, KEY_EV_TILES, FRAME_HOLE)
            .setOrigin(0, 0).setDisplaySize(TILE, TILE).setDepth(2);
          this.holeRects.push({
            x: nb.w ? px       : px + 8,
            y: nb.n ? py       : py + 8,
            w: TILE - (nb.w ? 0 : 8) - (nb.e ? 0 : 8),
            h: TILE - (nb.n ? 0 : 8) - (nb.s ? 0 : 8),
          });

        } else if (tile === PUDDLE) {
          this.add.image(px, py, KEY_EV_TILES, FRAME_WATER_LIGHT)
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
      const imgKey = type === EnemyType.TANK  ? KEY_SPR_TANK :
                     type === EnemyType.SWIFT ? KEY_SPR_SWIFT : KEY_SPR_ENEMY;

      this.enemies.push({
        x: ex, y: ey,
        hp: s.hp, maxHp: s.maxHp,
        speed: s.speed,
        contactDmgRate: s.contactDmgRate,
        enemyType: type,
        shootTimer: Math.random() * SHOOTER_FIRE_INTERVAL, // stagger initial shots
        img: this.add.image(ex, ey, imgKey).setOrigin(0, 0).setDepth(4),
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

    while (placed < count && attempts < 500) {
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
      });
      placed++;
    }
  }

  // ── HUD ──

  private buildHud() {
    const BAR_X = 50;

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.55);
    panel.fillRoundedRect(0, 0, 250, 90, 8);

    const avatar = this.add.graphics();
    avatar.fillStyle(0x4455aa);
    avatar.fillCircle(25, 45, 20);
    avatar.lineStyle(2, 0x8899cc);
    avatar.strokeCircle(25, 45, 20);

    this.hpBar      = this.add.graphics();
    this.staminaBar = this.add.graphics();
    this.hpLabel    = this.add.text(BAR_X, 6, '', { fontSize: '11px', color: '#dddddd' });
    this.coinText   = this.add.text(BAR_X, 62, '', { fontSize: '12px', color: '#ffd700' });

    this.hudContainer = this.add.container(10, 648, [
      panel, avatar, this.hpBar, this.staminaBar, this.hpLabel, this.coinText,
    ]);
    this.hudContainer.setScrollFactor(0).setDepth(10);

    this.add.text(1190, 740, `Level ${this.level}`, {
      fontSize: '14px', color: '#c0ccd8',
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(12);

    this.refreshHud();
  }

  private refreshHud() {
    const BAR_X = 50;
    const BAR_W = 182;

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const hpCol   = hpRatio > 0.5 ? 0x44cc66 : hpRatio > 0.25 ? 0xffaa00 : 0xff3333;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRoundedRect(BAR_X, 22, BAR_W, 12, 3);
    this.hpBar.fillStyle(hpCol);
    this.hpBar.fillRoundedRect(BAR_X, 22, BAR_W * hpRatio, 12, 3);
    this.hpLabel.setText(`HP  ${Math.ceil(this.hp)} / ${this.maxHp}`);

    const stRatio = this.stamina / STAMINA_MAX;
    const stCol   = this.sprinting ? 0xffcc00 : 0x5599ff;
    this.staminaBar.clear();
    this.staminaBar.fillStyle(0x333333);
    this.staminaBar.fillRoundedRect(BAR_X, 40, BAR_W, 8, 2);
    this.staminaBar.fillStyle(stCol);
    this.staminaBar.fillRoundedRect(BAR_X, 40, BAR_W * stRatio, 8, 2);

    this.coinText.setText(`Coins: ${this.totalCoins + this.coinsCollected}`);
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
      if (!this.done) this.advanceStage();
    });

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (!this.done) this.fireProjectile(ptr);
    });
  }

  // ── Movement & collision ──

  private handleMovement(time: number, delta: number) {
    const dt = delta / 1000;

    const movingX = this.cursors.left.isDown || this.keyA.isDown ||
                    this.cursors.right.isDown || this.keyD.isDown;
    const movingY = this.cursors.up.isDown || this.keyW.isDown ||
                    this.cursors.down.isDown || this.keyS.isDown;

    this.sprinting = this.keyShift.isDown && this.stamina > 0 && (movingX || movingY);

    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * dt);
      this.lastSprintTime = time;
    } else if (time - this.lastSprintTime >= STAMINA_REGEN_DELAY) {
      this.stamina = Math.min(STAMINA_MAX, this.stamina + STAMINA_REGEN * dt);
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

    const rightLimit = this.cameras.main.scrollX + this.cameras.main.width - PLAYER_SIZE;
    if (this.px > rightLimit) this.px = rightLimit;

    this.playerImg.setPosition(this.px, this.py);

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

  private fireProjectile(ptr: Phaser.Input.Pointer) {
    const wx = ptr.x + this.cameras.main.scrollX;
    const wy = ptr.y + this.cameras.main.scrollY;
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;

    const raw = Math.atan2(wy - cy, wx - cx);
    const ang = Math.round(raw / (Math.PI / 4)) * (Math.PI / 4);

    this.projectiles.push({
      x: cx - PROJ_SIZE / 2,
      y: cy - PROJ_SIZE / 2,
      vx: Math.cos(ang) * PROJ_SPEED,
      vy: Math.sin(ang) * PROJ_SPEED,
      img: this.add.image(cx, cy, KEY_SPR_PROJECTILE).setOrigin(0.5).setDepth(6),
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
              e.hp -= PROJ_DMG;
              if (e.hp <= 0) {
                e.img.destroy();
                e.hpBar.destroy();
                this.enemies.splice(j, 1);
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
    const scaledDmg = ENEMY_PROJ_DMG * Math.min(2, Math.pow(1.05, Math.floor((this.level - 1) / 3)));
    this.enemyProjectiles.push({
      x: ex - ENEMY_PROJ_SIZE / 2,
      y: ey - ENEMY_PROJ_SIZE / 2,
      vx: (dx / d) * ENEMY_PROJ_SPEED,
      vy: (dy / d) * ENEMY_PROJ_SPEED,
      dmg: scaledDmg,
      img: this.add.image(ex, ey, KEY_SPR_ENEMY_PROJ).setOrigin(0.5).setDepth(6),
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
        }
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
    for (const c of this.coins) {
      if (c.collected) continue;
      if (dist(cx, cy, c.x + COIN_SIZE / 2, c.y + COIN_SIZE / 2) < COIN_COLLECT_R) {
        c.collected = true;
        c.img.destroy();
        this.coinsCollected += COIN_VALUE;
      }
    }
  }

  // ── Camera ──

  private updateCamera(delta: number) {
    const cam  = this.cameras.main;
    const camW = cam.width;
    const camH = cam.height;
    const spd  = CAMERA_SCROLL_BASE * Math.min(3.5, 1 + 0.05 * (this.level - 1));
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

  private calculateRewards() {
    const secs = this.timer / 1000;
    const intervals = secs < 60 ? Math.floor((60 - secs) / TIME_BONUS_INTERVAL) : 0;
    return {
      xp:    BASE_XP + intervals * TIME_BONUS_XP + 50 + (this.level * 25),
      coins: BASE_COINS + intervals * TIME_BONUS_COINS + this.coinsCollected,
    };
  }

  // ── Stage progression ──

  private advanceStage() {
    const run = this.getRunData();
    const nextStep = this.step + 1;
    if (nextStep >= EVERGLADES_PER_CYCLE) {
      this.scene.start('DuelScene', { ...run, step: nextStep });
    } else {
      this.scene.start('EvergladesScene', { ...run, step: nextStep });
    }
  }

  // ── Overlays ──

  private showLevelComplete() {
    if (this.done) return;
    this.done = true;

    const { xp, coins } = this.calculateRewards();
    const w  = this.cameras.main.width;
    const h  = this.cameras.main.height;
    const cx = w / 2, cy = h / 2;

    const ov = this.add.graphics().setScrollFactor(0).setDepth(20);
    ov.fillStyle(0x000000, 0.88);
    ov.fillRect(0, 0, w, h);

    const s = Math.floor(this.timer / 1000);
    const timeStr = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    this.add.text(cx, cy - 110, 'Level Complete!', { fontSize: '28px', color: '#00ff88', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy - 55,  `Time: ${timeStr}`, { fontSize: '28px', color: '#aaffcc', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy - 10,  `+${xp} XP`, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy + 34,  `+${coins} Coins`, { fontSize: '28px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

    const btn = this.add.text(cx, cy + 100, 'Continue', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setColor('#00ff88'))
      .on('pointerout',  () => btn.setColor('#ffffff'))
      .on('pointerdown', () => this.advanceStage());
  }

  endRun() {
    console.log('endRun() called, runId:', this.runId);
    if (this.done) return;
    this.done = true;
    // Use committed totals only — current incomplete stage coins/XP are discarded on quit/death
    console.log('completeRun args:', { runId: this.runId, coins: this.totalCoins, xp: this.totalXp, maxLevel: this.level });
    completeRun(this.runId, this.totalCoins, this.totalXp, this.level)
      .catch((err: unknown) => console.error('completeRun failed:', err));
    if (this.sidebarNavHandler) {
      window.removeEventListener('sidebar-nav-request', this.sidebarNavHandler);
      this.sidebarNavHandler = null;
    }
  }

  private showGameOver() {
    if (this.done) return;
    this.endRun();

    const run = this.getRunData();
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
    this.add.text(cx, cy, `Total Coins: ${run.totalCoins}  |  Total XP: ${run.totalXp}`, { fontSize: '18px', color: '#ffd700' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);

    const retry = this.add.text(cx, cy + 50, 'Try Again', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => retry.setColor('#00ff88'))
      .on('pointerout',  () => retry.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.start('EvergladesScene', { level: 1, step: 0, totalCoins: 0, totalXp: 0, runId: 0 }));

    const menu = this.add.text(cx, cy + 120, 'Menu', { fontSize: '24px', color: '#888888' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menu.setColor('#ffffff'))
      .on('pointerout',  () => menu.setColor('#888888'))
      .on('pointerdown', () => { this.time.delayedCall(100, () => { this.scene.start('MenuScene'); }); });
  }
}