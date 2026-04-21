export type ClanRank = 'ROOKIE' | 'VETERAN' | 'ELITE' | 'LEGEND';

export function computeClanRank(maxLevel: number): ClanRank {
  if (maxLevel >= 15) return 'LEGEND';
  if (maxLevel >= 10) return 'ELITE';
  if (maxLevel >= 5)  return 'VETERAN';
  return 'ROOKIE';
}
