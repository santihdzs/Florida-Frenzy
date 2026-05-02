/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* Script to define the structure of cards in the game, 
* including their properties, effects, and how they are created and managed within the game. 
* This includes defining types for elements, categories, rarities, and effects, as well as 
* functions for creating base cards and special cards with unique abilities.
*/ 


// Element types, card categories, and rarities for the game
export type Element = 'fire' | 'water' | 'swamp' | 'sand' | 'ice';
export type CardCategory = 'attack' | 'defense' | 'status' | 'special';
export type CardRarity = 'base' | 'effect' | 'rare' | 'legendary';

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
  | 'HALVE_ATTACK'
  | 'NEGATE_SAND'
  | 'BARRIER_REACTIVE'
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

// Special cards helper for determining counters (e.g., fire is strong against swamp, but weak against water)
export const SPECIAL_COUNTERS: Record<Element, Element> = {
  fire: 'water',
  water: 'sand',
  sand: 'swamp',
  swamp: 'fire',
  ice: 'ice',
};

// Mapping of elements to their corresponding colors for UI representation
export const ELEMENT_COLORS: Record<Element, number> = {
  fire: 0xe65707,
  water: 0x2596be,
  swamp: 0x9ac226,
  sand: 0xfdd87b,
  ice: 0xe7f3fc,
};

// Function for Elemental Energy gain based on card power
function energyElementGained(power: number): number {
  if (power <= 4) return 2;
  if (power <= 7) return 3;
  return 4;
}

// Function for Instinct Energy gain based on card power
function energyInstGained(power: number): number {
  if (power <= 4) return 2;
  if (power <= 7) return 3;
  return 4;
}

function energyElementCost(power: number): number {
  if (power <= 4) return 1;
  if (power <= 7) return 2;
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
// the difference between 'power' and 'baseDamage' is that 'power' is a more abstract value 
// that can be used for various calculations (like energy gain, effect strength, etc.), 
// while 'baseDamage' is specifically the damage value that the card will deal when played. 
// This allows for more flexibility in card design, as you can have cards where the power 
// influences multiple aspects of the card's behavior, not just its damage output.
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
        effectDescription: `Haz ${power * 2} de daño al enemigo.`,
        baseDamage: power * 2,
        shieldValue: 0,
        effectValue: power * 2,
        effectDuration: 0,
        effectValueSecondary: 0,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: energyElementCost(power),
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
        effectDescription: `Gana ${power * 2} puntos de escudo.`,
        baseDamage: 0,
        shieldValue: power * 2,
        effectValue: power * 2,
        effectDuration: 0,
        effectValueSecondary: 0,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: energyElementCost(power),
        energyICost: 0,
      });
    
    case 'swamp': {
      const poisonValue = Math.max(2, Math.floor(power / 2));
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
        effectValueSecondary: 0,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: energyElementCost(power),
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
        effectDescription: `Haz ${power} de daño y reduce el daño del enemigo por ${power * 2} para el siguiente turno.`,
        baseDamage: power,
        shieldValue: 0,
        effectValue: power * 2,
        effectDuration: 1,
        effectValueSecondary: 0,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: energyElementCost(power),
        energyICost: 0,
      });
    }
    default:
      throw new Error(`Unknown element: ${element as string}`);
  }
}

// Base card pool consisting of 36 cards (9 for each of the 4 elements)
export const BASE_CARD_POOL: Card[] = [
  ...Array.from({ length: 9 }, (_, i) => createBaseCard('fire', i + 1)),
  ...Array.from({ length: 9 }, (_, i) => createBaseCard('water', i + 1)),
  ...Array.from({ length: 9 }, (_, i) => createBaseCard('swamp', i + 1)),
  ...Array.from({ length: 9 }, (_, i) => createBaseCard('sand', i + 1)),
];

