// Santiago Hernandez - A01787550
// AI was used for to populate vals for tiered upgrades

import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import { getPlayer, upgradeHp, upgradeGunDamage, upgradeFireRate, upgradeReloadTime, upgradeNoReload, upgradeMagSize, upgradeStaminaPool, upgradeStaminaRegen, buyCharacter, equipCharacter, buyCard } from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.ts';
import { fetchDeckBootstrap } from '../api/deckApi';
import { mapCardData } from '../utils/cardsMapper';
import type { Card } from '../utils/cards';
import { ELEMENT_COLORS } from '../utils/cards';

import christianPortrait from '../assets/characters/christian/Christian_v4_resized.webp';
import gavinPortrait     from '../assets/characters/gavin/Gavin_v3_resized.webp';
import gustavPortrait    from '../assets/characters/gustav/Gustav_v3_resized.webp';
import eddyPortrait      from '../assets/characters/eddy/Eddy_v2_resized.webp';

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

const CHARACTER_CATALOG = [
  { key: 'christian', name: 'Christian', roleKey: 'christian_role', coinCost: 0,    xpRequired: 0,    portraitKey: 'shop-chr-christian' },
  { key: 'gavin',     name: 'Gavin',     roleKey: 'gavin_role',     coinCost: 1500, xpRequired: 1250, portraitKey: 'shop-chr-gavin'     },
  { key: 'gustav',    name: 'Gustav',    roleKey: 'gustav_role',     coinCost: 3000, xpRequired: 2750, portraitKey: 'shop-chr-gustav'    },
  { key: 'eddy',      name: 'Eddy',      roleKey: 'eddy_role',       coinCost: 6000, xpRequired: 4750, portraitKey: 'shop-chr-eddy'      },
] as const;

const CARD_W      = 500;
const CARD_H      = 180;
const CARD_RADIUS = 12;
const CARD_GAP    = 12;
const BAR_H       = 20;
const CHAR_CARD_W = 500;
const CHAR_CARD_H = 200;
const MINI_CARD_W = 105;
const MINI_CARD_H = 138;
const MINI_CARD_GAP = 14;

