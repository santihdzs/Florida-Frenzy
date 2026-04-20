export type ClanRank = 'ROOKIE' | 'VETERAN' | 'ELITE' | 'LEGEND';

export function computeClanRank(maxXp: number): ClanRank {
  if (maxXp < 500) return 'ROOKIE';
  if (maxXp < 2000) return 'VETERAN';
  if (maxXp < 5000) return 'ELITE';
  return 'LEGEND';
}
