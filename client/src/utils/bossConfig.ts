// visual configuration for each boss, defining the animation keys, 
// scales, and positioning for the boss sprites in the game. Pythra has
// unique damage animations for his evolution phases.

export interface BossPhaseVisualConfig {
  idleKey: string;
  attackKeys: string[];
  hurtKeys: string[];
  prepareKeys?: string[];
  ultiKeys?: string[];
}

export interface BossVisualConfig {
  phases: BossPhaseVisualConfig[];
  defeatedKey: string;
  idleScale: number;
  attackScale: number;
  hurtScale: number;
  defeatedScale: number;
  flipX: boolean;
  x: number;
  y: number;
  depth: number;
}

// each boss has a corresponding visual configuration that the game uses to display 
// the correct animations and positioning during duels
export const BOSS_VISUALS: Record<string, BossVisualConfig> = {
  Skawl: {
    phases: [
      {
        idleKey: 'skawl-idle',
        attackKeys: ['skawl-attack-1', 'skawl-attack-2'],
        hurtKeys: ['skawl-damage-1', 'skawl-damage-2'],
        ultiKeys: ['skawl-ulti-1', 'skawl-ulti-2'],
      },
    ],
    defeatedKey: 'skawl-defeated',
    idleScale: 0.34,
    attackScale: 0.36,
    hurtScale: 0.35,
    defeatedScale: 0.35,
    flipX: false,
    x: 1025,
    y: 365,
    depth: 0,
  },

  Rabyz: {
    phases: [
      {
        idleKey: 'rabyz-idle',
        attackKeys: ['rabyz-attack-1', 'rabyz-attack-2'],
        hurtKeys: ['rabyz-damage-1', 'rabyz-damage-2'],
        ultiKeys: ['rabyz-ulti-1', 'rabyz-ulti-2'],
      },
    ],
    defeatedKey: 'rabyz-defeated',
    idleScale: 0.34,
    attackScale: 0.36,
    hurtScale: 0.35,
    defeatedScale: 0.35,
    flipX: false,
    x: 1025,
    y: 365,
    depth: 0,
  },

  Boldear: {
    phases: [
      {
        idleKey: 'boldear-idle',
        attackKeys: ['boldear-attack-1', 'boldear-attack-2'],
        hurtKeys: ['boldear-damage-1', 'boldear-damage-2'],
        ultiKeys: ['boldear-ulti-1', 'boldear-ulti-2'],
      },
    ],
    defeatedKey: 'boldear-defeated',
    idleScale: 0.34,
    attackScale: 0.36,
    hurtScale: 0.35,
    defeatedScale: 0.35,
    flipX: false,
    x: 1015,
    y: 420,
    depth: 0,
  },

  Pythra: {
    phases: [
      {
        idleKey: 'pythra-evolution-1',
        attackKeys: ['pythra-attack-1', 'pythra-attack-2'],
        hurtKeys: ['pythra-prepare-1', 'pythra-prepare-2'],
        ultiKeys: ['pythra-ulti-1', 'pythra-ulti-2'],
      },
      {
        idleKey: 'pythra-evolution-2',
        attackKeys: ['pythra-attack-3', 'pythra-attack-4'],
        hurtKeys: ['pythra-prepare-3', 'pythra-prepare-4'],
        ultiKeys: ['pythra-ulti-3', 'pythra-ulti-4'],
      },
      {
        idleKey: 'pythra-evolution-3',
        attackKeys: ['pythra-attack-5', 'pythra-attack-6'],
        hurtKeys: ['pythra-damage-1', 'pythra-damage-2'],
        ultiKeys: ['pythra-ulti-5', 'pythra-ulti-6'],
      },
    ],
    defeatedKey: 'pythra-defeated',
    idleScale: 0.40,
    attackScale: 0.42,
    hurtScale: 0.40,
    defeatedScale: 0.40,
    flipX: false,
    x: 1010,
    y: 480,
    depth: 0,
  },
};