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
  alive: boolean;
  type: 'SHOOTER' | 'TANK' | 'SWIFT';
}

export interface Room {
  code: string;
  hostId: number;
  players: Map<number, RoomPlayer>;
  state: 'lobby' | 'running' | 'ended';
  grid: number[][];
  enemies: EnemyState[];
  level: number;
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
    grid: [],
    enemies: [],
    level: 1,
    mapKey: 'sewers',
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
  if (!room || room.state !== 'lobby' || room.players.size >= 3) return null;
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
