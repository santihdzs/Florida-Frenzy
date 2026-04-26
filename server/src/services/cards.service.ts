import type { FastifyInstance } from 'fastify';
import { CardRarity, CardElement, CardCategory } from '@prisma/client';

interface ListCardsFilters {
    rarity?: CardRarity;
    element?: CardElement;
    category?: CardCategory;
} // Define the type for filters that can be applied when listing cards, with optional properties for rarity, element, and category

export async function listCards(fastify: FastifyInstance, filters: ListCardsFilters) { // Function to list cards based on provided filters
    return fastify.prisma.cardGame.findMany({
        where: {
            ...(filters.rarity && { cardRarity: filters.rarity }), // If rarity filter is provided, add it to the query
            ...(filters.element && { cardElement: filters.element }), // If element filter is provided, add it to the query
            ...(filters.category && { cardCategory: filters.category }), // If category filter is provided, add it to the query
        }, // Apply filters to the query if they are provided 
        orderBy: [
            { cardRarity: 'asc' },
            { cardElement: 'asc' },
            { cardNumber: 'asc' },
            { id: 'asc' },
        ], // Order the results by rarity, element, card number, and ID for consistent sorting
    });
}