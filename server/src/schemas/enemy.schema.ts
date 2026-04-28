export const getRandomDuelBossSchema = {
  response: {
    200: { // 200 OK response schema for the random duel boss endpoint
      type: 'object',
      properties: { // define the expected structure of the response object for a random duel boss
        id: { type: 'number' },
        enemyName: { type: 'string' },
        enemyDesc: { type: ['string', 'null'] },
        enemyType: { type: 'string' },
        faction: { type: 'string' },
        enemyBaseHp: { type: 'number' },
        aiLevel: { type: 'string' },
        enemyUltimate: { type: ['string', 'null'] },
        enemyUltimateDesc: { type: ['string', 'null'] },
      },
      required: ['id', 'enemyName', 'enemyType', 'faction', 'enemyBaseHp', 'aiLevel'], // state those fields as required in the response
    },
  },
};