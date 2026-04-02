import { create } from "domain";

// Element types, card categories, and rarities for the game
export type Element = 'fire' | 'water' | 'swamp' | 'sand' | 'ice';
export type CardCategory = 'attack' | 'defense' | 'status' | 'special';
export type CardRarity = 'base' | 'effect' | 'rare' | 'clan';

// Possible effects that a card can have in the game
export type CardEffect =
  | 'DAMAGE'
  | 'SHIELD'
  | 'POISON'
  | 'WEAKEN'
  | 'BURN'
  | 'BLOCK_FIRE'
  | 'RAGE'
  | 'EXPLOSION'
  | 'CHAIN'
  | 'HEAL'
  | 'DOUBLE_SHIELD'
  | 'CLEANSE'
  | 'REFLECT'
  | 'ENERGY_BOOST'
  | 'TOXIC'
  | 'DECAY'
  | 'EXTEND'
  | 'WEAKEN_ATTACK'
  | 'LIFESTEAL'
  | 'BLOCK_NUMBER'
  | 'BLIND'
  | 'SHIELD_BOOST'
  | 'WILDCARD'
  | 'BUFF'
  | 'STUN'
  | 'JAM'
  | 'DOUBLE_PLAY'
  | 'FORCE_DRAW'
  | 'AMPLIFY'
  | 'IMMUNITY'
  | 'HAND_RESET'
  | 'RANDOM_STATUS'
  | 'EXECUTE';


// Interface for a card in the game
export interface Card {
  id: string;
  name: string;
  element: Element;
  category: CardCategory;
  rarity: CardRarity;
  power: number | null;
  effect: CardEffect | null;
  effectDescription: string | null;

  baseDamage: number;
  shieldValue: number;
  effectValue: number;
  effectDuration: number;
  effectValueSecondary: number | null;

  energyEGain: number;
  energyIGain: number;
  energyECost: number;
  energyICost: number;
}

// Interface for the result of resolving a card's effects during gameplay
export interface CardResolution {
  damage: number;
  shield: number;
  appliedEffect: CardEffect | null;
  effectValue: number;
  effectDuration: number;
  secondaryEffectValue: number | null;
}

// Mapping of elements to their corresponding colors for UI representation
export const ELEMENT_COLORS: Record<Element, number> = {
  fire: 0xff4444,
  water: 0x3399ff,
  swamp: 0x44aa44,
  sand: 0xc2a36b,
  ice: 0xaee7ff,
};

// Function for Elemental Energy gain based on card power
function energyElementGained(power: number): number {
  if (power <= 4) return 1;
  if (power <= 7) return 2;
  return 3;
}

// Function for Instinct Energy gain based on card power
function energyInstGained(power: number): number {
  if (power <= 3) return 1;
  if (power <= 6) return 2;
  return 3;
}

// Clone a card object (useful for creating modified versions of cards without mutating the original)
function cloneCard(card: Card): Card {
  return { ...card };
}

// Create a new card object with a unique ID (useful for cards that are generated or modified during gameplay)
function withUniqueID(card: Card, suffix: string): Card {
  return { ...card, id: `${card.id}-${suffix}-${Math.random().toString(36).slice(2, 8)}`, };
}

function createCard(config: Omit<Card, 'id'>): Card {
  return {id: config.name.toLowerCase().replace(/\s+/g, '-'), ...config};
}




