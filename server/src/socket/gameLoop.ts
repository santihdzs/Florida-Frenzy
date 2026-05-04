import type { Room, EnemyState } from './roomManager.js';

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

const ENEMY_SPEEDS: Record<string, number> = { SHOOTER: 80, TANK: 55, SWIFT: 160 };
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

export function spawnEnemies(level: number): EnemyState[] {
  const types: EnemyState['type'][] = ['SHOOTER', 'TANK', 'SWIFT'];
  const count = Math.min(5 + level * 2, 20);
  return Array.from({ length: count }, (_, i) => {
    const type = types[i % 3];
    const hp = type === 'TANK' ? 200 + level * 20 : type === 'SWIFT' ? 60 + level * 8 : 100 + level * 12;
    return {
      id: ++_enemyIdCounter,
      x: 2500 + Math.random() * 2000,
      y: 50   + Math.random() * (WORLD_H - 100),
      hp,
      maxHp: hp,
      alive: true,
      type,
    };
  });
}

export function tickEnemies(room: Room, dt: number): void {
  const alive = Array.from(room.players.values()).filter(p => p.alive);
  if (alive.length === 0) return;

  // enemies target the centroid of all alive players
  const cx = alive.reduce((s, p) => s + p.x, 0) / alive.length;
  const cy = alive.reduce((s, p) => s + p.y, 0) / alive.length;

  for (const e of room.enemies) {
    if (!e.alive) continue;
    const speed = ENEMY_SPEEDS[e.type] ?? 80;
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
