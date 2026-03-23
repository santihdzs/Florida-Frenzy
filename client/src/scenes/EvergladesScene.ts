import Phaser from 'phaser';
import { rectIntersect } from '../physics/customPhysics';

// ── World ──────────────────────────────────────────────────────────────────────
const TILE    = 48;
const COLS    = 100;
const ROWS    = 15;
const WORLD_W = COLS * TILE;   // 4800
const WORLD_H = ROWS * TILE;   // 720

// ── Texture keys & canonical dimensions ───────────────────────────────────────
// To replace a placeholder with a real sprite:
//   1. Add  this.load.image(KEY_*, 'assets/...') in preload()
//   2. Remove the corresponding make() call in generateTextures()
//   3. Everything else stays the same.
//
// Tile sprites:   48 × 48  (one grid cell)
// Player sprite:  20 × 40  (~½ tile wide, ~1 tile tall; half-height when crouching)
// Enemy sprite:   20 × 40
// Coin sprite:    16 × 16  (⅓ tile — classic coin)
// Projectile:      8 ×  8
const KEY_TILE_FLOOR    = 'tile-floor';
const KEY_TILE_BARRIER  = 'tile-barrier';
const KEY_TILE_HOLE     = 'tile-hole';
const KEY_TILE_PUDDLE   = 'tile-puddle';
const KEY_TILE_EXIT     = 'tile-exit';
const KEY_SPR_PLAYER    = 'spr-player';
const KEY_SPR_ENEMY     = 'spr-enemy';
const KEY_SPR_COIN      = 'spr-coin';
const KEY_SPR_PROJECTILE = 'spr-projectile';

const TEX_TILE_W  = TILE;
const TEX_TILE_H  = TILE;
const TEX_PLAYER_W = 20;
const TEX_PLAYER_H = 40;
const TEX_ENEMY_W  = 20;
const TEX_ENEMY_H  = 40;
const TEX_COIN_W   = 16;
const TEX_COIN_H   = 16;
const TEX_PROJ_W   =  8;
const TEX_PROJ_H   =  8;

// ── Player ─────────────────────────────────────────────────────────────────────
const PLAYER_W     = TEX_PLAYER_W;
const PLAYER_H     = TEX_PLAYER_H;
const PLAYER_SPEED = 220;
const MAX_HP       = 100;
const CROUCH_H     = PLAYER_H / 2;   // hitbox height while crouching

// ── Enemies ────────────────────────────────────────────────────────────────────
const ENEMY_W         = TEX_ENEMY_W;
const ENEMY_H         = TEX_ENEMY_H;
const ENEMY_SPEED     = 75;
const ENEMY_DAMAGE    = 10;
const ENEMY_COUNT_MIN = 3;
const ENEMY_COUNT_MAX = 6;

// ── Healing (puddle) ───────────────────────────────────────────────────────────
const HEAL_PER_SEC = 12;

// ── Camera ─────────────────────────────────────────────────────────────────────
const CAMERA_SCROLL_SPEED = 60;  // px / s after leaving start zone

// ── Game loop ──────────────────────────────────────────────────────────────────
const LEVELS_PER_DUEL = 3;
const END_COL         = COLS - 5;
const START_COLS      = 4;

// ── Tile IDs ───────────────────────────────────────────────────────────────────
const FLOOR   = 0;
const BARRIER = 1;
const HOLE    = 2;
const PUDDLE  = 3;

// ── World generation ───────────────────────────────────────────────────────────
const BARRIER_SEEDS = 20;
const HOLE_SEEDS    =  7;
const PUDDLE_SEEDS  =  4;

// ── XP / Coins ─────────────────────────────────────────────────────────────────
const BASE_XP             = 100;
const BASE_COINS          =  50;
const TIME_BONUS_INTERVAL =   5;   // every 5 s under 1 min
const TIME_BONUS_XP       =  10;
const TIME_BONUS_COINS    =   5;

