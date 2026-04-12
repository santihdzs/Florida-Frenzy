/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* Reusable combat state management logic for the DuelScene, including functions to apply card effects,
* check for combat end conditions, and manage the flow of turns between the player and the enemy.
*/ 

export interface CombatState {
  shield: number;
  poisonTurnCounter: number;
  poisonDamage: number;
  burnTurnCounter: number;
  burnDamage: number;
  weakenTurnCounter: number;
  weakenEffectValue: number;
  reflectTurnCounter: number;
  reflectPercent: number;
  blockFireTurnCounter: number;
  stunTurnCounter: number;
  jamTurnCounter: number;
  chainFireBonus: number;
  sandBuffTurnCounter: number;
  sandBuffPercent: number;
  energyBoostTurnCounter: number;
  energyBoostPercent: number;
  discardDrawTurnCounter: number;
  blockedNumberTurnCounter: number | null;
}

export function createEmptyCombatState(): CombatState { // factory function to create a new combat state with default values
  return {
    shield: 0,
    poisonTurnCounter: 0,
    poisonDamage: 0,
    burnTurnCounter: 0,
    burnDamage: 0,
    weakenTurnCounter: 0,
    weakenEffectValue: 0,
    reflectTurnCounter: 0,
    reflectPercent: 0,
    blockFireTurnCounter: 0,
    stunTurnCounter: 0,
    jamTurnCounter: 0,
    chainFireBonus: 0,
    sandBuffTurnCounter: 0,
    sandBuffPercent: 0,
    energyBoostTurnCounter: 0,
    energyBoostPercent: 0,
    discardDrawTurnCounter: 0,
    blockedNumberTurnCounter: null,
  };
}