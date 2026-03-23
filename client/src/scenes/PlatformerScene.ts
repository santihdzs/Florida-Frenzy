import Phaser from 'phaser';
import { rectIntersect } from '../physics/customPhysics';

// World
const TILE = 48;
const COLS = 100;
const ROWS = 15;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;

// Player
const PLAYER_W = 28;
const PLAYER_H = 28;
const PLAYER_SPEED = 220;
const MAX_HP = 100;

// Enemies
const ENEMY_W = 24;
const ENEMY_H = 24;
const ENEMY_SPEED = 75;
const ENEMY_DAMAGE = 10;
const HIT_COOLDOWN_MS = 2000;
const ENEMY_COUNT_MIN = 3;
const ENEMY_COUNT_MAX = 6;

// Healing
const HEAL_PER_SEC = 12;

// South face depth illusion
const SOUTH_H = 8;

// Game loop
const LEVELS_PER_DUEL = 3;
const END_COL = COLS - 5;

// Tile types
const FLOOR   = 0;
const BARRIER = 1;
const HOLE    = 2;
const PUDDLE  = 3;

// World generation counts
const BARRIER_SEEDS = 14;
const HOLE_SEEDS    = 7;
const PUDDLE_SEEDS  = 2;

// Grass blade pattern (repeating per TILE cell)
const GRASS_BLADES = [
  { dx: 5,  dy: 4,  w: 2, h: 5, c: 0x2d5520 },
  { dx: 14, dy: 8,  w: 1, h: 6, c: 0x52a03a },
  { dx: 24, dy: 3,  w: 2, h: 4, c: 0x2d5520 },
  { dx: 34, dy: 13, w: 1, h: 5, c: 0x52a03a },
  { dx: 42, dy: 6,  w: 2, h: 4, c: 0x2d5520 },
  { dx: 10, dy: 30, w: 2, h: 5, c: 0x52a03a },
  { dx: 20, dy: 26, w: 1, h: 6, c: 0x2d5520 },
  { dx: 30, dy: 36, w: 2, h: 4, c: 0x52a03a },
  { dx: 40, dy: 41, w: 1, h: 5, c: 0x2d5520 },
  { dx:  8, dy: 18, w: 1, h: 3, c: 0x52a03a },
  { dx: 38, dy: 22, w: 2, h: 3, c: 0x2d5520 },
];

type Rect = { x: number; y: number; w: number; h: number };

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gfx: Phaser.GameObjects.Graphics;
  lastHit: number;
  dirTimer: number;
}

export class PlatformerScene extends Phaser.Scene {
  private playerX = 0;
  private playerY = 0;
  private playerHp = MAX_HP;
  private playerGfx!: Phaser.GameObjects.Graphics;

  private obstacleRects: Rect[] = [];
  private holeRects:     Rect[] = [];
  private puddleRects:   Rect[] = [];
  private endRect: Rect = { x: 0, y: 0, w: 0, h: 0 };

  private enemies: Enemy[] = [];

  private hpBar!:  Phaser.GameObjects.Graphics;
  private hpLabel!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private levelCount = 0;
  private done = false;

  constructor() {
    super({ key: 'PlatformerScene' });
  }

  init(data: { levelCount?: number }) {
    this.levelCount = data.levelCount ?? 0;
    this.done       = false;
    this.playerHp   = MAX_HP;
    this.obstacleRects = [];
    this.holeRects     = [];
    this.puddleRects   = [];
    this.enemies       = [];
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    const grid = this.generateGrid();
    this.drawWorld(grid);
    this.spawnEnemies(grid);

    this.playerX = TILE * 2;
    this.playerY = Math.floor(ROWS / 2) * TILE + (TILE - PLAYER_H) / 2;
    this.playerGfx = this.add.graphics();
    this.drawPlayer();

    this.createHud();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(time: number, delta: number) {
    if (this.done) return;
    this.handleMovement(delta);
    this.updateEnemies(time, delta);
    this.checkPuddle(delta);
    this.updateCamera();
    this.checkEndZone();
    this.checkHoleDeath();
    this.updateHud();
  }

  // --- grid generation ---

  private generateGrid(): number[][] {
    const grid: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));

