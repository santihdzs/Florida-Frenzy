/*
* Santiago Hernandez - A01787550
* Manuel Montero - A01660761
* Yael Ordaz - A01786776
*
* This is the API module responsible for fetching card data from the backend server. 
* It defines the structure of the card data as it is stored in the database and 
* provides a function to retrieve this data via an HTTP GET request. 
* The API URL is configurable through environment variables, allowing for 
* flexibility between development and production environments.
* 
* ChatGPT was used to assist in the design of the API module, including defining the DbCard
* interface and the fetchCards function for retrieving card data from the server.
*/

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