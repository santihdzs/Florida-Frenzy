import Phaser from 'phaser';
import titleBackground from '../assets/title-background.png';
import { getPlayer, upgradeHp } from '../utils/auth.js';

const HP_TIERS = [
  { from: 50,  to: 60,  cost: 700  },
  { from: 60,  to: 70,  cost: 1000 },
  { from: 70,  to: 80,  cost: 2500 },
  { from: 80,  to: 90,  cost: 2500 },
  { from: 90,  to: 100, cost: 3000 },
  { from: 100, to: 120, cost: 3500 },
  { from: 120, to: 140, cost: 4000 },
  { from: 140, to: 160, cost: 4500 },
  { from: 160, to: 180, cost: 5000 },
  { from: 180, to: 200, cost: 5000 },
];

const CARD_W = 500;
const CARD_H = 180;
const CARD_RADIUS = 12;
const BAR_H = 20;

interface UpgradeCardConfig {
  name: string;
  currentValue: () => number;
  maxValue: number;
  label: (current: number) => string;         // e.g. "HP: 50 / 200"
  nextLabel: (current: number) => string;      // e.g. "Next: 50 → 60"
  costLabel: (current: number) => string;      // e.g. "700 coins"
  isMaxed: (current: number) => boolean;
  onUpgrade: () => Promise<void>;
  onCoinsChanged: () => void;
}

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);
  }

  create() {
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;

    this.add.image(cx, H / 2, 'title-background');

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // Title
    this.add.text(cx, 60, 'SHOP', {
      ...baseStyle,
      fontSize: '60px',
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5);

    // Coins display — top right
    const player = getPlayer();
    console.log('ShopScene player:', player);
    let coins: number = typeof player?.totalCoins === 'number' ? player.totalCoins as number : 0;

    const coinsText = this.add.text(W - 24, 24, `Coins: ${coins}`, {
      ...baseStyle,
      fontSize: '24px',
      color: '#ffd700',
    }).setOrigin(1, 0);

    const refreshCoins = () => {
      const p = getPlayer();
      coins = typeof p?.totalCoins === 'number' ? p.totalCoins as number : coins;
      coinsText.setText(`Coins: ${coins}`);
    };

    // HP upgrade card config
    let currentHp: number = typeof player?.maxHp === 'number' ? player.maxHp as number : 50;

    const hpCardConfig: UpgradeCardConfig = {
      name: 'Health Upgrade',
      currentValue: () => currentHp,
      maxValue: 200,
      label: (v) => `HP: ${v} / 200`,
      nextLabel: (v) => {
        const t = HP_TIERS.find(x => x.from === v);
        return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL';
      },
      costLabel: (v) => {
        const t = HP_TIERS.find(x => x.from === v);
        return t ? `${t.cost} coins` : '';
      },
      isMaxed: (v) => HP_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => {
        await upgradeHp();
        const updated = getPlayer();
        currentHp = typeof updated?.maxHp === 'number' ? updated.maxHp as number : currentHp;
      },
      onCoinsChanged: refreshCoins,
    };

    // Build cards — first one starts just below the title
    let cardY = 160;
    this.createUpgradeCard(cx, cardY, hpCardConfig);

    // BACK button
    this.add.text(cx, H - 60, 'BACK', {
      ...baseStyle,
      fontSize: '40px',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#226d1b'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c2baba'); })
      .on('pointerdown', () => {
        this.time.delayedCall(100, () => { this.scene.start('MenuScene'); });
      });
  }

  private createUpgradeCard(cx: number, y: number, config: UpgradeCardConfig) {
    const PAD   = 20;
    const cardX = cx - CARD_W / 2;

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.55);
    bg.fillRoundedRect(cardX, y, CARD_W, CARD_H, CARD_RADIUS);
    bg.lineStyle(1, 0x555555, 0.8);
    bg.strokeRoundedRect(cardX, y, CARD_W, CARD_RADIUS);

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // Upgrade name
    this.add.text(cardX + PAD, y + PAD, config.name, {
      ...baseStyle,
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0, 0);

    // Current value label
    const valueText = this.add.text(cardX + PAD, y + PAD + 28, config.label(config.currentValue()), {
      ...baseStyle,
      fontSize: '18px',
    }).setOrigin(0, 0);

    // Progress bar
    const barX = cardX + PAD;
    const barY = y + PAD + 58;
    const barW = CARD_W - PAD * 2;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(barX, barY, barW, BAR_H, 4);

    const barFill = this.add.graphics();

    // Track a proxy value for tweening
    const barProxy = { ratio: config.currentValue() / config.maxValue };

    const redrawBar = () => {
      barFill.clear();
      barFill.fillStyle(0x44cc66, 1);
      barFill.fillRoundedRect(barX, barY, barW * barProxy.ratio, BAR_H, 4);
    };
    redrawBar();

    // Bottom row — next info, cost, button
    const bottomY = y + CARD_H - PAD - 28;

    const nextText = this.add.text(cardX + PAD, bottomY, config.nextLabel(config.currentValue()), {
      ...baseStyle,
      fontSize: '17px',
    }).setOrigin(0, 0.5);

    const costText = this.add.text(cx, bottomY, config.costLabel(config.currentValue()), {
      ...baseStyle,
      fontSize: '17px',
      color: '#ffd700',
    }).setOrigin(0.5, 0.5);

    // Error text (hidden initially)
    const errorText = this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1);

    // UPGRADE button
    let busy = false;
    const upgradeBtn = this.add.text(cardX + CARD_W - PAD, bottomY, 'UPGRADE', {
      ...baseStyle,
      fontSize: '22px',
      color: '#c2baba',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    upgradeBtn.on('pointerover', () => { if (!config.isMaxed(config.currentValue())) upgradeBtn.setColor('#226d1b'); });
    upgradeBtn.on('pointerout',  () => { if (!config.isMaxed(config.currentValue())) upgradeBtn.setColor('#c2baba'); });
    upgradeBtn.on('pointerdown', async () => {
      if (busy || config.isMaxed(config.currentValue())) return;
      busy = true;
      errorText.setText('');
      try {
        await config.onUpgrade();
        config.onCoinsChanged();

        const newVal = config.currentValue();
        valueText.setText(config.label(newVal));
        nextText.setText(config.nextLabel(newVal));
        costText.setText(config.costLabel(newVal));

        // Tween the bar fill
        const targetRatio = newVal / config.maxValue;
        this.tweens.add({
          targets: barProxy,
          ratio: targetRatio,
          duration: 400,
          ease: 'Sine.easeOut',
          onUpdate: redrawBar,
        });

        if (config.isMaxed(newVal)) {
          upgradeBtn.setText('MAX').setColor('#666666').disableInteractive();
          costText.setText('');
        }
      } catch (err: unknown) {
        errorText.setText(err instanceof Error ? err.message : 'Upgrade failed');
      } finally {
        busy = false;
      }
    });

    // Initial maxed state
    if (config.isMaxed(config.currentValue())) {
      upgradeBtn.setText('MAX').setColor('#666666').disableInteractive();
      costText.setText('');
      nextText.setText('MAX LEVEL');
    }
  }
}
