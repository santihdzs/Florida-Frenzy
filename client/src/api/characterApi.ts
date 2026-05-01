/*
*
* This file defines the API functions for fetching character data from the backend server. It includes:
* - An interface `CharacterGameData` that describes the structure of character data returned by the API.
* 
* Copilot was used to assist in writing the `fetchCharacters` and `fetchCharacterByKey` functions.
*/

import { API_URL } from './apiBase.js';

export interface CharacterGameData {
  id: number;
  characterKey: string;
  chName: string;
  chDesc: string | null;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  chUltimate: string;
  chUltimateDesc: string | null;
  isDefaultUnlocked: boolean;
}

export async function fetchCharacters(): Promise<CharacterGameData[]> {
  const response = await fetch(`${API_URL}/api/characters`);

  if (!response.ok) {
    throw new Error(`Failed to fetch characters: ${response.statusText}`);
  }

  return response.json() as Promise<CharacterGameData[]>;
}

export async function fetchCharacterByKey(characterKey: string): Promise<CharacterGameData> {
  const response = await fetch(`${API_URL}/api/characters/${encodeURIComponent(characterKey)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch character: ${response.statusText}`);
  }

  return response.json() as Promise<CharacterGameData>;
}