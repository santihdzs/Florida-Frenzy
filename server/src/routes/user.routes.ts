import type { FastifyPluginAsync } from 'fastify';
import { computeClanRank } from '../services/user.service.js';
import { notFound, conflict } from '../utils/errors.js';

interface PatchMeBody {
  username?: string;
}

const PLAYER_SELECT = {
  id: true,
  username: true,
  email: true,
  maxXp: true,
  totalCoins: true,
  maxHp: true,
  isAdmin: true,
  authProvider: true,
  firebaseUid: true,
  firstLogin: true,
  lastLogin: true,
} as const;

const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/users/me
  fastify.get('/me', async (request, reply) => {
    const player = await fastify.prisma.player.findUnique({
      where: { id: request.user.playerId },
      select: PLAYER_SELECT,
    });

    if (!player) {
      return reply.code(404).send(notFound('Player not found'));
    }

    return reply.send({ ...player, clanRank: computeClanRank(player.maxXp) });
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
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { username } = request.body;

      if (username) {
        const existing = await fastify.prisma.player.findUnique({
          where: { username },
        });
        if (existing && existing.id !== request.user.playerId) {
          return reply.code(409).send(conflict('Username already taken'));
        }
      }

      const updated = await fastify.prisma.player.update({
        where: { id: request.user.playerId },
        data: {
          ...(username !== undefined && { username }),
        },
        select: PLAYER_SELECT,
      });

      return reply.send({ ...updated, clanRank: computeClanRank(updated.maxXp) });
    }
  );
};

export default userRoutes;
