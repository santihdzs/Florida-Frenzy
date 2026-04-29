const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001';

export interface DbCard { // Define the structure of the card data as it is stored in the database
  id: number;
  cardName: string;
  cardCategory: string;
  cardElement: string;
  cardNumber: number | null;
  cardEffect: string | null;
  effectDesc: string | null;
  baseDamage: number | null;
  shieldValue: number | null;
  effectValue: number | null;
  effectDuration: number | null;
  effectValueSecondary: number | null;
  energyEGain: number | null;
  energyIGain: number | null;
  energyECost: number | null;
  energyICost: number | null;
  cardRarity: string;
}

export async function fetchCards(): Promise<DbCard[]> { // Function to fetch card data from the backend API
  const response = await fetch(`${API_URL}/api/cards`);

  if (!response.ok) {
    throw new Error(`Failed to fetch cards: ${response.statusText}`);
  }

  return response.json() as Promise<DbCard[]>;
}