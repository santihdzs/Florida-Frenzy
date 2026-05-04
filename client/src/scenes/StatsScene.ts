// Santiago Hernandez - A01787550

import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import {
  isLoggedIn,
  getPlayer,
  fetchMyRuns,
  fetchGlobalLeaderboard,
  fetchFriendsLeaderboard,
  fetchMyRank,
  fetchAdminStats,
} from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.ts';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string, lang = 'en'): string {
  const locale = lang === 'es' ? 'es-MX' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function clanRank(level: number): string {
  if (level >= 13) return 'LEGEND';
  if (level >= 8)  return 'ELITE';
  if (level >= 4)  return 'VETERAN';
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

  private t: Record<string, any> = {};
  private lang = 'en';

  private tf(key: string, ...args: any[]): string {
    const val = this.t[key];
    if (typeof val === 'function') return val(...args);
    return val ?? key;
  }

  preload() {
    this.load.image('title-background', titleBackground);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;

    this.lang = this.registry.get('language') || 'en';
    this.t = translations[this.lang];

    this.add.image(cx, H / 2, 'title-background');

    const base: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // BACK button
    this.add.text(cx, H - 36, this.tf('back'), {
      ...base, fontSize: '36px', color: '#c2baba',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#226d1b'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c2baba'); })
      .on('pointerdown', () => { this.time.delayedCall(100, () => { transitionTo(this, 'MenuScene'); }); });

    if (!isLoggedIn()) {
      this.add.text(cx, H / 2, this.tf('stats_not_logged'), {
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
    const player  = getPlayer();
    const isAdmin = player?.isAdmin === true;

    // Fetch data early
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let myRuns: any[] = [];
    try { myRuns = await fetchMyRuns(); } catch { /* offline */ }

    let myRank = 0;
    try { myRank = await fetchMyRank(); } catch { /* offline */ }

    const PANEL_Y = 20;
    const PANEL_H = H - 80;

    // ── LEFT COLUMN — Top Runs / Leaderboard ───────────────────────────────

    const LEFT_X = 20;
    const LEFT_W = 420;

    const leftBg = this.add.graphics();
    leftBg.fillStyle(0x000000, 0.55);
    leftBg.fillRoundedRect(LEFT_X, PANEL_Y, LEFT_W, PANEL_H, 12);

    this.add.text(LEFT_X + LEFT_W / 2, PANEL_Y + 28, this.tf('stats_top_runs'), {
      ...base, fontSize: '26px', color: '#ffd700',
    }).setOrigin(0.5);

    const lDiv1 = this.add.graphics();
    lDiv1.lineStyle(1, 0x555555, 0.8);
    lDiv1.lineBetween(LEFT_X + 14, PANEL_Y + 52, LEFT_X + LEFT_W - 14, PANEL_Y + 52);

    // Toggle buttons
    const TOGGLE_Y  = PANEL_Y + 70;
    const modes: LeaderboardMode[] = ['mine', 'global', 'friends'];
    const modeLabels: Record<LeaderboardMode, string> = {
      mine: this.tf('stats_mine'), global: this.tf('stats_global'), friends: this.tf('stats_friends_tab'),
    };

    let activeMode: LeaderboardMode = 'mine';
    const toggleTexts = {} as Record<LeaderboardMode, Phaser.GameObjects.Text>;
    modes.forEach((m, i) => {
      const tx = LEFT_X + (i + 1) * LEFT_W / (modes.length + 1);
      toggleTexts[m] = this.add.text(tx, TOGGLE_Y, modeLabels[m], {
        ...base, fontSize: '21px',
        color: m === 'mine' ? '#ffffff' : '#505050',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    });

    const lDiv2 = this.add.graphics();
    lDiv2.lineStyle(1, 0x555555, 0.8);
    lDiv2.lineBetween(LEFT_X + 14, TOGGLE_Y + 20, LEFT_X + LEFT_W - 14, TOGGLE_Y + 20);

    const LIST_Y  = TOGGLE_Y + 34;
    const ROW_H   = 44;
    const LIST_X  = LEFT_X + 18;
    const MAX_ROWS = 5;

    const listObjs: Phaser.GameObjects.GameObject[] = [];
    const clearList = () => { listObjs.forEach(o => { o.destroy(); }); listObjs.length = 0; };
    const setToggles = (mode: LeaderboardMode) => {
      modes.forEach(m => { toggleTexts[m].setColor(m === mode ? '#ffffff' : '#505050'); });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderMine = (data: any[]) => {
      const top = [...data]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => (Number(b.xpEarned) || 0) - (Number(a.xpEarned) || 0))
        .slice(0, MAX_ROWS);

      if (top.length === 0) {
        listObjs.push(this.add.text(
          LEFT_X + LEFT_W / 2, LIST_Y + 22,
          this.tf('stats_no_runs'),
          { ...base, fontSize: '16px', color: '#888888' },
        ).setOrigin(0.5));
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      top.forEach((run: any, i: number) => {
        const y    = LIST_Y + i * ROW_H;
        const date = run.endTime ? fmtDate(String(run.endTime)) : '—';
        const row  = `#${i + 1}  Lv ${String(run.maxLevel ?? 1)}  |  XP: ${String(run.xpEarned ?? 0)}  |  Coins: ${String(run.coinsEarned ?? 0)}  |  ${date}`;
        listObjs.push(this.add.text(LIST_X, y + ROW_H / 2, row, {
          ...base, fontSize: '14px', color: '#c2baba',
        }).setOrigin(0, 0.5));
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderBoard = (data: any[], mode: LeaderboardMode) => {
      if (data.length === 0) {
        const msg = mode === 'friends' ? this.tf('stats_add_friends') : this.tf('stats_no_data');
        listObjs.push(this.add.text(
          LEFT_X + LEFT_W / 2, LIST_Y + 22, msg,
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
        const levelStr = level > 0 ? `Lv ${level}  |  ` : '';
        const row      = `#${i + 1}  ${String(p.username)}  |  ${levelStr}XP: ${String(xp)}  |  ${rank}`;
        listObjs.push(this.add.text(LIST_X, y + ROW_H / 2, row, {
          ...base, fontSize: '14px', color: '#c2baba',
        }).setOrigin(0, 0.5));
      });
    };

    // seq counter cancels stale async tab-switch fetches if the user switches again before the first resolves
    let seq = 0;
    const loadAndRenderLeaderboard = async (mode: LeaderboardMode) => {
      const mySeq = ++seq;
      clearList();
      const loadingT = this.add.text(
        LEFT_X + LEFT_W / 2, LIST_Y + 22, this.tf('stats_loading'),
        { ...base, fontSize: '16px', color: '#888888' },
      ).setOrigin(0.5);
      listObjs.push(loadingT);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any[] = [];
        if      (mode === 'mine')    data = await fetchMyRuns();
        else if (mode === 'global')  data = await fetchGlobalLeaderboard(5);
        else                          data = await fetchFriendsLeaderboard();

        if (mySeq !== seq) return;
        clearList();
        if (mode === 'mine') renderMine(data);
        else                  renderBoard(data, mode);
      } catch {
        if (mySeq !== seq) return;
        clearList();
        listObjs.push(this.add.text(
          LEFT_X + LEFT_W / 2, LIST_Y + 22, this.tf('stats_failed'),
          { ...base, fontSize: '16px', color: '#ff4444' },
        ).setOrigin(0.5));
      }
    };

    modes.forEach(m => {
      toggleTexts[m].on('pointerdown', () => {
        if (activeMode === m) return;
        activeMode = m;
        setToggles(m);
        void loadAndRenderLeaderboard(m);
      });
    });

    renderMine(myRuns);

    // ── RIGHT COLUMN — Player Stats ─────────────────────────────────────────

    const RIGHT_X = 460;
    const RIGHT_W = W - RIGHT_X - 20;

    const rightBg = this.add.graphics();
    rightBg.fillStyle(0x000000, 0.55);
    rightBg.fillRoundedRect(RIGHT_X, PANEL_Y, RIGHT_W, PANEL_H, 12);

    // Title — for admins: tab toggle; for everyone else: static title
    let activePanel: 'player' | 'admin' = 'player';
    let playerTabText: Phaser.GameObjects.Text | null = null;
    let adminTabText:  Phaser.GameObjects.Text | null = null;

    if (isAdmin) {
      const tabCx = RIGHT_X + RIGHT_W / 2;
      playerTabText = this.add.text(tabCx - 80, PANEL_Y + 28, this.tf('stats_player_stats'), {
        ...base, fontSize: '22px', color: '#ffffff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      adminTabText = this.add.text(tabCx + 80, PANEL_Y + 28, this.tf('stats_admin_stats'), {
        ...base, fontSize: '22px', color: '#505050',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    } else {
      this.add.text(RIGHT_X + RIGHT_W / 2, PANEL_Y + 28, this.tf('stats_player_stats'), {
        ...base, fontSize: '26px', color: '#ffd700',
      }).setOrigin(0.5);
    }

    const rDiv = this.add.graphics();
    rDiv.lineStyle(1, 0x555555, 0.8);
    rDiv.lineBetween(RIGHT_X + 14, PANEL_Y + 52, RIGHT_X + RIGHT_W - 14, PANEL_Y + 52);

    // ── Player Stats content ────────────────────────────────────────────────

    const STAT_ROW_H   = 44;
    const STAT_START_Y = PANEL_Y + 72;
    const LABEL_X      = RIGHT_X + 18;
    const VALUE_X      = RIGHT_X + RIGHT_W - 18;

    const maxXp    = Number(player?.maxXp ?? 0);
    // Derive bestLevel from run data — player.bestLevel/clanRank are not included in the login
    // response (only in GET /api/users/me), so the cached player object won't have them.
    const bestLevelFromRuns = myRuns.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? Math.max(...myRuns.map((r: any) => Number(r.maxLevel) || 0))
      : Number(player?.bestLevel ?? 0);
    const rank = clanRank(bestLevelFromRuns);
    const avgLevel = myRuns.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (myRuns.reduce((s: number, r: any) => s + (Number(r.maxLevel) || 1), 0) / myRuns.length).toFixed(1)
      : 'N/A';
    const joined = player?.firstLogin ? fmtDate(String(player.firstLogin), this.lang) : '—';

    const stats: Array<{ label: string; value: string; highlight?: string }> = [
      { label: this.tf('stats_total_games'),    value: String(player?.totalGamesPlayed   ?? 0) },
      { label: this.tf('stats_joined'),         value: joined },
      { label: this.tf('stats_enemies_killed'), value: String(player?.totalEnemiesKilled ?? 0) },
      { label: this.tf('stats_avg_level'),      value: String(avgLevel) },
      { label: this.tf('stats_rank'),           value: rank, highlight: rankColor(rank) },
      { label: this.tf('stats_high_score'),     value: String(maxXp) },
      { label: this.tf('stats_total_coins'),    value: String(player?.totalCoins         ?? 0) },
      { label: this.tf('stats_global_standing'), value: myRank > 0 ? `#${myRank}` : '—',
        highlight: myRank === 1 ? '#ffd700' : myRank <= 3 ? '#c0c0c0' : '#ffffff' },
    ];

    const playerObjs: Phaser.GameObjects.GameObject[] = [];

    stats.forEach(({ label, value, highlight }, i) => {
      const y = STAT_START_Y + i * STAT_ROW_H;

      const lt = this.add.text(LABEL_X, y, label, {
        ...base, fontSize: '19px', color: '#a0a0a0',
      }).setOrigin(0, 0.5);

      const vt = this.add.text(VALUE_X, y, value, {
        ...base, fontSize: '19px', color: highlight ?? '#ffffff',
      }).setOrigin(1, 0.5);

      playerObjs.push(lt, vt);

      if (i < stats.length - 1) {
        const dg = this.add.graphics();
        dg.lineStyle(1, 0x3a3a3a, 0.7);
        dg.lineBetween(LABEL_X, y + STAT_ROW_H / 2 + 2, VALUE_X, y + STAT_ROW_H / 2 + 2);
        playerObjs.push(dg);
      }
    });

    // Rank progress bar
    const RANK_BOUNDS: Record<string, { min: number; max: number; next: string | null }> = {
      ROOKIE:  { min: 0,  max: 3,  next: 'VETERAN' },
      VETERAN: { min: 4,  max: 7,  next: 'ELITE' },
      ELITE:   { min: 8,  max: 12, next: 'LEGEND' },
      LEGEND:  { min: 13, max: 13, next: null },
    };

    const bestLevel  = bestLevelFromRuns;
    const rankBounds = RANK_BOUNDS[rank] ?? RANK_BOUNDS['ROOKIE'];
    const rankProgress = rankBounds.next === null
      ? 1.0
      : Math.max(0, Math.min(1, (bestLevel - rankBounds.min) / (rankBounds.max - rankBounds.min)));

    const barBaseY = STAT_START_Y + stats.length * STAT_ROW_H + 10;

    const rankLabelLeft = this.add.text(LABEL_X, barBaseY, rank, {
      ...base, fontSize: '16px', color: rankColor(rank),
    }).setOrigin(0, 0.5);
    playerObjs.push(rankLabelLeft);

    const nextRankLabel = rankBounds.next ?? 'MAX';
    const rankLabelRight = this.add.text(VALUE_X, barBaseY, nextRankLabel, {
      ...base, fontSize: '16px',
      color: rankBounds.next ? rankColor(rankBounds.next) : '#ffd700',
    }).setOrigin(1, 0.5);
    playerObjs.push(rankLabelRight);

    const barY  = barBaseY + 16;
    const barX  = LABEL_X;
    const barW  = RIGHT_W - 36;
    const barH  = 14;
    const barGfx = this.add.graphics();

    // Track (visible background)
    barGfx.fillStyle(0x2a2a44, 1);
    barGfx.fillRoundedRect(barX, barY, barW, barH, 4);

    // Fill
    if (rankProgress > 0) {
      const fillColor = parseInt(rankColor(rank).replace('#', ''), 16);
      barGfx.fillStyle(fillColor, 1);
      barGfx.fillRoundedRect(barX, barY, Math.max(barH, Math.round(barW * rankProgress)), barH, 4);
    }
    playerObjs.push(barGfx);

    // Run history chart
    const chartStartY  = barY + barH + 18;
    const chartTitle   = this.add.text(RIGHT_X + RIGHT_W / 2, chartStartY, this.tf('stats_run_history'), {
      ...base, fontSize: '15px', color: '#888888',
    }).setOrigin(0.5);
    playerObjs.push(chartTitle);

    const chartX = RIGHT_X + 14;
    const chartY = chartStartY + 18;
    const chartW = RIGHT_W - 28;
    const chartH = PANEL_Y + PANEL_H - chartY - 14; // fill remaining space

    const chartBg = this.add.graphics();
    chartBg.fillStyle(0x0d0d1a, 0.9);
    chartBg.fillRoundedRect(chartX, chartY, chartW, chartH, 6);
    playerObjs.push(chartBg);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartRuns = [...myRuns]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.runStatus === 'COMPLETED')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => new Date(a.endTime || a.startTime).getTime() - new Date(b.endTime || b.startTime).getTime())
      .slice(-10);

    if (chartRuns.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xpValues    = chartRuns.map((r: any) => Number(r.xpEarned) || 0);
      const maxXpVal    = Math.max(...xpValues, 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const levelValues = chartRuns.map((r: any) => Number(r.maxLevel) || 0);
      const maxLevelVal = Math.max(...levelValues, 1);
      const count    = chartRuns.length;
      const padLeft  = 36; // room for Y-axis labels
      const padRight = 10;
      const padTop   = 18; // room for max label
      const padBot   = 8;  // small margin below axis line
      const innerW   = chartW - padLeft - padRight;
      const innerH   = chartH - padTop - padBot;
      const gap      = 4;
      const barWidth = (innerW - gap * (count - 1)) / count;
      const axisX    = chartX + padLeft;
      const axisY    = chartY + padTop + innerH;

      const chartGfx = this.add.graphics();
      xpValues.forEach((xp, i) => {
        if (xp <= 0) return;
        const bh = Math.max(2, (xp / maxXpVal) * innerH);
        const bx = axisX + i * (barWidth + gap);
        const by = axisY - bh;
        const t  = xp / maxXpVal;
        const cr = Math.round(0x99 + t * (0xff - 0x99));
        const cg = Math.round(0x66 + t * (0xd7 - 0x66));
        const color = (cr << 16) | (cg << 8) | 0x00;
        chartGfx.fillStyle(color, 1);
        chartGfx.fillRoundedRect(bx, by, barWidth, bh, 2);
      });

      // X axis line
      chartGfx.lineStyle(1, 0x444444, 1);
      chartGfx.lineBetween(axisX, axisY, axisX + innerW, axisY);
      // Y axis line
      chartGfx.lineBetween(axisX, chartY + padTop, axisX, axisY);
      playerObjs.push(chartGfx);

      // Y labels (level numbers)
      const maxLabel = this.add.text(axisX - 4, chartY + padTop, String(maxLevelVal), {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#888888',
      }).setOrigin(1, 0.5);
      playerObjs.push(maxLabel);

      const zeroLabel = this.add.text(axisX - 4, axisY, '0', {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#888888',
      }).setOrigin(1, 0.5);
      playerObjs.push(zeroLabel);
    } else {
      const noDataText = this.add.text(
        chartX + chartW / 2, chartY + chartH / 2,
        this.tf('stats_no_completed'),
        { ...base, fontSize: '15px', color: '#555555' },
      ).setOrigin(0.5);
      playerObjs.push(noDataText);
    }

    // ── Admin Stats content ─────────────────────────────────────────────────

    const adminObjs: Phaser.GameObjects.GameObject[] = [];
    let adminLoaded = false;

    const renderAdminStats = (data: {
      totalPlayers: number;
      totalRuns: number;
      avgLevel: number;
      activeSessions: number;
      onlinePlayers?: number;
      levelDistribution: { level: number; count: number }[];
    }) => {
      const adminStats = [
        { label: this.tf('stats_reg_players'),       value: String(data.totalPlayers) },
        { label: this.tf('stats_online'),            value: String(data.onlinePlayers ?? 0) },
        { label: this.tf('stats_total_runs'),        value: String(data.totalRuns) },
        { label: this.tf('stats_avg_level_reached'), value: String(data.avgLevel) },
        { label: this.tf('stats_active_sessions'),   value: String(data.activeSessions) },
      ];

      adminStats.forEach(({ label, value }, i) => {
        const y = STAT_START_Y + i * STAT_ROW_H;
        const lt = this.add.text(LABEL_X, y, label, { ...base, fontSize: '19px', color: '#a0a0a0' }).setOrigin(0, 0.5);
        const vt = this.add.text(VALUE_X, y, value, { ...base, fontSize: '19px', color: '#ffffff' }).setOrigin(1, 0.5);
        adminObjs.push(lt, vt);

        if (i < adminStats.length - 1) {
          const dg = this.add.graphics();
          dg.lineStyle(1, 0x3a3a3a, 0.7);
          dg.lineBetween(LABEL_X, y + STAT_ROW_H / 2 + 2, VALUE_X, y + STAT_ROW_H / 2 + 2);
          adminObjs.push(dg);
        }
      });

      // Level distribution histogram
      const histStartY = STAT_START_Y + adminStats.length * STAT_ROW_H + 18;
      const histTitle  = this.add.text(RIGHT_X + RIGHT_W / 2, histStartY, this.tf('stats_level_dist'), {
        ...base, fontSize: '15px', color: '#888888',
      }).setOrigin(0.5);
      adminObjs.push(histTitle);

      const histX = RIGHT_X + 14;
      const histY = histStartY + 18;
      const histW = RIGHT_W - 28;
      const histH = PANEL_Y + PANEL_H - histY - 14;

      const histBg = this.add.graphics();
      histBg.fillStyle(0x0d0d1a, 0.9);
      histBg.fillRoundedRect(histX, histY, histW, histH, 6);
      adminObjs.push(histBg);

      const dist = data.levelDistribution;
      if (dist.length > 0) {
        const maxCount  = Math.max(...dist.map(d => d.count), 1);
        const maxLevel  = Math.max(...dist.map(d => d.level), 1);
        const padX      = 12;
        const padBot    = 20;
        const innerW    = histW - padX * 2;
        const innerH    = histH - padBot - 6;
        const slots     = Math.min(maxLevel, 20);
        const gap       = 3;
        const bw        = (innerW - gap * (slots - 1)) / slots;

        const histGfx = this.add.graphics();
        for (let lvl = 1; lvl <= slots; lvl++) {
          const entry = dist.find(d => d.level === lvl);
          const count = entry ? entry.count : 0;
          if (count <= 0) continue;

          const bh    = Math.max(2, (count / maxCount) * innerH);
          const bx    = histX + padX + (lvl - 1) * (bw + gap);
          const by    = histY + histH - padBot - bh;
          const t     = lvl / slots;
          const color = t < 0.35 ? 0x00cc44 : t < 0.65 ? 0xffd700 : 0xff8c00;
          histGfx.fillStyle(color, 1);
          histGfx.fillRoundedRect(bx, by, bw, bh, 2);
        }
        // Axis line
        histGfx.lineStyle(1, 0x444444, 1);
        histGfx.lineBetween(histX + padX, histY + histH - padBot, histX + histW - padX, histY + histH - padBot);
        adminObjs.push(histGfx);

        // Level number labels under bars (every 5 levels to avoid overlap)
        for (let lvl = 1; lvl <= slots; lvl++) {
          if (lvl === 1 || lvl % 5 === 0 || lvl === slots) {
            const lx = histX + padX + (lvl - 1) * (bw + gap) + bw / 2;
            const ly = histY + histH - padBot + 4;
            const lt = this.add.text(lx, ly, String(lvl), {
              fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#555555',
            }).setOrigin(0.5, 0);
            adminObjs.push(lt);
          }
        }

        // Max count label
        const maxLabel = this.add.text(histX + padX + 2, histY + 6, String(maxCount), {
          fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#555555',
        });
        adminObjs.push(maxLabel);
      } else {
        const noData = this.add.text(
          histX + histW / 2, histY + histH / 2,
          this.tf('stats_no_completed_db'),
          { ...base, fontSize: '15px', color: '#555555' },
        ).setOrigin(0.5);
        adminObjs.push(noData);
      }

      adminObjs.forEach(o => (o as Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void }).setVisible(false));
    };

    const loadAdminStats = async () => {
      if (adminLoaded) return;
      adminLoaded = true;
      const data = await fetchAdminStats();
      if (data) {
        renderAdminStats(data);
        // If admin tab is still active, show them
        if (activePanel === 'admin') {
          adminObjs.forEach(o => (o as any).setVisible(true));
        }
      } else {
        const errText = this.add.text(RIGHT_X + RIGHT_W / 2, STAT_START_Y + 40, this.tf('stats_admin_fail'), {
          ...base, fontSize: '16px', color: '#ff4444',
        }).setOrigin(0.5);
        adminObjs.push(errText);
        errText.setVisible(activePanel === 'admin');
      }
    };

    // ── Admin tab wiring ────────────────────────────────────────────────────

    if (isAdmin && playerTabText && adminTabText) {
      const showPlayerPanel = () => {
        activePanel = 'player';
        playerTabText!.setColor('#ffffff');
        adminTabText!.setColor('#505050');
        playerObjs.forEach(o => (o as any).setVisible(true));
        adminObjs.forEach(o => (o as any).setVisible(false));
      };

      const showAdminPanel = () => {
        activePanel = 'admin';
        playerTabText!.setColor('#505050');
        adminTabText!.setColor('#ffffff');
        playerObjs.forEach(o => (o as any).setVisible(false));
        if (!adminLoaded) {
          void loadAdminStats();
        } else {
          adminObjs.forEach(o => (o as any).setVisible(true));
        }
      };

      playerTabText.on('pointerdown', showPlayerPanel);
      adminTabText.on('pointerdown', showAdminPanel);
    }
  }
}
