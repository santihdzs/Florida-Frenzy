/* 
*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* This file defines JSON schemas for validating the input parameters and request bodies of the 
* deck-related API endpoints in the server.
* 
* AI was used to assist in the design of the API routes and their interactions with the database
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