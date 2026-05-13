import type { FastifyInstance } from 'fastify';
import type { Server as SocketServer } from 'socket.io';
import * as rm from './roomManager.js';
import { tickEnemies } from './gameLoop.js';

// ── Multiplayer run lifecycle (happy path) ─────────────────────────────────
//   lobby:start
//     → run:start                  (initial grid + enemies emitted to room)
//     → [gameplay tick loop: run:tick @ 50ms, run:move, run:hit_enemy, ...]
//     → run:reached_end × N        (every alive player crosses the end zone)
//     → run:level_start            (room.currentLevel++, new grid + enemies,
//                                   players reset to spawn slots; the tick
//                                   interval keeps running — only state mutates)
//     → [gameplay] → run:reached_end × N → run:level_start → ...
//     → run:ended                  (all players dead, or pre-existing trigger)
// ───────────────────────────────────────────────────────────────────────────

// fastify-socket.io decorates the instance with `io` but doesn't ship module augmentation
declare module 'fastify' {
  interface FastifyInstance {
    io: SocketServer;
  }
}

// Advance a room to the next level and emit run:level_start.
// Called from both run:reached_end (normal path) and run:player_died (when the
// dying player was the last one not yet at the end zone).
function broadcastLevelStart(io: SocketServer, roomCode: string): void {
  const result = rm.incrementLevel(roomCode);
  if (!result) return;
  io.to(roomCode).emit('run:level_start', {
    level:          result.level,
    seed:           result.seed,
    grid:           result.grid,
    enemies:        result.enemies.map(e => ({
      id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, type: e.type, alive: e.alive,
    })),
    startPositions: result.startPositions,
    // mapKey rotates per level (no back-to-back repeats). Client swaps tile
    // textures + background to match before rebuilding the world.
    mapKey:         result.mapKey,
    players:        rm.serializePlayers(rm.getRoom(roomCode)!),
  });
}