export const SPECIAL_CARD_POOL: Card[] = [
  // Fire special cards (5)
  createCard({
    name: 'Burn Strike',
    element: 'fire',
    category: 'attack',
    rarity: 'effect',
    power: 6,
    effect: 'BURN',
    effectDescription: '12 daño + 4 burn por 2 turnos',
    baseDamage: 12,
    shieldValue: 0,
    effectValue: 4,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 4,
    energyIGain: 2,
    energyECost: 1,
    energyICost: 1,
  }),

  createCard({
    name: 'Half Break',
    element: 'fire',
    category: 'attack',
    rarity: 'effect',
    power: 5,
    effect: 'BLOCK_FIRE',
    effectDescription: '10 daño. Bloquea cartas Fire por 1 turno',
    baseDamage: 10,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 1,
  }),

  createCard({
    name: 'Rage Boost',
    element: 'fire',
    category: 'attack',
    rarity: 'effect',
    power: 7,
    effect: 'RAGE',
    effectDescription: '20 daño si el rival está bajo 50% HP',
    baseDamage: 10,
    shieldValue: 0,
    effectValue: 100, // Representa el porcentaje de aumento de daño
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 2,
    energyICost: 2,
  }),

  createCard({
    name: 'Explosion',
    element: 'fire',
    category: 'attack',
    rarity: 'effect',
    power: null,
    effect: 'EXPLOSION',
    effectDescription: '24 daño. Recibes 6 de recoil',
    baseDamage: 24,
    shieldValue: 0,
    effectValue: 6, // Daño que el jugador recibe
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 1,
  }),

  createCard({
    name: 'Chain Fire',
    element: 'fire',
    category: 'attack',
    rarity: 'effect',
    power: 6,
    effect: 'CHAIN',
    effectDescription: '12 daño. Tu próximo Fire gana +6 daño',
    baseDamage: 12,
    shieldValue: 0,
    effectValue: 6, // Aumento de daño para el siguiente ataque de fuego
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 4,
    energyIGain: 2,
    energyECost: 0,
    energyICost: 1,
  }),

  // Water special cards (5)
  createCard({
    name: 'Healing Wave',
    element: 'water',
    category: 'defense',
    rarity: 'effect',
    power: 5,
    effect: 'HEAL',
    effectDescription: '10 escudo y cura 6 HP',
    baseDamage: 0,
    shieldValue: 10,
    effectValue: 6,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 4,
    energyIGain: 4,
    energyECost: 2,
    energyICost: 2,
  }),

  createCard({
    name: 'Shield Surge',
    element: 'water',
    category: 'defense',
    rarity: 'effect',
    power: 6,
    effect: 'DOUBLE_SHIELD',
    effectDescription: 'Duplica tu escudo. Si no tienes, ganas 24', // flag
    baseDamage: 0,
    shieldValue: 24,
    effectValue: 100, // Representa el porcentaje de aumento de escudo
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 1,
    energyICost: 1,
  }),

  createCard({
    name: 'Cleanse',
    element: 'water',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'CLEANSE',
    effectDescription: 'Cleanses all active negative effects',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 2,
    energyICost: 2,
  }),

  createCard({
    name: 'Reflect', // flag
    element: 'water',
    category: 'defense',
    rarity: 'effect',
    power: 5,
    effect: 'REFLECT',
    effectDescription: 'Refleja 35% del daño por 1 turno',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 35,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 5,
    energyIGain: 3,
    energyECost: 2,
    energyICost: 2,
  }),

  createCard({
    name: 'Flow State',
    element: 'water',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'ENERGY_BOOST',
    effectDescription: '+30% energía por 2 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 30,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 1,
    energyICost: 1,
  }),

  // Swamp special cards (5)
  createCard({
    name: 'Toxic Spread',
    element: 'swamp',
    category: 'status',
    rarity: 'effect',
    power: 5,
    effect: 'TOXIC',
    effectDescription: '10 poison por 3 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 10,
    effectDuration: 3,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 1,
  }),

  createCard({
    name: 'Decay',
    element: 'swamp',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'DECAY',
    effectDescription: 'Reduce el escudo rival en 10%',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 10,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 3,
    energyECost: 1,
    energyICost: 2,
  }),

  createCard({
    name: 'Infection',
    element: 'swamp',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'EXTEND',
    effectDescription: 'Extiende 1 turno los efectos del rival',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 1,
    energyICost: 2,
  }),

  createCard({
    name: 'Corrosion',
    element: 'swamp',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'WEAKEN_ATTACK',
    effectDescription: 'Reduce por 6 el daño rival por 2 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 6,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 6,
    energyIGain: 6,
    energyECost: 2,
    energyICost: 2,
  }),

  createCard({
    name: 'Leech',
    element: 'swamp',
    category: 'attack',
    rarity: 'effect',
    power: 4,
    effect: 'LIFESTEAL',
    effectDescription: '10 daño. Roba 25% del daño como vida',
    baseDamage: 10,
    shieldValue: 0,
    effectValue: 25,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 5,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 1,
  }),

  // Sand special cards (5)
  createCard({
    name: 'Quicksand',
    element: 'sand',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'HALVE_ATTACK',
    effectDescription: 'Reduce el próximo ataque rival a la mitad',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 50, // Representa la reducción del 50% en el próximo ataque
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 0,
    energyICost: 1,
  }),

  createCard({
    name: 'Dust Blind',
    element: 'sand',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'NEGATE_SAND',
    effectDescription: 'Nega el próximo Sand rival. Si no aplica, ganas 20 escudo',
    baseDamage: 0,
    shieldValue: 20,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 4,
    energyIGain: 3,
    energyECost: 2,
    energyICost: 2,
  }),

  createCard({
    name: 'Barrier',
    element: 'sand',
    category: 'defense',
    rarity: 'effect',
    power: 5,
    effect: 'BARRIER_REACTIVE',
    effectDescription: 'Gana 20 escudo. Si el rival juega Swamp Special, ganas 20 más',
    baseDamage: 0,
    shieldValue: 20,
    effectValue: 20,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 6,
    energyIGain: 5,
    energyECost: 2,
    energyICost: 1,
  }),

  createCard({
    name: 'Skywalker',
    element: 'sand',
    category: 'special',
    rarity: 'effect',
    power: null,
    effect: 'WILDCARD',
    effectDescription: 'Comodín Sand contra cualquier Special',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 1,
    energyECost: 1,
    energyICost: 0,
  }),

  createCard({
    name: 'Sandstorm',
    element: 'sand',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'BUFF',
    effectDescription: 'Tus cartas Sand ganan +20% daño por 3 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 20,
    effectDuration: 3,
    effectValueSecondary: 0,
    energyEGain: 4,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 1,
  }),

]



