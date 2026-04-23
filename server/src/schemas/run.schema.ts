export const completeRunSchema = {
  body: {
    type: 'object',
    required: ['runId', 'coinsEarned', 'xpEarned', 'maxLevel'],
    properties: {
      runId:         { type: 'integer', minimum: 1 },
      coinsEarned:   { type: 'integer', minimum: 0 },
      xpEarned:      { type: 'integer', minimum: 0 },
      maxLevel:      { type: 'integer', minimum: 1 },
      enemiesKilled: { type: 'integer', minimum: 0 },
    },
    additionalProperties: false,
  },
} as const;
