import type { DuelBossData } from '../utils/bossTypes';

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001';

// Function to fetch a random duel boss from the server,
// used in the duel mode of the game to provide variety in boss encounters
export async function fetchRandomDuelBoss(): Promise<DuelBossData> {
  const response = await fetch(`${API_URL}/api/enemies/random-duel-boss`); // make a GET request to the random duel boss endpoint to retrieve a random boss for the duel mode

  if (!response.ok) {
    throw new Error(`Failed to fetch boss: ${response.statusText}`);
  } // check if the response is successful, and if not, throw an error with the status text for debugging purposes

  return response.json() as Promise<DuelBossData>;
}