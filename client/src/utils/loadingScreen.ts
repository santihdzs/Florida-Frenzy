import Phaser from 'phaser';

export function showLoadingScreen(scene: Phaser.Scene): void {
  const W  = scene.cameras.main.width;
  const H  = scene.cameras.main.height;
  const cx = W / 2;
  const cy = H / 2;

  const BAR_W = 320;
  const BAR_H = 18;

  const overlay = scene.add
    .rectangle(cx, cy, W, H, 0x000000, 0.88)
    .setDepth(9998)
    .setScrollFactor(0);

  const label = scene.add
    .text(cx, cy - 30, 'Loading...', {
      fontSize: '22px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif',
    })
    .setOrigin(0.5)
    .setDepth(9999)
    .setScrollFactor(0);

  const track = scene.add
    .rectangle(cx, cy + 10, BAR_W, BAR_H, 0x333333)
    .setDepth(9999)
    .setScrollFactor(0);

  // origin (0, 0.5) so the fill grows rightward from the left edge of the track
  const fill = scene.add
    .rectangle(cx - BAR_W / 2, cy + 10, 1, BAR_H, 0x00cc55)
    .setOrigin(0, 0.5)
    .setDepth(10000)
    .setScrollFactor(0);

  scene.load.on('progress', (value: number) => {
    fill.width = Math.max(1, BAR_W * value);
  });

  // Phaser fires 'complete' even when the loader list was empty (all cache hits),
  // so this cleanup always runs and the overlay never gets stranded.
  scene.load.on('complete', () => {
    overlay.destroy();
    label.destroy();
    track.destroy();
    fill.destroy();
  });
}
