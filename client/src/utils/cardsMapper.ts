/*
* This module provides a function to map card data from the database format to the 
* application's Card type.
* It defines the structure of the database card object and the mapping logic to 
* convert it to the Card type used in the client application.
*/

import type { Card, Element, CardCategory, CardRarity, CardEffect } from './cards'; // Import the Card type and related types from the cards module
import type { DbCard } from '../api/cardsApi'; // Import the DbCard type from the cardsApi module

export function mapCardData(db: DbCard): Card { // Function to map a database card object to the Card type used in the client application
    return {
        id: String(db.id),
        name: db.cardName,
        category: db.cardCategory.toLowerCase() as CardCategory,
        element: db.cardElement.toLowerCase() as Element,
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
        rarity: db.cardRarity.toLowerCase() as CardRarity,
    };
}