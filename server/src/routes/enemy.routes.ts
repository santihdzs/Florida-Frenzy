import type { FastifyPluginAsync } from 'fastify';
import { getDuelBosses, getRandomDuelBoss } from '../services/enemy.service.js';
import { getRandomDuelBossSchema } from '../schemas/enemy.schema.js';

const enemyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/duel-bosses', async () => { // endpoint to retrieve all duel bosses, used for the boss selection screen in the game
    return getDuelBosses(fastify);
  });

  fastify.get('/random-duel-boss', { schema: getRandomDuelBossSchema }, async () => {
    return getRandomDuelBoss(fastify); // endpoint to retrieve a random duel boss, used for the random boss encounter in the duel mode of the game, with response validation using the defined schema
  });
};

export default enemyRoutes; // export the enemy routes to be registered in the main server file, allowing the game to fetch boss data for duels