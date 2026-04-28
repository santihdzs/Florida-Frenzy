/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* Centralized configuration file for the duel mechanics, 
* defining constants for HP, energy, hand size, deck size, and sprite scales.
*
*/ 

export const MAX_HP = 100; // shared HP cap for both combatants
export const MAX_ENERGY = 50; // maximum value for each energy bar
export const HAND_SIZE = 5; // number of cards each side starts with
export const PLAYER_DECK_SIZE = 12; // number of cards in the player's deck
export const DISCARD_BASE_SIZE = 72; // discard pile seed size

export const PLAYER_IDLE_SCALE = 0.33; // player idle sprite scale
export const PLAYER_ATTACK_SCALE = 0.33; // player attack sprite scale
export const PLAYER_HURT_SCALE = 0.33; // player hurt sprite scale

export const ENEMY_IDLE_SCALE = 0.34; // enemy idle sprite scale
export const ENEMY_ATTACK_SCALE = 0.36; // enemy attack sprite scale
export const ENEMY_HURT1_SCALE = 0.35; // enemy hurt sprite scale for mid HP
export const ENEMY_HURT2_SCALE = 0.35; // enemy hurt sprite scale for low HP