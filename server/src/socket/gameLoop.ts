import type { Room, EnemyState } from './roomManager.js';

// ── SCALING PARITY ─────────────────────────────────────────────────────────
// The constants and functions below are copied from the single-player
// RunScene.ts so multiplayer enemy scaling matches single-player exactly.
// If RunScene tuning changes, update both sides.
//
//   getEnemyStats(type, level)   ← RunScene.ts:333-354
//   getSpawnPool(level)          ← RunScene.ts:356-361
//   spawn-count formula           ← RunScene.ts:1107-1109
//   ENEMY_HP / ENEMY_SPEED / ENEMY_DPS / ENEMY_COUNT_MIN / ENEMY_COUNT_MAX
//                                ← RunScene.ts:79, 77, 78, 80, 81
//
// Multiplayer-only deltas (not present in single-player):
//   • Per-player enemy count multiplier: +1 per additional player past the
//     first, applied after the base count is rolled.
//   • Hard cap of 20 total enemies (single-player has no cap on count itself).
// ───────────────────────────────────────────────────────────────────────────

const TILE    = 48;
const COLS    = 105;
const ROWS    = 18;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;

const FLOOR   = 0;
const BARRIER = 1;
const HOLE    = 2;
const PUDDLE  = 3;

const BARRIER_SEEDS = 22;
const HOLE_SEEDS    = 7;
const PUDDLE_SEEDS  = 2;
const START_COLS    = 4;
const END_COL       = COLS - 1;

// SCALING PARITY: match RunScene.ts:77-81
const ENEMY_HP        = 100;
const ENEMY_SPEED     = 113;
const ENEMY_DPS       = 20;
const ENEMY_COUNT_MIN = 3;
const ENEMY_COUNT_MAX = 6;
const ENEMY_COUNT_CAP = 20; // multiplayer-only cap

type GameLoopEnemyType = EnemyState['type']; // 'SHOOTER' | 'TANK' | 'SWIFT'

