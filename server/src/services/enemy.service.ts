import type { FastifyInstance } from 'fastify';

export async function getDuelBosses(fastify: FastifyInstance) { // fetch all bosses from the database
  return fastify.prisma.enemy.findMany({
    where: {
      enemyType: { in: ['CARD_ENEMY', 'FINAL_BOSS'] },
    }, // filter to include only card enemies and final bosses
    orderBy: { id: 'asc' }, // order results by ID in ascending order for consistent retrieval
  });
}

// Function to retrieve a random boss for duels, 
// with weighted probabilities to make certain bosses rarer
export async function getRandomDuelBoss(fastify: FastifyInstance) {
  const bosses = await getDuelBosses(fastify);

  const weightedPool = bosses.flatMap((boss) => {
    if (boss.enemyName === 'Pythra') return [boss]; // very rare final boss with only 1 entry in the pool
    return [boss, boss, boss, boss, boss, boss, boss, boss, boss, boss]; // common bosses have 10 entries in the pool to increase their chances of being selected
  });

  const pick = weightedPool[Math.floor(Math.random() * weightedPool.length)]; // randomly select a boss from the weighted pool, giving rarer bosses a lower chance of being picked due to fewer entries
  return pick;
}