// ── In-level coins ─────────────────────────────────────────────────────────────
const COIN_COUNT_MIN  =  8;
const COIN_COUNT_MAX  = 15;
const COIN_VALUE      =  5;
const COIN_COLLECT_R  = 20;  // pick-up radius (px)

// ── Projectile ─────────────────────────────────────────────────────────────────
const PROJ_SPEED = 420;

// ── Types ──────────────────────────────────────────────────────────────────────
type Rect = { x: number; y: number; w: number; h: number };

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  img: Phaser.GameObjects.Image;
  touching: boolean;   // true while overlapping the player this frame
  dirTimer: number;
}

interface Coin {
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  collected: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  img: Phaser.GameObjects.Image;
  dead: boolean;
}

// ── Scene ──────────────────────────────────────────────────────────────────────
export class EvergladesScene extends Phaser.Scene {

  // player state ----------------------------------------------------------------
  private playerX  = 0;
  private playerY  = 0;    // top of the FULL (standing) bounding box; feet = playerY + PLAYER_H
  private playerHp = MAX_HP;
  private playerImg!: Phaser.GameObjects.Image;
  private isCrouching = false;

  // level state -----------------------------------------------------------------
  private levelCount     = 0;
  private levelStartX    = 0;
  private levelStartY    = 0;
  private leftStartZone  = false;
  private done           = false;
  private levelTimer     = 0;    // ms elapsed this level
  private collectedCoins = 0;

  // world geometry (built from grid) --------------------------------------------
  private obstacleRects: Rect[] = [];
  private holeRects:     Rect[] = [];
  private puddleRects:   Rect[] = [];
  private endRect:       Rect   = { x: 0, y: 0, w: 0, h: 0 };

  // entities --------------------------------------------------------------------
  private enemies:     Enemy[]      = [];
  private coins:       Coin[]       = [];
  private projectiles: Projectile[] = [];

  // HUD -------------------------------------------------------------------------
  private hpBar!:         Phaser.GameObjects.Graphics;
  private hpLabel!:       Phaser.GameObjects.Text;
  private timerText!:     Phaser.GameObjects.Text;
  private coinCountText!: Phaser.GameObjects.Text;

