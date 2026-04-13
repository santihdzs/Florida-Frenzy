import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { DuelScene } from './scenes/DuelScene';
import { EvergladesScene } from './scenes/EvergladesScene';
import { PlatformerScene } from './scenes/PlatformerScene';
import { SettingsScene } from './scenes/SettingsScene';
import { InstructionScene } from './scenes/InstructionScene';
import { PauseScene } from './scenes/PauseScene';

const config: Phaser.Types.Core.GameConfig = { // Phaser game configuration object
  type: Phaser.WEBGL, // use WebGL rendering for better performance and effects
  parent: 'game-container', // the DOM element ID where the game canvas will be injected
  dom: { createContainer: true }, // enable DOM element creation for UI overlays
  width: 1200,
  height: 750,
  backgroundColor: '#1a1a2e', // dark background color for better contrast with game elements
  scale: {
    mode: Phaser.Scale.FIT, // scale the game to fit the available space while maintaining aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH, // center the game canvas both horizontally and vertically
  },
  scene: [MenuScene, DuelScene, EvergladesScene, PlatformerScene, InstructionScene, SettingsScene, PauseScene], // register all game scenes in the desired order
};

new Phaser.Game(config); // create a new Phaser game instance with the specified configuration

const disableContextMenuOnGameCanvas = () => { // constant function to disable right-click context menu on the game canvas
  const canvas = document.querySelector('#game-container canvas'); // select the game canvas element within the game container

  if (!canvas) {
    requestAnimationFrame(disableContextMenuOnGameCanvas);
    return;
  } // if the canvas is not yet available, wait for the next animation frame and try again

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  }); // add an event listener to the canvas to prevent the default context menu from appearing on right-click
};

disableContextMenuOnGameCanvas(); // call the function to disable the context menu as soon as the script runs, ensuring it takes effect as soon as the canvas is available