interface OwnedCardEntry {
  cardGameId: number;
  isUnlocked: boolean;
  numCardsOwned: number;
}

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

  private t: Record<string, any> = {};

  private tf(key: string, ...args: any[]): string {
    const val = this.t[key];
    if (typeof val === 'function') return val(...args);
    return val ?? key;
  }

  preload() {
    if (!this.textures.exists('title-background'))    this.load.image('title-background',    titleBackground);
    if (!this.textures.exists('shop-chr-christian'))  this.load.image('shop-chr-christian',  christianPortrait);
    if (!this.textures.exists('shop-chr-gavin'))      this.load.image('shop-chr-gavin',      gavinPortrait);
    if (!this.textures.exists('shop-chr-gustav'))     this.load.image('shop-chr-gustav',     gustavPortrait);
    if (!this.textures.exists('shop-chr-eddy'))       this.load.image('shop-chr-eddy',       eddyPortrait);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;

    const langKey = this.registry.get('language') || 'en';
    this.t = translations[langKey];

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

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

    // ── Tabs ─────────────────────────────────────────────────────────────────
    let activeTab: 'upgrades' | 'characters' | 'cards' = 'upgrades';

    const upgradesTabText = this.add.text(cx - 160, 70, this.tf('shop_tab_upgrades'), {
      ...baseStyle, fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

    const charactersTabText = this.add.text(cx, 70, this.tf('shop_tab_characters'), {
      ...baseStyle, fontSize: '22px', color: '#505050',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

    const cardsTabText = this.add.text(cx + 160, 70, this.tf('shop_tab_cards'), {
      ...baseStyle, fontSize: '22px', color: '#505050',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

    const tabDivider = this.add.graphics().setScrollFactor(0).setDepth(10);
    tabDivider.lineStyle(1, 0x555555, 0.8);
    tabDivider.lineBetween(cx - 280, 86, cx + 280, 86);

    const upgradeObjects:   Phaser.GameObjects.GameObject[] = [];
    const characterObjects: Phaser.GameObjects.GameObject[] = [];
    const cardObjects:      Phaser.GameObjects.GameObject[] = [];

    const switchTab = (tab: 'upgrades' | 'characters' | 'cards') => {
      activeTab = tab;
      upgradesTabText.setColor(tab === 'upgrades' ? '#ffffff' : '#505050');
      charactersTabText.setColor(tab === 'characters' ? '#ffffff' : '#505050');
      cardsTabText.setColor(tab === 'cards' ? '#ffffff' : '#505050');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upgradeObjects.forEach(o => (o as any).setVisible(tab === 'upgrades'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      characterObjects.forEach(o => (o as any).setVisible(tab === 'characters'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cardObjects.forEach(o => (o as any).setVisible(tab === 'cards'));
      this.cameras.main.scrollY = 0;
    };

    upgradesTabText.on('pointerdown', () => { if (activeTab !== 'upgrades') switchTab('upgrades'); });
    charactersTabText.on('pointerdown', () => { if (activeTab !== 'characters') switchTab('characters'); });
    cardsTabText.on('pointerdown', () => { if (activeTab !== 'cards') switchTab('cards'); });

    // Load card data async (clanRank + card pool + owned set)
    let clanRank: string = (player as any)?.clanRank ?? 'ROOKIE';
    let allMappedCards: Card[] = [];
    let ownedCardIds = new Set<number>();
    let cardsContentHeight = 0;

    const renderCardsTabContent = () => {
      cardObjects.forEach(o => (o as any).destroy());
      cardObjects.length = 0;

      const trackCard = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
        cardObjects.push(obj); return obj;
      };

      let cardsY = 100;

      const addSectionTitle = (title: string, y: number) =>
        trackCard(this.add.text(cx - 250, y, title, {
          ...baseStyle, fontSize: '24px', color: '#ffd700',
        }).setOrigin(0, 0));

      const renderMiniRow = (
        title: string,
        cards: Card[],
        y: number,
        canBuy: boolean,
        footerFn: (owned: boolean) => string,
      ) => {
        addSectionTitle(title, y);
        const columns = 5;
        const totalW = columns * MINI_CARD_W + (columns - 1) * MINI_CARD_GAP;
        const startX = cx - totalW / 2;
        const startY = y + 38;

        cards.forEach((card, i) => {
          const col = i % columns;
          const row = Math.floor(i / columns);
          const x = startX + col * (MINI_CARD_W + MINI_CARD_GAP);
          const yy = startY + row * (MINI_CARD_H + 12);
          const owned = ownedCardIds.has(Number(card.id));
          const buyable = canBuy && !owned;

          const miniCard = this.createShopMiniCard(
            x, yy, card, owned, buyable, footerFn(owned),
            async () => {
              try {
                await buyCard(Number(card.id));
                ownedCardIds.add(Number(card.id));
                refreshCoins();
                renderCardsTabContent();
              } catch (err) {
                console.error(err);
              }
            }
          );
          trackCard(miniCard);
        });

        const usedRows = Math.ceil(cards.length / columns);
        return startY + usedRows * (MINI_CARD_H + 12) + 30;
      };

      const isVeteranOrAbove = ['VETERAN', 'ELITE', 'LEGEND'].includes(clanRank);
      const isEliteOrAbove   = ['ELITE', 'LEGEND'].includes(clanRank);

      if (!isVeteranOrAbove) {
        trackCard(this.add.text(cx, 140, this.tf('shop_cards_need_veteran'), {
          ...baseStyle, fontSize: '22px', color: '#cccccc',
        }).setOrigin(0.5, 0));
        cardsY = 200;
      } else {
        cardsY = renderMiniRow(
          this.tf('shop_cards_special'),
          allMappedCards.filter(c => c.rarity === 'effect'),
          cardsY,
          isVeteranOrAbove,
          (owned) => owned ? this.tf('shop_cards_owned') : this.tf('shop_cards_buy', 1500),
        );
      }

      if (isEliteOrAbove) {
        cardsY = renderMiniRow(
          this.tf('shop_cards_ice'),
          allMappedCards.filter(c => c.rarity === 'rare'),
          cardsY,
          isEliteOrAbove,
          (owned) => owned ? this.tf('shop_cards_owned') : this.tf('shop_cards_buy', 2000),
        );
      } else {
        trackCard(this.add.text(cx, cardsY, this.tf('shop_cards_need_elite'), {
          ...baseStyle, fontSize: '20px', color: '#888888',
        }).setOrigin(0.5, 0));
        cardsY += 50;
      }

      const legendaryCards = allMappedCards.filter(c => c.rarity === 'legendary');
      if (legendaryCards.length > 0) {
        cardsY = renderMiniRow(
          this.tf('shop_cards_legendary'),
          legendaryCards,
          cardsY,
          false,
          () => this.tf('shop_cards_run_unlock'),
        );
      }

      cardsContentHeight = cardsY + 20;
      cardObjects.forEach(o => (o as any).setVisible(activeTab === 'cards'));
    };

    // Bootstrap load: fetch rank + cards then render card tab
    // ai helped structure this part
    void (async () => {
      try {
        const playerId = Number((player as any)?.id ?? 0);
        if (playerId > 0) {
          const bootstrap = await fetchDeckBootstrap(playerId);
          clanRank = bootstrap.player.clanRank;
          allMappedCards = (bootstrap.allCards as any[]).map(mapCardData);
          ownedCardIds = new Set(
            (bootstrap.ownedCards as OwnedCardEntry[])
              .filter(pc => pc.isUnlocked && pc.numCardsOwned > 0)
              .map(pc => pc.cardGameId)
          );
          allMappedCards.filter(c => c.rarity === 'base').forEach(c => ownedCardIds.add(Number(c.id)));
          renderCardsTabContent(); // re-render with real data; visibility handled inside
        }
      } catch (e) {
        console.error('Shop card bootstrap failed:', e);
      }
    })();

    // Render immediately with empty state (shows rank messages, updates when loaded)
    renderCardsTabContent();

    // ── Upgrade Cards ─────────────────────────────────────────────────────────
    let cardY = 100;

    const trackUpg = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      upgradeObjects.push(obj); return obj;
    };

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
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

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
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

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
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

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
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    this.createNoReloadCard(cx, cardY, player, refreshCoins, trackUpg);
    cardY += CARD_H + CARD_GAP;

    let currentMag = typeof player?.magSize === 'number' ? player.magSize as number : 10;
    this.createUpgradeCard(cx, cardY, {
      name: this.tf('shop_mag'),
      currentValue: () => currentMag,
      maxValue: 30,
      label: (v) => this.tf('shop_label_ammo', v),
      nextLabel: (v) => { const t = MAG_SIZE_TIERS.find(x => x.from === v); return t ? this.tf('shop_next', t.from, t.to) : this.tf('shop_max_level'); },
      costLabel: (v) => { const t = MAG_SIZE_TIERS.find(x => x.from === v); return t ? this.tf('shop_coins_cost', t.cost) : ''; },
      isMaxed: (v) => MAG_SIZE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeMagSize(); const u = getPlayer(); currentMag = typeof u?.magSize === 'number' ? u.magSize as number : currentMag; },
      onCoinsChanged: refreshCoins,
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

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
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

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
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    const upgradeContentHeight = cardY + 20;

    // ── Character Cards ───────────────────────────────────────────────────────
    let chrY = 100;

    const trackChr = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      characterObjects.push(obj); return obj;
    };

    const playerXp      = typeof player?.maxXp === 'number' ? player.maxXp as number : 0;
    const unlockedChars = Array.isArray(player?.unlockedCharacters) ? player!.unlockedCharacters as string[] : ['christian'];
    let equippedChar    = typeof player?.equippedCharacter === 'string' ? player.equippedCharacter as string : 'christian';

    const cardControllers: Array<{ key: string; setEquipped: (e: boolean) => void }> = [];

    CHARACTER_CATALOG.forEach((charDef) => {
      const ctrl = this.createCharacterCard(cx, chrY, charDef, playerXp, unlockedChars, equippedChar, refreshCoins, (newEquipped) => {
        equippedChar = newEquipped;
        cardControllers.forEach(c => c.setEquipped(c.key === newEquipped));
      }, trackChr);
      cardControllers.push({ key: charDef.key, setEquipped: ctrl.setEquipped });
      chrY += CHAR_CARD_H + CARD_GAP;
    });

    const charContentHeight = chrY + 20;

    // ── Scroll ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, Math.max(upgradeContentHeight, charContentHeight));

    this.input.on('wheel', (_ptr: unknown, _objs: unknown[], _dx: number, deltaY: number) => {
      const contentH = activeTab === 'upgrades' ? upgradeContentHeight
        : activeTab === 'characters' ? charContentHeight
        : cardsContentHeight;
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.cameras.main.scrollY + deltaY * 0.5,
        0,
        Math.max(0, contentH - H),
      );
    });

    this.add.text(cx, H - 16, this.tf('shop_scroll_hint'), {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // Start on upgrades tab
    switchTab('upgrades');
  }

  private createCharacterCard(
    cx: number,
    y: number,
    charDef: typeof CHARACTER_CATALOG[number],
    playerXp: number,
    unlockedChars: string[],
    equippedChar: string,
    refreshCoins: () => void,
    onEquipped: (key: string) => void,
    track: <T extends Phaser.GameObjects.GameObject>(obj: T) => T,
  ): { setEquipped: (nowEquipped: boolean) => void } {
    const PAD   = 20;
    const cardX = cx - CHAR_CARD_W / 2;

    const isUnlocked    = unlockedChars.includes(charDef.key);
    let   isEquipped    = equippedChar === charDef.key;
    const isFree        = charDef.coinCost === 0;
    const canAffordXp   = playerXp >= charDef.xpRequired;
    let   canBeEquipped = isFree || isUnlocked;

    const bg = track(this.add.graphics());
    const drawBg = (equipped: boolean) => {
      bg.clear();
      bg.fillStyle(0x000000, 0.55);
      bg.fillRoundedRect(cardX, y, CHAR_CARD_W, CHAR_CARD_H, CARD_RADIUS);
      bg.lineStyle(1, equipped ? 0x44cc66 : 0x555555, 0.8);
      bg.strokeRoundedRect(cardX, y, CHAR_CARD_W, CHAR_CARD_H, CARD_RADIUS);
    };
    drawBg(isEquipped);

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    const portrait = track(this.add.image(cardX + PAD + 60, y + CHAR_CARD_H / 2, charDef.portraitKey));
    const portraitScale = Math.min(110 / portrait.width, (CHAR_CARD_H - PAD * 2) / portrait.height);
    portrait.setScale(portraitScale);

    const textX = cardX + PAD + 130;

    track(this.add.text(textX, y + PAD, charDef.name, {
      ...baseStyle, fontSize: '22px', color: '#ffffff',
    }).setOrigin(0, 0));

    track(this.add.text(textX, y + PAD + 28, this.tf(charDef.roleKey), {
      ...baseStyle, fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0, 0));

    track(this.add.text(textX, y + PAD + 52, isFree ? this.tf('shop_chr_free') : this.tf('shop_chr_cost', charDef.coinCost), {
      ...baseStyle, fontSize: '14px', color: isFree ? '#44cc66' : '#ffd700',
    }).setOrigin(0, 0));

    if (charDef.xpRequired > 0) {
      track(this.add.text(textX, y + PAD + 72, this.tf('shop_chr_requires', charDef.xpRequired), {
        ...baseStyle, fontSize: '14px', color: canAffordXp ? '#88cc88' : '#888888',
      }).setOrigin(0, 0));
    }

    const statusText = track(this.add.text(cardX + CHAR_CARD_W - PAD, y + CHAR_CARD_H - PAD, '', {
      ...baseStyle, fontSize: '15px', color: '#ff4444',
    }).setOrigin(1, 1));

    const actionBtnY = y + CHAR_CARD_H - PAD - 16;
    let actionRef: Phaser.GameObjects.Text | null = null;

    if (isEquipped) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, this.tf('shop_chr_equipped'), {
        ...baseStyle, fontSize: '22px', color: '#44cc66',
      }).setOrigin(1, 0.5));

    } else if (canBeEquipped) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, this.tf('shop_chr_equip'), {
        ...baseStyle, fontSize: '22px', color: '#c2baba',
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));

      let busy = false;
      actionRef.on('pointerover', () => { if (!isEquipped) actionRef!.setColor('#226d1b'); });
      actionRef.on('pointerout',  () => { if (!isEquipped) actionRef!.setColor('#c2baba'); });
      actionRef.on('pointerdown', async () => {
        if (busy || isEquipped) return;
        busy = true;
        statusText.setText('');
        try {
          await equipCharacter(charDef.key);
          onEquipped(charDef.key);
        } catch (err) {
          statusText.setText(err instanceof Error ? err.message : this.tf('shop_chr_failed'));
        } finally {
          busy = false;
        }
      });

    } else if (canAffordXp) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, this.tf('shop_chr_buy'), {
        ...baseStyle, fontSize: '22px', color: '#c2baba',
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));

      let busy = false;
      actionRef.on('pointerover', () => actionRef!.setColor('#226d1b'));
      actionRef.on('pointerout',  () => actionRef!.setColor('#c2baba'));
      actionRef.on('pointerdown', async () => {
        if (busy) return;
        busy = true;
        statusText.setText('');
        try {
          await buyCharacter(charDef.key);
          refreshCoins();
          canBeEquipped = true;
          actionRef!.setText(this.tf('shop_chr_equip')).setColor('#c2baba');
          // ai helped with this
          actionRef!.off('pointerover').off('pointerout').off('pointerdown');
          actionRef!.on('pointerover', () => { if (!isEquipped) actionRef!.setColor('#226d1b'); });
          actionRef!.on('pointerout',  () => { if (!isEquipped) actionRef!.setColor('#c2baba'); });
          actionRef!.on('pointerdown', async () => {
            if (busy || isEquipped) return;
            busy = true;
            statusText.setText('');
            try {
              await equipCharacter(charDef.key);
              onEquipped(charDef.key);
            } catch (err2) {
              statusText.setText(err2 instanceof Error ? err2.message : this.tf('shop_chr_failed'));
            } finally {
              busy = false;
            }
          });
        } catch (err) {
          statusText.setText(err instanceof Error ? err.message : this.tf('shop_chr_failed'));
        } finally {
          busy = false;
        }
      });

    } else {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, this.tf('shop_chr_locked_btn'), {
        ...baseStyle, fontSize: '22px', color: '#555555',
      }).setOrigin(1, 0.5));
    }

    return {
      setEquipped: (nowEquipped: boolean) => {
        if (!canBeEquipped || !actionRef) return;
        isEquipped = nowEquipped;
        drawBg(nowEquipped);
        if (nowEquipped) {
          actionRef.setText(this.tf('shop_chr_equipped')).setColor('#44cc66').disableInteractive();
        } else {
          actionRef.setText(this.tf('shop_chr_equip')).setColor('#c2baba').setInteractive({ useHandCursor: true });
        }
      },
    };
  }

  private createShopMiniCard(
    x: number,
    y: number,
    card: Card,
    owned: boolean,
    canBuy: boolean,
    footerLabel: string,
    onBuy: () => Promise<void>,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const frameColor = ELEMENT_COLORS[card.element] ?? 0xffffff;

    const bg = this.add.rectangle(0, 0, MINI_CARD_W, MINI_CARD_H, 0x1c1c1c, 0.98)
      .setOrigin(0)
      .setStrokeStyle(3, frameColor, 1);

    const rarityText = this.add.text(MINI_CARD_W / 2, 12, card.rarity.toUpperCase(), {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '11px', color: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    const nameText = this.add.text(MINI_CARD_W / 2, 42, card.name.toUpperCase(), {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 4,
      align: 'center', wordWrap: { width: 90 },
    }).setOrigin(0.5);

    const infoText = this.add.text(MINI_CARD_W / 2, 106, footerLabel, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '12px',
      color: owned ? '#00ff88' : canBuy ? '#ffd700' : '#bbbbbb',
      stroke: '#000000', strokeThickness: 4,
      align: 'center', wordWrap: { width: 92 },
    }).setOrigin(0.5);

    container.add([bg, rarityText, nameText, infoText]);
    container.setSize(MINI_CARD_W, MINI_CARD_H);

    if (canBuy) {
      container.setInteractive({ useHandCursor: true });
      container.on('pointerover', () => bg.setStrokeStyle(3, 0xffffff, 1));
      container.on('pointerout',  () => bg.setStrokeStyle(3, frameColor, 1));
      container.on('pointerdown', () => { void onBuy(); });
    }

    return container;
  }

  private createNoReloadCard(
    cx: number,
    y: number,
    player: Record<string, unknown> | null,
    refreshCoins: () => void,
    track: <T extends Phaser.GameObjects.GameObject>(obj: T) => T,
  ) {
    const PAD   = 20;
    const cardX = cx - CARD_W / 2;

    const reloadTime  = typeof player?.reloadTime  === 'number'  ? player.reloadTime  as number  : 1;
    const hasNoReload = typeof player?.hasNoReload  === 'boolean' ? player.hasNoReload as boolean : false;

    const bg = track(this.add.graphics());
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

    track(this.add.text(cardX + PAD, y + PAD, this.tf('shop_no_reload'), {
      ...baseStyle, fontSize: '22px', color: '#ffffff',
    }).setOrigin(0, 0));

    if (hasNoReload) {
      track(this.add.text(cx, y + CARD_H / 2 + 10, this.tf('shop_unlocked'), {
        ...baseStyle, fontSize: '28px', color: '#44cc66',
      }).setOrigin(0.5, 0.5));
      return;
    }

    if (reloadTime < 5) {
      track(this.add.text(cx, y + CARD_H / 2 + 10, this.tf('shop_no_reload_locked'), {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '18px',
        color: '#666666',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5, 0.5));
      return;
    }

    const bottomY = y + CARD_H - PAD - 28;

    track(this.add.text(cardX + PAD, bottomY, this.tf('shop_no_reload_desc'), {
      ...baseStyle, fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0, 0.5));

    const costText = track(this.add.text(cx, bottomY, this.tf('shop_coins_cost', 100), {
      ...baseStyle, fontSize: '17px', color: '#ffd700',
    }).setOrigin(0.5, 0.5));

    const errorText = track(this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1));

    let busy = false;
    const upgradeBtn = track(this.add.text(cardX + CARD_W - PAD, bottomY, this.tf('shop_upgrade'), {
      ...baseStyle, fontSize: '22px', color: '#c2baba',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));

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

  private createUpgradeCard(
    cx: number,
    y: number,
    config: UpgradeCardConfig,
    track: <T extends Phaser.GameObjects.GameObject>(obj: T) => T,
  ) {
    const PAD   = 20;
    const cardX = cx - CARD_W / 2;

    const bg = track(this.add.graphics());
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

    track(this.add.text(cardX + PAD, y + PAD, config.name, {
      ...baseStyle, fontSize: '22px', color: '#ffffff',
    }).setOrigin(0, 0));

    const valueText = track(this.add.text(cardX + PAD, y + PAD + 28, config.label(config.currentValue()), {
      ...baseStyle, fontSize: '18px',
    }).setOrigin(0, 0));

    const barX = cardX + PAD;
    const barY = y + PAD + 58;
    const barW = CARD_W - PAD * 2;

    const barBg = track(this.add.graphics());
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(barX, barY, barW, BAR_H, 4);

    const barFill = track(this.add.graphics());
    // proxy object lets the tween interpolate fill width through barProxy.ratio each frame
    const barProxy = { ratio: config.currentValue() / config.maxValue };

    const redrawBar = () => {
      barFill.clear();
      barFill.fillStyle(0x44cc66, 1);
      barFill.fillRoundedRect(barX, barY, barW * barProxy.ratio, BAR_H, 4);
    };
    redrawBar();

    const bottomY = y + CARD_H - PAD - 28;

    const nextText = track(this.add.text(cardX + PAD, bottomY, config.nextLabel(config.currentValue()), {
      ...baseStyle, fontSize: '17px',
    }).setOrigin(0, 0.5));

    const costText = track(this.add.text(cx, bottomY, config.costLabel(config.currentValue()), {
      ...baseStyle, fontSize: '17px', color: '#ffd700',
    }).setOrigin(0.5, 0.5));

    const errorText = track(this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1));

    let busy = false;
    const upgradeBtn = track(this.add.text(cardX + CARD_W - PAD, bottomY, this.tf('shop_upgrade'), {
      ...baseStyle, fontSize: '22px', color: '#c2baba',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));

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
        // ai helped with this
        this.tweens.add({
          targets: barProxy,
          ratio: targetRatio,
          duration: 400,
          ease: 'Sine.easeOut',
          onUpdate: redrawBar,
        });

        if (config.isMaxed(newVal)) {
          upgradeBtn.setText(this.tf('shop_max')).setColor('#666666').disableInteractive();
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
