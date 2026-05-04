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
import christianDamage1 from '../assets/characters/christian/Christian_damage-1.webp';
import christianDamage2 from '../assets/characters/christian/Christian_damage-2.webp';
import christinDefeated from '../assets/characters/christian/Christian_defeated.webp';

import gavinIdle from '../assets/characters/gavin/Gavin_v3_resized.webp';
import gavinAttack1 from '../assets/characters/gavin/Gavin_attack-1.webp';
import gavinAttack2 from '../assets/characters/gavin/Gavin_attack-2.webp';
import gavinDamage1 from '../assets/characters/gavin/Gavin_damage-1.webp';
import gavinDamage2 from '../assets/characters/gavin/Gavin_damage-2.webp';
import gavinDefeated from '../assets/characters/gavin/Gavin_defeated.webp';

import gustavIdle from '../assets/characters/gustav/Gustav_v3_resized.webp';
import gustavAttack1 from '../assets/characters/gustav/Gustav_attack-1.webp';
import gustavAttack2 from '../assets/characters/gustav/Gustav_attack-2.webp';
import gustavDamage1 from '../assets/characters/gustav/Gustav_damage-1.webp';
import gustavDamage2 from '../assets/characters/gustav/Gustav_damage-2.webp';
import gustavDefeated from '../assets/characters/gustav/Gustav_defeated.webp';

import eddyIdle from '../assets/characters/eddy/Eddy_v2_resized.webp';
import eddyAttack1 from '../assets/characters/eddy/Eddy_attack-1.webp';
import eddyAttack2 from '../assets/characters/eddy/Eddy_attack-2.webp';
import eddyDamage1 from '../assets/characters/eddy/Eddy_damage-1.webp';
import eddyDamage2 from '../assets/characters/eddy/Eddy_damage-2.webp';
import eddyDefeated from '../assets/characters/eddy/Eddy_defeated.webp';

export type CharacterSkinKey = 'christian' | 'gavin' | 'gustav' | 'eddy';

export interface CharacterVisuals {
  avatarUrl: string;
  sheetUrl: string;
  duel: {
    idle: string;
    attack1: string;
    attack2: string;
    damage1: string;
    damage2: string;
    defeated: string;
  };
  run: {
    xCuts: readonly number[];
    yCuts: readonly number[];
  };
}

export const CHARACTER_VISUALS: Record<CharacterSkinKey, CharacterVisuals> = {
  christian: {
    avatarUrl: chrisAvatarUrl,
    sheetUrl: christianSheet,
    duel: {
      idle: christianIdle,
      attack1: christianAttack1,
      attack2: christianAttack2,
      damage1: christianDamage1,
      damage2: christianDamage2,
      defeated: christinDefeated,
    },
    run: {
      xCuts: [0, 293, 587, 880],
      yCuts: [0, 300, 600, 900, 1200],
    },
  },
  gavin: {
    avatarUrl: gavinAvatarUrl,
    sheetUrl: gavinSheet,
    duel: {
      idle: gavinIdle,
      attack1: gavinAttack1,
      attack2: gavinAttack2,
      damage1: gavinDamage1,
      damage2: gavinDamage2,
      defeated: gavinDefeated,
    },
    run: {
      xCuts: [0, 292, 584, 876],
      yCuts: [0, 304, 608, 912, 1216],
    },
  },
  gustav: {
    avatarUrl: gustavAvatarUrl,
    sheetUrl: gustavSheet,
    duel: {
      idle: gustavIdle,
      attack1: gustavAttack1,
      attack2: gustavAttack2,
      damage1: gustavDamage1,
      damage2: gustavDamage2,
      defeated: gustavDefeated,
    },
    run: {
      xCuts: [0, 292, 584, 875],
      yCuts: [0, 304, 608, 912, 1216],
    },
  },
  eddy: {
    avatarUrl: eddyAvatarUrl,
    sheetUrl: eddySheet,
    duel: {
      idle: eddyIdle,
      attack1: eddyAttack1,
      attack2: eddyAttack2,
      damage1: eddyDamage1,
      damage2: eddyDamage2,
      defeated: eddyDefeated,
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