import Phaser from 'phaser';
import { isLoggedIn } from './utils/auth.js';
import { MenuScene } from './scenes/MenuScene';
import { DuelScene } from './scenes/DuelScene';
import { EvergladesScene } from './scenes/EvergladesScene';
import { PlatformerScene } from './scenes/PlatformerScene';
import { SettingsScene } from './scenes/SettingsScene';
import { InstructionScene } from './scenes/InstructionScene';
import { LoginScene } from './scenes/LoginScene';
import { PauseScene } from './scenes/PauseScene';
import { TutorialScene } from './scenes/TutorialScene';
import { TutorialScene2 } from './scenes/TutorialScene2';
import { ShopScene } from './scenes/ShopScene';
import { StatsScene } from './scenes/StatsScene';
import { FriendsScene } from './scenes/FriendsScene';

// Skip the welcome screen narrative if the player is already logged in
if (isLoggedIn()) {
  document.getElementById('welcome-screen')?.remove();
}

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
  scene: [MenuScene, DuelScene, EvergladesScene, PlatformerScene, InstructionScene, SettingsScene, LoginScene, PauseScene, TutorialScene, TutorialScene2, ShopScene, StatsScene, FriendsScene],
};

const game = new Phaser.Game(config); // create a new Phaser game instance with the specified configuration
(window as any).__phaserGame = game; // expose game instance for HTML sidebar navigation

document.addEventListener('focusin', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    (window as any).__phaserGame?.input.keyboard?.enabled && ((window as any).__phaserGame.input.keyboard.enabled = false);
  }
});

document.addEventListener('focusout', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    const kb = (window as any).__phaserGame?.input?.keyboard;
    if (kb) kb.enabled = true;
  }
});

// Apply saved mute state on boot
if (localStorage.getItem('ff_muted') === 'true') {
  game.sound.mute = true;
}

// Global F key fullscreen toggle — same logic as SettingsScene so both stay in sync
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key !== 'f' && e.key !== 'F') return;
  // Don't intercept when the user is typing in an input or textarea
  if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
  if (game.scale.isFullscreen) {
    game.scale.stopFullscreen();
  } else {
    document.getElementById('game-container')?.requestFullscreen();
  }
});

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
