/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* This file defines TypeScript types related to player characters, 
* including their visual configurations for duels and running animations. 
* 
* ChatGPT was used to assist in writing and optimizing some of the code in this file
*/

import type { PlayerCharacterKey, PlayerVisualConfig } from './playerTypes';

export const PLAYER_VISUALS: Record<PlayerCharacterKey, PlayerVisualConfig> = {
  christian: {
    run: {
      avatarKey: 'player-avatar-christian',
      worldTextureKey: 'player-run-christian',
      worldScale: 1,
    },
    duel: {
      idleKey: 'christian-idle',
      attackKeys: ['christian-attack-1', 'christian-attack-2'],
      hurtKeys: ['christian-damage-1', 'christian-damage-2'],
      defeatedKey: 'christian-defeated',
      idleScale: 0.33,
      attackScale: 0.33,
      hurtScale: 0.33,
      defeatedScale: 0.33,
      x: 290,
      y: 455,
      depth: 0,
      flipX: false,
    },
  },

  gustav: {
    run: {
      avatarKey: 'player-avatar-gustav',
      worldTextureKey: 'player-run-gustav',
      worldScale: 1,
    },
    duel: {
      idleKey: 'gustav-idle',
      attackKeys: ['gustav-attack-1', 'gustav-attack-2'],
      hurtKeys: ['gustav-damage-1', 'gustav-damage-2'],
      defeatedKey: 'gustav-defeated',
      idleScale: 0.33,
      attackScale: 0.33,
      hurtScale: 0.33,
      defeatedScale: 0.33,
      x: 290,
      y: 455,
      depth: 0,
      flipX: false,
    },
  },

  gavin: {
    run: {
      avatarKey: 'player-avatar-gavin',
      worldTextureKey: 'player-run-gavin',
      worldScale: 1,
    },
    duel: {
      idleKey: 'gavin-idle',
      attackKeys: ['gavin-attack-1', 'gavin-attack-2'],
      hurtKeys: ['gavin-damage-1', 'gavin-damage-2'],
      defeatedKey: 'gavin-defeated',
      idleScale: 0.33,
      attackScale: 0.33,
      hurtScale: 0.33,
      defeatedScale: 0.33,
      x: 290,
      y: 455,
      depth: 0,
      flipX: false,
    },
  },

  eddy: {
    run: {
      avatarKey: 'player-avatar-eddy',
      worldTextureKey: 'player-run-eddy',
      worldScale: 1,
    },
    duel: {
      idleKey: 'eddy-idle',
      attackKeys: ['eddy-attack-1', 'eddy-attack-2'],
      hurtKeys: ['eddy-damage-1', 'eddy-damage-2'],
      defeatedKey: 'eddy-defeated',
      idleScale: 0.33,
      attackScale: 0.33,
      hurtScale: 0.33,
      defeatedScale: 0.33,
      x: 290,
      y: 455,
      depth: 0,
      flipX: false,
    },
  },
};