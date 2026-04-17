import Phaser from 'phaser';
import titleBackground from '../assets/title-background.png';
import { isLoggedIn, getPlayer, fetchMyRuns } from '../utils/auth.js';

export class StatsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatsScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);
  }

  create() {
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;

    this.add.image(cx, H / 2, 'title-background');

    const player  = getPlayer();
    const isAdmin = player?.isAdmin === true;

    this.add.text(cx, 50, `YOUR BEST RUNS${isAdmin ? '  (Admin)' : ''}`, {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '42px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5);

    if (player) {
      this.add.text(cx, 100, String(player.username), {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '18px',
        color: isAdmin ? '#ffd700' : '#888888',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5);
    }

    if (!isLoggedIn()) {
      this.add.text(cx, H / 2, 'Log in to view your stats', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '28px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      return;
    }

    const loadingText = this.add.text(cx, H / 2, 'Loading…', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '24px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);

    void this.loadAndRender(cx, H, loadingText);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async loadAndRender(cx: number, H: number, loadingText: Phaser.GameObjects.Text): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let runs: any[] = [];
    try { runs = await fetchMyRuns(); } catch { /* offline */ }

    if (loadingText.active) loadingText.destroy();

    if (runs.length === 0) {
      this.add.text(cx, H / 2, 'No runs yet — start playing!', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '26px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const top5 = [...runs]
      .sort((a: any, b: any) => (((b.xpEarned as number) ?? 0) - ((a.xpEarned as number) ?? 0)))
      .slice(0, 5);

    const hdrStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 1,
    };
    const rowStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '18px',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 1,
    };

    const tableX = cx - 320;
    const cols   = [tableX, tableX + 60, tableX + 200, tableX + 370, tableX + 500];
    const hdrs   = ['#', 'LEVEL', 'XP EARNED', 'COINS', 'DATE'];
    const headY  = 160;

    hdrs.forEach((h, i) => this.add.text(cols[i], headY, h, hdrStyle).setOrigin(0, 0.5));

    const divG = this.add.graphics();
    divG.lineStyle(1, 0x555555, 0.8);
    divG.lineBetween(tableX - 10, headY + 16, cx + 330, headY + 16);

    top5.forEach((run: any, i: number) => {
      const rowY   = headY + 38 + i * 48;
      const level  = String(run.maxLevel   ?? 1);
      const xp     = String(run.xpEarned   ?? 0);
      const coins  = String(run.coinsEarned ?? 0);
      const date   = run.endTime
        ? new Date(run.endTime as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';
      [String(i + 1), level, xp, coins, date].forEach((v, j) => {
        this.add.text(cols[j], rowY, v, rowStyle).setOrigin(0, 0.5);
      });
    });
  }
}
