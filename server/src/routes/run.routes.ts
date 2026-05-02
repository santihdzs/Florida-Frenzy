import type { FastifyPluginAsync } from 'fastify';
import { getRunsByPlayer, getRunById } from '../services/run.service.js';
import { notFound, badRequest } from '../utils/errors.js';
import { completeRunSchema } from '../schemas/run.schema.js';
import { SAFE_PLAYER_SELECT } from '../utils/playerSelect.js';
import { computeClanRank } from '../services/user.service.js';

// CreateRunBody intentionally empty — deckId resolved server-side

interface RunParams {
  id: string;
}

interface CompleteRunBody {
  runId: number;
  coinsEarned: number;
  xpEarned: number;
  maxLevel: number;
  enemiesKilled?: number;
}

interface UnlockLegendaryCardBody {
  cardName: string;
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
        data: { playerId, deckId: deck.id, runStatus: 'IN_PROGRESS', zonesDone: 0, xpEarned: 0, coinsEarned: 0 },
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
      const { runId, coinsEarned, xpEarned, maxLevel, enemiesKilled = 0 } = request.body;
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

      const result = await fastify.prisma.$transaction(async (tx) => {
        const currentPlayer = await tx.player.findUniqueOrThrow({
          where: { id: playerId },
          select: { maxXp: true },
        });
        const updatedRun = await tx.run.update({
          where: { id: runId },
          data: { runStatus: 'COMPLETED', endTime: new Date(), xpEarned, coinsEarned, maxLevel },
        });
        const updatedPlayer = await tx.player.update({
          where: { id: playerId },
          data: {
            totalCoins:         { increment: coinsEarned },
            maxXp:              Math.max(currentPlayer.maxXp, xpEarned),
            totalGamesPlayed:   { increment: 1 },
            totalEnemiesKilled: { increment: enemiesKilled },
          },
          select: SAFE_PLAYER_SELECT,
        });
        return { run: updatedRun, player: updatedPlayer };
      });

      return reply.send(result);
    }
  );

  // POST /api/runs/beat-pythra
  fastify.post('/beat-pythra', async (request, reply) => {
    const playerId = request.user.playerId;

    const player = await (fastify.prisma as any).player.findUnique({
      where: { id: playerId },
      select: { hasBeatenPythra: true },
    });

    if (!player) {
      return reply.code(404).send(notFound('Player not found'));
    }

    const firstTime = !player.hasBeatenPythra;

    if (firstTime) {
      await (fastify.prisma as any).player.update({
        where: { id: playerId },
        data: { hasBeatenPythra: true },
      });
    }

    return reply.send({ firstTime });
  });

  // POST /api/runs/abandon-stale
  fastify.post('/abandon-stale', async (request, reply) => {
    const playerId = request.user.playerId;
    await fastify.prisma.run.updateMany({
      where: { playerId, runStatus: 'IN_PROGRESS' },
      data: { runStatus: 'ABANDONED', endTime: new Date() },
    });
    return reply.code(200).send({ ok: true });
  });

  // POST /api/runs/unlock-legendary-card
  fastify.post<{ Body: UnlockLegendaryCardBody }>(
    '/unlock-legendary-card',
    {
      schema: {
        body: {
          type: 'object',
          required: ['cardName'],
          additionalProperties: false,
          properties: {
            cardName: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const playerId = request.user.playerId;
      const cardName = request.body.cardName.trim();

      const player = await fastify.prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true, maxXp: true },
      });
      if (!player) {
        return reply.code(404).send(notFound('Player not found'));
      }

      const rank = computeClanRank(player.maxXp);
      if (rank !== 'LEGEND') {
        return reply.code(403).send(badRequest('Legend rank required'));
      }

      const card = await fastify.prisma.cardGame.findFirst({
        where: {
          cardName,
          cardRarity: 'LEGENDARY',
        },
        select: { id: true },
      });

      if (!card) {
        return reply.code(404).send(notFound('Legendary card not found'));
      }

      const existing = await fastify.prisma.playerCard.findFirst({
        where: { playerId, cardGameId: card.id },
      });

      if (existing?.isUnlocked && existing.numCardsOwned > 0) {
        return reply.send({ ok: true, cardGameId: card.id, alreadyUnlocked: true });
      }

      if (existing) {
        await fastify.prisma.playerCard.update({
          where: { id: existing.id },
          data: {
            isUnlocked: true,
            numCardsOwned: Math.max(existing.numCardsOwned, 1),
          },
        });
      } else {
        await fastify.prisma.playerCard.create({
          data: {
            playerId,
            cardGameId: card.id,
            isUnlocked: true,
            numCardsOwned: 1,
          },
        });
      }

      return reply.send({ ok: true, cardGameId: card.id });
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
