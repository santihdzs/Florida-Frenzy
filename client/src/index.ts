import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { DuelScene } from './scenes/DuelScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 900,
  height: 650,
  backgroundColor: '#1a1a2e',
  scene: [MenuScene, DuelScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

new Phaser.Game(config);
