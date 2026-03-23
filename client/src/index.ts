import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { DuelScene } from './scenes/DuelScene';
import { EvergladesScene } from './scenes/EvergladesScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: 1200,
  height: 750,
  backgroundColor: '#1a1a2e',
  scene: [MenuScene, DuelScene, EvergladesScene],
};

new Phaser.Game(config);
