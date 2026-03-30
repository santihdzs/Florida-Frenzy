// Element types, card categories, and rarities for the game
export type Element = 'fire' | 'water' | 'swamp' | 'sand' | 'ice';
export type CardCategory = 'attack' | 'defense' | 'status' | 'special';
export type CardRarity = 'base' | 'effect' | 'rare' | 'clan';

// Interface for a card in the game
export interface Card {
  id: string;
  name: string;
  element: Element;
  category: CardCategory;
  rarity: CardRarity;
  power: number | null;
  effect: string | null;
  effectDescription: string | null;
  baseDamage: number;
  energyEGain: number;
  energyIGain: number;
  energyECost: number;
  energyICost: number;
}

// Mapping of elements to their corresponding colors for UI representation
export const ELEMENT_COLORS: Record<Element, number> = {
  fire: 0xff4444,
  water: 0x3399ff,
  swamp: 0x44aa44,
  sand: 0xc2a36b,
  ice: 0xaee7ff,
};

// Function to create a base card given an element and power level
function createBaseCard(element: Element, power: number): Card {
  const capitalized = element.charAt(0).toUpperCase() + element.slice(1);

  const categoryMap: Record<'fire' | 'water' | 'swamp' | 'sand', CardCategory> = {
    fire: 'attack',
    water: 'defense',
    swamp: 'status',
    sand: 'defense',
  };

  const effectMap: Record<'fire' | 'water' | 'swamp' | 'sand', string> = {
    fire: 'damage',
    water: 'shield',
    swamp: 'poison',
    sand: 'weaken',
  };

  const descMap: Record<'fire' | 'water' | 'swamp' | 'sand', string> = {
    fire: 'Deal direct damage equal to value',
    water: 'Gain shield equal to value',
    swamp: 'Apply poison damage over time',
    sand: 'Reduce incoming damage next turn',
  };

  if (element === 'ice') {
    throw new Error('Ice is not part of the base card pool');
  }

  return {
    id: `${element}-${power}`,
    name: `${capitalized} ${power}`,
    element,
    category: categoryMap[element],
    rarity: 'base',
    power,
    effect: effectMap[element],
    effectDescription: descMap[element],
    baseDamage: element === 'fire' ? power : 0,
    energyEGain: power <= 4 ? 1 : power <= 7 ? 2 : 3,
    energyIGain: power <= 3 ? 1 : power <= 6 ? 2 : 3,
    energyECost: 0,
    energyICost: 0,
  };
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