// Element types and their relationships
export type Element = 'water' | 'fire' | 'swamp' | 'sand' | 'ice';

// Fire > Electric, Electric > Water, Water > Fire, Earth > Venom, Venom > Earth
// Same element = compare power value
export const ELEMENT_COLORS: Record<Element, number> = {
  water: 0x4444ff,
  fire: 0xff4444,
  swamp: 0x2f6b3f,
  sand: 0xc2a56b,
  ice: 0xaee7ff
};

export const ELEMENT_COUNTERS: Record<Exclude<Element, 'ice'>, Exclude<Element, 'ice'>> = {
  water: 'fire',
  fire: 'swamp',
  swamp: 'sand',
  sand: 'water'
};

// Ice Effects
export type IceEffects = 'stun' | 'overdrive' | 'jam';

// Cards
export interface Cards {
  id: string;
  element: Element;
  damagePower: number;
  iceEffect?: IceEffects;
}

export function compareCards(
  playerElement: Element,
  playerPower: number,
  opponentElement: Element,
  opponentPower: number
): 'win' | 'lose' | 'draw' {
  // Same element - compare power
  if (playerElement === opponentElement) {
    if (playerPower > opponentPower) return 'win';
    if (playerPower < opponentPower) return 'lose';
    return 'draw';
  }

  // Check if player wins
  if (getElementStrength(playerElement) === opponentElement) {
    return 'win';
  }

  // Check if opponent wins
  if (getElementStrength(opponentElement) === playerElement) {
    return 'lose';
  }

  // Neutral - compare power
  if (playerPower > opponentPower) return 'win';
  if (playerPower < opponentPower) return 'lose';
  return 'draw';
}

export interface Card {
  id: string;
  element: Element;
  power: number;
}

// Generate 5 random cards for a duel
export function generateDeck(): Card[] {
  const elements: Element[] = ['fire', 'water', 'earth', 'electric', 'venom'];
  const deck: Card[] = [];
  
  for (let i = 0; i < 5; i++) {
    deck.push({
      id: `card-${i}`,
      element: elements[i % elements.length],
      power: Math.floor(Math.random() * 5) + 1 // Power 1-5
    });
  }
  
  return deck;
}
