import type { FastifyPluginAsync } from 'fastify';
import { computeClanRank } from '../services/user.service.js';
import { hashPassword, verifyPassword } from '../services/auth.service.js';
import { notFound, conflict, unauthorized, badRequest } from '../utils/errors.js';
import { SAFE_PLAYER_SELECT } from '../utils/playerSelect.js';

interface PatchMeBody {
  username?: string;
  isMuted?: boolean;
}

async function getBestLevel(fastify: Parameters<FastifyPluginAsync>[0], playerId: number): Promise<number> {
  const bestRun = await fastify.prisma.run.findFirst({
    where: { playerId },
    orderBy: { maxLevel: 'desc' },
    select: { maxLevel: true },
  });
  return bestRun?.maxLevel ?? 0;
}

const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/users/admin-stats — admin only
  fastify.get('/admin-stats', async (request, reply) => {
    const player = await fastify.prisma.player.findUnique({
      where: { id: request.user.playerId },
      select: { isAdmin: true },
    });
    if (!player?.isAdmin) return reply.code(403).send({ error: 'Forbidden' });

    const [totalPlayers, totalRuns, avgData, activeSessions, levelDist] = await Promise.all([
      fastify.prisma.player.count(),
      fastify.prisma.run.count({ where: { runStatus: 'COMPLETED' } }),
      fastify.prisma.run.aggregate({ where: { runStatus: 'COMPLETED' }, _avg: { maxLevel: true } }),
      fastify.prisma.run.count({ where: { runStatus: 'IN_PROGRESS' } }),
      fastify.prisma.run.groupBy({
        by: ['maxLevel'],
        where: { runStatus: 'COMPLETED' },
        _count: { maxLevel: true },
        orderBy: { maxLevel: 'asc' },
      }),
    ]);

    return reply.send({
      totalPlayers,
      totalRuns,
      avgLevel: Number((avgData._avg.maxLevel ?? 0).toFixed(1)),
      activeSessions,
      levelDistribution: levelDist.map(r => ({ level: r.maxLevel, count: r._count.maxLevel })),
    });
  });

  // GET /api/users/me
  fastify.get('/me', async (request, reply) => {
    const playerId = request.user.playerId;
    const player = await fastify.prisma.player.findUnique({
      where: { id: playerId },
      select: SAFE_PLAYER_SELECT,
    });

    if (!player) {
      return reply.code(404).send(notFound('Player not found'));
    }

    const bestLevel = await getBestLevel(fastify, playerId);
    return reply.send({ ...player, bestLevel, clanRank: computeClanRank(bestLevel) });
  });

  // PATCH /api/users/me
  fastify.patch<{ Body: PatchMeBody }>(
    '/me',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 30 },
            isMuted:  { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { username, isMuted } = request.body;

      if (username === undefined && isMuted === undefined) {
        const player = await fastify.prisma.player.findUniqueOrThrow({
          where: { id: playerId },
          select: SAFE_PLAYER_SELECT,
        });
        const bestLevel = await getBestLevel(fastify, playerId);
        return reply.send({ ...player, bestLevel, clanRank: computeClanRank(bestLevel) });
      }

      if (username) {
        const existing = await fastify.prisma.player.findUnique({
          where: { username },
        });
        if (existing && existing.id !== playerId) {
          return reply.code(409).send(conflict('Username already taken'));
        }
      }

      const updated = await fastify.prisma.player.update({
        where: { id: playerId },
        data: {
          ...(username !== undefined && { username }),
          ...(isMuted  !== undefined && { isMuted }),
        },
        select: SAFE_PLAYER_SELECT,
      });

      const bestLevel = await getBestLevel(fastify, playerId);
      return reply.send({ ...updated, bestLevel, clanRank: computeClanRank(bestLevel) });
    }
  );
  // PATCH /api/users/me/email
  fastify.patch<{ Body: { email: string } }>(
    '/me/email',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', minLength: 5 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { email } = request.body;

      const existing = await fastify.prisma.player.findUnique({ where: { email } });
      if (existing && existing.id !== playerId) {
        return reply.code(409).send(conflict('Email already in use'));
      }

      const updated = await fastify.prisma.player.update({
        where: { id: playerId },
        data: { email },
        select: SAFE_PLAYER_SELECT,
      });
      const bestLevel = await getBestLevel(fastify, playerId);
      return reply.send({ ...updated, bestLevel, clanRank: computeClanRank(bestLevel) });
    }
  );

  // PATCH /api/users/me/password
  fastify.patch<{ Body: { currentPassword: string; newPassword: string } }>(
    '/me/password',
    {
      schema: {
        body: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword:     { type: 'string', minLength: 6 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { currentPassword, newPassword } = request.body;

      const player = await fastify.prisma.player.findUnique({
        where: { id: playerId },
        select: { passwordHash: true },
      });
      if (!player?.passwordHash) {
        return reply.code(400).send(badRequest('Password changes are not available for this account type'));
      }

      const valid = await verifyPassword(currentPassword, player.passwordHash);
      if (!valid) {
        return reply.code(401).send(unauthorized('Current password is incorrect'));
      }

      const newHash = await hashPassword(newPassword);
      await fastify.prisma.player.update({
        where: { id: playerId },
        data: { passwordHash: newHash },
      });
      return reply.send({ message: 'Password updated' });
    }
  );

  // DELETE /api/users/me
  fastify.delete<{ Body: { password: string } }>(
    '/me',
    {
      schema: {
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const { password } = request.body;

      const player = await fastify.prisma.player.findUnique({
        where: { id: playerId },
        select: { passwordHash: true },
      });
      if (!player?.passwordHash) {
        return reply.code(400).send(badRequest('Account deletion via password is not available for this account type'));
      }

      const valid = await verifyPassword(password, player.passwordHash);
      if (!valid) {
        return reply.code(401).send(unauthorized('Password is incorrect'));
      }

      await fastify.prisma.player.delete({ where: { id: playerId } });
      return reply.code(204).send();
    }
  );
};

export default userRoutes;
