import type { FastifyPluginAsync } from 'fastify';
import { listCardsSchema } from '../schemas/cards.schema.js';
import { listCards } from '../services/cards.service.js';

interface CardsQuery { // Define the query parameters for listing cards
    rarity?: string;
    element?: string;
    category?: string;
}

const cardRoutes: FastifyPluginAsync = async (fastify) => { // Define the route for listing cards with optional filters
    fastify.get<{ Querystring: CardsQuery }>(
        '/', // Route to list cards with optional filters for rarity, element, and category
        { schema: listCardsSchema },
        async (request, reply) => {
            const cards = await listCards(fastify, request.query); // Call the service function to get the list of cards based on the provided filters
            return reply.send(cards); // Send the list of cards as the response
        }
    );
};

export default cardRoutes; // Export the card routes to be used in the main server file