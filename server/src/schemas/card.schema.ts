/*
*
* To validate Card filters and queries in querystring and request body
*
*/


export const listCardsSchema = { // Validation for query parameters when listing cards
    querystring: { // Validation for query parameters when listing cards
        type: 'object',
        properties: { // Validation for query parameters when listing cards
            rarity: { type: 'string' },
            element: { type: 'string' },
            category: { type: 'string' },
        },
        additionalProperties: false, // Disallow additional query parameters
    },
} as const; // Use 'as const' to ensure the schema is treated as a constant type