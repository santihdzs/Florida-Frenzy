import type { FastifyInstance } from 'fastify';

export type ClanRank = 'ROOKIE' | 'VETERAN' | 'ELITE' | 'LEGEND';

export function computeClanRank(swampXp: number): ClanRank {
  if (swampXp < 500) return 'ROOKIE';
  if (swampXp < 2000) return 'VETERAN';
  if (swampXp < 5000) return 'ELITE';
  return 'LEGEND';
}

export async function getPlayerById(fastify: FastifyInstance, playerId: number) {
  return fastify.prisma.player.findUnique({ where: { id: playerId } });
}