  // input -----------------------------------------------------------------------
  private cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!:     Phaser.Input.Keyboard.Key;
  private keyA!:     Phaser.Input.Keyboard.Key;
  private keyS!:     Phaser.Input.Keyboard.Key;
  private keyD!:     Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'EvergladesScene' });
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────

  init(data: { levelCount?: number }) {
    this.levelCount     = data.levelCount ?? 0;
    this.done           = false;
    this.playerHp       = MAX_HP;
    this.obstacleRects  = [];
    this.holeRects      = [];
    this.puddleRects    = [];
    this.enemies        = [];
    this.coins          = [];
    this.projectiles    = [];
    this.isCrouching    = false;
    this.leftStartZone  = false;
    this.levelTimer     = 0;
    this.collectedCoins = 0;
  }

  // Add real sprite loads here when assets are ready, e.g.:
  //   this.load.image(KEY_SPR_PLAYER, 'assets/sprites/player.png');
  // Then remove the corresponding make() call inside generateTextures().
  preload() { /* intentionally empty until real assets land */ }

  create() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.generateTextures();

    const grid = this.generateGrid();
    this.buildWorld(grid);
    this.spawnEnemies(grid);
    this.spawnCoins(grid);

    this.playerX     = TILE * 2;
    this.playerY     = Math.floor(ROWS / 2) * TILE + (TILE - PLAYER_H) / 2;
    this.levelStartX = this.playerX;
    this.levelStartY = this.playerY;

    this.playerImg = this.add.image(this.playerX, this.playerY, KEY_SPR_PLAYER)
      .setOrigin(0, 0)
      .setDepth(5);

    this.buildHud();
    this.setupInput();
  }

  update(_time: number, delta: number) {
    if (this.done) return;
    this.levelTimer += delta;
    this.handleCrouch();
    this.handleMovement(delta);
    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.checkPuddle(delta);
    this.checkCoins();
    this.updateCamera(delta);
    this.checkEndZone();
    this.checkHoleDeath();
    this.refreshHud();
  }

  // ── placeholder textures ───────────────────────────────────────────────────
  // Solid-colour rectangles at the correct canonical dimensions.
  // Swap any of these out by loading a real image with the same key in preload().

  private generateTextures() {
    const make = (key: string, w: number, h: number, color: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(color);
      g.fillRect(0, 0, w, h);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // Tiles  (48 × 48)
    make(KEY_TILE_FLOOR,   TEX_TILE_W, TEX_TILE_H, 0x3d7030);  // grass green
    make(KEY_TILE_BARRIER, TEX_TILE_W, TEX_TILE_H, 0x6b4a1e);  // bark brown
    make(KEY_TILE_HOLE,    TEX_TILE_W, TEX_TILE_H, 0x111111);  // void black
    make(KEY_TILE_PUDDLE,  TEX_TILE_W, TEX_TILE_H, 0x1a6644);  // swamp water
    make(KEY_TILE_EXIT,    TEX_TILE_W, TEX_TILE_H, 0x0e2e1a);  // cypress dark

    // Entities
    make(KEY_SPR_PLAYER,     TEX_PLAYER_W, TEX_PLAYER_H, 0x3366ff);  // blue
    make(KEY_SPR_ENEMY,      TEX_ENEMY_W,  TEX_ENEMY_H,  0xcc2222);  // red
    make(KEY_SPR_COIN,       TEX_COIN_W,   TEX_COIN_H,   0xffd700);  // gold
    make(KEY_SPR_PROJECTILE, TEX_PROJ_W,   TEX_PROJ_H,   0x44aaff);  // water blue
  }

  // ── grid generation ────────────────────────────────────────────────────────

  private generateGrid(): number[][] {
    const grid: number[][] = Array.from({ length: ROWS }, () =>
      new Array<number>(COLS).fill(FLOOR),
    );

    // 3-tile-wide zigzag path — always traversable
    const onPath: boolean[][] = Array.from({ length: ROWS }, () =>
      new Array<boolean>(COLS).fill(false),
    );
    let pathRow = Math.floor(ROWS / 2);
    for (let col = 0; col < COLS; col++) {
      for (let dr = -1; dr <= 1; dr++) {
        const r = pathRow + dr;
        if (r >= 0 && r < ROWS) onPath[r][col] = true;
      }
      if (col > 4 && col < COLS - 5) {
        const roll = Math.random();
        if      (roll < 0.2 && pathRow > 3)        pathRow--;
        else if (roll < 0.4 && pathRow < ROWS - 4)  pathRow++;
      }
    }

    const safe    = (r: number, c: number) =>
      onPath[r][c] || c < START_COLS || c >= END_COL;
    const blocked = (r: number, c: number) =>
      safe(r, c) || grid[r][c] !== FLOOR;

    for (let i = 0; i < BARRIER_SEEDS; i++) {
      const sr = Phaser.Math.Between(0, ROWS - 1);
      const sc = Phaser.Math.Between(START_COLS, END_COL - 2);
      if (!blocked(sr, sc))
        this.growCluster(grid, sr, sc, BARRIER, Phaser.Math.Between(3, 9), blocked);
    }
    for (let i = 0; i < HOLE_SEEDS; i++) {
      const sr = Phaser.Math.Between(0, ROWS - 1);
      const sc = Phaser.Math.Between(START_COLS, END_COL - 2);
      if (!blocked(sr, sc))
        this.growCluster(grid, sr, sc, HOLE, Phaser.Math.Between(1, 3), blocked);
    }
    for (let i = 0; i < PUDDLE_SEEDS; i++) {
      const sr = Phaser.Math.Between(1, ROWS - 2);
      const sc = Phaser.Math.Between(10, END_COL - 10);
      if (!blocked(sr, sc))
        this.growCluster(grid, sr, sc, PUDDLE, Phaser.Math.Between(3, 8), blocked);
    }

    return grid;
  }

  private growCluster(
    grid: number[][], sr: number, sc: number,
    type: number, size: number,
    blocked: (r: number, c: number) => boolean,
  ) {
    const frontier: { r: number; c: number }[] = [{ r: sr, c: sc }];
    const visited = new Set<string>([`${sr},${sc}`]);
    let placed = 0;

    while (placed < size && frontier.length > 0) {
      const idx      = Math.floor(Math.random() * frontier.length);
      const { r, c } = frontier.splice(idx, 1)[0];
      if (blocked(r, c)) continue;
      grid[r][c] = type;
      placed++;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const nr = r + dr, nc = c + dc;
        const key = `${nr},${nc}`;
        if (!visited.has(key) && nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          visited.add(key);
          frontier.push({ r: nr, c: nc });
        }
      }
    }
  }

  // ── world construction ─────────────────────────────────────────────────────
  // One Image per tile — static, depth-0, WebGL-batched by texture key.
  // Swap tile visuals by replacing the placeholder texture with a real image.

  private buildWorld(grid: number[][]) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = grid[row][col];
        const key  =
          col >= END_COL   ? KEY_TILE_EXIT    :
          tile === BARRIER ? KEY_TILE_BARRIER :
          tile === HOLE    ? KEY_TILE_HOLE    :
          tile === PUDDLE  ? KEY_TILE_PUDDLE  :
          KEY_TILE_FLOOR;

        this.add.image(col * TILE, row * TILE, key).setOrigin(0, 0).setDepth(0);

        const px = col * TILE, py = row * TILE;
        if (tile === BARRIER) {
          this.obstacleRects.push({ x: px, y: py, w: TILE, h: TILE });
        } else if (tile === HOLE) {
          // Shrink hitbox so the player must be mostly inside before falling
          this.holeRects.push({ x: px + 8, y: py + 8, w: TILE - 16, h: TILE - 16 });
        } else if (tile === PUDDLE) {
          this.puddleRects.push({ x: px, y: py, w: TILE, h: TILE });
        }
      }
    }

    this.endRect = {
      x: END_COL * TILE, y: 0,
      w: (COLS - END_COL) * TILE, h: WORLD_H,
    };

    this.add.text(
      END_COL * TILE + ((COLS - END_COL) * TILE) / 2, WORLD_H / 2,
      'EXIT', { fontSize: '26px', color: '#8fcc60', fontStyle: 'bold' },
    ).setOrigin(0.5).setDepth(1);
  }

  // ── entity spawning ────────────────────────────────────────────────────────

  private spawnEnemies(grid: number[][]) {
    const count = Phaser.Math.Between(ENEMY_COUNT_MIN, ENEMY_COUNT_MAX);
    let placed = 0, attempts = 0;

    while (placed < count && attempts < 300) {
      attempts++;
      const col = Phaser.Math.Between(10, END_COL - 2);
      const row = Phaser.Math.Between(0, ROWS - 1);
      if (grid[row][col] !== FLOOR) continue;

      const angle = Math.random() * Math.PI * 2;
      const ex    = col * TILE + (TILE - ENEMY_W) / 2;
      const ey    = row * TILE + (TILE - ENEMY_H) / 2;
      this.enemies.push({
        x: ex, y: ey,
        vx: Math.cos(angle) * ENEMY_SPEED,
        vy: Math.sin(angle) * ENEMY_SPEED,
        img: this.add.image(ex, ey, KEY_SPR_ENEMY).setOrigin(0, 0).setDepth(4),
        touching: false,
        dirTimer: Phaser.Math.Between(1000, 3000),
      });
      placed++;
    }
  }

  private spawnCoins(grid: number[][]) {
    const count = Phaser.Math.Between(COIN_COUNT_MIN, COIN_COUNT_MAX);
    let placed = 0, attempts = 0;

    while (placed < count && attempts < 500) {
      attempts++;
      const col = Phaser.Math.Between(START_COLS + 1, END_COL - 2);
      const row = Phaser.Math.Between(0, ROWS - 1);
      if (grid[row][col] !== FLOOR) continue;

      const cx = col * TILE + (TILE - TEX_COIN_W) / 2;
      const cy = row * TILE + (TILE - TEX_COIN_H) / 2;
      this.coins.push({
        x: cx, y: cy,
        img: this.add.image(cx, cy, KEY_SPR_COIN).setOrigin(0, 0).setDepth(2),
        collected: false,
      });
      placed++;
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  private buildHud() {
    const w = this.cameras.main.width;

    this.add.text(16, 12, `Level ${this.levelCount + 1}`, {
      fontSize: '16px', color: '#ffffff',
      backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(10);

    this.hpBar   = this.add.graphics().setScrollFactor(0).setDepth(10);
    this.hpLabel = this.add.text(w / 2, 38, '', { fontSize: '13px', color: '#ffffff' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(11);

    this.timerText = this.add.text(w - 16, 12, '0:00', {
      fontSize: '18px', color: '#ffffaa',
      backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    this.coinCountText = this.add.text(w - 16, 44, 'Coins: 0', {
      fontSize: '14px', color: '#ffd700',
      backgroundColor: '#00000099', padding: { x: 4, y: 2 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    this.refreshHud();
  }

  private refreshHud() {
    const cx    = this.cameras.main.width / 2;
    const barW  = 200, barH = 18;
    const bx    = cx - barW / 2, by = 12;
    const ratio = Math.max(0, this.playerHp / MAX_HP);
    const col   = ratio > 0.5 ? 0x44cc66 : ratio > 0.25 ? 0xffaa00 : 0xff3333;

    this.hpBar.clear();
    this.hpBar.fillStyle(0x222222);
    this.hpBar.fillRoundedRect(bx - 2, by - 2, barW + 4, barH + 4, 4);
    this.hpBar.fillStyle(col);
    this.hpBar.fillRoundedRect(bx, by, barW * ratio, barH, 3);
    this.hpBar.lineStyle(1, 0xffffff, 0.4);
    this.hpBar.strokeRoundedRect(bx, by, barW, barH, 3);
    this.hpLabel.setText(`HP  ${Math.ceil(this.playerHp)} / ${MAX_HP}`);

    const s = Math.floor(this.levelTimer / 1000);
    this.timerText.setText(`${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`);
    this.coinCountText.setText(`Coins: ${this.collectedCoins}`);
  }

  // ── input ──────────────────────────────────────────────────────────────────

  private setupInput() {
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.keyW     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyShift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (!this.done) this.fireProjectile(ptr);
    });
  }

  // ── crouch ─────────────────────────────────────────────────────────────────

  private handleCrouch() {
    const downHeld   = this.cursors.down.isDown || this.keyS.isDown;
    this.isCrouching = this.keyShift.isDown && downHeld;

    // Visually squash/restore the sprite to match the hitbox height
    this.playerImg.setDisplaySize(PLAYER_W, this.hitboxH);
  }

  // ── hitbox helpers ─────────────────────────────────────────────────────────
  // Hitbox is anchored to the player's feet (playerY + PLAYER_H).
  // Crouching shrinks the hitbox upward, feet stay fixed.

  private get hitboxH(): number {
    return this.isCrouching ? CROUCH_H : PLAYER_H;
  }

  private get hitboxY(): number {
    return this.playerY + (PLAYER_H - this.hitboxH);
  }

  // ── movement ───────────────────────────────────────────────────────────────

  private handleMovement(delta: number) {
    const dt = delta / 1000;
    let dx = 0, dy = 0;

    if      (this.cursors.left.isDown  || this.keyA.isDown) dx = -PLAYER_SPEED * dt;
    else if (this.cursors.right.isDown || this.keyD.isDown) dx =  PLAYER_SPEED * dt;
    if      (this.cursors.up.isDown    || this.keyW.isDown) dy = -PLAYER_SPEED * dt;
    // Down movement only when Shift is NOT held (Shift+Down = crouch, not movement)
    else if ((this.cursors.down.isDown || this.keyS.isDown) && !this.keyShift.isDown)
      dy = PLAYER_SPEED * dt;

    this.playerX += dx;
    this.resolveX();
    this.playerY += dy;
    this.resolveY();

    this.playerX = Phaser.Math.Clamp(this.playerX, 0, WORLD_W - PLAYER_W);
    this.playerY = Phaser.Math.Clamp(this.playerY, 0, WORLD_H - PLAYER_H);

    // Sprite top matches hitbox top
    this.playerImg.setPosition(this.playerX, this.hitboxY);

    if (!this.leftStartZone && this.playerX > START_COLS * TILE) {
      this.leftStartZone = true;
    }
  }

  private resolveX() {
    for (const obs of this.obstacleRects) {
      if (!rectIntersect(this.playerX, this.hitboxY, PLAYER_W, this.hitboxH, obs.x, obs.y, obs.w, obs.h))
        continue;
      const oR = (this.playerX + PLAYER_W) - obs.x;
      const oL = (obs.x + obs.w) - this.playerX;
      this.playerX = oR < oL ? obs.x - PLAYER_W : obs.x + obs.w;
    }
  }

  private resolveY() {
    const hitY = this.hitboxY;
    const ph   = this.hitboxH;
    for (const obs of this.obstacleRects) {
      if (!rectIntersect(this.playerX, hitY, PLAYER_W, ph, obs.x, obs.y, obs.w, obs.h))
        continue;
      const oB = (hitY + ph) - obs.y;
      const oT = (obs.y + obs.h) - hitY;
      if (oB < oT) this.playerY = obs.y - PLAYER_H;                  // came from above
      else         this.playerY = obs.y + obs.h - (PLAYER_H - ph);   // came from below
    }
  }

  // ── shooting ───────────────────────────────────────────────────────────────
  // Angle snapped to nearest 45° (8 directions).

  private fireProjectile(ptr: Phaser.Input.Pointer) {
    const wx  = ptr.x + this.cameras.main.scrollX;
    const wy  = ptr.y + this.cameras.main.scrollY;
    const pcx = this.playerX + PLAYER_W / 2;
    const pcy = this.hitboxY  + this.hitboxH  / 2;

    const raw = Math.atan2(wy - pcy, wx - pcx);
    const ang = Math.round(raw / (Math.PI / 4)) * (Math.PI / 4);

    this.projectiles.push({
      x: pcx - TEX_PROJ_W / 2,
      y: pcy - TEX_PROJ_H / 2,
      vx: Math.cos(ang) * PROJ_SPEED,
      vy: Math.sin(ang) * PROJ_SPEED,
      img: this.add.image(pcx, pcy, KEY_SPR_PROJECTILE).setOrigin(0.5, 0.5).setDepth(6),
      dead: false,
    });
  }

  private updateProjectiles(delta: number) {
    const dt = delta / 1000;

    for (const p of this.projectiles) {
      if (p.dead) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const oob = p.x < 0 || p.x + TEX_PROJ_W > WORLD_W
               || p.y < 0 || p.y + TEX_PROJ_H > WORLD_H;
      const hitWall = this.obstacleRects.some(obs =>
        rectIntersect(p.x, p.y, TEX_PROJ_W, TEX_PROJ_H, obs.x, obs.y, obs.w, obs.h),
      );

      if (oob || hitWall) {
        p.dead = true;
        p.img.destroy();
        continue;
      }
      p.img.setPosition(p.x + TEX_PROJ_W / 2, p.y + TEX_PROJ_H / 2);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (this.projectiles[i].dead) this.projectiles.splice(i, 1);
    }
  }

  // ── enemy update ───────────────────────────────────────────────────────────

  private updateEnemies(delta: number) {
    const dt   = delta / 1000;
    const hitY = this.hitboxY;
    const ph   = this.hitboxH;

    for (const e of this.enemies) {
      // Random direction change
      e.dirTimer -= delta;
      if (e.dirTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        e.vx = Math.cos(angle) * ENEMY_SPEED;
        e.vy = Math.sin(angle) * ENEMY_SPEED;
        e.dirTimer = Phaser.Math.Between(1000, 3000);
      }

      // Move X, bounce off barriers
      e.x += e.vx * dt;
      if (this.obstacleRects.some(obs =>
        rectIntersect(e.x, e.y, ENEMY_W, ENEMY_H, obs.x, obs.y, obs.w, obs.h))) {
        e.x -= e.vx * dt;
        e.vx = -e.vx;
      }

      // Move Y, bounce off barriers
      e.y += e.vy * dt;
      if (this.obstacleRects.some(obs =>
        rectIntersect(e.x, e.y, ENEMY_W, ENEMY_H, obs.x, obs.y, obs.w, obs.h))) {
        e.y -= e.vy * dt;
        e.vy = -e.vy;
      }

      // World-boundary bounce
      if (e.x < 0 || e.x + ENEMY_W > WORLD_W) {
        e.x  = Phaser.Math.Clamp(e.x, 0, WORLD_W - ENEMY_W);
        e.vx = -e.vx;
      }
      if (e.y < 0 || e.y + ENEMY_H > WORLD_H) {
        e.y  = Phaser.Math.Clamp(e.y, 0, WORLD_H - ENEMY_H);
        e.vy = -e.vy;
      }

      // Damage: once per contact event — player must break contact to be hit again
      const nowTouching = rectIntersect(
        this.playerX, hitY, PLAYER_W, ph,
        e.x, e.y, ENEMY_W, ENEMY_H,
      );
      if (nowTouching && !e.touching) {
        this.playerHp = Math.max(0, this.playerHp - ENEMY_DAMAGE);
        if (this.playerHp <= 0) { this.showGameOver(); return; }
      }
      e.touching = nowTouching;

      e.img.setPosition(e.x, e.y);
    }
  }

  // ── puddle healing ─────────────────────────────────────────────────────────

  private checkPuddle(delta: number) {
    const cx = this.playerX + PLAYER_W / 2;
    const cy = this.hitboxY + this.hitboxH / 2;
    for (const p of this.puddleRects) {
      if (cx > p.x && cx < p.x + p.w && cy > p.y && cy < p.y + p.h) {
        this.playerHp = Math.min(MAX_HP, this.playerHp + HEAL_PER_SEC * (delta / 1000));
        break;
      }
    }
  }

  // ── coin collection ────────────────────────────────────────────────────────

  private checkCoins() {
    const cx = this.playerX + PLAYER_W / 2;
    const cy = this.hitboxY + this.hitboxH / 2;
    for (const c of this.coins) {
      if (c.collected) continue;
      if (Math.hypot(cx - (c.x + TEX_COIN_W / 2), cy - (c.y + TEX_COIN_H / 2)) < COIN_COLLECT_R) {
        c.collected = true;
        c.img.destroy();
        this.collectedCoins += COIN_VALUE;
      }
    }
  }

  // ── camera ─────────────────────────────────────────────────────────────────

  private updateCamera(delta: number) {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;

    if (this.leftStartZone) {
      // Auto-pan right, forcing the player forward
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this.cameras.main.scrollX + CAMERA_SCROLL_SPEED * (delta / 1000),
        0, WORLD_W - camW,
      );
      // Vertical continues to follow player
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.hitboxY + this.hitboxH / 2 - camH / 2,
        0, WORLD_H - camH,
      );
      // Camera left edge overtook player → teleport to level start (HP preserved)
      if (this.cameras.main.scrollX >= this.playerX) {
        this.teleportToStart();
      }
    } else {
      // Normal follow in start zone
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this.playerX + PLAYER_W / 2 - camW / 2,
        0, WORLD_W - camW,
      );
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.hitboxY + this.hitboxH / 2 - camH / 2,
        0, WORLD_H - camH,
      );
    }
  }

  private teleportToStart() {
    this.playerX       = this.levelStartX;
    this.playerY       = this.levelStartY;
    this.leftStartZone = false;
    this.cameras.main.scrollX = 0;
    this.playerImg.setPosition(this.playerX, this.hitboxY);
  }

  // ── win / lose ─────────────────────────────────────────────────────────────

  private checkEndZone() {
    if (rectIntersect(
      this.playerX, this.hitboxY, PLAYER_W, this.hitboxH,
      this.endRect.x, this.endRect.y, this.endRect.w, this.endRect.h,
    )) this.showLevelComplete();
  }

  private checkHoleDeath() {
    const cx = this.playerX + PLAYER_W / 2;
    const cy = this.hitboxY + this.hitboxH / 2;
    for (const h of this.holeRects) {
      if (cx > h.x && cx < h.x + h.w && cy > h.y && cy < h.y + h.h) {
        this.showGameOver();
        return;
      }
    }
  }

  // ── rewards ────────────────────────────────────────────────────────────────

  private calculateRewards(): { xp: number; coins: number } {
    const secs      = this.levelTimer / 1000;
    const intervals = secs < 60 ? Math.floor((60 - secs) / TIME_BONUS_INTERVAL) : 0;
    return {
      xp:    BASE_XP    + intervals * TIME_BONUS_XP,
      coins: BASE_COINS + intervals * TIME_BONUS_COINS + this.collectedCoins,
    };
  }

  // ── overlays ───────────────────────────────────────────────────────────────

  private showLevelComplete() {
    if (this.done) return;
    this.done = true;

    const { xp, coins } = this.calculateRewards();
    const { width: w, height: h } = this.cameras.main;
    const cx = w / 2, cy = h / 2;
    const next = this.levelCount + 1;

    const ov = this.add.graphics().setScrollFactor(0).setDepth(20);
    ov.fillStyle(0x000000, 0.88);
    ov.fillRect(0, 0, w, h);

    const s = Math.floor(this.levelTimer / 1000);
    for (const [txt, y, color] of [
      ['Level Complete!',   cy - 110, '#00ff88'],
      [`Time: ${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`, cy - 55, '#aaffcc'],
      [`+${xp} XP`,         cy -  10, '#ffffff'],
      [`+${coins} Coins`,   cy +  34, '#ffd700'],
    ] as [string, number, string][]) {
      this.add.text(cx, y, txt, { fontSize: '28px', color, fontStyle: 'bold' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(21);
    }

    const btn = this.add.text(cx, cy + 100, 'Continue', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setColor('#00ff88'))
      .on('pointerout',  () => btn.setColor('#ffffff'))
      .on('pointerdown', () =>
        this.scene.start(
          next % LEVELS_PER_DUEL === 0 ? 'DuelScene' : 'EvergladesScene',
          { levelCount: next },
        ),
      );
  }

  private showGameOver() {
    if (this.done) return;
    this.done = true;

    const { width: w, height: h } = this.cameras.main;
    const cx = w / 2, cy = h / 2;

    const ov = this.add.graphics().setScrollFactor(0).setDepth(20);
    ov.fillStyle(0x000000, 0.88);
    ov.fillRect(0, 0, w, h);

    const reason = this.playerHp <= 0 ? 'Defeated!' : 'You Fell!';
    this.add.text(cx, cy - 80, reason, { fontSize: '48px', color: '#ff4444', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy - 20, `Level ${this.levelCount + 1}`, { fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);

    const retry = this.add.text(cx, cy + 40, 'Try Again', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => retry.setColor('#00ff88'))
      .on('pointerout',  () => retry.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.start('EvergladesScene', { levelCount: this.levelCount }));

    const menu = this.add.text(cx, cy + 110, 'Menu', { fontSize: '24px', color: '#888888' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menu.setColor('#ffffff'))
      .on('pointerout',  () => menu.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