    // Carve a guaranteed 3-wide zigzag path
    const onPath: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let pathRow = Math.floor(ROWS / 2);
    for (let col = 0; col < COLS; col++) {
      for (let dr = -1; dr <= 1; dr++) {
        const r = pathRow + dr;
        if (r >= 0 && r < ROWS) onPath[r][col] = true;
      }
      if (col > 4 && col < COLS - 5) {
        const roll = Math.random();
        if      (roll < 0.2 && pathRow > 3)       pathRow--;
        else if (roll < 0.4 && pathRow < ROWS - 4) pathRow++;
      }
    }

    // Protected: path tiles, start zone, exit zone
    const safe = (r: number, c: number) => onPath[r][c] || c < 4 || c >= END_COL;

    // Only place on FLOOR, non-safe tiles
    const blocked = (r: number, c: number) => safe(r, c) || grid[r][c] !== FLOOR;

    // Barrier clusters (larger blobs)
    for (let i = 0; i < BARRIER_SEEDS; i++) {
      const sr = Phaser.Math.Between(0, ROWS - 1);
      const sc = Phaser.Math.Between(4, END_COL - 2);
      if (!blocked(sr, sc))
        this.growCluster(grid, sr, sc, BARRIER, Phaser.Math.Between(3, 9), blocked);
    }

    // Hole clusters (smaller)
    for (let i = 0; i < HOLE_SEEDS; i++) {
      const sr = Phaser.Math.Between(0, ROWS - 1);
      const sc = Phaser.Math.Between(4, END_COL - 2);
      if (!blocked(sr, sc))
        this.growCluster(grid, sr, sc, HOLE, Phaser.Math.Between(1, 3), blocked);
    }

    // Puddle clusters (sparse)
    for (let i = 0; i < PUDDLE_SEEDS; i++) {
      const sr = Phaser.Math.Between(1, ROWS - 2);
      const sc = Phaser.Math.Between(10, END_COL - 10);
      if (!blocked(sr, sc))
        this.growCluster(grid, sr, sc, PUDDLE, Phaser.Math.Between(2, 5), blocked);
    }