// Verbatim port of RunScene.ts:333-354. Returns the per-level stat block
// for a given enemy archetype. contactDmgRate is computed for parity but not
// currently consumed server-side (server has no contact-damage path yet).
function getEnemyStats(type: GameLoopEnemyType, level: number): {
  hp: number; maxHp: number; speed: number; contactDmgRate: number;
} {
  if (type === 'SHOOTER') {
    const la = level - 1;
    const hp = Math.round(ENEMY_HP * Math.min(3, Math.pow(1.1, la)));
    const speed = ENEMY_SPEED * Math.min(1.5, Math.pow(1.03, la));
    return { hp, maxHp: hp, speed, contactDmgRate: 0 };
  }
  if (type === 'TANK') {
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

// Verbatim port of RunScene.ts:356-361. Returns a weighted pool of enemy
// types to sample uniformly from. Only SHOOTERs at level 1; TANKs unlocked at
// level 2; SWIFTs unlocked at level 3+.
function getSpawnPool(level: number): GameLoopEnemyType[] {
  const r = (t: GameLoopEnemyType, n: number): GameLoopEnemyType[] =>
    Array.from({ length: n }, () => t);
  if (level <= 1) return r('SHOOTER', 10);
  if (level === 2) return [...r('SHOOTER', 7), ...r('TANK', 3)];
  return [...r('SHOOTER', 4), ...r('TANK', 2), ...r('SWIFT', 2)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simple LCG seeded RNG — matches the spirit of Math.random() but deterministic
class SeededRNG {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0; }
  next(): number {
    this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0;
    return this.s / 0x100000000;
  }
  randInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// bfs flood fill places a cluster of matching tiles starting from a seed cell
function growCluster(
  rng: SeededRNG,
  grid: number[][],
  sr: number,
  sc: number,
  type: number,
  size: number,
  blocked: (r: number, c: number) => boolean,
): void {
  const frontier: { r: number; c: number }[] = [{ r: sr, c: sc }];
  const visited = new Set<string>([`${sr},${sc}`]);
  let placed = 0;
  while (placed < size && frontier.length > 0) {
    const idx = Math.floor(rng.next() * frontier.length);
    const cell = frontier.splice(idx, 1)[0];
    if (blocked(cell.r, cell.c)) continue;
    grid[cell.r][cell.c] = type;
    placed++;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = cell.r + dr;
      const nc = cell.c + dc;
      const k = `${nr},${nc}`;
      if (!visited.has(k) && nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        visited.add(k);
        frontier.push({ r: nr, c: nc });
      }
    }
  }
}

export function generateGrid(seed: number): number[][] {
  const rng = new SeededRNG(seed);
  const grid: number[][] = Array.from({ length: ROWS }, () =>
    new Array<number>(COLS).fill(FLOOR),
  );
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
      const roll = rng.next();
      if (roll < 0.2 && pathRow > 3) pathRow--;
      else if (roll < 0.4 && pathRow < ROWS - 4) pathRow++;
    }
  }

  const safe    = (r: number, c: number) => onPath[r][c] || c < START_COLS || c >= END_COL;
  const blocked = (r: number, c: number) => safe(r, c) || grid[r][c] !== FLOOR;

  for (let i = 0; i < BARRIER_SEEDS; i++) {
    const sr = rng.randInt(0, ROWS - 1);
    const sc = rng.randInt(START_COLS, END_COL - 2);
    if (!blocked(sr, sc)) growCluster(rng, grid, sr, sc, BARRIER, rng.randInt(3, 9), blocked);
  }
  for (let i = 0; i < HOLE_SEEDS; i++) {
    const sr = rng.randInt(0, ROWS - 1);
    const sc = rng.randInt(START_COLS, END_COL - 2);
    if (!blocked(sr, sc)) growCluster(rng, grid, sr, sc, HOLE, rng.randInt(1, 3), blocked);
  }
  for (let i = 0; i < PUDDLE_SEEDS; i++) {
    const sr = rng.randInt(1, ROWS - 2);
    const sc = rng.randInt(10, END_COL - 10);
    if (!blocked(sr, sc)) growCluster(rng, grid, sr, sc, PUDDLE, rng.randInt(2, 5), blocked);
  }

  return grid;
}

const ENEMY_SIZE = 48;

function isBlockedCell(grid: number[][], ex: number, ey: number): boolean {
  const col0 = Math.max(0, Math.floor(ex / TILE));
  const row0 = Math.max(0, Math.floor(ey / TILE));
  const col1 = Math.min(COLS - 1, Math.floor((ex + ENEMY_SIZE - 1) / TILE));
  const row1 = Math.min(ROWS - 1, Math.floor((ey + ENEMY_SIZE - 1) / TILE));
  for (let r = row0; r <= row1; r++) {
    for (let c = col0; c <= col1; c++) {
      const cell = grid[r]?.[c] ?? FLOOR;
      if (cell === BARRIER || cell === HOLE) return true;
    }
  }
  return false;
}

let _enemyIdCounter = 0;

// SCALING PARITY: spawn count formula is the single-player one
// (RunScene.ts:1107-1109) with two multiplayer-only deltas:
//   • +1 enemy per additional player past the first
//   • hard cap of ENEMY_COUNT_CAP (20) total
//
// numPlayers defaults to 1 to keep the function callable from any future
// solo-spawn path; roomManager.generateLevelState always passes the actual
// player count.
export function spawnEnemies(level: number, numPlayers: number = 1): EnemyState[] {
  const pool      = getSpawnPool(level);
  const extra     = Math.min(20, 2 * (level - 1));
  const baseCount = randInt(ENEMY_COUNT_MIN + extra, ENEMY_COUNT_MAX + extra);
  const count     = Math.min(ENEMY_COUNT_CAP, baseCount + Math.max(0, numPlayers - 1));

  const enemies: EnemyState[] = [];
  for (let i = 0; i < count; i++) {
    const type  = pool[Math.floor(Math.random() * pool.length)];
    const stats = getEnemyStats(type, level);
    enemies.push({
      id:    ++_enemyIdCounter,
      x:     2500 + Math.random() * 2000,
      y:     50   + Math.random() * (WORLD_H - 100),
      hp:    stats.hp,
      maxHp: stats.maxHp,
      speed: stats.speed,
      alive: true,
      type,
    });
  }
  return enemies;
}

export function tickEnemies(room: Room, dt: number): void {
  const alive = Array.from(room.players.values()).filter(p => p.alive);
  if (alive.length === 0) return;

  // enemies target the centroid of all alive players
  const cx = alive.reduce((s, p) => s + p.x, 0) / alive.length;
  const cy = alive.reduce((s, p) => s + p.y, 0) / alive.length;

  // Speed comes from the per-enemy stat assigned at spawn time, which is the
  // verbatim getEnemyStats() output for the level the enemy spawned on.
  // Fallback recomputes from the current level in case `speed` is missing
  // (e.g. a future enemy added without going through spawnEnemies).
  const level = room.currentLevel ?? 1;

  for (const e of room.enemies) {
    if (!e.alive) continue;
    const speed = e.speed ?? getEnemyStats(e.type, level).speed;
    const dx = cx - e.x;
    const dy = cy - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 32) continue;

    const nx = Math.max(0, Math.min(WORLD_W - ENEMY_SIZE, e.x + (dx / dist) * speed * dt));
    const ny = Math.max(0, Math.min(WORLD_H - ENEMY_SIZE, e.y + (dy / dist) * speed * dt));

    if (!isBlockedCell(room.grid, nx, ny)) {
      e.x = nx; e.y = ny;
    } else if (!isBlockedCell(room.grid, nx, e.y)) {
      e.x = nx;
    } else if (!isBlockedCell(room.grid, e.x, ny)) {
      e.y = ny;
    }
    // fully blocked: enemy stays in place this tick
  }
}
