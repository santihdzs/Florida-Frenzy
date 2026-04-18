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
        effectDescription: `Gana ${power * 2} puntos de escudo.`,
        baseDamage: 0,
        shieldValue: power * 2,
        effectValue: power * 2,
        effectDuration: 0,
        effectValueSecondary: 0,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: 0,
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
        effectDescription: `Haz ${power} de daño y reduce el daño del enemigo por ${power * 2} para el siguiente turno.`,
        baseDamage: power,
        shieldValue: 0,
        effectValue: power * 2,
        effectDuration: 1,
        effectValueSecondary: 0,
        energyEGain: energyElementGained(power),
        energyIGain: energyInstGained(power),
        energyECost: 0,
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
    effectDescription: 'Inflige 6 de daño y quema al enemigo por 2 turnos, causando 2 de daño adicional cada turno.',
    baseDamage: 6,
    shieldValue: 0,
    effectValue: 2,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Half Break',
    element: 'fire',
    category: 'attack',
    rarity: 'effect',
    power: 5,
    effect: 'BLOCK_FIRE',
    effectDescription: 'Hace 5 de daño y bloquea el próximo ataque de fuego del enemigo durante 1 turno.',
    baseDamage: 5,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Rage Boost',
    element: 'fire',
    category: 'attack',
    rarity: 'effect',
    power: 7,
    effect: 'RAGE',
    effectDescription: 'Hace el doble de daño, solo si la HP del rival está por debajo del 50%.',
    baseDamage: 7,
    shieldValue: 0,
    effectValue: 100, // Representa el porcentaje de aumento de daño
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),

  createCard({
    name: 'Explosion',
    element: 'fire',
    category: 'attack',
    rarity: 'effect',
    power: null,
    effect: 'EXPLOSION',
    effectDescription: 'Daño maximo, pero daña al jugador.',
    baseDamage: 12,
    shieldValue: 0,
    effectValue: 3, // Daño que el jugador recibe
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
    effectDescription: 'Si el siguiente ataque del jugador es de fuego, aumenta su daño en 3',
    baseDamage: 6,
    shieldValue: 0,
    effectValue: 3, // Aumento de daño para el siguiente ataque de fuego
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  // Water special cards (5)
  createCard({
    name: 'Healing Wave',
    element: 'water',
    category: 'defense',
    rarity: 'effect',
    power: 5,
    effect: 'HEAL',
    effectDescription: 'Convierte el 25% de tu daño en vida',
    baseDamage: 0,
    shieldValue: 5,
    effectValue: 25, // Representa el porcentaje de curación basado en el daño infligido
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Shield Surge',
    element: 'water',
    category: 'defense',
    rarity: 'effect',
    power: 6,
    effect: 'DOUBLE_SHIELD',
    effectDescription: 'Duplica tu escudo disponible',
    baseDamage: 0,
    shieldValue: 12,
    effectValue: 100, // Representa el porcentaje de aumento de escudo
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Cleanse',
    element: 'water',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'CLEANSE',
    effectDescription: 'Elimina todos los efectos negativos activos en el jugador',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Reflect',
    element: 'water',
    category: 'defense',
    rarity: 'effect',
    power: 5,
    effect: 'REFLECT',
    effectDescription: 'Devuelve el 25% del daño recibido al enemigo',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 25,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Flow State',
    element: 'water',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'ENERGY_BOOST',
    effectDescription: 'Aumenta la regenración de energía un 20% por 2 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 20,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  // Swamp special cards (5)
  createCard({
    name: 'Toxic Spread',
    element: 'swamp',
    category: 'status',
    rarity: 'effect',
    power: 5,
    effect: 'TOXIC',
    effectDescription: 'Aplica 5 de daño por veneno por 3 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 5,
    effectDuration: 3,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Decay',
    element: 'swamp',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'DECAY',
    effectDescription: 'Reduce el escudo del enemigo progresivamente en un 5%',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 5,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Infection',
    element: 'swamp',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'EXTEND',
    effectDescription: 'Extiende los efectos activos del enemigo por 1 turno',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Corrosion',
    element: 'swamp',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'WEAKEN_ATTACK',
    effectDescription: 'Reduce el daño de las cartas del enemigo en un 20% por 2 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 20,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Leech',
    element: 'swamp',
    category: 'attack',
    rarity: 'effect',
    power: 4,
    effect: 'LIFESTEAL',
    effectDescription: '15% del daño infligido se convierte en vida para el jugador',
    baseDamage: 4,
    shieldValue: 0,
    effectValue: 15,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  // Sand special cards (5)
  createCard({
    name: 'Quicksand',
    element: 'sand',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'BLOCK_NUMBER',
    effectDescription: 'Bloquea un número específico',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Dust Blind',
    element: 'sand',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'BLIND',
    effectDescription: 'Oculta los valores de las cartas base del enemigo',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Barrier',
    element: 'sand',
    category: 'defense',
    rarity: 'effect',
    power: 5,
    effect: 'SHIELD_BOOST',
    effectDescription: 'Aplica un 20% de escudo adicional',
    baseDamage: 0,
    shieldValue: 20,
    effectValue: 20,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Skywalker',
    element: 'sand',
    category: 'special',
    rarity: 'effect',
    power: null,
    effect: 'WILDCARD',
    effectDescription: 'Comodín exclusivo para cartas de arena (se juega contra cualquier numero)',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
  }),

  createCard({
    name: 'Sandstorm',
    element: 'sand',
    category: 'status',
    rarity: 'effect',
    power: null,
    effect: 'BUFF',
    effectDescription: 'Aumenta el daño de las cartas de arena del jugador un 7% por 3 turnos',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 7,
    effectDuration: 3,
    effectValueSecondary: 0,
    energyEGain: 2,
    energyIGain: 2,
    energyECost: 2,
    energyICost: 0,
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
    effectDescription: 'Congela al enemigo',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),

  createCard({
    name: 'Ice Jam',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'JAM',
    effectDescription: 'Deshabilita las cartas de efecto del enemigo',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),

  createCard({
    name: 'Ice Overdrive',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'DOUBLE_PLAY',
    effectDescription: 'Permite jugar 2 cartas en 1 turno',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),

  createCard({
    name: 'Ice Shift',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'WILDCARD',
    effectDescription: 'Comodín general (se juega contra cualquier numero y/o elemento)',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),

  createCard({
    name: 'Ice Flood',
    element: 'ice',
    category: 'special',
    rarity: 'rare',
    power: null,
    effect: 'FORCE_DRAW',
    effectDescription: 'Obliga al enemigo a robar de la pila de descarte, hasta encontrar un elemento designado por el jugador',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),
]


// Clan (legendary) Cards (5 cards)
export const CLAN_CARD_POOL: Card[] = [
  createCard({
    name: 'Crocodile',
    element: 'swamp',
    category: 'special',
    rarity: 'clan',
    power: null,
    effect: 'AMPLIFY',
    effectDescription: 'Imita la carta en juego, e incrementa su efecto/daño un 5%',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 5,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),

  createCard({
    name: 'Alligator',
    element: 'water',
    category: 'special',
    rarity: 'clan',
    power: null,
    effect: 'IMMUNITY',
    effectDescription: 'Convierte todo el daño recibido en escudo durante 1 turno',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 100,
    effectDuration: 1,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),

  createCard({
    name: 'Gavial',
    element: 'sand',
    category: 'special',
    rarity: 'clan',
    power: null,
    effect: 'HAND_RESET',
    effectDescription: 'Permite reorganizar la mano completamente',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 5,
    effectDuration: 0,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),
  createCard({
    name: 'Caiman',
    element: 'swamp',
    category: 'special',
    rarity: 'clan',
    power: null,
    effect: 'RANDOM_STATUS',
    effectDescription: 'Aplica un estado aleatorio al enemigo',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 2,
    effectValueSecondary: 0,
    energyEGain: 3,
    energyIGain: 3,
    energyECost: 3,
    energyICost: 0,
  }),

  createCard({
    name: 'Sarcosuchus',
    element: 'fire',
    category: 'special',
    rarity: 'clan',
    power: null,
    effect: 'EXECUTE',
    effectDescription: 'Reduce al enemigo a 1 HP y 1 escudo',
    baseDamage: 0,
    shieldValue: 0,
    effectValue: 1,
    effectDuration: 0,
    effectValueSecondary: 1,
    energyEGain: 5,
    energyIGain: 5,
    energyECost: 5,
    energyICost: 0,
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

export function getClanCardPool(): Card[] {
  return CLAN_CARD_POOL.map(cloneCard);
}

export function getFullCardPool(): Card[] {
  return [ ...getBaseCardPool(), ...getSpecialCardPool(), ...getIceCardPool(), ...getClanCardPool() ];
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

export function drawCards(deck: Card[], count: number): Card[] {
  return deck.slice(0, count);
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

// Validate if a card can be played
export function canPlayCard(selected: Card, tableCard: Card): boolean {
  if (selected.element === 'ice') {
    return true; // Ice card logic
  }

  if (selected.power !== null && tableCard.power !== null && selected.power === tableCard.power) {
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

// Unfinished temporal demo for current DuelScene implementation, to be expanded with actual effect logic
export function compareCards(playerCard: Card, enemyCard: Card): 'win' | 'lose' | 'draw' {
  const playerResolution = resolveCardEffect(playerCard);
  const enemyResolution = resolveCardEffect(enemyCard);

  const playerScore = playerResolution.damage + playerResolution.shield + playerResolution.effectValue + playerCard.energyEGain + playerCard.energyIGain;
  const enemyScore = enemyResolution.damage + enemyResolution.shield + enemyResolution.effectValue + enemyCard.energyEGain + enemyCard.energyIGain;

  if (canPlayCard(playerCard, enemyCard) && !canPlayCard(enemyCard, playerCard)) {
    return 'win';
  }

  if (!canPlayCard(playerCard, enemyCard) && canPlayCard(enemyCard, playerCard)) {
    return 'lose';
  }

  if (playerCard.element === enemyCard.element) {
    const playerP = playerCard.power ?? 0;
    const enemyP = enemyCard.power ?? 0;
    if (playerP > enemyP) return 'win';
    if (playerP < enemyP) return 'lose';
  }

  if (playerScore > enemyScore) return 'win';
  if (playerScore < enemyScore) return 'lose';
  return 'draw';
}