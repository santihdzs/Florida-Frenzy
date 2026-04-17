import type { FastifyInstance } from 'fastify';

export type ClanRank = 'ROOKIE' | 'VETERAN' | 'ELITE' | 'LEGEND';

export function computeClanRank(maxXp: number): ClanRank {
  if (maxXp < 500) return 'ROOKIE';
  if (maxXp < 2000) return 'VETERAN';
  if (maxXp < 5000) return 'ELITE';
  return 'LEGEND';
}

export async function getPlayerById(fastify: FastifyInstance, playerId: number) {
  return fastify.prisma.player.findUnique({ where: { id: playerId } });
}
