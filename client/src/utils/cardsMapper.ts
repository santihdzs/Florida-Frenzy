/*
* This module provides a function to map card data from the database format to the 
* application's Card type.
* It defines the structure of the database card object and the mapping logic to 
* convert it to the Card type used in the client application.
*/

import type { Card, Element, CardCategory, CardRarity, CardEffect } from './cards'; // Import the Card type and related types from the cards module
import type { DbCard } from '../api/cardsApi'; // Import the DbCard type from the cardsApi module

const rarityMap: Record<string, CardRarity> = {
    BASE: 'base',
    EFFECT: 'effect',
    RARE: 'rare',
    LEGENDARY: 'legendary',
}; // map database rarity strings to CardRarity types

const categoryMap: Record<string, CardCategory> = {
    BASE: 'attack',
    SPECIAL: 'special',
}; // map database category strings to CardCategory types

const elementMap: Record<string, Element> = {
    FIRE: 'fire',
    WATER: 'water',
    SWAMP: 'swamp',
    SAND: 'sand',
    ICE: 'ice',
} // map database element strings to Element types

export function mapCardData(db: DbCard): Card { // Function to map a database card object to the Card type used in the client application
    return {
        id: String(db.id),
        name: db.cardName,
        category: categoryMap[db.cardCategory] ?? 'base',
        element: elementMap[db.cardElement] ?? 'fire',
        power: db.cardNumber,
        effect: db.cardEffect as CardEffect | null,
        effectDescription: db.effectDesc ?? '',
        baseDamage: db.baseDamage ?? 0,
        shieldValue: db.shieldValue ?? 0,
        effectValue: db.effectValue ?? 0,
        effectDuration: db.effectDuration ?? 0,
        effectValueSecondary: db.effectValueSecondary ?? 0,
        energyEGain: db.energyEGain ?? 0,
        energyIGain: db.energyIGain ?? 0,
        energyECost: db.energyECost ?? 0,
        energyICost: db.energyICost ?? 0,
        rarity: rarityMap[db.cardRarity] ?? 'base',
    };
}