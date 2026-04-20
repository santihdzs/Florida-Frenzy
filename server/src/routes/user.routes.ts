import type { FastifyPluginAsync } from 'fastify';
import { computeClanRank } from '../services/user.service.js';
import { notFound, conflict } from '../utils/errors.js';
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
};

export default userRoutes;
