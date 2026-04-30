import evergladesUrl      from '../assets/maps/everglades.webp';
import garbageDumpUrl     from '../assets/maps/garbage_dump.webp';
import sewersUrl          from '../assets/maps/sewers.webp';
import suburbsUrl         from '../assets/maps/suburbs.webp';

import bgEvergladesUrl    from '../assets/backgrounds/everglades.jpg';
import bgGarbageDumpUrl   from '../assets/backgrounds/garbage_dump_topdown.webp';
import bgSewersUrl        from '../assets/backgrounds/sewers_topdown.webp';
import bgSuburbsUrl       from '../assets/backgrounds/suburbs_topdown.webp';

export interface MapConfig {
  key: string;
  url: string;
  tileWidth: number;
  tileHeight: number;
  frames: {
    grass:   number;
    barrier: number;
    hole:    number;
    puddle:  number;
  };
  bgKey: string;
  bgUrl: string;
}

export const MAP_CONFIGS: Record<string, MapConfig> = {
  everglades: {
    key:        'ev-tiles',
    url:        evergladesUrl,
    tileWidth:  16,
    tileHeight: 16,
    frames: { grass: 75, barrier: 32, hole: 8, puddle: 290 },
    bgKey: 'bg-everglades',
    bgUrl: bgEvergladesUrl,
  },
  garbage_dump: {
    key:        'garbage-dump-tiles',
    url:        garbageDumpUrl,
    tileWidth:  16,  // TODO: update when garbage_dump spritesheet is finalised
    tileHeight: 16,
    frames: { grass: 75, barrier: 32, hole: 8, puddle: 290 }, // TODO: update frames for garbage_dump
    bgKey: 'bg-garbage-dump',
    bgUrl: bgGarbageDumpUrl,
  },
  sewers: {
    key:        'sewers-tiles',
    url:        sewersUrl,
    tileWidth:  16,  // TODO: update when sewers spritesheet is finalised
    tileHeight: 16,
    frames: { grass: 75, barrier: 32, hole: 8, puddle: 290 }, // TODO: update frames for sewers
    bgKey: 'bg-sewers',
    bgUrl: bgSewersUrl,
  },
  suburbs: {
    key:        'suburbs-tiles',
    url:        suburbsUrl,
    tileWidth:  16,  // TODO: update when suburbs spritesheet is finalised
    tileHeight: 16,
    frames: { grass: 75, barrier: 32, hole: 8, puddle: 290 }, // TODO: update frames for suburbs
    bgKey: 'bg-suburbs',
    bgUrl: bgSuburbsUrl,
  },
};

const MAP_KEYS = Object.keys(MAP_CONFIGS);

export function selectMap(previousKey?: string): MapConfig {
  const candidates = MAP_KEYS.filter(k => MAP_CONFIGS[k].key !== previousKey);
  const pool = candidates.length > 0 ? candidates : MAP_KEYS;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return MAP_CONFIGS[chosen];
}