export function registerSocketHandlers(fastify: FastifyInstance): void {
  const io = fastify.io;

  // JWT auth middleware — runs before any event handler
  io.use((socket, next) => {
    const token = (socket.handshake.auth as { token?: string }).token;
    if (!token) {
      console.warn(`[socket] auth rejected — no token (socketId=${socket.id})`);
      return next(new Error('No token'));
    }
    try {
      const payload = fastify.jwt.verify<{ playerId: number }>(token);
      (socket as typeof socket & { playerId: number }).playerId = payload.playerId;
      console.log(`[socket] auth ok — playerId=${payload.playerId} socketId=${socket.id}`);
      next();
    } catch (err) {
      console.warn(`[socket] auth rejected — invalid token (socketId=${socket.id}) err=${(err as Error).message}`);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const playerId = (socket as typeof socket & { playerId: number }).playerId;

    // Resolve username and skin from DB before allowing any lobby events.
    // All event handlers that need these values await this promise.
    const readyPromise = fastify.prisma.player
      .findUnique({
        where:  { id: playerId },
        select: { username: true, equippedCharacter: true },
      })
      .then((player) => {
        if (!player) { socket.disconnect(); throw new Error('Player not found'); }
        const info = {
          username: player.username,
          skin: (player.equippedCharacter as string | null) ?? 'christian',
        };
        rm.registerOnline(playerId, socket.id);
        socket.emit('connected', { playerId, username: player.username });
        return info;
      });

    // ── Disconnect ─────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      rm.unregisterOnline(playerId);
      const room = rm.getRoomByPlayerId(playerId);
      if (!room) return;
      const updated = rm.leaveRoom(room.code, playerId);
      if (updated) {
        io.to(room.code).emit('lobby:state', {
          code:    updated.code,
          hostId:  updated.hostId,
          players: rm.serializePlayers(updated),
          state:   updated.state,
        });
      }
    });

    // ── Lobby: create room ──────────────────────────────────────────────────

    socket.on('lobby:create', () => {
      void (async () => {
        let info: { username: string; skin: string };
        try { info = await readyPromise; }
        catch { socket.emit('error', 'Not authenticated'); return; }

        const existing = rm.getRoomByPlayerId(playerId);
        if (existing) { socket.leave(existing.code); rm.leaveRoom(existing.code, playerId); }

        const room = rm.createRoom(playerId, info.username, socket.id, info.skin);
        socket.join(room.code);
        socket.emit('lobby:created', {
          code:    room.code,
          hostId:  room.hostId,
          players: rm.serializePlayers(room),
          state:   room.state,
        });
      })();
    });

    // ── Lobby: join room by code ────────────────────────────────────────────

    socket.on('lobby:join', (data: { code: string }) => {
      void (async () => {
        let info: { username: string; skin: string };
        try { info = await readyPromise; }
        catch { socket.emit('error', 'Not authenticated'); return; }

        const existing = rm.getRoomByPlayerId(playerId);
        if (existing) { socket.leave(existing.code); rm.leaveRoom(existing.code, playerId); }

        const room = rm.joinRoom(data.code, playerId, info.username, socket.id, info.skin);
        if (!room) { socket.emit('error', 'Room not found, full, or already started'); return; }

        socket.join(room.code);
        io.to(room.code).emit('lobby:state', {
          code:    room.code,
          hostId:  room.hostId,
          players: rm.serializePlayers(room),
          state:   room.state,
        });
      })();
    });

    // ── Lobby: invite a friend ──────────────────────────────────────────────

    socket.on('lobby:invite', (data: { friendId: number }) => {
      void (async () => {
        let info: { username: string; skin: string };
        try { info = await readyPromise; }
        catch { return; }

        const room = rm.getRoomByPlayerId(playerId);
        if (!room) { socket.emit('error', 'You are not in a room'); return; }
        const friendSocketId = rm.getSocketId(data.friendId);
        if (!friendSocketId) { socket.emit('error', 'Friend is not online'); return; }
        io.to(friendSocketId).emit('lobby:invite_received', {
          roomCode:     room.code,
          fromUsername: info.username,
          fromPlayerId: playerId,
        });
      })();
    });

    // ── Lobby: toggle ready ─────────────────────────────────────────────────

    socket.on('lobby:ready', (data: { ready: boolean }) => {
      const room = rm.getRoomByPlayerId(playerId);
      if (!room || room.state !== 'lobby') return;
      rm.setReady(room.code, playerId, data.ready);
      io.to(room.code).emit('lobby:state', {
        code:    room.code,
        hostId:  room.hostId,
        players: rm.serializePlayers(room),
        state:   room.state,
      });
    });

    // ── Lobby: leave room ───────────────────────────────────────────────────

    socket.on('lobby:leave', () => {
      const room = rm.getRoomByPlayerId(playerId);
      if (!room) return;
      socket.leave(room.code);
      const updated = rm.leaveRoom(room.code, playerId);
      if (updated) {
        io.to(room.code).emit('lobby:state', {
          code:    updated.code,
          hostId:  updated.hostId,
          players: rm.serializePlayers(updated),
          state:   updated.state,
        });
      }
      socket.emit('lobby:left', {});
    });

    // ── Lobby: start the run ────────────────────────────────────────────────

    socket.on('lobby:start', () => {
      void (async () => {
        const room = rm.getRoomByPlayerId(playerId);
        if (!room) return;
        if (room.hostId !== playerId) { socket.emit('error', 'Only the host can start'); return; }
        if (!rm.allReady(room))       { socket.emit('error', 'Not all players are ready'); return; }
        if (room.players.size < 1)    { socket.emit('error', 'Need at least one player'); return; }

        // Pull each player's shop-purchased upgrades from the DB so the run
        // uses their actual stats (not the hardcoded 100/100/10/1 defaults set
        // in createRoom/joinRoom). One findMany covers the whole room.
        const playerIds = Array.from(room.players.keys());
        let rows: Array<{
          id: number;
          maxHp: number;
          bulletDamage: number;
          fireRate: number;
          reloadTime: number;
          hasNoReload: boolean;
          magSize: number;
          staminaPool: number;
          staminaRegen: number;
          equippedCharacter: string;
        }>;
        try {
          rows = await fastify.prisma.player.findMany({
            where: { id: { in: playerIds } },
            select: {
              id: true,
              maxHp: true,
              bulletDamage: true,
              fireRate: true,
              reloadTime: true,
              hasNoReload: true,
              magSize: true,
              staminaPool: true,
              staminaRegen: true,
              equippedCharacter: true,
            },
          });
        } catch (err) {
          console.error('[lobby:start] failed to fetch player stats:', err);
          socket.emit('error', 'Failed to load player stats');
          return;
        }

        const playerStats: Record<number, {
          maxHp: number;
          bulletDamage: number;
          fireRate: number;
          reloadTime: number;
          hasNoReload: boolean;
          magSize: number;
          staminaPool: number;
          staminaRegen: number;
          equippedCharacter: string;
        }> = {};
        for (const row of rows) {
          playerStats[row.id] = {
            maxHp:             row.maxHp,
            bulletDamage:      row.bulletDamage,
            fireRate:          row.fireRate,
            reloadTime:        row.reloadTime,
            hasNoReload:       row.hasNoReload,
            magSize:           row.magSize,
            staminaPool:       row.staminaPool,
            staminaRegen:      row.staminaRegen,
            equippedCharacter: row.equippedCharacter,
          };
          // Replace the room's placeholder hp/maxHp with the DB value so the
          // wire-emitted ServerPlayer payload carries the correct maxHp for
          // every player (used by remote HP overlays on the client side).
          const rp = room.players.get(row.id);
          if (rp) {
            rp.maxHp = row.maxHp;
            rp.hp    = row.maxHp;
          }
        }

        room.state = 'running';
        room.gamePhase = 'in_progress';
        room.baseSeed = Date.now();
        // Reset reachedEnd in case a previous aborted run left it populated
        room.reachedEnd.clear();

        const initial = rm.generateLevelState(room.code, room.currentLevel);
        if (!initial) { socket.emit('error', 'Failed to initialize level'); return; }

        io.to(room.code).emit('run:start', {
          seed:    initial.seed,
          grid:    initial.grid,
          enemies: initial.enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, type: e.type, alive: e.alive })),
          players: rm.serializePlayers(room),
          playerStats,
          level:   room.currentLevel,
          mapKey:  room.mapKey,
        });

        // Server-authoritative enemy movement at 50ms ticks.
        // This interval is NOT torn down on level transitions — level boundaries
        // are state mutations on the room, the loop keeps running across them.
        let lastTick = Date.now();
        room.intervalId = setInterval(() => {
          const now = Date.now();
          tickEnemies(room, (now - lastTick) / 1000);
          lastTick = now;
          io.to(room.code).emit('run:tick', {
            enemies: room.enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, alive: e.alive })),
            players: rm.serializePlayers(room),
          });
        }, 50);
      })();
    });

    // ── Run: player position update ─────────────────────────────────────────

    socket.on('run:move', (data: { x: number; y: number }) => {
      const room = rm.getRoomByPlayerId(playerId);
      if (!room || room.state !== 'running') return;
      const p = room.players.get(playerId);
      console.log(`[run:move] playerId=${playerId} x=${Math.round(data.x)} y=${Math.round(data.y)} found=${!!p} alive=${p?.alive}`);
      if (p?.alive) { p.x = data.x; p.y = data.y; }
    });

    // ── Run: client reports hitting an enemy ────────────────────────────────

    socket.on('run:hit_enemy', (data: { enemyId: number; damage: number }) => {
      const room = rm.getRoomByPlayerId(playerId);
      if (!room || room.state !== 'running') return;
      const enemy = room.enemies.find(e => e.id === data.enemyId);
      if (!enemy || !enemy.alive) return;

      enemy.hp = Math.max(0, enemy.hp - Math.min(data.damage, 200));
      if (enemy.hp <= 0) {
        enemy.alive = false;
        io.to(room.code).emit('run:enemy_died', { enemyId: enemy.id });
      }
    });

    // ── Run: player death ───────────────────────────────────────────────────

    socket.on('run:player_died', () => {
      const room = rm.getRoomByPlayerId(playerId);
      if (!room || room.state !== 'running') return;
      const p = room.players.get(playerId);
      if (!p) return;
      p.alive = false;
      // Dead players can't satisfy the reached-end gate; drop them from the set.
      room.reachedEnd.delete(playerId);
      io.to(room.code).emit('run:player_died', { playerId });

      const living = Array.from(room.players.values()).filter(pl => pl.alive);
      if (living.length === 0) {
        clearInterval(room.intervalId);
        room.state = 'ended';
        room.gamePhase = 'ended';
        io.to(room.code).emit('run:ended', { level: room.currentLevel, allDead: true });
        rm.deleteRoom(room.code);
      } else if (living.every(pl => pl.endReached)) {
        // Last living players were already at the end — advance the level.
        broadcastLevelStart(io, room.code);
      }
    });

    // ── Run: player reached end zone ────────────────────────────────────────

    socket.on('run:reached_end', () => {
      const room = rm.getRoomByPlayerId(playerId);
      if (!room || room.state !== 'running') return;
      const p = room.players.get(playerId);
      if (!p || !p.alive) return;
      p.endReached = true;
      room.reachedEnd.add(playerId);

      const livingCount = Array.from(room.players.values()).filter(pl => pl.alive).length;
      if (livingCount > 0 && room.reachedEnd.size === livingCount) {
        broadcastLevelStart(io, room.code);
      }
    });
  });
}
