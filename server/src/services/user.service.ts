export type ClanRank = 'ROOKIE' | 'VETERAN' | 'ELITE' | 'LEGEND';

export function computeClanRank(maxLevel: number): ClanRank {
  if (maxLevel >= 13) return 'LEGEND';
  if (maxLevel >= 8)  return 'ELITE';
  if (maxLevel >= 4)  return 'VETERAN';
  return 'ROOKIE';
}
