import { generateGrid, spawnEnemies } from './gameLoop.js';

// Maximum players per lobby/room. Mirror this value anywhere the client
// renders a fixed roster (currently MultiplayerLobbyScene.ts).
export const MAX_ROOM_SIZE = 4;

// Keys of every map registered in client/src/utils/mapConfig.ts. The server
// only needs the strings — the client owns the texture data. If a new map is
// added on the client, also add its key here so the rotation can pick it.
const MAP_KEYS: readonly string[] = ['everglades', 'garbage_dump', 'sewers', 'suburbs'];

// Mirror of client `selectMap()` in utils/mapConfig.ts. Picks a random map
// that isn't the previously-used one; if the filter would leave the pool
// empty (single-map config, or unknown previousKey filtering nothing out),
// falls back to the full list so the function never throws and never loops.
function selectMapKey(previousKey?: string): string {
  const candidates = MAP_KEYS.filter(k => k !== previousKey);
  const pool = candidates.length > 0 ? candidates : MAP_KEYS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export interface RoomPlayer {
  playerId: number;
  username: string;
  socketId: string;
  ready: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  skin: string;
  endReached: boolean;
}

export interface EnemyState {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  // Server-internal per-enemy speed assigned at spawn time via the
  // single-player getEnemyStats() formula. Not included in any wire payload
  // (the client doesn't need it — server is authoritative for movement).
  speed: number;
  alive: boolean;
  type: 'SHOOTER' | 'TANK' | 'SWIFT';
}

// gamePhase is the canonical phase enum used by the level-transition logic.
// `state` is kept for backwards compatibility with code that already reads it.
export type GamePhase = 'waiting' | 'in_progress' | 'level_complete' | 'ended';

export interface Room {
  code: string;
  hostId: number;
  players: Map<number, RoomPlayer>;
  state: 'lobby' | 'running' | 'ended';
  gamePhase: GamePhase;
  grid: number[][];
  enemies: EnemyState[];
  // currentLevel is the canonical level counter; `level` is the legacy alias
  // kept in sync for any external consumer still reading it.
  currentLevel: number;
  level: number;
  // baseSeed is mixed with currentLevel to derive a deterministic per-level
  // grid seed (`baseSeed XOR (level * 2654435761)`).
  baseSeed: number;
  // playerIds of players who have emitted run:reached_end in the current level.
  // Cleared by incrementLevel() at the start of each new level.
  reachedEnd: Set<number>;
  mapKey: string;
  intervalId?: ReturnType<typeof setInterval>;
}

// Online players: playerId → socketId
const onlinePlayers = new Map<number, string>();
const rooms = new Map<string, Room>();

// Excludes I and O to avoid visual ambiguity
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

export function registerOnline(playerId: number, socketId: string): void {
  onlinePlayers.set(playerId, socketId);
}

export function unregisterOnline(playerId: number): void {
  onlinePlayers.delete(playerId);
}

export function getSocketId(playerId: number): string | undefined {
  return onlinePlayers.get(playerId);
}

export function getOnlineCount(): number {
  return onlinePlayers.size;
}

export function createRoom(
  hostId: number,
  hostUsername: string,
  hostSocketId: string,
  skin: string,
): Room {
  const code = generateCode();
  const room: Room = {
    code,
    hostId,
    players: new Map([[hostId, {
      playerId: hostId,
      username: hostUsername,
      socketId: hostSocketId,
      ready: false,
      x: 100,
      y: 300,
      hp: 100,
      maxHp: 100,
      alive: true,
      skin,
      endReached: false,
    }]]),
    state: 'lobby',
    gamePhase: 'waiting',
    grid: [],
    enemies: [],
    currentLevel: 1,
    level: 1,
    baseSeed: 0,
    reachedEnd: new Set<number>(),
    // Random initial map; subsequent levels rotate via incrementLevel().
    mapKey: selectMapKey(),
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(
  code: string,
  playerId: number,
  username: string,
  socketId: string,
  skin: string,
): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room || room.state !== 'lobby' || room.players.size >= MAX_ROOM_SIZE) return null;
  const startX = 100 + room.players.size * 64;
  room.players.set(playerId, {
    playerId,
    username,
    socketId,
    ready: false,
    x: startX,
    y: 300,
    hp: 100,
    maxHp: 100,
    alive: true,
    skin,
    endReached: false,
  });
  return room;
}

export function leaveRoom(code: string, playerId: number): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  room.players.delete(playerId);
  if (room.players.size === 0) {
    if (room.intervalId) clearInterval(room.intervalId);
    rooms.delete(code);
    return null;
  }
  if (room.hostId === playerId) {
    room.hostId = room.players.keys().next().value as number;
  }
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomByPlayerId(playerId: number): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.has(playerId)) return room;
  }
  return undefined;
}

