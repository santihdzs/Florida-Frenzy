import type { FastifyPluginAsync } from 'fastify';
import { getRunsByPlayer, getRunById } from '../services/run.service.js';
import { notFound, badRequest } from '../utils/errors.js';
import { completeRunSchema } from '../schemas/run.schema.js';

// CreateRunBody intentionally empty — deckId resolved server-side

interface RunParams {
  id: string;
}

interface CompleteRunBody {
  runId: number;
  coinsEarned: number;
  xpEarned: number;
  maxLevel: number;
}

const runRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/runs
  fastify.post(
    '/',
    async (request, reply) => {
      const playerId = request.user.playerId;

      // Find or create the player's active deck
      let deck = await fastify.prisma.deck.findFirst({
        where: { playerId, isActive: true },
      });

      if (!deck) {
        // No active deck yet — create a placeholder so the run can be recorded
        const defaultChar = await fastify.prisma.characterGame.findFirst();
        if (!defaultChar) {
          return reply.code(400).send(badRequest('No characters exist in the game yet'));
        }
        deck = await fastify.prisma.deck.create({
          data: {
            deckName: 'Default',
            isActive: true,
            playerId,
            characterGameId: defaultChar.id,
          },
        });
      }

      const run = await fastify.prisma.run.create({
        data: { playerId, deckId: deck.id, runStatus: 'IN_PROGRESS', zonesDone: 0, xpEarned: 0 },
      });

      return reply.code(201).send(run);
    }
  );

  // GET /api/runs
  fastify.get('/', async (request, reply) => {
    const runs = await getRunsByPlayer(fastify, request.user.playerId);
    return reply.send(runs);
  });

  // POST /api/runs/complete
  fastify.post<{ Body: CompleteRunBody }>(
    '/complete',
    { schema: completeRunSchema },
    async (request, reply) => {
      fastify.log.info({ body: request.body }, 'Run complete request');
      const { runId, coinsEarned, xpEarned, maxLevel } = request.body;
      const playerId = request.user.playerId;

      const run = await fastify.prisma.run.findFirst({
        where: { id: runId, playerId },
      });

      if (!run) {
        return reply.code(404).send(notFound('Run not found or does not belong to you'));
      }

      if (run.runStatus !== 'IN_PROGRESS') {
        return reply.code(400).send(badRequest('Run is already completed or abandoned'));
      }

      // Fetch current maxXp to compute the new max
      const currentPlayer = await fastify.prisma.player.findUniqueOrThrow({
        where: { id: playerId },
        select: { maxXp: true },
      });

      const [updatedRun, updatedPlayer] = await fastify.prisma.$transaction([
        fastify.prisma.run.update({
          where: { id: runId },
          data: { runStatus: 'COMPLETED', endTime: new Date(), xpEarned, coinsEarned, maxLevel },
        }),
        fastify.prisma.player.update({
          where: { id: playerId },
          data: {
            totalCoins: { increment: coinsEarned },
            maxXp: Math.max(currentPlayer.maxXp, xpEarned),
          },
        }),
      ]);

      const { passwordHash: _pw, ...safePlayer } = updatedPlayer;
      return reply.send({ run: updatedRun, player: safePlayer });
    }
  );

  // GET /api/runs/:id
  fastify.get<{ Params: RunParams }>('/:id', async (request, reply) => {
    const runId = parseInt(request.params.id, 10);
    if (isNaN(runId)) {
      return reply.code(400).send(badRequest('Invalid run ID'));
    }

    const run = await getRunById(fastify, runId, request.user.playerId);
    if (!run) {
      return reply.code(404).send(notFound('Run not found'));
    }

    return reply.send(run);
  });
};

export default runRoutes;
