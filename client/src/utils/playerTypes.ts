/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* This file defines TypeScript types related to player characters, 
* including their visual configurations for duels and running animations. 
* These types are used throughout the game to ensure consistent handling of 
* player character data and visuals.
* 
* ChatGPT was used to assist in writing and optimizing some of the code in this file
*/

export type PlayerCharacterKey = 'christian' | 'gustav' | 'gavin' | 'eddy';

export interface PlayerRunVisualConfig {
  avatarKey: string;
  worldTextureKey: string;
  worldScale: number;
} // configuration for the player's running animation, including the avatar sprite and the world texture used for parallax effects

export interface PlayerDuelVisualConfig {
  idleKey: string;
  attackKeys: string[];
  hurtKeys: string[];
  defeatedKey: string;
  idleScale: number;
  attackScale: number;
  hurtScale: number;
  defeatedScale: number;
  x: number;
  y: number;
  depth: number;
  flipX: boolean;
} // configuration for the player's duel animation, including idle, attack, hurt, and defeated states

export interface PlayerVisualConfig {
  run: PlayerRunVisualConfig;
  duel: PlayerDuelVisualConfig;
}

export interface ActiveCharacterStats {
  characterGameId: number;
  characterName: string;
  characterKey: PlayerCharacterKey;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  chUltimate: string | null;
  chUltimateDesc: string | null;
} // all stats related to the database character that is currently active for the player

export const PLAYER_ID_TO_KEY: Record<number, PlayerCharacterKey> = {
  1: 'christian',
  2: 'gustav',
  3: 'gavin',
  4: 'eddy',
}; // mapping from character game IDs to their corresponding keys used in the codebase for easier reference

export const PLAYER_NAME_TO_KEY: Record<string, PlayerCharacterKey> = {
  Christian: 'christian',
  Gustav: 'gustav',
  Gavin: 'gavin',
  Eddy: 'eddy',
}; // mapping from character names to their corresponding keys, useful for converting user-friendly names to internal keys

export function normalizePlayerCharacterKey(value: unknown): PlayerCharacterKey {
  if (value === 'gustav' || value === 'gavin' || value === 'eddy') return value;
  return 'christian';
} // utility function to normalize any input value to a valid PlayerCharacterKey, defaulting to 'christian' if the input is not recognized