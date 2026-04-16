import type { FastifyPluginAsync } from 'fastify';
import { getRunsByPlayer, getRunById } from '../services/run.service.js';
import { notFound, badRequest } from '../utils/errors.js';

interface CreateRunBody {
  deckId: number;
}

interface RunParams {
  id: string;
}

const runRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/runs
  fastify.post<{ Body: CreateRunBody }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['deckId'],
          properties: {
            deckId: { type: 'integer' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { deckId } = request.body;
      const playerId = request.user.playerId;

      const deck = await fastify.prisma.deck.findFirst({
        where: { id: deckId, playerId },
      });

      if (!deck) {
        return reply.code(404).send(notFound('Deck not found or does not belong to you'));
      }

      if (!deck.isActive) {
        return reply.code(400).send(badRequest('Deck is not active'));
      }

      const run = await fastify.prisma.run.create({
        data: { playerId, deckId, runStatus: 'IN_PROGRESS', zonesDone: 0 },
      });

      return reply.code(201).send(run);
    }
  );

  // GET /api/runs
  fastify.get('/', async (request, reply) => {
    const runs = await getRunsByPlayer(fastify, request.user.playerId);
    return reply.send(runs);
  });

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
