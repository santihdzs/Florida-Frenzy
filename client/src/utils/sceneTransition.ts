import Phaser from 'phaser';

export function transitionTo(scene: Phaser.Scene, key: string, data?: object): void {
  if ((scene as any).__transitioning) return;
  (scene as any).__transitioning = true;
  scene.cameras.main.fadeOut(300, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    (scene as any).__transitioning = false;
    scene.scene.start(key, data);
  });
}
