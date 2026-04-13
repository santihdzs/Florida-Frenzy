import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { DuelScene } from './scenes/DuelScene';
import { EvergladesScene } from './scenes/EvergladesScene';
import { PlatformerScene } from './scenes/PlatformerScene';
import { SettingsScene } from './scenes/SettingsScene';
import { InstructionScene } from './scenes/InstructionScene';
import { LoginScene } from './scenes/LoginScene';
import { PauseScene } from './scenes/PauseScene';

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
  },
  scene: [MenuScene, DuelScene, EvergladesScene, PlatformerScene, InstructionScene, SettingsScene, LoginScene, PauseScene],
};

new Phaser.Game(config);