// Ice Card Pool (5 cards)
export const ICE_CARD_POOL: Card[] = [
  createCard({
    name: 'Ice Stun',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'STUN',
    effectDescription: 'Congela al rival por 1 turno',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 6,
    energyICost: 6,
  }),

  createCard({
    name: 'Ice Jam',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'JAM',
    effectDescription: 'Bloquea las especiales rivales por 2 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 8,
    energyICost: 6,
  }),

  createCard({
    name: 'Ice Overdrive',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'DOUBLE_PLAY',
    effectDescription: 'Puedes jugar 2 cartas este turno',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 8,
    energyICost: 8,
  }),

  createCard({
    name: 'Ice Shift',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'HAND_RESET',
    effectDescription: 'La mano rival va a discard. Roba una nueva desde la discard pile',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 10,
    energyICost: 8,
  }),

  createCard({
    name: 'Ice Flood',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'AMPLIFY',
    effectDescription: 'Si la carta en mesa es base, copia su número y fuerza respuesta solo por ese número. Si la carta en mesa es especial, gana 25 HP y 25 escudo y el rival puede responder con cualquier carta',
    baseDamage: 0,
    shieldValue: 25,
    effectValue: 25,
    effectDuration: 0,
    effectValueSecondary: 25,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 8,
    energyICost: 8,
  }),
]


// Legendary Cards (5 cards)
export const LEGENDARY_CARD_POOL: Card[] = [
  createCard({
    name: 'Crocodile',
    element: 'swamp',
    category: 'special',
    rarity: 'legendary',
    power: null,
    effect: 'AMPLIFY',
    effectDescription: 'Remueve el 35% de la vida del oponente',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 35,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 15,
    energyICost: 15,
  }),

  createCard({
    name: 'Alligator',
    element: 'water',
    category: 'special',
    rarity: 'legendary',
    power: null,
    effect: 'IMMUNITY',
    effectDescription: 'Recupera el 100% de su vida',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 100,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 16,
    energyICost: 18,
  }),

  createCard({
    name: 'Gavial',
    element: 'sand',
    category: 'special',
    rarity: 'legendary',
    power: null,
    effect: 'HAND_RESET',
    effectDescription: 'Carga la Ulti del jugador instantaneamente',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 5,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 17,
    energyICost: 14,
  }),
  createCard({
    name: 'Caiman',
    element: 'swamp',
    category: 'special',
    rarity: 'legendary',
    power: null,
    effect: 'RANDOM_STATUS',
    effectDescription: 'Aplica un estado aleatorio al enemigo',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 13,
    energyICost: 16,
  }),

  createCard({
    name: 'Sarcosuchus',
    element: 'fire',
    category: 'special',
    rarity: 'legendary',
    power: null,
    effect: 'EXECUTE',
    effectDescription: 'Reduce al enemigo a 25 HP y 25 escudo',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 0,
    energyIGain: 0,
    energyECost: 20,
    energyICost: 18,
  }),
];

