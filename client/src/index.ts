import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { DuelScene } from './scenes/DuelScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1000,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [MenuScene, DuelScene],
  resolution: 2,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

new Phaser.Game(config);
