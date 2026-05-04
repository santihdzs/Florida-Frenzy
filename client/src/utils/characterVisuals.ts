/*
* Santiago Hernandez - A01787550
* Manuel Montero - A01660761
* Yael Ordaz - A01786776
* 
* 
* This module defines the visual assets and configurations for the characters in the game, 
* including their avatars, sprite sheets, and specific images for different states 
* (idle, attack, damage, defeated) used in the duel mode. 
* It also includes configuration for how these visuals should be displayed during duels, 
* such as scaling and positioning. 
*
* Copilot was used to assist in the organization and structuring of the character visuals
*/


import chrisAvatarUrl from '../assets/sprites/Chris.webp';
import gavinAvatarUrl from '../assets/sprites/Gav.webp';
import gustavAvatarUrl from '../assets/sprites/Gus.webp';
import eddyAvatarUrl from '../assets/sprites/Ed.webp';

import christianSheet from '../assets/characters/christian/Christian_SpriteSheet.webp';
import gavinSheet from '../assets/characters/gavin/Gavin_SpriteSheet.webp';
import gustavSheet from '../assets/characters/gustav/Gustav_SpriteSheet.webp';
import eddySheet from '../assets/characters/eddy/Eddy_SpriteSheet.webp';

import christianIdle from '../assets/characters/christian/Christian_v4_resized.webp';
import christianAttack1 from '../assets/characters/christian/Christian_attack-1.webp';
import christianAttack2 from '../assets/characters/christian/Christian_attack-2.webp';
import christianUlti1 from '../assets/characters/christian/Christian_ulti-1.webp';
import christianUlti2 from '../assets/characters/christian/Christian_ulti-2.webp';
import christianDamage1 from '../assets/characters/christian/Christian_damage-1.webp';
import christianDamage2 from '../assets/characters/christian/Christian_damage-2.webp';
import christinDefeated from '../assets/characters/christian/Christian_defeated.webp';

import gavinIdle from '../assets/characters/gavin/Gavin_v3_resized.webp';
import gavinAttack1 from '../assets/characters/gavin/Gavin_attack-1.webp';
import gavinAttack2 from '../assets/characters/gavin/Gavin_attack-2.webp';
import gavinUlti1 from '../assets/characters/gavin/Gavin_ulti-1.webp';
import gavinUlti2 from '../assets/characters/gavin/Gavin_ulti-2.webp';
import gavinDamage1 from '../assets/characters/gavin/Gavin_damage-1.webp';
import gavinDamage2 from '../assets/characters/gavin/Gavin_damage-2.webp';
import gavinDefeated from '../assets/characters/gavin/Gavin_defeated.webp';

import gustavIdle from '../assets/characters/gustav/Gustav_v3_resized.webp';
import gustavAttack1 from '../assets/characters/gustav/Gustav_attack-1.webp';
import gustavAttack2 from '../assets/characters/gustav/Gustav_attack-2.webp';
import gustavUlti1 from '../assets/characters/gustav/Gustav_ulti-1.webp';
import gustavUlti2 from '../assets/characters/gustav/Gustav_ulti-2.webp';
import gustavDamage1 from '../assets/characters/gustav/Gustav_damage-1.webp';
import gustavDamage2 from '../assets/characters/gustav/Gustav_damage-2.webp';
import gustavDefeated from '../assets/characters/gustav/Gustav_defeated.webp';

import eddyIdle from '../assets/characters/eddy/Eddy_v2_resized.webp';
import eddyAttack1 from '../assets/characters/eddy/Eddy_attack-1.webp';
import eddyAttack2 from '../assets/characters/eddy/Eddy_attack-2.webp';
import eddyUlti1 from '../assets/characters/eddy/Eddy_ulti-1.webp';
import eddyUlti2 from '../assets/characters/eddy/Eddy_ulti-2.webp';
import eddyDamage1 from '../assets/characters/eddy/Eddy_damage-1.webp';
import eddyDamage2 from '../assets/characters/eddy/Eddy_damage-2.webp';
import eddyDefeated from '../assets/characters/eddy/Eddy_defeated.webp';

export type CharacterSkinKey = 'christian' | 'gavin' | 'gustav' | 'eddy';

