// Element types and their relationships
export type Element = 'fire' | 'water' | 'earth' | 'electric' | 'venom';

// Fire > Electric, Electric > Water, Water > Fire, Earth > Venom, Venom > Earth
// Same element = compare power value
export const ELEMENT_COLORS: Record<Element, number> = {
  fire: 0xff4444,
  water: 0x4444ff,
  earth: 0x44aa44,
  electric: 0xaaaa44,
  venom: 0x8844aa
};

export function getElementStrength(element: Element): Element {
  const strengths: Record<Element, Element> = {
    fire: 'electric',
    water: 'fire',
    earth: 'venom',
    electric: 'water',
    venom: 'earth'
  };
  return strengths[element];
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
