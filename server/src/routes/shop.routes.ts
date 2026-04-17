import type { FastifyPluginAsync } from 'fastify';
import { badRequest } from '../utils/errors.js';

const HP_TIERS = [
  { from: 50,  to: 60,  cost: 700  },
  { from: 60,  to: 70,  cost: 1000 },
  { from: 70,  to: 80,  cost: 2500 },
  { from: 80,  to: 90,  cost: 2500 },
  { from: 90,  to: 100, cost: 3000 },
  { from: 100, to: 120, cost: 3500 },
  { from: 120, to: 140, cost: 4000 },
  { from: 140, to: 160, cost: 4500 },
  { from: 160, to: 180, cost: 5000 },
  { from: 180, to: 200, cost: 5000 },
];

const shopRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/upgrade-hp', { schema: { body: { type: 'object', additionalProperties: false } } }, async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await fastify.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
      select: { maxHp: true, totalCoins: true },
    });

    const tier = HP_TIERS.find(t => t.from === player.maxHp);
    if (!tier) {
      return reply.code(400).send(badRequest('Max HP reached'));
    }

    if (player.totalCoins < tier.cost) {
      return reply.code(400).send(badRequest('Not enough coins'));
    }

    const [updatedPlayer] = await fastify.prisma.$transaction([
      fastify.prisma.player.update({
        where: { id: playerId },
        data: {
          maxHp: tier.to,
          totalCoins: { decrement: tier.cost },
        },
      }),
    ]);

    const { passwordHash: _pw, ...safePlayer } = updatedPlayer;
    return reply.send({ player: safePlayer });
  });
};

export default shopRoutes;
