import evergladesUrl      from '../assets/maps/everglades.webp';
import garbageDumpUrl     from '../assets/maps/garbage_dump.webp';
import sewersUrl          from '../assets/maps/sewers.webp';
import suburbsUrl         from '../assets/maps/suburbs.webp';

import bgEvergladesUrl    from '../assets/backgrounds/everglades.jpg';
import bgGarbageDumpUrl   from '../assets/backgrounds/garbage_dump_topdown.webp';
import bgSewersUrl        from '../assets/backgrounds/sewers_topdown.webp';
import bgSuburbsUrl       from '../assets/backgrounds/suburbs_topdown.webp';

export interface TileRect { x: number; y: number; w: number; h: number }

export interface MapConfig {
  key: string;
  url: string;
  tileWidth: number;
  tileHeight: number;
  frames: {
    grass:   TileRect;
    barrier: TileRect;
    hole:    TileRect;
    puddle:  TileRect;
  };
  bgKey: string;
  bgUrl: string;
}

export const MAP_CONFIGS: Record<string, MapConfig> = {
  // everglades: {
  //   key:        'ev-tiles',
  //   url:        evergladesUrl,
  //   tileWidth:  16,
  //   tileHeight: 16,
  //   frames: {
  //     grass:   { x: 112, y:  64, w: 16, h: 16 }, // was frame 75  (col 7,  row 4)
  //     barrier: { x: 240, y:  16, w: 16, h: 16 }, // was frame 32  (col 15, row 1)
  //     hole:    { x: 128, y:   0, w: 16, h: 16 }, // was frame 8   (col 8,  row 0)
  //     puddle:  { x:  16, y: 272, w: 16, h: 16 }, // was frame 290 (col 1,  row 17)
  //   },
  //   bgKey: 'bg-everglades',
  //   bgUrl: bgEvergladesUrl,
  // },
  // garbage_dump: {
  //   key:        'garbage-dump-tiles',
  //   url:        garbageDumpUrl,
  //   tileWidth:  80,  // TODO: update when garbage_dump spritesheet is finalised
  //   tileHeight: 80,
  //   frames: { // TODO: update rects when garbage_dump spritesheet is finalised
  //     grass:   { x: 175, y: 578, w: 110, h: 110 },
  //     barrier: { x: 638, y: 760, w: 117, h: 98 },
  //     hole:    { x: 884, y: 769, w: 35, h: 35 },
  //     puddle:  { x: 60, y: 348, w: 118, h: 115 },
  //   },
  //   bgKey: 'bg-garbage-dump',
  //   bgUrl: bgGarbageDumpUrl,
  // },
  // sewers: {
  //   key:        'sewers-tiles',
  //   url:        sewersUrl,
  //   tileWidth:  80,
  //   tileHeight: 80,
  //   frames: {
  //     grass:   { x: 0,   y: 285, w: 230, h: 230 },
  //     barrier: { x: 580, y: 23,  w: 94,  h: 73  },
  //     hole:    { x: 170, y: 606, w: 117,  h: 82  },
  //     puddle:  { x: 6,   y: 711,   w: 159,  h: 149  },
  //   },
  //   bgKey: 'bg-sewers',
  //   bgUrl: bgSewersUrl,
  // },
  suburbs: {
    key:        'suburbs-tiles',
    url:        suburbsUrl,
    tileWidth:  80,  // TODO: update when suburbs spritesheet is finalised
    tileHeight: 80,
    frames: { // TODO: update rects for suburbs
      grass:   { x: 283, y: 494, w: 68, h: 68 },
      barrier: { x: 70, y: 636, w: 180, h: 208 },
      hole:    { x: 801, y: 507, w: 59, h: 62 },
      puddle:  { x: 305, y: 1087, w: 96, h: 96 },
    },
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
