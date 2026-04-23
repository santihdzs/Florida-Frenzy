import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';

type RunWithCount = Prisma.RunGetPayload<{
  include: { _count: { select: { runZones: true } } };
}>;

type RunWithDetails = Prisma.RunGetPayload<{
  include: {
    runZones: { include: { zoneGame: true } };
    battles: {
      include: {
        enemy: true;
        battleRewards: { include: { reward: true } };
      };
    };
  };
}>;

export async function getRunsByPlayer(
  fastify: FastifyInstance,
  playerId: number
): Promise<RunWithCount[]> {
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
): Promise<RunWithDetails | null> {
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
