import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { DuelScene } from './scenes/DuelScene';
import { PlatformerScene } from './scenes/PlatformerScene';
import { SettingsScene } from './scenes/SettingsScene';
import { InstructionScene } from './scenes/InstructionScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game-container',
  dom: { createContainer: true },
  width: 1200,
  height: 750,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true
  },
  scene: [MenuScene, DuelScene, PlatformerScene, SettingsScene, InstructionScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

new Phaser.Game(config);
