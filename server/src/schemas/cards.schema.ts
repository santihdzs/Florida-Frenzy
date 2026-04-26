/*
*
* To validate Card filters and queries in querystring and request body
*
*/


export const listCardsSchema = { // Validation for query parameters when listing cards
    querystring: { // Validation for query parameters when listing cards
        type: 'object',
        properties: {
            rarity: {
                type: 'string',
                enum: ['BASE', 'EFFECT', 'RARE', 'LEGENDARY'], // Allowed values for rarity filter
            },
            element: {
                type: 'string',
                enum: ['FIRE', 'WATER', 'SWAMP', 'SAND', 'ICE'], // Allowed values for element filter
            },
            category: {
                type: 'string',
                enum: ['ATTACK', 'DEFENSE', 'STATUS', 'SPECIAL'], // Allowed values for category filter
            },
        },
        additionalProperties: false, // Disallow additional query parameters
    },
} as const; // Use 'as const' to ensure the schema is treated as a constant type