// the CHARACTER_VISUALS object maps each character skin key to its corresponding visual assets and configuration
export interface CharacterVisuals {
  avatarUrl: string;
  sheetUrl: string;
  duel: {
    idle: string;
    attack1: string;
    attack2: string;
    ulti1: string;
    ulti2: string;
    damage1: string;
    damage2: string;
    defeated: string;
  };
  duelVisuals: {
    idleScale: number;
    attackScale: number;
    hurtScale: number;
    poseX: number;
    poseY: number;
    shadowX: number;
    shadowY: number;
    shadowRadiusX: number;
    shadowRadiusY: number;
  };
  run: {
    xCuts: readonly number[];
    yCuts: readonly number[];
  };
}

export const CHARACTER_VISUALS: Record<CharacterSkinKey, CharacterVisuals> = {
  christian: { // Christian's character visuals
    avatarUrl: chrisAvatarUrl,
    sheetUrl: christianSheet,
    duel: {
      idle: christianIdle,
      attack1: christianAttack1,
      attack2: christianAttack2,
      ulti1: christianUlti1,
      ulti2: christianUlti2,
      damage1: christianDamage1,
      damage2: christianDamage2,
      defeated: christinDefeated,
    },
    duelVisuals: {
      idleScale: 0.33,
      attackScale: 0.33,
      hurtScale: 0.33,
      poseX: 160,
      poseY: 380,
      shadowX: 160,
      shadowY: 390,
      shadowRadiusX: 150,
      shadowRadiusY: 32,
    },
    run: {
      xCuts: [0, 293, 587, 880],
      yCuts: [0, 300, 600, 900, 1200],
    },
  },
  gavin: { // Gavin's character visuals
    avatarUrl: gavinAvatarUrl,
    sheetUrl: gavinSheet,
    duel: {
      idle: gavinIdle,
      attack1: gavinAttack1,
      attack2: gavinAttack2,
      ulti1: gavinUlti1,
      ulti2: gavinUlti2,
      damage1: gavinDamage1,
      damage2: gavinDamage2,
      defeated: gavinDefeated,
    },
    duelVisuals: {
      idleScale: 0.33,
      attackScale: 0.33,
      hurtScale: 0.33,
      poseX: 160,
      poseY: 380,
      shadowX: 170,
      shadowY: 390,
      shadowRadiusX: 150,
      shadowRadiusY: 32,
    },
    run: {
      xCuts: [0, 292, 584, 876],
      yCuts: [0, 304, 608, 912, 1216],
    },
  },
  gustav: { // Gustav's character visuals
    avatarUrl: gustavAvatarUrl,
    sheetUrl: gustavSheet,
    duel: {
      idle: gustavIdle,
      attack1: gustavAttack1,
      attack2: gustavAttack2,
      ulti1: gustavUlti1,
      ulti2: gustavUlti2,
      damage1: gustavDamage1,
      damage2: gustavDamage2,
      defeated: gustavDefeated,
    },
    duelVisuals: {
      idleScale: 0.33,
      attackScale: 0.33,
      hurtScale: 0.33,
      poseX: 175,
      poseY: 390,
      shadowX: 175,
      shadowY: 400,
      shadowRadiusX: 150,
      shadowRadiusY: 32,
    },
    run: {
      xCuts: [0, 292, 584, 875],
      yCuts: [0, 304, 608, 912, 1216],
    },
  },
  eddy: { // Eddy's character visuals
    avatarUrl: eddyAvatarUrl,
    sheetUrl: eddySheet,
    duel: {
      idle: eddyIdle,
      attack1: eddyAttack1,
      attack2: eddyAttack2,
      ulti1: eddyUlti1,
      ulti2: eddyUlti2,
      damage1: eddyDamage1,
      damage2: eddyDamage2,
      defeated: eddyDefeated,
    },
    duelVisuals: {
      idleScale: 0.33,
      attackScale: 0.33,
      hurtScale: 0.33,
      poseX: 150,
      poseY: 320,
      shadowX: 150,
      shadowY: 330,
      shadowRadiusX: 150,
      shadowRadiusY: 32,
    },
    run: {
      xCuts: [0, 293, 587, 880],
      yCuts: [0, 300, 599, 899, 1198],
    },
  },
};

export function isCharacterSkinKey(value: string): value is CharacterSkinKey {
  return value in CHARACTER_VISUALS;
}

export function resolveCharacterSkinKey(value: string | undefined | null): CharacterSkinKey {
  return value && isCharacterSkinKey(value) ? value : 'christian';
}