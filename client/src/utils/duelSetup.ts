/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* Utility functions for setting up the duel, including creating a shuffled discard pile from the base card pool.
*
* ChatGPT was used to assist in writing and optimizing some of the code in this file
*/

import { Card, getBaseCardPool, shuffleCards } from './cards'; // import Card type and card utility functions

export function createBaseDiscardPile(size: number): Card[] {
    const basePool = getBaseCardPool(); // source pool for discard pile cards
    const cards: Card[] = []; // discard pile to build and shuffle

    for (let i = 0; i < size; i += 1) {
        const source = basePool[i % basePool.length]; // cycle through the base card pool if needed
        cards.push({
            ...source, // copy the base card data
            id: `${source.id}-discard-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, // generate a unique id for each duplicate card
        });
    }

    return shuffleCards(cards); // randomize the discard pile order
}