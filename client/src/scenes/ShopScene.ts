// Santiago Hernandez - A01787550
// AI was used for to populate vals for tiered upgrades 

import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import { getPlayer, upgradeHp, upgradeGunDamage, upgradeFireRate, upgradeReloadTime, upgradeNoReload, upgradeMagSize, upgradeStaminaPool, upgradeStaminaRegen } from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.ts';

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

const DAMAGE_TIERS = [
  { from: 10, to: 15, cost: 1000 },
  { from: 15, to: 20, cost: 2000 },
  { from: 20, to: 30, cost: 3000 },
  { from: 30, to: 50, cost: 4000 },
];

const FIRE_RATE_TIERS = [
  { from: 1, to: 2, cost: 1000 },
  { from: 2, to: 3, cost: 2000 },
  { from: 3, to: 4, cost: 3000 },
  { from: 4, to: 5, cost: 4000 },
];

const RELOAD_TIERS = [
  { from: 1, to: 2, cost: 1000 },
  { from: 2, to: 3, cost: 2000 },
  { from: 3, to: 4, cost: 3000 },
  { from: 4, to: 5, cost: 4000 },
];

const MAG_SIZE_TIERS = [
  { from: 10, to: 15, cost: 1000 },
  { from: 15, to: 20, cost: 2000 },
  { from: 20, to: 25, cost: 3000 },
  { from: 25, to: 30, cost: 4000 },
];

const STAMINA_POOL_TIERS = [
  { from: 1, to: 2, cost: 1000 },
  { from: 2, to: 3, cost: 2000 },
  { from: 3, to: 4, cost: 3000 },
  { from: 4, to: 5, cost: 4000 },
];

const STAMINA_REGEN_TIERS = [
  { from: 1, to: 2, cost: 1000 },
  { from: 2, to: 3, cost: 2000 },
  { from: 3, to: 4, cost: 3000 },
  { from: 4, to: 5, cost: 4000 },
];

const CARD_W      = 500;
const CARD_H      = 180;
const CARD_RADIUS = 12;
const CARD_GAP    = 12;
const BAR_H       = 20;

