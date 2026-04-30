/*
*
* AlL the routes to manage decks, including fetching the initial data for the deck 
* management screen, saving a deck, and activating a deck.
* 
*/

import type { FastifyInstance } from 'fastify';
import {
  activateDeckBodySchema,
  deckBootstrapParamsSchema,
  saveDeckBodySchema,
} from '../schemas/deck.schema.js';

import {
  getDeckBootstrap,
  saveDeck,
  setActiveDeck,
  getActiveDeck,
} from '../services/deck.service.js';

export default async function deckRoutes(fastify: FastifyInstance) {
  fastify.get('/bootstrap/:playerId', {
    schema: {
      params: deckBootstrapParamsSchema,
    }, //  get the initial data needed for the deck management screen
  }, async (request, reply) => {
    try {
      const { playerId } = request.params as { playerId: number };
      const data = await getDeckBootstrap(fastify.prisma, Number(playerId));
      return reply.send(data);
    } 
    
    catch (error) {
      request.log.error(error);
      return reply.code(400).send({ message: error instanceof Error ? error.message : 'Failed to load deck bootstrap.' });
    }
  }); // defines a GET route to fetch the initial data needed for the deck management screen, including the player's owned cards, existing decks, and all available cards in the game, based on the player's ID provided in the URL parameters

  fastify.get('/active/:playerId', async (request, reply) => {
    try {
      const { playerId } = request.params as { playerId: number };
      const data = await getActiveDeck(fastify.prisma, Number(playerId));
      return reply.send(data);
    }  // defines a GET route to fetch the currently active deck for a player
    
    catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        message: error instanceof Error ? error.message : 'Failed to load active deck.',
      });
    }
  });

  fastify.put('/save', {
    schema: {
      body: saveDeckBodySchema,
    },
  }, async (request, reply) => {
    try {
      const body = request.body as {
        playerId: number;
        slotIndex: number;
        characterGameId: number;
        cardGameIds: number[];
        makeActive?: boolean;
      };

      const deck = await saveDeck(fastify.prisma, body);
      return reply.send(deck);
    } 
    
    catch (error) {
      request.log.error(error);
      return reply.code(400).send({ message: error instanceof Error ? error.message : 'Failed to save deck.' });
    }
  }); // defines a PUT route to save a deck, including the player's ID, deck slot index, character game ID, and list of card game IDs

  fastify.patch('/activate', {
    schema: {
      body: activateDeckBodySchema,
    },
  }, async (request, reply) => {
    try {
      const body = request.body as {
        playerId: number;
        deckId: number;
      };

      const result = await setActiveDeck(fastify.prisma, body);
      return reply.send(result);
    } 
    
    catch (error) {
      request.log.error(error);
      return reply.code(400).send({ message: error instanceof Error ? error.message : 'Failed to activate deck.' });
    }
  }); // defines a PATCH route to activate a deck, setting it as the active deck for the player based on the player's ID and deck ID provided in the request body
}