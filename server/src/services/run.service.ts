import type { FastifyInstance } from 'fastify';

export async function getRunsByPlayer(fastify: FastifyInstance, playerId: number) {
  return fastify.prisma.run.findMany({
    where: { playerId },
    orderBy: { startTime: 'desc' },
    include: { _count: { select: { runZones: true } } },
  });
}

export async function getRunById(
  fastify: FastifyInstance,
  runId: number,
  playerId: number
) {
  return fastify.prisma.run.findFirst({
    where: { id: runId, playerId },
    include: {
      runZones: { include: { zoneGame: true } },
      battles: {
        include: {
          enemy: true,
          battleRewards: { include: { reward: true } },
        },
      },
    },
  });
}
