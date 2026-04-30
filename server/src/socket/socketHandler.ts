import type { FastifyInstance } from 'fastify';
import type { Server as SocketServer } from 'socket.io';
import * as rm from './roomManager.js';
import { generateGrid, spawnEnemies, tickEnemies } from './gameLoop.js';

// fastify-socket.io decorates the instance with `io` but doesn't ship module augmentation
declare module 'fastify' {
  interface FastifyInstance {
    io: SocketServer;
  }
}

export function registerSocketHandlers(fastify: FastifyInstance): void {
  const io = fastify.io;

  // JWT auth middleware — runs before any event handler
  io.use((socket, next) => {
    const token = (socket.handshake.auth as { token?: string }).token;
    if (!token) return next(new Error('No token'));
    try {
      const payload = fastify.jwt.verify<{ playerId: number }>(token);
      (socket as typeof socket & { playerId: number }).playerId = payload.playerId;
      next();
    } catch {
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
      const room = rm.getRoomByPlayerId(playerId);
      if (!room) return;
      if (room.hostId !== playerId) { socket.emit('error', 'Only the host can start'); return; }
      if (!rm.allReady(room))       { socket.emit('error', 'Not all players are ready'); return; }
      if (room.players.size < 1)    { socket.emit('error', 'Need at least one player'); return; }

      room.state = 'running';
      const seed = Date.now();
      room.grid    = generateGrid(seed);
      room.enemies = spawnEnemies(room.level);

      io.to(room.code).emit('run:start', {
        seed,
        grid:    room.grid,
        enemies: room.enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, type: e.type, alive: e.alive })),
        players: rm.serializePlayers(room),
        level:   room.level,
        mapKey:  room.mapKey,
      });

      // Server-authoritative enemy movement at 100ms ticks
      let lastTick = Date.now();
      room.intervalId = setInterval(() => {
        const now = Date.now();
        tickEnemies(room, (now - lastTick) / 1000);
        lastTick = now;
        io.to(room.code).emit('run:tick', {
          enemies: room.enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, alive: e.alive })),
          players: rm.serializePlayers(room),
        });
      }, 100);
    });

    // ── Run: player position update ─────────────────────────────────────────

    socket.on('run:move', (data: { x: number; y: number }) => {
      const room = rm.getRoomByPlayerId(playerId);
      if (!room || room.state !== 'running') return;
      const p = room.players.get(playerId);
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
      io.to(room.code).emit('run:player_died', { playerId });

      const living = Array.from(room.players.values()).filter(pl => pl.alive);
      if (living.length === 0) {
        clearInterval(room.intervalId);
        room.state = 'ended';
        io.to(room.code).emit('run:ended', { level: room.level, allDead: true });
        rm.deleteRoom(room.code);
      } else if (living.every(pl => pl.endReached)) {
        room.level++;
        let i = 0;
        for (const pl of room.players.values()) {
          pl.alive = true; pl.hp = 100; pl.x = 100 + i * 64; pl.y = 300; pl.endReached = false; i++;
        }
        const seed = Date.now();
        room.grid    = generateGrid(seed);
        room.enemies = spawnEnemies(room.level);
        io.to(room.code).emit('run:level_complete', {
          level: room.level, seed, grid: room.grid,
          enemies: room.enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, type: e.type, alive: e.alive })),
          players: rm.serializePlayers(room),
        });
      }
    });

    // ── Run: player reached end zone ────────────────────────────────────────

    socket.on('run:reached_end', () => {
      const room = rm.getRoomByPlayerId(playerId);
      if (!room || room.state !== 'running') return;
      const p = room.players.get(playerId);
      if (!p || !p.alive) return;
      p.endReached = true;

      const living = Array.from(room.players.values()).filter(pl => pl.alive);
      if (living.length > 0 && living.every(pl => pl.endReached)) {
        room.level++;
        let i = 0;
        for (const pl of room.players.values()) {
          pl.alive = true; pl.hp = 100; pl.x = 100 + i * 64; pl.y = 300; pl.endReached = false; i++;
        }
        const seed = Date.now();
        room.grid    = generateGrid(seed);
        room.enemies = spawnEnemies(room.level);
        io.to(room.code).emit('run:level_complete', {
          level: room.level, seed, grid: room.grid,
          enemies: room.enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, type: e.type, alive: e.alive })),
          players: rm.serializePlayers(room),
        });
      }
    });
  });
}