// Function to create a base card given an element and power level
function createBaseCard(element: Element, power: number): Card {
  const capitalized = element.charAt(0).toUpperCase() + element.slice(1);

  switch (element) {
    case 'fire':
      return createCard({
        name: `${capitalized} Card ${power}`,
        element,
        category: 'attack',
        rarity: 'base',
        power,
        effect: 'DAMAGE',
        effectDescription: `Haz ${power} de daño al enemigo.`,
        baseDamage: power,
        shieldValue: 0,
        effectValue: power,
        effectDuration: 0,
        effectValueSecondary: null,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: 0,
        energyICost: 0,
      });
      
    case 'water':
      return createCard({
        name: `${capitalized} Card ${power}`,
        element,
        category: 'defense',
        rarity: 'base',
        power,
        effect: 'SHIELD',
        effectDescription: `Gana ${power} puntos de escudo.`,
        baseDamage: 0,
        shieldValue: power,
        effectValue: power,
        effectDuration: 0,
        effectValueSecondary: null,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: 0,
        energyICost: 0,
      });
    
    case 'swamp': {
      const poisonValue = Math.max(1, Math.floor(power / 3));
      const poisonDuration = Math.max(1, Math.floor(power / 3));
      return createCard({
        name: `${capitalized} Card ${power}`,
        element,
        category: 'status',
        rarity: 'base',
        power,
        effect: 'POISON',
        effectDescription: `Envenena al enemigo por ${poisonValue} de daño durante ${poisonDuration} turnos.`,
        baseDamage: 0,
        shieldValue: 0,
        effectValue: poisonValue,
        effectDuration: poisonDuration,
        effectValueSecondary: null,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: 0,
        energyICost: 0,
      });
    }

    case 'sand': {
      return createCard({
        name: `${capitalized} Card ${power}`,
        element,
        category: 'defense',
        rarity: 'base',
        power,
        effect: 'WEAKEN',
        effectDescription: `Reduce el daño del enemigo por ${power} para el siguiente turno.`,
        baseDamage: 0,
        shieldValue: 0,
        effectValue: power,
        effectDuration: 1,
        effectValueSecondary: null,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: 0,
        energyICost: 0,
      });
    }
  }
}

// Base card pool consisting of 36 cards (9 for each of the 4 elements)
export const BASE_CARD_POOL: Card[] = [
  ...Array.from({ length: 9 }, (_, i) => createBaseCard('fire', i + 1)),
  ...Array.from({ length: 9 }, (_, i) => createBaseCard('water', i + 1)),
  ...Array.from({ length: 9 }, (_, i) => createBaseCard('swamp', i + 1)),
  ...Array.from({ length: 9 }, (_, i) => createBaseCard('sand', i + 1)),
];

// Basic utilities
export function getBaseCardPool(): Card[] {
  return BASE_CARD_POOL.map(card => ({ ...card }));
}

export function shuffleCards(cards: Card[]): Card[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateDeck(size = 12): Card[] {
  const pool = shuffleCards(getBaseCardPool());
  return pool.slice(0, size).map((card, index) => ({
    ...card,
    id: `${card.id}-deck-${index}-${Date.now()}`
  }));
}

export function drawCards(deck: Card[], count: number): Card[] {
  return deck.slice(0, count);
}

// Validate if a card can be played
export function canPlayCard(selected: Card, tableCard: Card): boolean {
  if (selected.element === 'ice') {
    return true; // Ice card logic tbd, but for now it can be played on any card
  }
  if (tableCard.power !== null && selected.power === tableCard.power) {
    return true;
  }
  return selected.element === tableCard.element;
}

// Compare two cards for sorting purposes
export function compareCards(playerElement: Element, playerPower: number | null, enemyElement: Element, enemyPower: number | null): 'win' | 'lose' | 'draw' {
  const p = playerPower ?? 0;
  const e = enemyPower ?? 0;

  const advantageMap: Record<Element, Element | null> = {
    fire: 'swamp',
    water: 'fire',
    swamp: 'sand',
    sand: 'water',
    ice: null,
  };

  if (playerElement === enemyElement) {
    if (p > e) return 'win';
    if (p < e) return 'lose';
    return 'draw';
  }

  if (playerElement === 'ice') return 'win';
  if (enemyElement === 'ice') return 'lose';

  if (advantageMap[playerElement] === enemyElement) return 'win';
  if (advantageMap[enemyElement] === playerElement) return 'lose';

  if (p > e) return 'win';
  if (p < e) return 'lose';
  return 'draw';
}

// Draw one card from the deck
export function drawOne(deck: Card[]): Card | null {
  if (deck.length === 0) return null;
  return deck.shift() ?? null;
}

// Build a starting hand of 5 cards from the deck
export function buildStartingHand(deck: Card[], handSize = 5): Card[] {
  const hand: Card[] = [];
  for (let i = 0; i < handSize; i++) {
    const card = drawOne(deck);
    if (card) hand.push(card);
  }
  return hand;
}