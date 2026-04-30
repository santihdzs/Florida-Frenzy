/* 
*
* This file defines JSON schemas for validating the input parameters and request bodies of the 
* deck-related API endpoints in the server.
* These schemas ensure that the incoming data for operations such as fetching deck bootstrap data, 
* saving a deck configuration, and activating a deck adhere to the expected structure and types.
* These schemas specify required fields, their types, and any constraints (like minimum values or 
* array lengths) to maintain data integrity and prevent invalid requests from being processed by the server.
*/

export const deckBootstrapParamsSchema = {
  type: 'object',
  required: ['playerId'],
  properties: {
    playerId: { type: 'integer', minimum: 1 },
  },
}; // validates that the request to fetch deck bootstrap data includes a valid playerId parameter that is a positive integer

export const saveDeckBodySchema = {
  type: 'object',
  required: ['playerId', 'slotIndex', 'characterGameId', 'cardGameIds'],
  properties: {
    playerId: { type: 'integer', minimum: 1 },
    slotIndex: { type: 'integer', minimum: 0, maximum: 2 },
    characterGameId: { type: 'integer', minimum: 1 },
    cardGameIds: {
      type: 'array',
      minItems: 0,
      items: { type: 'integer', minimum: 1 },
    },
    makeActive: { type: 'boolean' },
  },
}; // validates the request body for saving a deck configuration

export const activateDeckBodySchema = {
  type: 'object',
  required: ['playerId', 'deckId'],
  properties: {
    playerId: { type: 'integer', minimum: 1 },
    deckId: { type: 'integer', minimum: 1 },
  },
}; // validates the request body for setting a deck as active, ensuring it includes valid playerId and deckId parameters that are positive integers