// Exports of all card pools
export function getBaseCardPool(): Card[] {
  return BASE_CARD_POOL.map(cloneCard);
}

export function getSpecialCardPool(): Card[] {
  return SPECIAL_CARD_POOL.map(cloneCard);
}

export function getIceCardPool(): Card[] {
  return ICE_CARD_POOL.map(cloneCard);
}

export function getLegendaryCardPool(): Card[] {
  return LEGENDARY_CARD_POOL.map(cloneCard);
}

export function getFullCardPool(): Card[] {
  return [ 
    ...getBaseCardPool(), 
    ...getSpecialCardPool(), 
    ...getIceCardPool(), 
    ...getLegendaryCardPool() 
  ];
}


// Utility functions for card management during gameplay
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
  return pool.slice(0, size).map((card, index) => {
    const preparedCard = cloneCard(card);
    return withUniqueID(preparedCard, `deck-${index}-${Date.now()}`);
  });
}

export function drawOneCard(deck: Card[]): Card | null {
  if (deck.length === 0) return null;
  return deck.shift() ?? null;
}

export function buildHand(deck: Card[], handSize = 5): Card[] {
  const hand: Card[] = [];
  for (let i = 0; i < handSize; i++) {
    const card = drawOneCard(deck);
    if (card) hand.push(card);
  }

  return hand;
}

export function isSpecialCounterPlay(selected: Card, tableCard: Card): boolean {
  if (selected.rarity !== 'effect') return false;
  return selected.element === SPECIAL_COUNTERS[tableCard.element];
}

export function isCounterBonusTrigger(selected: Card, tableCard: Card): boolean {
  return selected.rarity === 'effect' && selected.element === SPECIAL_COUNTERS[tableCard.element];
}

// Validate if a card can be played
export function canPlayCard(selected: Card, tableCard: Card): boolean {
  if (selected.rarity === 'legendary' || tableCard.rarity === 'legendary') {
    return true; // Legendary cards can be played against any card, and any card can be played against legendary cards
  }

  if (selected.element === 'ice') {
    return true; // Ice card logic
  }

  // Special interactions for Ice cards
  const tableIsIceRare = tableCard.rarity === 'rare' && tableCard.element === 'ice';
  const tableIsIceJam = tableCard.name === 'Ice Jam';
  const tableIsIceFlood = tableCard.name === 'Ice Flood';

  if (tableIsIceJam) {
    return selected.rarity === 'base'; // Only base cards can be played against Ice Jam
  }

  if (tableIsIceRare && !tableIsIceFlood) {
    return true; // Any card can be played against Ice rares, except for specific counters
  }

  if (selected.rarity === 'effect') { // Special card logic
    return selected.element === tableCard.element || isSpecialCounterPlay(selected, tableCard); // Permite jugar un Special si es del mismo elemento o es un counter especial
  }

  if (tableCard.rarity === 'effect') {
    return selected.element === tableCard.element; // Solo permite jugar cartas normales contra Specials del mismo elemento, no permite counters normales contra Specials
  }

  if (selected.power !== null && tableCard.power !== null && selected.power === tableCard.power) { // Permite jugar si el poder es exactamente igual, independientemente del elemento
    return true;
  }

  return selected.element === tableCard.element;
}

export function resolveCardEffect(card: Card): CardResolution {
  return {
    damage: card.baseDamage,
    shield: card.shieldValue,
    appliedEffect: card.effect,
    effectValue: card.effectValue,
    effectDuration: card.effectDuration,
    secondaryEffectValue: card.effectValueSecondary,
  };
}

