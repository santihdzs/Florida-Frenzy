/*
*
* A module for managing local deck storage and access rules based on clan rank. 
* It defines the structure of local deck data, provides functions to determine 
* card access based on player rank, and handles saving/loading deck configurations to/from localStorage.
* 
*/

import type { Card } from './cards';
import type { ClanRank } from '../../../server/src/services/user.service';

export type LocalDeckSlot = Card | null; // a deck slot can either contain a Card or be empty (null)

export interface LocalDeckData {
  slotCards: string[]; // card ids
  isActive: boolean;
  characterKey: string;
} // represents the data structure for a single deck, including the cards in the deck, whether it's active, and the associated character

export interface LocalDeckStorage {
  selectedDeckIndex: number;
  decks: LocalDeckData[];
}

export const DECK_SLOT_LIMIT: Record<ClanRank, number> = {
  ROOKIE: 12,
  VETERAN: 15,
  ELITE: 19,
  LEGEND: 21,
}; // defines the maximum number of cards allowed in a deck based on the player's clan rank

const RANK_ORDER: Record<ClanRank, number> = {
  ROOKIE: 0,
  VETERAN: 1,
  ELITE: 2,
  LEGEND: 3,
}; // defines the order of clan ranks for comparison

export function getDeckSlotLimit(rank: ClanRank): number {
  return DECK_SLOT_LIMIT[rank];
}

export function getUnlockRankForCard(card: Card): ClanRank {
  if (card.rarity === 'base') return 'ROOKIE';
  if (card.rarity === 'effect') return 'VETERAN';
  if (card.rarity === 'rare') return 'ELITE';
  return 'LEGEND';
} // determines the minimum clan rank required to use a given card based on its rarity

export function hasRankAccess(playerRank: ClanRank, requiredRank: ClanRank): boolean {
  return RANK_ORDER[playerRank] >= RANK_ORDER[requiredRank];
}

export function canUseCardInDeck(card: Card, playerRank: ClanRank): boolean {
  return hasRankAccess(playerRank, getUnlockRankForCard(card));
}

export function getDeckStorageKey(): string {
  return 'ff_local_decks_v1'; // the key used to store deck data in localStorage, versioned for potential future changes
}

export function createEmptyLocalDeckStorage(): LocalDeckStorage {
  return {
    selectedDeckIndex: 0,
    decks: [
      { slotCards: [], isActive: true, characterKey: 'christian' },
      { slotCards: [], isActive: false, characterKey: 'christian' },
      { slotCards: [], isActive: false, characterKey: 'christian' },
    ], // initializes an empty deck storage with 3 decks, only the first one is active by default, and all are set to a default character
  };
}

export function loadLocalDeckStorage(): LocalDeckStorage {
  const raw = localStorage.getItem(getDeckStorageKey());
  if (!raw) return createEmptyLocalDeckStorage(); // if no data is found in localStorage, return a new empty deck storage object

  try {
    const parsed = JSON.parse(raw) as LocalDeckStorage; // attempt to analyze the stored JSON data into the LocalDeckStorage format

    if (!parsed || !Array.isArray(parsed.decks) || parsed.decks.length !== 3) {
      return createEmptyLocalDeckStorage();
    } // validate the structure of the parsed data, ensuring it has the expected properties and format; if validation fails, return a new empty deck storage object

    return parsed;
  } 
  
  catch {
    return createEmptyLocalDeckStorage();
  } // if JSON parsing fails (e.g., due to corrupted data), catch the error and return a new empty deck storage object to ensure the application can continue functioning without crashing
}

export function saveLocalDeckStorage(data: LocalDeckStorage): void {
  localStorage.setItem(getDeckStorageKey(), JSON.stringify(data));
} // saves the provided LocalDeckStorage data to localStorage as a JSON string