export function setReady(code: string, playerId: number, ready: boolean): void {
  const player = rooms.get(code)?.players.get(playerId);
  if (player) player.ready = ready;
}

export function allReady(room: Room): boolean {
  if (room.players.size < 1) return false;
  for (const p of room.players.values()) {
    if (!p.ready) return false;
  }
  return true;
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (room?.intervalId) clearInterval(room.intervalId);
  rooms.delete(code);
}

// strips socketId so clients never receive internal socket identifiers
export function serializePlayers(room: Room): Omit<RoomPlayer, 'socketId'>[] {
  return Array.from(room.players.values()).map(({ socketId: _s, ...rest }) => rest);
}

// Spawn slot for the i-th player in the room — left edge, vertically centered.
// Matches the layout used by the original inline reset logic at game start.
function spawnSlot(index: number): { x: number; y: number } {
  return { x: 100 + index * 64, y: 300 };
}

// Deterministic per-level seed: baseSeed XOR (level * golden-ratio-ish constant).
// Each level produces a distinct grid layout but the run remains reproducible
// from a single baseSeed if ever needed for replay/debug.
function deriveLevelSeed(baseSeed: number, level: number): number {
  return (baseSeed ^ Math.imul(level, 2654435761)) >>> 0;
}

// Shared helper: regenerate grid and enemies for the given level. Stores both
// on the room and returns them so callers can include them in network payloads.
// Used by lobby:start (initial level) and incrementLevel (subsequent levels).
export function generateLevelState(
  roomCode: string,
  level: number,
): { seed: number; grid: number[][]; enemies: EnemyState[] } | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.baseSeed === 0) room.baseSeed = Date.now();
  const seed = deriveLevelSeed(room.baseSeed, level);
  room.grid    = generateGrid(seed);
  // Pass the room's player count so spawnEnemies can apply the per-player
  // enemy-count multiplier defined by the multiplayer scaling rules.
  room.enemies = spawnEnemies(level, room.players.size);
  return { seed, grid: room.grid, enemies: room.enemies };
}

// Advance the room to the next level: bump counters, clear reachedEnd, reset
// every alive player to a spawn slot, rotate the map (no back-to-back repeat),
// and regenerate the level state. Returns the new state + per-player start
// positions so the caller can broadcast them. Returns null if the room no
// longer exists.
export function incrementLevel(roomCode: string): {
  level: number;
  seed: number;
  grid: number[][];
  enemies: EnemyState[];
  startPositions: Record<number, { x: number; y: number }>;
  mapKey: string;
} | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.gamePhase = 'level_complete';
  room.currentLevel++;
  room.level = room.currentLevel; // keep legacy alias in sync
  room.reachedEnd.clear();

  // Rotate to a different map than the one used on the previous level.
  // Mirrors the single-player no-repeat guarantee from RunScene/mapConfig.
  room.mapKey = selectMapKey(room.mapKey);

  const startPositions: Record<number, { x: number; y: number }> = {};
  let i = 0;
  for (const pl of room.players.values()) {
    if (!pl.alive) { i++; continue; } // dead players stay dead; spectators don't respawn
    const slot = spawnSlot(i);
    pl.x = slot.x;
    pl.y = slot.y;
    pl.endReached = false;
    startPositions[pl.playerId] = slot;
    i++;
  }

  const state = generateLevelState(roomCode, room.currentLevel);
  room.gamePhase = 'in_progress';
  if (!state) return null;
  return { level: room.currentLevel, ...state, startPositions, mapKey: room.mapKey };
}