interface UpgradeCardConfig {
  name: string;
  currentValue: () => number;
  maxValue: number;
  label: (current: number) => string;
  nextLabel: (current: number) => string;
  costLabel: (current: number) => string;
  isMaxed: (current: number) => boolean;
  onUpgrade: () => Promise<void>;
  onCoinsChanged: () => void;
}

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  // Translation table loaded in create(), used by tf()
  private t: Record<string, any> = {};
 
  // Helper: resolves both plain strings and interpolation functions
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

    // Load translations for the active language
    const langKey = this.registry.get('language') || 'en';
    this.t = translations[langKey];

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // Fixed background + title + coins (scrollFactor 0 = stays on screen regardless of camera)
    this.add.image(cx, H / 2, 'title-background').setScrollFactor(0);

    this.add.text(cx, 32, this.tf('shop'), {
      ...baseStyle,
      fontSize: '52px',
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    const player = getPlayer();
    let coins: number = typeof player?.totalCoins === 'number' ? player.totalCoins as number : 0;

    const coinsText = this.add.text(W - 24, 10, this.tf('shop_coins_display', coins), {
      ...baseStyle,
      fontSize: '22px',
      color: '#ffd700',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    const refreshCoins = () => {
      const p = getPlayer();
      coins = typeof p?.totalCoins === 'number' ? p.totalCoins as number : coins;
      coinsText.setText(this.tf('shop_coins_display', coins));
    };

    // BACK button — fixed
    this.add.text(cx, H - 36, this.tf('back'), {
      ...baseStyle,
      fontSize: '36px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#226d1b'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c2baba'); })
      .on('pointerdown', () => {
        this.time.delayedCall(100, () => { transitionTo(this, 'MenuScene'); });
      });

    // ── Cards (scrollable world objects) ──
    let cardY = 90;

    // HP
    let currentHp = typeof player?.maxHp === 'number' ? player.maxHp as number : 50;
    this.createUpgradeCard(cx, cardY, {
      name: this.tf('shop_hp'),
      currentValue: () => currentHp,
      maxValue: 200,
      label: (v) => this.tf('shop_label_hp', v),
      nextLabel: (v) => { const t = HP_TIERS.find(x => x.from === v); return t ? this.tf('shop_next', t.from, t.to) : this.tf('shop_max_level'); },
      costLabel: (v) => { const t = HP_TIERS.find(x => x.from === v); return t ? this.tf('shop_coins_cost', t.cost) : ''; },
      isMaxed: (v) => HP_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeHp(); const u = getPlayer(); currentHp = typeof u?.maxHp === 'number' ? u.maxHp as number : currentHp; },
      onCoinsChanged: refreshCoins,
    });
    cardY += CARD_H + CARD_GAP;

    // Bullet Damage
    let currentDmg = typeof player?.bulletDamage === 'number' ? player.bulletDamage as number : 10;
    this.createUpgradeCard(cx, cardY, {
      name: this.tf('shop_dmg'),
      currentValue: () => currentDmg,
      maxValue: 50,
      label: (v) => `DMG: ${v} / 50`,
      nextLabel: (v) => { const t = DAMAGE_TIERS.find(x => x.from === v); return t ? this.tf('shop_next', t.from, t.to) : this.tf('shop_max_level'); },
      costLabel: (v) => { const t = DAMAGE_TIERS.find(x => x.from === v); return t ? this.tf('shop_coins_cost', t.cost) : ''; },
      isMaxed: (v) => DAMAGE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeGunDamage(); const u = getPlayer(); currentDmg = typeof u?.bulletDamage === 'number' ? u.bulletDamage as number : currentDmg; },
      onCoinsChanged: refreshCoins,
    });
    cardY += CARD_H + CARD_GAP;

    // Fire Rate
    let currentRate = typeof player?.fireRate === 'number' ? player.fireRate as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: this.tf('shop_fire_rate'),
      currentValue: () => currentRate,
      maxValue: 5,
      label: (v) => this.tf('shop_label_rate', v),
      nextLabel: (v) => { const t = FIRE_RATE_TIERS.find(x => x.from === v); return t ? this.tf('shop_next', t.from, t.to) : this.tf('shop_max_level'); },
      costLabel: (v) => { const t = FIRE_RATE_TIERS.find(x => x.from === v); return t ? this.tf('shop_coins_cost', t.cost) : ''; },
      isMaxed: (v) => FIRE_RATE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeFireRate(); const u = getPlayer(); currentRate = typeof u?.fireRate === 'number' ? u.fireRate as number : currentRate; },
      onCoinsChanged: refreshCoins,
    });
    cardY += CARD_H + CARD_GAP;

    // Reload Speed
    let currentReload = typeof player?.reloadTime === 'number' ? player.reloadTime as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: this.tf('shop_reload'),
      currentValue: () => currentReload,
      maxValue: 5,
      label: (v) => this.tf('shop_label_speed', v),
      nextLabel: (v) => { const t = RELOAD_TIERS.find(x => x.from === v); return t ? this.tf('shop_next', t.from, t.to) : this.tf('shop_max_level'); },
      costLabel: (v) => { const t = RELOAD_TIERS.find(x => x.from === v); return t ? this.tf('shop_coins_cost', t.cost) : ''; },
      isMaxed: (v) => RELOAD_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeReloadTime(); const u = getPlayer(); currentReload = typeof u?.reloadTime === 'number' ? u.reloadTime as number : currentReload; },
      onCoinsChanged: refreshCoins,
    });
    cardY += CARD_H + CARD_GAP;

    // No Reload (special card)
    this.createNoReloadCard(cx, cardY, player, refreshCoins);
    cardY += CARD_H + CARD_GAP;

    // Magazine Size
    let currentMag = typeof player?.magSize === 'number' ? player.magSize as number : 10;
    this.createUpgradeCard(cx, cardY, {
      name: this.tf('shop_magazine_size'),
      currentValue: () => currentMag,
      maxValue: 30,
      label: (v) => this.tf('shop_label_ammo', v),
      nextLabel: (v) => { const t = MAG_SIZE_TIERS.find(x => x.from === v); return t ? this.tf('shop_next', t.from, t.to) : this.tf('shop_max_level'); },
      costLabel: (v) => { const t = MAG_SIZE_TIERS.find(x => x.from === v); return t ? this.tf('shop_coins_cost', t.cost) : ''; },
      isMaxed: (v) => MAG_SIZE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeMagSize(); const u = getPlayer(); currentMag = typeof u?.magSize === 'number' ? u.magSize as number : currentMag; },
      onCoinsChanged: refreshCoins,
    });
    cardY += CARD_H + CARD_GAP;

    // Endurance (Stamina Pool)
    let currentStaminaPool = typeof player?.staminaPool === 'number' ? player.staminaPool as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: this.tf('shop_endurance'),
      currentValue: () => currentStaminaPool,
      maxValue: 5,
      label: (v) => this.tf('shop_label_level', v),
      nextLabel: (v) => { const t = STAMINA_POOL_TIERS.find(x => x.from === v); return t ? this.tf('shop_next', t.from, t.to) : this.tf('shop_max_level'); },
      costLabel: (v) => { const t = STAMINA_POOL_TIERS.find(x => x.from === v); return t ? this.tf('shop_coins_cost', t.cost) : ''; },
      isMaxed: (v) => STAMINA_POOL_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeStaminaPool(); const u = getPlayer(); currentStaminaPool = typeof u?.staminaPool === 'number' ? u.staminaPool as number : currentStaminaPool; },
      onCoinsChanged: refreshCoins,
    });
    cardY += CARD_H + CARD_GAP;

    // Recovery (Stamina Regen)
    let currentStaminaRegen = typeof player?.staminaRegen === 'number' ? player.staminaRegen as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: this.tf('shop_recovery'),
      currentValue: () => currentStaminaRegen,
      maxValue: 5,
      label: (v) => this.tf('shop_label_level', v),
      nextLabel: (v) => { const t = STAMINA_REGEN_TIERS.find(x => x.from === v); return t ? this.tf('shop_next', t.from, t.to) : this.tf('shop_max_level'); },
      costLabel: (v) => { const t = STAMINA_REGEN_TIERS.find(x => x.from === v); return t ? this.tf('shop_coins_cost', t.cost) : ''; },
      isMaxed: (v) => STAMINA_REGEN_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeStaminaRegen(); const u = getPlayer(); currentStaminaRegen = typeof u?.staminaRegen === 'number' ? u.staminaRegen as number : currentStaminaRegen; },
      onCoinsChanged: refreshCoins,
    });
    cardY += CARD_H + CARD_GAP;

    // Set camera scroll bounds so cards are scrollable
    const contentHeight = cardY + 20;
    if (contentHeight > H) {
      this.cameras.main.setBounds(0, 0, W, contentHeight);
      this.input.on('wheel', (_ptr: unknown, _objs: unknown[], _dx: number, deltaY: number) => {
        this.cameras.main.scrollY = Phaser.Math.Clamp(
          this.cameras.main.scrollY + deltaY * 0.5,
          0,
          contentHeight - H
        );
      });

      // Scroll hint
      this.add.text(cx, H - 16, this.tf('shop_scroll_hint'), {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '14px',
        color: '#888888',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
    }
  }

  private createNoReloadCard(cx: number, y: number, player: Record<string, unknown> | null, refreshCoins: () => void) {
    const PAD   = 20;
    const cardX = cx - CARD_W / 2;

    const reloadTime  = typeof player?.reloadTime  === 'number'  ? player.reloadTime  as number  : 1;
    const hasNoReload = typeof player?.hasNoReload  === 'boolean' ? player.hasNoReload as boolean : false;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.55);
    bg.fillRoundedRect(cardX, y, CARD_W, CARD_H, CARD_RADIUS);
    bg.lineStyle(1, 0x555555, 0.8);
    bg.strokeRoundedRect(cardX, y, CARD_W, CARD_H, CARD_RADIUS);

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    this.add.text(cardX + PAD, y + PAD, this.tf('shop_no_reload'), {
      ...baseStyle,
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0, 0);

    if (hasNoReload) {
      this.add.text(cx, y + CARD_H / 2 + 10, this.tf('shop_unlocked'), {
        ...baseStyle,
        fontSize: '28px',
        color: '#44cc66',
      }).setOrigin(0.5, 0.5);
      return;
    }

    if (reloadTime < 5) {
      this.add.text(cx, y + CARD_H / 2 + 10, this.tf('shop_no_reload_locked'), {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '18px',
        color: '#666666',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5, 0.5);
      return;
    }

    // Available for purchase
    const bottomY = y + CARD_H - PAD - 28;

    this.add.text(cardX + PAD, bottomY, this.tf('shop_no_reload_desc'), {
      ...baseStyle,
      fontSize: '15px',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5);

    const costText = this.add.text(cx, bottomY, this.tf('shop_coins_cost', 100), {
      ...baseStyle,
      fontSize: '17px',
      color: '#ffd700',
    }).setOrigin(0.5, 0.5);

    const errorText = this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1);

    let busy = false;
    const upgradeBtn = this.add.text(cardX + CARD_W - PAD, bottomY, this.tf('shop_upgrade'), {
      ...baseStyle,
      fontSize: '22px',
      color: '#c2baba',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    upgradeBtn.on('pointerover', () => upgradeBtn.setColor('#226d1b'));
    upgradeBtn.on('pointerout',  () => upgradeBtn.setColor('#c2baba'));
    upgradeBtn.on('pointerdown', async () => {
      if (busy) return;
      busy = true;
      errorText.setText('');
      try {
        await upgradeNoReload();
        refreshCoins();
        upgradeBtn.setText(this.tf('shop_unlocked')).setColor('#44cc66').disableInteractive();
        costText.setText('');
      } catch (err: unknown) {
        errorText.setText(err instanceof Error ? err.message : this.tf('shop_upgrade_failed'));
      } finally {
        busy = false;
      }
    });
  }

  private createUpgradeCard(cx: number, y: number, config: UpgradeCardConfig) {
    const PAD   = 20;
    const cardX = cx - CARD_W / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.55);
    bg.fillRoundedRect(cardX, y, CARD_W, CARD_H, CARD_RADIUS);
    bg.lineStyle(1, 0x555555, 0.8);
    bg.strokeRoundedRect(cardX, y, CARD_W, CARD_H, CARD_RADIUS);

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    this.add.text(cardX + PAD, y + PAD, config.name, {
      ...baseStyle,
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0, 0);

    const valueText = this.add.text(cardX + PAD, y + PAD + 28, config.label(config.currentValue()), {
      ...baseStyle,
      fontSize: '18px',
    }).setOrigin(0, 0);

    const barX = cardX + PAD;
    const barY = y + PAD + 58;
    const barW = CARD_W - PAD * 2;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(barX, barY, barW, BAR_H, 4);

    const barFill = this.add.graphics();
    const barProxy = { ratio: config.currentValue() / config.maxValue };

    const redrawBar = () => {
      barFill.clear();
      barFill.fillStyle(0x44cc66, 1);
      barFill.fillRoundedRect(barX, barY, barW * barProxy.ratio, BAR_H, 4);
    };
    redrawBar();

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

    const errorText = this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1);

    let busy = false;
    const upgradeBtn = this.add.text(cardX + CARD_W - PAD, bottomY, this.tf('shop_upgrade'), {
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
        errorText.setText(err instanceof Error ? err.message : this.tf('shop_upgrade_failed'));
      } finally {
        busy = false;
      }
    });

    if (config.isMaxed(config.currentValue())) {
      upgradeBtn.setText(this.tf('shop_max')).setColor('#666666').disableInteractive();
      costText.setText('');
      nextText.setText(this.tf('shop_max_level'));
    }
  }
}
