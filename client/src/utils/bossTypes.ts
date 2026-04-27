// Define types for boss data used in the game
export type BossAiLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type BossEnemyType = 'CARD_ENEMY' | 'FINAL_BOSS';
export type BossFaction = 'RAT' | 'RACCOON' | 'BEAR' | 'PYTHON';

export interface DuelBossData { // interface representing the structure of boss data for duels
  id: number;
  enemyName: string;
  enemyDesc?: string | null;
  enemyType: BossEnemyType;
  faction: BossFaction;
  enemyBaseHp: number;
  aiLevel: BossAiLevel;
  enemyUltimate?: string | null;
  enemyUltimateDesc?: string | null;
}