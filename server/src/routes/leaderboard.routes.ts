import type { FastifyPluginAsync } from 'fastify';
import { computeClanRank } from '../services/user.service.js';

interface LeaderboardQuery {
  limit?: string;
}

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/leaderboard
  fastify.get<{ Querystring: LeaderboardQuery }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const raw = parseInt(request.query.limit ?? '10', 10);
      const limit = isNaN(raw) ? 10 : Math.min(Math.max(raw, 1), 100);

      const players = await fastify.prisma.player.findMany({
        orderBy: { maxXp: 'desc' },
        take: limit,
        select: {
          id: true,
          username: true,
          maxXp: true,
          firstLogin: true,
        },
      });

      return reply.send(
        players.map((p) => ({ ...p, clanRank: computeClanRank(p.maxXp) }))
      );
    }
  );
};

export default leaderboardRoutes;
