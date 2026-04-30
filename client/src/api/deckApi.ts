/*
*
* This file defines TypeScript interfaces and functions for interacting with the 
* deck-related API endpoints of the Florida Frenzy game server.
* It includes the structure of the response for fetching deck bootstrap data, as 
* well as functions to fetch this data, save a deck configuration, and activate a deck.
* These functions make HTTP requests to the corresponding API endpoints on the 
* server, handle responses and errors, and return the relevant data to be used in the 
* client application for managing player decks.
* 
* ChatGPT was used to assist in writing and optimizing some of the code in this file
* 
*/

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001';

export interface DeckBootstrapResponse {
  player: {
    id: number;
    username: string;
    maxXp: number;
    clanRank: 'ROOKIE' | 'VETERAN' | 'ELITE' | 'LEGEND';
    slotLimit: number;
  }; // player info
  ownedCards: {
    cardGameId: number;
    isUnlocked: boolean;
    numCardsOwned: number;
    cardRarity: string;
  }[]; // list of cards owned by the player
  decks: {
    id: number;
    deckName: string;
    isActive: boolean;
    characterGameId: number;
    cards: {
      id: number;
      cardGameId: number;
      cardsIncluded: number;
    }[];
  }[]; // list of the player's decks, including the cards in each deck
  allCards: unknown[];
}

export async function fetchDeckBootstrap(playerId: number): Promise<DeckBootstrapResponse> {
  const response = await fetch(`${API_URL}/api/decks/bootstrap/${playerId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Failed to fetch deck bootstrap.');
  }

  return response.json();
} // fetches the initial data needed for the deck management screen

export async function saveDeckToBackend(input: {
  playerId: number;
  slotIndex: number;
  characterGameId: number;
  cardGameIds: number[];
  makeActive?: boolean;
}) {
  const response = await fetch(`${API_URL}/api/decks/save`, {
    method: 'PUT', // make a PUT request to the save deck endpoint to save the player's deck configuration
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Failed to save deck.');
  }

  return response.json();
} // sends the player's deck configuration to the server to be saved, including which cards are in the deck and which character is selected, and optionally whether to set this deck as active

export async function activateDeckInBackend(input: { playerId: number; deckId: number }) {
  const response = await fetch(`${API_URL}/api/decks/activate`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Failed to activate deck.');
  }

  return response.json();
} // activates a deck in the backend, setting it as the active deck for the player

export async function fetchActiveDeck(playerId: number) {
  const response = await fetch(`${API_URL}/api/decks/active/${playerId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Failed to fetch active deck.');
  }

  return response.json();
} // fetches the currently active deck for a player, including the character and cards in that deck