    return grid;
  }

  // BFS-style random blob growth
  private growCluster(
    grid: number[][], startRow: number, startCol: number,
    type: number, size: number,
    isBlocked: (r: number, c: number) => boolean
  ) {
    const frontier = [{ r: startRow, c: startCol }];
    const visited  = new Set([`${startRow},${startCol}`]);
    let placed = 0;

    while (placed < size && frontier.length > 0) {
      const idx = Math.floor(Math.random() * frontier.length);
      const { r, c } = frontier.splice(idx, 1)[0];

      if (isBlocked(r, c)) continue;
      grid[r][c] = type;
      placed++;

      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        const key = `${nr},${nc}`;
        if (!visited.has(key) && nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          visited.add(key);
          frontier.push({ r: nr, c: nc });
        }
      }
    }
  }

  // --- world drawing ---

  private drawWorld(grid: number[][]) {
    const floorGfx = this.add.graphics();
    const obsGfx   = this.add.graphics();

    // Grass base
    floorGfx.fillStyle(0x3d7030);
    floorGfx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Repeating grass blade pattern
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const bx = col * TILE, by = row * TILE;
        for (const b of GRASS_BLADES) {
          floorGfx.fillStyle(b.c);
          floorGfx.fillRect(bx + b.dx, by + b.dy, b.w, b.h);
        }
      }
    }

    // Start zone subtle tint
    floorGfx.fillStyle(0x336677, 0.3);
    floorGfx.fillRect(0, 0, 4 * TILE, WORLD_H);

    // Exit zone
    floorGfx.fillStyle(0x886600);
    floorGfx.fillRect(END_COL * TILE, 0, (COLS - END_COL) * TILE, WORLD_H);
    this.endRect = { x: END_COL * TILE, y: 0, w: (COLS - END_COL) * TILE, h: WORLD_H };

    this.add.text(
      END_COL * TILE + ((COLS - END_COL) * TILE) / 2, WORLD_H / 2,
      'EXIT', { fontSize: '28px', color: '#ffdd00', fontStyle: 'bold' }
    ).setOrigin(0.5);

    // Tiles
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = grid[row][col];
        const px = col * TILE, py = row * TILE;
        if      (tile === HOLE)    { this.drawHole(floorGfx, px, py);    this.holeRects.push({ x: px + 8, y: py + 8, w: TILE - 16, h: TILE - 16 }); }
        else if (tile === BARRIER) { this.drawBarrier(obsGfx, px, py);   this.obstacleRects.push({ x: px, y: py, w: TILE, h: TILE }); }
        else if (tile === PUDDLE)  { this.drawPuddle(floorGfx, px, py);  this.puddleRects.push({ x: px, y: py, w: TILE, h: TILE }); }
      }
    }
  }

  private drawHole(gfx: Phaser.GameObjects.Graphics, px: number, py: number) {
    gfx.fillStyle(0x111111);
    gfx.fillRect(px + 2,  py + 2,  TILE - 4,  TILE - 4);
    gfx.fillStyle(0x050508);
    gfx.fillRect(px + 8,  py + 8,  TILE - 16, TILE - 16);
    gfx.fillStyle(0x000000);
    gfx.fillRect(px + 13, py + 13, TILE - 26, TILE - 26);
  }

  private drawBarrier(gfx: Phaser.GameObjects.Graphics, px: number, py: number) {
    // Green grass strip on top
    gfx.fillStyle(0x5a9e40);
    gfx.fillRect(px + 2, py + 2, TILE - 4, 9);
    // Brown body
    gfx.fillStyle(0x7a4a25);
    gfx.fillRect(px + 2, py + 11, TILE - 4, TILE - 13);
    // Left highlight
    gfx.fillStyle(0xa06030);
    gfx.fillRect(px + 2, py + 11, 5, TILE - 13);
    // Bottom/right shadow
    gfx.fillStyle(0x4a2810);
    gfx.fillRect(px + 2,      py + TILE - 9, TILE - 4, 7);
    gfx.fillRect(px + TILE - 8, py + 11,    7, TILE - 13);
    // South face (depth)
    gfx.fillStyle(0x2d1608);
    gfx.fillRect(px + 2, py + TILE, TILE - 4, SOUTH_H);
  }

  private drawPuddle(gfx: Phaser.GameObjects.Graphics, px: number, py: number) {
    gfx.fillStyle(0x2a6699);
    gfx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
    gfx.fillStyle(0x3a88bb);
    gfx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
    // Shimmer highlights
    gfx.fillStyle(0x80c8ee);
    gfx.fillRect(px + 12, py + 12, 8, 3);
    gfx.fillRect(px + 26, py + 22, 5, 3);
  }

  // --- player ---

  private drawPlayer() {
    this.playerGfx.clear();
    const px = Math.round(this.playerX);
    const py = Math.round(this.playerY);

    // Shadow
    this.playerGfx.fillStyle(0x000000, 0.3);
    this.playerGfx.fillEllipse(px + PLAYER_W / 2, py + PLAYER_H + 4, PLAYER_W - 4, 8);
    // Body
    this.playerGfx.fillStyle(0x3366ff);
    this.playerGfx.fillRect(px + 2, py, PLAYER_W - 4, PLAYER_H - 4);
    // Highlight
    this.playerGfx.fillStyle(0x66aaff);
    this.playerGfx.fillRect(px + 2, py, PLAYER_W - 4, 5);
    this.playerGfx.fillRect(px + 2, py, 5, PLAYER_H - 4);
    // South face
    this.playerGfx.fillStyle(0x1133aa);
    this.playerGfx.fillRect(px + 2, py + PLAYER_H - 4, PLAYER_W - 4, 6);
  }

  // --- HUD ---

  private createHud() {
    const w = this.cameras.main.width;

    this.add.text(16, 12, `Level ${this.levelCount + 1}`, {
      fontSize: '16px', color: '#ffffff',
      backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(10);

    this.hpBar   = this.add.graphics().setScrollFactor(0).setDepth(10);
    this.hpLabel = this.add.text(w / 2, 38, '', {
      fontSize: '13px', color: '#ffffff',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(11);

    this.updateHud();
  }

  private updateHud() {
    const cx   = this.cameras.main.width / 2;
    const barW = 200;
    const barH = 18;
    const bx   = cx - barW / 2;
    const by   = 12;
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
  }

  // --- movement & collision ---

  private handleMovement(delta: number) {
    const dt = delta / 1000;
    let dx = 0, dy = 0;

    if      (this.cursors.left.isDown  || this.wasd.A.isDown) dx = -PLAYER_SPEED * dt;
    else if (this.cursors.right.isDown || this.wasd.D.isDown) dx =  PLAYER_SPEED * dt;
    if      (this.cursors.up.isDown    || this.wasd.W.isDown) dy = -PLAYER_SPEED * dt;
    else if (this.cursors.down.isDown  || this.wasd.S.isDown) dy =  PLAYER_SPEED * dt;

    this.playerX += dx;
    this.resolveCollisions('x');
    this.playerY += dy;
    this.resolveCollisions('y');

    this.playerX = Phaser.Math.Clamp(this.playerX, 0, WORLD_W - PLAYER_W);
    this.playerY = Phaser.Math.Clamp(this.playerY, 0, WORLD_H - PLAYER_H);
    this.drawPlayer();
  }

  private resolveCollisions(axis: 'x' | 'y') {
    for (const obs of this.obstacleRects) {
      if (!rectIntersect(this.playerX, this.playerY, PLAYER_W, PLAYER_H, obs.x, obs.y, obs.w, obs.h)) continue;
      if (axis === 'x') {
        const oR = (this.playerX + PLAYER_W) - obs.x;
        const oL = (obs.x + obs.w) - this.playerX;
        this.playerX = oR < oL ? obs.x - PLAYER_W : obs.x + obs.w;
      } else {
        const oB = (this.playerY + PLAYER_H) - obs.y;
        const oT = (obs.y + obs.h) - this.playerY;
        this.playerY = oB < oT ? obs.y - PLAYER_H : obs.y + obs.h;
      }
    }
  }

  // --- enemies ---

  private spawnEnemies(grid: number[][]) {
    const count = Phaser.Math.Between(ENEMY_COUNT_MIN, ENEMY_COUNT_MAX);
    let placed = 0, attempts = 0;

    while (placed < count && attempts < 300) {
      attempts++;
      const col = Phaser.Math.Between(10, END_COL - 2);
      const row = Phaser.Math.Between(0, ROWS - 1);
      if (grid[row][col] !== FLOOR) continue;

      const angle = Math.random() * Math.PI * 2;
      const e: Enemy = {
        x: col * TILE + (TILE - ENEMY_W) / 2,
        y: row * TILE + (TILE - ENEMY_H) / 2,
        vx: Math.cos(angle) * ENEMY_SPEED,
        vy: Math.sin(angle) * ENEMY_SPEED,
        gfx: this.add.graphics(),
        lastHit: -HIT_COOLDOWN_MS,
        dirTimer: Phaser.Math.Between(1000, 3000),
      };
      this.drawEnemy(e);
      this.enemies.push(e);
      placed++;
    }
  }

  private drawEnemy(e: Enemy) {
    e.gfx.clear();
    const px = Math.round(e.x);
    const py = Math.round(e.y);

    // Shadow
    e.gfx.fillStyle(0x000000, 0.3);
    e.gfx.fillEllipse(px + ENEMY_W / 2, py + ENEMY_H + 3, ENEMY_W - 6, 7);
    // Body
    e.gfx.fillStyle(0xcc3333);
    e.gfx.fillRect(px + 2, py, ENEMY_W - 4, ENEMY_H - 4);
    // Highlight
    e.gfx.fillStyle(0xee5555);
    e.gfx.fillRect(px + 2, py, ENEMY_W - 4, 4);
    e.gfx.fillRect(px + 2, py, 4, ENEMY_H - 4);
    // South face
    e.gfx.fillStyle(0x881111);
    e.gfx.fillRect(px + 2, py + ENEMY_H - 4, ENEMY_W - 4, 5);
  }

  private updateEnemies(time: number, delta: number) {
    const dt = delta / 1000;

    for (const e of this.enemies) {
      // Random direction change
      e.dirTimer -= delta;
      if (e.dirTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        e.vx = Math.cos(angle) * ENEMY_SPEED;
        e.vy = Math.sin(angle) * ENEMY_SPEED;
        e.dirTimer = Phaser.Math.Between(1000, 3000);
      }

      // Move X + bounce off obstacles
      e.x += e.vx * dt;
      for (const obs of this.obstacleRects) {
        if (rectIntersect(e.x, e.y, ENEMY_W, ENEMY_H, obs.x, obs.y, obs.w, obs.h)) {
          e.x -= e.vx * dt;
          e.vx = -e.vx;
          break;
        }
      }

      // Move Y + bounce off obstacles
      e.y += e.vy * dt;
      for (const obs of this.obstacleRects) {
        if (rectIntersect(e.x, e.y, ENEMY_W, ENEMY_H, obs.x, obs.y, obs.w, obs.h)) {
          e.y -= e.vy * dt;
          e.vy = -e.vy;
          break;
        }
      }

      // World bounds bounce
      if (e.x < 0 || e.x + ENEMY_W > WORLD_W) {
        e.x  = Phaser.Math.Clamp(e.x, 0, WORLD_W - ENEMY_W);
        e.vx = -e.vx;
      }
      if (e.y < 0 || e.y + ENEMY_H > WORLD_H) {
        e.y  = Phaser.Math.Clamp(e.y, 0, WORLD_H - ENEMY_H);
        e.vy = -e.vy;
      }

      // Damage player on contact
      if (rectIntersect(this.playerX, this.playerY, PLAYER_W, PLAYER_H, e.x, e.y, ENEMY_W, ENEMY_H)) {
        if (time - e.lastHit >= HIT_COOLDOWN_MS) {
          this.playerHp = Math.max(0, this.playerHp - ENEMY_DAMAGE);
          e.lastHit = time;
          if (this.playerHp <= 0) { this.showGameOver(); return; }
        }
      }

      this.drawEnemy(e);
    }
  }

  // --- puddle heal ---

  private checkPuddle(delta: number) {
    const cx = this.playerX + PLAYER_W / 2;
    const cy = this.playerY + PLAYER_H / 2;
    for (const p of this.puddleRects) {
      if (cx > p.x && cx < p.x + p.w && cy > p.y && cy < p.y + p.h) {
        this.playerHp = Math.min(MAX_HP, this.playerHp + HEAL_PER_SEC * (delta / 1000));
        break;
      }
    }
  }

  // --- camera ---

  private updateCamera() {
    this.cameras.main.scrollX = Phaser.Math.Clamp(
      this.playerX + PLAYER_W / 2 - this.cameras.main.width  / 2,
      0, WORLD_W - this.cameras.main.width
    );
    this.cameras.main.scrollY = Phaser.Math.Clamp(
      this.playerY + PLAYER_H / 2 - this.cameras.main.height / 2,
      0, WORLD_H - this.cameras.main.height
    );
  }

  // --- win / lose checks ---

  private checkHoleDeath() {
    const cx = this.playerX + PLAYER_W / 2;
    const cy = this.playerY + PLAYER_H / 2;
    for (const hole of this.holeRects) {
      if (cx > hole.x && cx < hole.x + hole.w && cy > hole.y && cy < hole.y + hole.h) {
        this.showGameOver();
        return;
      }
    }
  }

  private checkEndZone() {
    if (rectIntersect(this.playerX, this.playerY, PLAYER_W, PLAYER_H,
        this.endRect.x, this.endRect.y, this.endRect.w, this.endRect.h)) {
      this.showLevelComplete();
    }
  }

  // --- overlays ---

  private showLevelComplete() {
    if (this.done) return;
    this.done = true;
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const cx = w / 2, cy = h / 2;
    const next = this.levelCount + 1;

    const ov = this.add.graphics().setScrollFactor(0).setDepth(20);
    ov.fillStyle(0x000000, 0.85);
    ov.fillRect(0, 0, w, h);

    this.add.text(cx, cy - 80, 'Level Complete!', { fontSize: '48px', color: '#00ff88', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy - 20, `Level ${next} cleared`, { fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);

    const btn = this.add.text(cx, cy + 60, 'Continue', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setColor('#00ff88'))
      .on('pointerout',  () => btn.setColor('#ffffff'))
      .on('pointerdown', () => {
        if (next % LEVELS_PER_DUEL === 0) this.scene.start('DuelScene',      { levelCount: next });
        else                               this.scene.start('PlatformerScene', { levelCount: next });
      });
  }

  private showGameOver() {
    if (this.done) return;
    this.done = true;
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const cx = w / 2, cy = h / 2;

    const ov = this.add.graphics().setScrollFactor(0).setDepth(20);
    ov.fillStyle(0x000000, 0.85);
    ov.fillRect(0, 0, w, h);

    const reason = this.playerHp <= 0 ? 'You were defeated!' : 'You Fell!';
    this.add.text(cx, cy - 80, reason, { fontSize: '48px', color: '#ff4444', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);
    this.add.text(cx, cy - 20, `Level ${this.levelCount + 1}`, { fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21);

    const retry = this.add.text(cx, cy + 40, 'Try Again', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => retry.setColor('#00ff88'))
      .on('pointerout',  () => retry.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.start('PlatformerScene', { levelCount: this.levelCount }));

    const menu = this.add.text(cx, cy + 110, 'Menu', { fontSize: '24px', color: '#888888' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menu.setColor('#ffffff'))
      .on('pointerout',  () => menu.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
