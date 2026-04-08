import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { DuelScene } from './scenes/DuelScene';
import { EvergladesScene } from './scenes/EvergladesScene';
import { PlatformerScene } from './scenes/PlatformerScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: 1200,
  height: 750,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, DuelScene, EvergladesScene, PlatformerScene],
};

new Phaser.Game(config);
