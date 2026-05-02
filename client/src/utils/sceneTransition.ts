import Phaser from 'phaser';

export function transitionTo(scene: Phaser.Scene, key: string, data?: object): void {
  if ((scene as any).__transitioning) {
    console.warn(`[transitionTo] Already transitioning, ignoring request to ${key}`);
    return;
  }
  (scene as any).__transitioning = true;
  console.log(`[transitionTo] Starting transition to ${key}`);
  
  if (!scene.cameras.main) {
    console.error(`[transitionTo] scene.cameras.main is null/undefined!`);
    (scene as any).__transitioning = false;
    return;
  }
  
  scene.cameras.main.fadeOut(300, 0, 0, 0);
  const fadeListener = () => {
    console.log(`[transitionTo] camerafadeoutcomplete fired for ${key}`);
    (scene as any).__transitioning = false;
    scene.scene.start(key, data);
  };
  
  scene.cameras.main.once('camerafadeoutcomplete', fadeListener);
  console.log(`[transitionTo] Listener registered for camerafadeoutcomplete -> ${key}`);
}
