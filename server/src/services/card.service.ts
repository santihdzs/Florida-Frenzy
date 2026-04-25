import type { FastifyInstance } from 'fastify';

interface ListCardsFilters {
    rarity?: string;
    element?: string;
    category?: string;
} // Define the filters for listing cards, all properties are optional

export async function listCards(fastify: FastifyInstance, filters: ListCardsFilters) { // Function to list cards based on provided filters
    return fastify.prisma.cardGame.findMany({
        where: {
            ...(filters.rarity && { cardRarity: filters.rarity as any }),
            ...(filters.element && { cardElement: filters.element as any }),
            ...(filters.category && { cardCategory: filters.category as any }),
        }, // Apply filters to the query if they are provided
        orderBy: [
            { cardRarity: 'asc' },
            { cardElement: 'asc' },
            { cardNumber: 'asc' },
            { id: 'asc' },
        ], // Order the results by rarity, element, card number, and ID for consistent sorting
    });
}