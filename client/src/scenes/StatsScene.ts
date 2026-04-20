import Phaser from 'phaser';
import titleBackground from '../assets/title-background.png';
import {
  isLoggedIn,
  getPlayer,
  fetchMyRuns,
  fetchGlobalLeaderboard,
  fetchFriendsLeaderboard,
} from '../utils/auth.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function clanRank(level: number): string {
  if (level >= 15) return 'LEGEND';
  if (level >= 10) return 'ELITE';
  if (level >= 5)  return 'VETERAN';
  return 'ROOKIE';
}

function rankColor(rank: string): string {
  switch (rank) {
    case 'LEGEND':  return '#ff8c00';
    case 'ELITE':   return '#a855f7';
    case 'VETERAN': return '#3b82f6';
    default:        return '#6b7280';
  }
}

type LeaderboardMode = 'mine' | 'global' | 'friends';

// ── Scene ──────────────────────────────────────────────────────────────────

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

    const base: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // BACK button
    this.add.text(cx, H - 36, 'BACK', {
      ...base, fontSize: '36px', color: '#c2baba',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#226d1b'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c2baba'); })
      .on('pointerdown', () => { this.time.delayedCall(100, () => { this.scene.start('MenuScene'); }); });

    if (!isLoggedIn()) {
      this.add.text(cx, H / 2, 'Log in to view your stats', {
        ...base, fontSize: '28px', color: '#888888',
      }).setOrigin(0.5);
      return;
    }

    void this.buildLayout(W, H, base);
  }

  private async buildLayout(
    W: number,
    H: number,
    base: Phaser.Types.GameObjects.Text.TextStyle,
  ): Promise<void> {
    const player = getPlayer();

    // Fetch runs early so avg level can be computed for the stats column
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let myRuns: any[] = [];
    try { myRuns = await fetchMyRuns(); } catch { /* offline */ }

    const PANEL_Y = 20;
    const PANEL_H = H - 80;

    // ── LEFT COLUMN — Player Stats ──────────────────────────────────────────

    const LEFT_X = 50;
    const LEFT_W = 420;

    const leftBg = this.add.graphics();
    leftBg.fillStyle(0x000000, 0.55);
    leftBg.fillRoundedRect(LEFT_X, PANEL_Y, LEFT_W, PANEL_H, 12);

    const isAdmin = player?.isAdmin === true;
    this.add.text(LEFT_X + LEFT_W / 2, PANEL_Y + 28, `Player Stats${isAdmin ? '  (Admin)' : ''}`, {
      ...base, fontSize: '26px', color: '#ffd700',
    }).setOrigin(0.5);

    // Thin divider under title
    const lDiv = this.add.graphics();
    lDiv.lineStyle(1, 0x555555, 0.8);
    lDiv.lineBetween(LEFT_X + 14, PANEL_Y + 52, LEFT_X + LEFT_W - 14, PANEL_Y + 52);

    const STAT_START_Y = PANEL_Y + 72;
    const STAT_ROW_H   = 44;
    const LABEL_X      = LEFT_X + 18;
    const VALUE_X      = LEFT_X + LEFT_W - 18;

    const maxXp  = Number(player?.maxXp ?? 0);
    const rank   = String(player?.clanRank ?? clanRank(Number(player?.bestLevel ?? 0)));

    const avgLevel = myRuns.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (myRuns.reduce((s: number, r: any) => s + (Number(r.maxLevel) || 1), 0) / myRuns.length).toFixed(1)
      : 'N/A';

    const joined = player?.firstLogin
      ? fmtDate(String(player.firstLogin))
      : '—';

    const stats: Array<{ label: string; value: string; highlight?: string }> = [
      { label: 'Total Games',    value: String(player?.totalGamesPlayed   ?? 0) },
      { label: 'Joined',         value: joined },
      { label: 'Enemies Killed', value: String(player?.totalEnemiesKilled ?? 0) },
      { label: 'Average Level',  value: String(avgLevel) },
      { label: 'Rank',           value: rank, highlight: rankColor(rank) },
      { label: 'Best XP',        value: String(maxXp) },
      { label: 'Total Coins',    value: String(player?.totalCoins         ?? 0) },
    ];

    stats.forEach(({ label, value, highlight }, i) => {
      const y = STAT_START_Y + i * STAT_ROW_H;

      this.add.text(LABEL_X, y, label, {
        ...base, fontSize: '19px', color: '#a0a0a0',
      }).setOrigin(0, 0.5);

      this.add.text(VALUE_X, y, value, {
        ...base, fontSize: '19px', color: highlight ?? '#ffffff',
      }).setOrigin(1, 0.5);

      // Divider between rows (not after the last)
      if (i < stats.length - 1) {
        const dg = this.add.graphics();
        dg.lineStyle(1, 0x3a3a3a, 0.7);
        dg.lineBetween(LABEL_X, y + STAT_ROW_H / 2 + 2, VALUE_X, y + STAT_ROW_H / 2 + 2);
      }
    });

    // ── RIGHT COLUMN — Leaderboard ──────────────────────────────────────────

    const RIGHT_X = 490;
    const RIGHT_W = W - RIGHT_X - 20;

    const rightBg = this.add.graphics();
    rightBg.fillStyle(0x000000, 0.55);
    rightBg.fillRoundedRect(RIGHT_X, PANEL_Y, RIGHT_W, PANEL_H, 12);

    this.add.text(RIGHT_X + RIGHT_W / 2, PANEL_Y + 28, 'Top Runs', {
      ...base, fontSize: '26px', color: '#ffd700',
    }).setOrigin(0.5);

    // Thin divider under title
    const rDiv1 = this.add.graphics();
    rDiv1.lineStyle(1, 0x555555, 0.8);
    rDiv1.lineBetween(RIGHT_X + 14, PANEL_Y + 52, RIGHT_X + RIGHT_W - 14, PANEL_Y + 52);

    // ── Toggle buttons ──────────────────────────────────────────────────────

    const TOGGLE_Y = PANEL_Y + 70;
    const modes: LeaderboardMode[] = ['mine', 'global', 'friends'];
    const modeLabels: Record<LeaderboardMode, string> = {
      mine: 'Mine', global: 'Global', friends: 'Friends',
    };

    let activeMode: LeaderboardMode = 'mine';

    const toggleTexts = {} as Record<LeaderboardMode, Phaser.GameObjects.Text>;
    modes.forEach((m, i) => {
      const tx = RIGHT_X + (i + 1) * RIGHT_W / (modes.length + 1);
      toggleTexts[m] = this.add.text(tx, TOGGLE_Y, modeLabels[m], {
        ...base, fontSize: '21px',
        color: m === 'mine' ? '#ffffff' : '#505050',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    });

    const rDiv2 = this.add.graphics();
    rDiv2.lineStyle(1, 0x555555, 0.8);
    rDiv2.lineBetween(RIGHT_X + 14, TOGGLE_Y + 20, RIGHT_X + RIGHT_W - 14, TOGGLE_Y + 20);

    // ── List area ───────────────────────────────────────────────────────────

    const LIST_Y  = TOGGLE_Y + 34;
    const ROW_H   = 44;
    const LIST_X  = RIGHT_X + 18;
    const MAX_ROWS = 5;

    const listObjs: Phaser.GameObjects.GameObject[] = [];

    const clearList = () => {
      listObjs.forEach(o => { o.destroy(); });
      listObjs.length = 0;
    };

    const setToggles = (mode: LeaderboardMode) => {
      modes.forEach(m => {
        toggleTexts[m].setColor(m === mode ? '#ffffff' : '#505050');
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderMine = (data: any[]) => {
      const top = [...data]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => (Number(b.xpEarned) || 0) - (Number(a.xpEarned) || 0))
        .slice(0, MAX_ROWS);

      if (top.length === 0) {
        listObjs.push(this.add.text(
          RIGHT_X + RIGHT_W / 2, LIST_Y + 22,
          'No runs yet — start playing!',
          { ...base, fontSize: '16px', color: '#888888' },
        ).setOrigin(0.5));
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      top.forEach((run: any, i: number) => {
        const y    = LIST_Y + i * ROW_H;
        const date = run.endTime ? fmtDate(String(run.endTime)) : '—';
        const row  = `#${i + 1}  Level ${String(run.maxLevel ?? 1)}  |  XP: ${String(run.xpEarned ?? 0)}  |  Coins: ${String(run.coinsEarned ?? 0)}  |  ${date}`;
        listObjs.push(this.add.text(LIST_X, y + ROW_H / 2, row, {
          ...base, fontSize: '15px', color: '#c2baba',
        }).setOrigin(0, 0.5));
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderBoard = (data: any[], mode: LeaderboardMode) => {
      if (data.length === 0) {
        const msg = mode === 'friends' ? 'Add friends to compare!' : 'No data available';
        listObjs.push(this.add.text(
          RIGHT_X + RIGHT_W / 2, LIST_Y + 22, msg,
          { ...base, fontSize: '16px', color: '#888888' },
        ).setOrigin(0.5));
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.slice(0, MAX_ROWS).forEach((p: any, i: number) => {
        const y        = LIST_Y + i * ROW_H;
        const xp       = Number(p.maxXp ?? 0);
        const level    = Number(p.bestLevel ?? 0);
        const rank     = String(p.clanRank ?? clanRank(level));
        const levelStr = level > 0 ? `Level ${level}  |  ` : '';
        const row      = `#${i + 1}  ${String(p.username)}  |  ${levelStr}XP: ${String(xp)}  |  Rank: ${rank}`;
        listObjs.push(this.add.text(LIST_X, y + ROW_H / 2, row, {
          ...base, fontSize: '15px', color: '#c2baba',
        }).setOrigin(0, 0.5));
      });
    };

    // Stale-request guard: if the user clicks a different toggle while
    // a fetch is in flight, the older callback does nothing when it resolves.
    let seq = 0;

    const loadAndRender = async (mode: LeaderboardMode) => {
      const mySeq = ++seq;
      clearList();

      const loadingT = this.add.text(
        RIGHT_X + RIGHT_W / 2, LIST_Y + 22, 'Loading…',
        { ...base, fontSize: '16px', color: '#888888' },
      ).setOrigin(0.5);
      listObjs.push(loadingT);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any[] = [];
        if      (mode === 'mine')    data = await fetchMyRuns();
        else if (mode === 'global')  data = await fetchGlobalLeaderboard(5);
        else                          data = await fetchFriendsLeaderboard();

        if (mySeq !== seq) return; // superseded by a later click

        clearList();
        if (mode === 'mine') renderMine(data);
        else                  renderBoard(data, mode);
      } catch {
        if (mySeq !== seq) return;
        clearList();
        listObjs.push(this.add.text(
          RIGHT_X + RIGHT_W / 2, LIST_Y + 22, 'Failed to load',
          { ...base, fontSize: '16px', color: '#ff4444' },
        ).setOrigin(0.5));
      }
    };

    // Wire up toggle clicks
    modes.forEach(m => {
      toggleTexts[m].on('pointerdown', () => {
        if (activeMode === m) return;
        activeMode = m;
        setToggles(m);
        void loadAndRender(m);
      });
    });

    // Initial render with 'mine' (data already in hand)
    renderMine(myRuns);
  }
}
