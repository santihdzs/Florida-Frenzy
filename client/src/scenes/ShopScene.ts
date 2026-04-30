// j/troubleshooting
// Santiago Hernandez - A01787550
// AI was used for to populate vals for tiered upgrades

import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import { 
  getPlayer, 
  upgradeHp, 
  upgradeGunDamage, 
  upgradeFireRate, 
  upgradeReloadTime, 
  upgradeNoReload, 
  upgradeMagSize, 
  upgradeStaminaPool, 
  upgradeStaminaRegen, 
  buyCharacter, 
  equipCharacter,
  buyCard 
} from '../utils/auth.js';

import { transitionTo } from '../utils/sceneTransition.js';

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
  { key: 'christian', name: 'Christian', role: 'The Balanced Fighter', coinCost: 0,    xpRequired: 0,    portraitKey: 'shop-chr-christian' },
  { key: 'gavin',     name: 'Gavin',     role: 'The All-Rounder',      coinCost: 1500, xpRequired: 1250, portraitKey: 'shop-chr-gavin'     },
  { key: 'gustav',    name: 'Gustav',    role: 'The Fortress',          coinCost: 3000, xpRequired: 2750, portraitKey: 'shop-chr-gustav'    },
  { key: 'eddy',      name: 'Eddy',      role: 'The Berserker',         coinCost: 6000, xpRequired: 4750, portraitKey: 'shop-chr-eddy'      },
] as const;

const CARD_W      = 500;
const CARD_H      = 180;
const CARD_RADIUS = 12;
const CARD_GAP    = 12;
const BAR_H       = 20;

const CHAR_CARD_W = 500;
const CHAR_CARD_H = 200;

type ClanRank = 'ROOKIE' | 'VETERAN' | 'ELITE' | 'LEGEND';
type ShopTab = 'upgrades' | 'characters' | 'cards';

const MINI_CARD_W = 105;
const MINI_CARD_H = 138;
const MINI_CARD_GAP = 14;

interface OwnedCardEntry {
  cardGameId: number;
  isUnlocked: boolean;
  numCardsOwned: number;
  cardRarity: string;
} // represents the information about a card that the player owns, including how many copies they have, whether it is unlocked for use, and its rarity which may affect how it can be used or upgraded

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

  preload() {
    if (!this.textures.exists('title-background')) this.load.image('title-background', titleBackground);
    if (!this.textures.exists('shop-chr-christian')) this.load.image('shop-chr-christian', christianPortrait);
    if (!this.textures.exists('shop-chr-gavin'))     this.load.image('shop-chr-gavin',     gavinPortrait);
    if (!this.textures.exists('shop-chr-gustav'))    this.load.image('shop-chr-gustav',     gustavPortrait);
    if (!this.textures.exists('shop-chr-eddy'))      this.load.image('shop-chr-eddy',       eddyPortrait);
  }

  async create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    this.add.image(cx, H / 2, 'title-background').setScrollFactor(0);

    this.add.text(cx, 32, 'SHOP', {
      ...baseStyle,
      fontSize: '52px',
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    const player = getPlayer();
    let coins: number = typeof player?.totalCoins === 'number' ? player.totalCoins as number : 0;

    const coinsText = this.add.text(W - 24, 10, `Coins: ${coins}`, {
      ...baseStyle,
      fontSize: '22px',
      color: '#ffd700',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    const refreshCoins = () => {
      const p = getPlayer();
      coins = typeof p?.totalCoins === 'number' ? p.totalCoins as number : coins;
      coinsText.setText(`Coins: ${coins}`);
    };

    const playerId = Number(player?.id);
    let clanRank: ClanRank = 'ROOKIE'; // default rank if player data is not available for some reason
    let ownedCardIds = new Set<number>(); // a set to keep track of which card IDs the player owns and has unlocked
    let allMappedCards: Card[] = [];

    if (Number.isFinite(playerId) && playerId > 0) {
      try {
        const bootstrap = await fetchDeckBootstrap(playerId);
        clanRank = bootstrap.player.clanRank;

        allMappedCards = (bootstrap.allCards as any[]).map(mapCardData);

        ownedCardIds = new Set(
          (bootstrap.ownedCards as OwnedCardEntry[])
            .filter(card => card.isUnlocked && card.numCardsOwned > 0)
            .map(card => card.cardGameId)
        ); // populate the set of owned card IDs based on the player's owned cards that are unlocked

        allMappedCards
          .filter(card => card.rarity === 'base')
          .forEach(card => ownedCardIds.add(Number(card.id))); // automatically consider all base cards as owned since they are typically available to all players
      }
      
      catch (error) {
        console.error('Failed to load card shop bootstrap:', error);
      }
    }

    this.add.text(cx, H - 36, 'BACK', {
      ...baseStyle,
      fontSize: '36px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#226d1b'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c2baba'); })
      .on('pointerdown', () => {
        this.time.delayedCall(100, () => { transitionTo(this, 'MenuScene'); });
      });

    // ── Tabs ────────────────────────────────────────────────────────────────
    let activeTab: ShopTab = 'upgrades';

    const upgradesTabText = this.add.text(cx - 90, 70, 'Upgrades', {
      ...baseStyle, fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

    const charactersTabText = this.add.text(cx + 90, 70, 'Characters', {
      ...baseStyle, fontSize: '22px', color: '#505050',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

    const cardsTabText = this.add.text(cx + 245, 70, 'Cards', {
      ...baseStyle, fontSize: '22px', color: '#505050',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

    const tabDivider = this.add.graphics().setScrollFactor(0).setDepth(10);
    tabDivider.lineStyle(1, 0x555555, 0.8);
    tabDivider.lineBetween(cx - 200, 86, cx + 200, 86);

    // We hold all tab objects in groups so we can show/hide them
    const upgradeObjects:   Phaser.GameObjects.GameObject[] = [];
    const characterObjects: Phaser.GameObjects.GameObject[] = [];
    const cardObjects:      Phaser.GameObjects.GameObject[] = [];

    const clearCardObjects = () => {
      cardObjects.forEach (obj => obj.destroy());
      cardObjects.length = 0;
    }; // helper function to clear out existing card objects when switching tabs to ensure we don't have lingering objects from the previous tab

    const switchTab = (tab: ShopTab) => {
      activeTab = tab;
      upgradesTabText.setColor(tab === 'upgrades' ? '#ffffff' : '#505050');
      charactersTabText.setColor(tab === 'characters' ? '#ffffff' : '#505050');
      cardsTabText.setColor(tab === 'cards' ? '#ffffff' : '#505050');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upgradeObjects.forEach(o => (o as any).setVisible(tab === 'upgrades'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      characterObjects.forEach(o => (o as any).setVisible(tab === 'characters'));

      cardObjects.forEach(o => (o as any).setVisible(tab === 'cards'));
      // Reset camera scroll so both tabs start at top
      this.cameras.main.scrollY = 0;
    };

    upgradesTabText.on('pointerdown', () => { if (activeTab !== 'upgrades') switchTab('upgrades'); });
    charactersTabText.on('pointerdown', () => { if (activeTab !== 'characters') switchTab('characters'); });
    cardsTabText.on('pointerdown', () => { if (activeTab !== 'cards') switchTab('cards'); });

    let cardY = 100;

    const trackUpg = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      upgradeObjects.push(obj);
      return obj;
    }; // helper function to track upgrade-related game objects so we can easily show/hide them

    let currentHp = typeof player?.maxHp === 'number' ? player.maxHp as number : 50;
    this.createUpgradeCard(cx, cardY, {
      name: 'Health Upgrade',
      currentValue: () => currentHp,
      maxValue: 200,
      label: (v) => `HP: ${v} / 200`,
      nextLabel: (v) => { const t = HP_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = HP_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => HP_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeHp(); const u = getPlayer(); currentHp = typeof u?.maxHp === 'number' ? u.maxHp as number : currentHp; },
      onCoinsChanged: refreshCoins,
    }, trackUpg); // create the health upgrade card with the appropriate labels and upgrade logic
    cardY += CARD_H + CARD_GAP;

    let currentDmg = typeof player?.bulletDamage === 'number' ? player.bulletDamage as number : 10;
    this.createUpgradeCard(cx, cardY, {
      name: 'Bullet Damage',
      currentValue: () => currentDmg,
      maxValue: 50,
      label: (v) => `DMG: ${v} / 50`,
      nextLabel: (v) => { const t = DAMAGE_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = DAMAGE_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => DAMAGE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeGunDamage(); const u = getPlayer(); currentDmg = typeof u?.bulletDamage === 'number' ? u.bulletDamage as number : currentDmg; },
      onCoinsChanged: refreshCoins,
    }, trackUpg); // create the bullet damage upgrade card with the appropriate labels and upgrade logic
    cardY += CARD_H + CARD_GAP;

    let currentRate = typeof player?.fireRate === 'number' ? player.fireRate as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: 'Fire Rate',
      currentValue: () => currentRate,
      maxValue: 5,
      label: (v) => `Rate: ${v} / 5`,
      nextLabel: (v) => { const t = FIRE_RATE_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = FIRE_RATE_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => FIRE_RATE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeFireRate(); const u = getPlayer(); currentRate = typeof u?.fireRate === 'number' ? u.fireRate as number : currentRate; },
      onCoinsChanged: refreshCoins,
    }, trackUpg); // create the fire rate upgrade card with the appropriate labels and upgrade logic
    cardY += CARD_H + CARD_GAP;

    let currentReload = typeof player?.reloadTime === 'number' ? player.reloadTime as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: 'Reload Speed',
      currentValue: () => currentReload,
      maxValue: 5,
      label: (v) => `Speed: ${v} / 5`,
      nextLabel: (v) => { const t = RELOAD_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = RELOAD_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => RELOAD_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeReloadTime(); const u = getPlayer(); currentReload = typeof u?.reloadTime === 'number' ? u.reloadTime as number : currentReload; },
      onCoinsChanged: refreshCoins,
    }, trackUpg); // create the reload speed upgrade card with the appropriate labels and upgrade logic
    cardY += CARD_H + CARD_GAP;

    this.createNoReloadCard(cx, cardY, player, refreshCoins, trackUpg);
    cardY += CARD_H + CARD_GAP;

    let currentMag = typeof player?.magSize === 'number' ? player.magSize as number : 10;
    this.createUpgradeCard(cx, cardY, {
      name: 'Magazine Size',
      currentValue: () => currentMag,
      maxValue: 30,
      label: (v) => `Ammo: ${v} / 30`,
      nextLabel: (v) => { const t = MAG_SIZE_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = MAG_SIZE_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => MAG_SIZE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeMagSize(); const u = getPlayer(); currentMag = typeof u?.magSize === 'number' ? u.magSize as number : currentMag; },
      onCoinsChanged: refreshCoins,
    }, trackUpg); // create the magazine size upgrade card with the appropriate labels and upgrade logic
    cardY += CARD_H + CARD_GAP;

    let currentStaminaPool = typeof player?.staminaPool === 'number' ? player.staminaPool as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: 'Endurance',
      currentValue: () => currentStaminaPool,
      maxValue: 5,
      label: (v) => `Level: ${v} / 5`,
      nextLabel: (v) => { const t = STAMINA_POOL_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = STAMINA_POOL_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => STAMINA_POOL_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeStaminaPool(); const u = getPlayer(); currentStaminaPool = typeof u?.staminaPool === 'number' ? u.staminaPool as number : currentStaminaPool; },
      onCoinsChanged: refreshCoins,
    }, trackUpg); // create the endurance upgrade card with the appropriate labels and upgrade logic
    cardY += CARD_H + CARD_GAP;

    let currentStaminaRegen = typeof player?.staminaRegen === 'number' ? player.staminaRegen as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: 'Recovery',
      currentValue: () => currentStaminaRegen,
      maxValue: 5,
      label: (v) => `Level: ${v} / 5`,
      nextLabel: (v) => { const t = STAMINA_REGEN_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = STAMINA_REGEN_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => STAMINA_REGEN_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeStaminaRegen(); const u = getPlayer(); currentStaminaRegen = typeof u?.staminaRegen === 'number' ? u.staminaRegen as number : currentStaminaRegen; },
      onCoinsChanged: refreshCoins,
    }, trackUpg); // create the recovery upgrade card with the appropriate labels and upgrade logic
    cardY += CARD_H + CARD_GAP;

    const upgradeContentHeight = cardY + 20;

    let chrY = 100;

    const trackChr = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      characterObjects.push(obj);
      return obj;
    };

    const playerXp = typeof player?.maxXp === 'number' ? player.maxXp as number : 0;
    const unlockedChars = Array.isArray(player?.unlockedCharacters) ? player.unlockedCharacters as string[] : ['christian'];
    let equippedChar = typeof player?.equippedCharacter === 'string' ? player.equippedCharacter as string : 'christian';

    const cardControllers: Array<{ key: string; setEquipped: (e: boolean) => void }> = [];

    CHARACTER_CATALOG.forEach((charDef) => {
      const ctrl = this.createCharacterCard(
        cx,
        chrY,
        charDef,
        playerXp,
        unlockedChars,
        equippedChar,
        refreshCoins,
        (newEquipped) => {
          equippedChar = newEquipped;
          cardControllers.forEach(c => c.setEquipped(c.key === newEquipped));
        },
        trackChr
      ); // create the character card for this character definition with the appropriate labels and logic

      cardControllers.push({ key: charDef.key, setEquipped: ctrl.setEquipped });
      chrY += CHAR_CARD_H + CARD_GAP;
    });

    const charContentHeight = chrY + 20;

    // ── Upgrade Cards ────────────────────────────────────────────────────────
    let cardsContentHeight = 0;

    const renderCardsTabContent = () => {
      clearCardObjects();

      let cardsY = 100;

      const trackCard = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
        cardObjects.push(obj);
        return obj;
      };

      const addCardsSectionTitle = (title: string, y: number) => {
        return trackCard(this.add.text(cx - 250, y, title, {
          ...baseStyle,
          fontSize: '26px',
          color: '#ffd700',
        }).setOrigin(0, 0));
      };

      const renderMiniCardRow = (
        title: string,
        cards: Card[],
        y: number,
        canBuyPredicate: (card: Card) => boolean,
        labelForCard: (card: Card, owned: boolean) => string,
      ) => {
        addCardsSectionTitle(title, y);

        const columns = 5;
        const totalRowWidth = columns * MINI_CARD_W + (columns - 1) * MINI_CARD_GAP;
        const startX = cx - totalRowWidth / 2;
        const startY = y + 38;

        cards.forEach((card, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);

          const x = startX + col * (MINI_CARD_W + MINI_CARD_GAP);
          const yy = startY + row * (MINI_CARD_H + 12);

          const owned = ownedCardIds.has(Number(card.id));
          const canBuy = canBuyPredicate(card) && !owned;

          const cardObj = this.createShopMiniCard(
            x,
            yy,
            card,
            owned,
            canBuy,
            labelForCard(card, owned),
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
          ); // create the mini card for this card definition with the appropriate labels and logic

          trackCard(cardObj);
        });

        const usedRows = Math.ceil(cards.length / columns);
        return startY + usedRows * (MINI_CARD_H + 12) + 30;
      };

      if (clanRank === 'ROOKIE') {
        trackCard(this.add.text(cx, 140, 'Reach VETERAN to buy Special cards.', {
          ...baseStyle,
          fontSize: '28px',
          color: '#cccccc',
        }).setOrigin(0.5, 0));
        cardsY = 220;
      } else {
        const specialCards = allMappedCards.filter(card => card.rarity === 'effect');
        cardsY = renderMiniCardRow(
          'SPECIAL CARDS',
          specialCards,
          cardsY,
          () => clanRank === 'VETERAN' || clanRank === 'ELITE' || clanRank === 'LEGEND',
          (_card, owned) => owned ? 'OWNED' : '1500 COINS'
        );
      }

      if (clanRank === 'ELITE' || clanRank === 'LEGEND') {
        const iceCards = allMappedCards.filter(card => card.rarity === 'rare');
        cardsY = renderMiniCardRow(
          'ICE CARDS',
          iceCards,
          cardsY,
          () => clanRank === 'ELITE' || clanRank === 'LEGEND',
          (_card, owned) => owned ? 'OWNED' : '2000 COINS'
        );
      } else {
        trackCard(this.add.text(cx, cardsY, 'Reach ELITE to buy Ice cards.', {
          ...baseStyle,
          fontSize: '24px',
          color: '#888888',
        }).setOrigin(0.5, 0));
        cardsY += 60;
      }

      const legendaryCards = allMappedCards.filter(card => card.rarity === 'legendary');
      if (legendaryCards.length > 0) {
        cardsY = renderMiniCardRow(
          'LEGENDARY CARDS',
          legendaryCards,
          cardsY,
          () => false,
          () => 'RUN UNLOCK'
        );
      }

      cardsContentHeight = cardsY + 20;

      cardObjects.forEach(o => (o as any).setVisible(activeTab === 'cards'));
    };

    renderCardsTabContent();

    // ── Scroll setup ─────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, Math.max(upgradeContentHeight, charContentHeight));

    this.input.on('wheel', (_ptr: unknown, _objs: unknown[], _dx: number, deltaY: number) => {
      const contentH = 
      activeTab === 'upgrades' 
      ? upgradeContentHeight 
      : activeTab === 'characters'
      ? charContentHeight
      : cardsContentHeight; // determine the content height based on which tab is active so we know how far to allow scrolling

      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.cameras.main.scrollY + deltaY * 0.5,
        0,
        contentH - H
      );
    });

   
    if (Math.max(upgradeContentHeight, charContentHeight, cardsContentHeight) > H) {
      this.add.text(cx, H - 16, '▼ scroll for more', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '14px',
        color: '#888888',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
    } // add a hint to scroll if the content height exceeds the screen height to improve discoverability

    // Hide character cards initially
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const isUnlocked  = unlockedChars.includes(charDef.key);
    let   isEquipped  = equippedChar === charDef.key;
    const isFree      = charDef.coinCost === 0;
    const canAffordXp = playerXp >= charDef.xpRequired;
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

    track(this.add.text(textX, y + PAD + 28, charDef.role, {
      ...baseStyle, fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0, 0));

    track(this.add.text(textX, y + PAD + 52, isFree ? 'Free' : `Cost: ${charDef.coinCost} coins`, {
      ...baseStyle, fontSize: '14px', color: isFree ? '#44cc66' : '#ffd700',
    }).setOrigin(0, 0));

    if (charDef.xpRequired > 0) {
      track(this.add.text(textX, y + PAD + 72, `Requires: ${charDef.xpRequired} XP`, {
        ...baseStyle, fontSize: '14px', color: canAffordXp ? '#88cc88' : '#888888',
      }).setOrigin(0, 0));
    }

    const statusText = track(this.add.text(cardX + CHAR_CARD_W - PAD, y + CHAR_CARD_H - PAD, '', {
      ...baseStyle, fontSize: '15px', color: '#ff4444',
    }).setOrigin(1, 1));

    const actionBtnY = y + CHAR_CARD_H - PAD - 16;
    let actionRef: Phaser.GameObjects.Text | null = null;

    if (isEquipped) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, 'EQUIPPED', {
        ...baseStyle, fontSize: '22px', color: '#44cc66',
      }).setOrigin(1, 0.5));
    } 
    
    else if (canBeEquipped) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, 'EQUIP', {
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
        } 
        
        catch (err) {
          statusText.setText(err instanceof Error ? err.message : 'Failed');
        } 
        
        finally {
          busy = false;
        }
      });
    } 
    
    else if (canAffordXp) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, 'BUY', {
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
          actionRef!.setText('EQUIP').setColor('#c2baba');
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
            } 
            
            catch (err2) {
              statusText.setText(err2 instanceof Error ? err2.message : 'Failed');
            } 
            
            finally {
              busy = false;
            }
          });
        } 
        
        catch (err) {
          statusText.setText(err instanceof Error ? err.message : 'Failed');
        } 
        
        finally {
          busy = false;
        } // handle the buy character flow, and if successful, update the button to become an equip button
      });
    } 
    
    else {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, 'LOCKED', {
        ...baseStyle, fontSize: '22px', color: '#555555',
      }).setOrigin(1, 0.5));
    }

    return {
      setEquipped: (nowEquipped: boolean) => {
        if (!canBeEquipped || !actionRef) return;
        isEquipped = nowEquipped;
        drawBg(nowEquipped);
        if (nowEquipped) {
          actionRef.setText('EQUIPPED').setColor('#44cc66').disableInteractive();
        } else {
          actionRef.setText('EQUIP').setColor('#c2baba').setInteractive({ useHandCursor: true });
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
      .setStrokeStyle(3, frameColor, 1); // card background with colored border based on element

    const rarityText = this.add.text(MINI_CARD_W / 2, 12, card.rarity.toUpperCase(), {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const nameText = this.add.text(MINI_CARD_W / 2, 42, card.name.toUpperCase(), {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 90 },
    }).setOrigin(0.5);

    const infoText = this.add.text(MINI_CARD_W / 2, 106, owned ? 'OWNED' : footerLabel, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '12px',
      color: owned ? '#00ff88' : canBuy ? '#ffd700' : '#bbbbbb',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 92 },
    }).setOrigin(0.5);

    container.add([bg, rarityText, nameText, infoText]);
    container.setSize(MINI_CARD_W, MINI_CARD_H);

    if (canBuy) {
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        bg.setStrokeStyle(3, 0xffffff, 1);
      });

      container.on('pointerout', () => {
        bg.setStrokeStyle(3, frameColor, 1);
      });

      container.on('pointerdown', async () => {
        await onBuy();
      });
    } // we check canBuy instead of owned because some cards may be owned but not yet unlocked for use, so we only want to allow clicking if the card can actually be bought/unlocked

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

    track(this.add.text(cardX + PAD, y + PAD, 'No Reload', {
      ...baseStyle,
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0, 0));

    if (hasNoReload) {
      track(this.add.text(cx, y + CARD_H / 2 + 10, 'UNLOCKED', {
        ...baseStyle,
        fontSize: '28px',
        color: '#44cc66',
      }).setOrigin(0.5, 0.5));
      return;
    }

    if (reloadTime < 5) {
      track(this.add.text(cx, y + CARD_H / 2 + 10, 'Max out Reload Speed first', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '18px',
        color: '#666666',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5, 0.5));
      return;
    }

    const bottomY = y + CARD_H - PAD - 28;

    track(this.add.text(cardX + PAD, bottomY, 'Eliminates reload requirement', {
      ...baseStyle,
      fontSize: '15px',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5));

    const costText = track(this.add.text(cx, bottomY, '5000 coins', {
      ...baseStyle,
      fontSize: '17px',
      color: '#ffd700',
    }).setOrigin(0.5, 0.5));

    const errorText = track(this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1));

    let busy = false;
    const upgradeBtn = track(this.add.text(cardX + CARD_W - PAD, bottomY, 'UPGRADE', {
      ...baseStyle,
      fontSize: '22px',
      color: '#c2baba',
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
        upgradeBtn.setText('UNLOCKED').setColor('#44cc66').disableInteractive();
        costText.setText('');
      } catch (err: unknown) {
        errorText.setText(err instanceof Error ? err.message : 'Upgrade failed');
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
      ...baseStyle,
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0, 0));

    const valueText = track(this.add.text(cardX + PAD, y + PAD + 28, config.label(config.currentValue()), {
      ...baseStyle,
      fontSize: '18px',
    }).setOrigin(0, 0));

    const barX = cardX + PAD;
    const barY = y + PAD + 58;
    const barW = CARD_W - PAD * 2;

    const barBg = track(this.add.graphics());
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(barX, barY, barW, BAR_H, 4);

    const barFill = track(this.add.graphics());
    const barProxy = { ratio: config.currentValue() / config.maxValue };

    const redrawBar = () => {
      barFill.clear();
      barFill.fillStyle(0x44cc66, 1);
      barFill.fillRoundedRect(barX, barY, barW * barProxy.ratio, BAR_H, 4);
    };
    redrawBar();

    const bottomY = y + CARD_H - PAD - 28;

    const nextText = track(this.add.text(cardX + PAD, bottomY, config.nextLabel(config.currentValue()), {
      ...baseStyle,
      fontSize: '17px',
    }).setOrigin(0, 0.5));

    const costText = track(this.add.text(cx, bottomY, config.costLabel(config.currentValue()), {
      ...baseStyle,
      fontSize: '17px',
      color: '#ffd700',
    }).setOrigin(0.5, 0.5));

    const errorText = track(this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1));

    let busy = false;
    const upgradeBtn = track(this.add.text(cardX + CARD_W - PAD, bottomY, 'UPGRADE', {
      ...baseStyle,
      fontSize: '22px',
      color: '#c2baba',
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

    if (config.isMaxed(config.currentValue())) {
      upgradeBtn.setText('MAX').setColor('#666666').disableInteractive();
      costText.setText('');
      nextText.setText('MAX LEVEL');
    }
  }
}

  // incoming changes
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
// Santiago Hernandez - A01787550
// AI was used for to populate vals for tiered upgrades

import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import { getPlayer, upgradeHp, upgradeGunDamage, upgradeFireRate, upgradeReloadTime, upgradeNoReload, upgradeMagSize, upgradeStaminaPool, upgradeStaminaRegen, buyCharacter, equipCharacter } from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';

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
  { key: 'christian', name: 'Christian', role: 'The Balanced Fighter', coinCost: 0,    xpRequired: 0,    portraitKey: 'shop-chr-christian' },
  { key: 'gavin',     name: 'Gavin',     role: 'The All-Rounder',      coinCost: 1500, xpRequired: 1250, portraitKey: 'shop-chr-gavin'     },
  { key: 'gustav',    name: 'Gustav',    role: 'The Fortress',          coinCost: 3000, xpRequired: 2750, portraitKey: 'shop-chr-gustav'    },
  { key: 'eddy',      name: 'Eddy',      role: 'The Berserker',         coinCost: 6000, xpRequired: 4750, portraitKey: 'shop-chr-eddy'      },
] as const;

const CARD_W      = 500;
const CARD_H      = 180;
const CARD_RADIUS = 12;
const CARD_GAP    = 12;
const BAR_H       = 20;

const CHAR_CARD_W = 500;
const CHAR_CARD_H = 200;

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

  preload() {
    if (!this.textures.exists('title-background')) this.load.image('title-background', titleBackground);
    if (!this.textures.exists('shop-chr-christian')) this.load.image('shop-chr-christian', christianPortrait);
    if (!this.textures.exists('shop-chr-gavin'))     this.load.image('shop-chr-gavin',     gavinPortrait);
    if (!this.textures.exists('shop-chr-gustav'))    this.load.image('shop-chr-gustav',     gustavPortrait);
    if (!this.textures.exists('shop-chr-eddy'))      this.load.image('shop-chr-eddy',       eddyPortrait);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;

    const baseStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    this.add.image(cx, H / 2, 'title-background').setScrollFactor(0);

    this.add.text(cx, 32, 'SHOP', {
      ...baseStyle,
      fontSize: '52px',
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    const player = getPlayer();
    let coins: number = typeof player?.totalCoins === 'number' ? player.totalCoins as number : 0;

    const coinsText = this.add.text(W - 24, 10, `Coins: ${coins}`, {
      ...baseStyle,
      fontSize: '22px',
      color: '#ffd700',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    const refreshCoins = () => {
      const p = getPlayer();
      coins = typeof p?.totalCoins === 'number' ? p.totalCoins as number : coins;
      coinsText.setText(`Coins: ${coins}`);
    };

    this.add.text(cx, H - 36, 'BACK', {
      ...baseStyle,
      fontSize: '36px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#226d1b'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c2baba'); })
      .on('pointerdown', () => {
        this.time.delayedCall(100, () => { transitionTo(this, 'MenuScene'); });
      });

    // ── Tabs ────────────────────────────────────────────────────────────────
    let activeTab: 'upgrades' | 'characters' = 'upgrades';

    const upgradesTabText = this.add.text(cx - 90, 70, 'Upgrades', {
      ...baseStyle, fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

    const charactersTabText = this.add.text(cx + 90, 70, 'Characters', {
      ...baseStyle, fontSize: '22px', color: '#505050',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setInteractive({ useHandCursor: true });

    const tabDivider = this.add.graphics().setScrollFactor(0).setDepth(10);
    tabDivider.lineStyle(1, 0x555555, 0.8);
    tabDivider.lineBetween(cx - 200, 86, cx + 200, 86);

    // We hold all upgrade and character card objects in groups so we can show/hide them
    const upgradeObjects:   Phaser.GameObjects.GameObject[] = [];
    const characterObjects: Phaser.GameObjects.GameObject[] = [];

    const switchTab = (tab: 'upgrades' | 'characters') => {
      activeTab = tab;
      upgradesTabText.setColor(tab === 'upgrades' ? '#ffffff' : '#505050');
      charactersTabText.setColor(tab === 'characters' ? '#ffffff' : '#505050');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upgradeObjects.forEach(o => (o as any).setVisible(tab === 'upgrades'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      characterObjects.forEach(o => (o as any).setVisible(tab === 'characters'));
      // Reset camera scroll so both tabs start at top
      this.cameras.main.scrollY = 0;
    };

    upgradesTabText.on('pointerdown', () => { if (activeTab !== 'upgrades') switchTab('upgrades'); });
    charactersTabText.on('pointerdown', () => { if (activeTab !== 'characters') switchTab('characters'); });

    // ── Upgrade Cards ────────────────────────────────────────────────────────
    let cardY = 100;

    const trackUpg = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      upgradeObjects.push(obj); return obj;
    };

    let currentHp = typeof player?.maxHp === 'number' ? player.maxHp as number : 50;
    this.createUpgradeCard(cx, cardY, {
      name: 'Health Upgrade',
      currentValue: () => currentHp,
      maxValue: 200,
      label: (v) => `HP: ${v} / 200`,
      nextLabel: (v) => { const t = HP_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = HP_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => HP_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeHp(); const u = getPlayer(); currentHp = typeof u?.maxHp === 'number' ? u.maxHp as number : currentHp; },
      onCoinsChanged: refreshCoins,
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    let currentDmg = typeof player?.bulletDamage === 'number' ? player.bulletDamage as number : 10;
    this.createUpgradeCard(cx, cardY, {
      name: 'Bullet Damage',
      currentValue: () => currentDmg,
      maxValue: 50,
      label: (v) => `DMG: ${v} / 50`,
      nextLabel: (v) => { const t = DAMAGE_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = DAMAGE_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => DAMAGE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeGunDamage(); const u = getPlayer(); currentDmg = typeof u?.bulletDamage === 'number' ? u.bulletDamage as number : currentDmg; },
      onCoinsChanged: refreshCoins,
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    let currentRate = typeof player?.fireRate === 'number' ? player.fireRate as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: 'Fire Rate',
      currentValue: () => currentRate,
      maxValue: 5,
      label: (v) => `Rate: ${v} / 5`,
      nextLabel: (v) => { const t = FIRE_RATE_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = FIRE_RATE_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => FIRE_RATE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeFireRate(); const u = getPlayer(); currentRate = typeof u?.fireRate === 'number' ? u.fireRate as number : currentRate; },
      onCoinsChanged: refreshCoins,
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    let currentReload = typeof player?.reloadTime === 'number' ? player.reloadTime as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: 'Reload Speed',
      currentValue: () => currentReload,
      maxValue: 5,
      label: (v) => `Speed: ${v} / 5`,
      nextLabel: (v) => { const t = RELOAD_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = RELOAD_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => RELOAD_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeReloadTime(); const u = getPlayer(); currentReload = typeof u?.reloadTime === 'number' ? u.reloadTime as number : currentReload; },
      onCoinsChanged: refreshCoins,
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    this.createNoReloadCard(cx, cardY, player, refreshCoins, trackUpg);
    cardY += CARD_H + CARD_GAP;

    let currentMag = typeof player?.magSize === 'number' ? player.magSize as number : 10;
    this.createUpgradeCard(cx, cardY, {
      name: 'Magazine Size',
      currentValue: () => currentMag,
      maxValue: 30,
      label: (v) => `Ammo: ${v} / 30`,
      nextLabel: (v) => { const t = MAG_SIZE_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = MAG_SIZE_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => MAG_SIZE_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeMagSize(); const u = getPlayer(); currentMag = typeof u?.magSize === 'number' ? u.magSize as number : currentMag; },
      onCoinsChanged: refreshCoins,
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    let currentStaminaPool = typeof player?.staminaPool === 'number' ? player.staminaPool as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: 'Endurance',
      currentValue: () => currentStaminaPool,
      maxValue: 5,
      label: (v) => `Level: ${v} / 5`,
      nextLabel: (v) => { const t = STAMINA_POOL_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = STAMINA_POOL_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => STAMINA_POOL_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeStaminaPool(); const u = getPlayer(); currentStaminaPool = typeof u?.staminaPool === 'number' ? u.staminaPool as number : currentStaminaPool; },
      onCoinsChanged: refreshCoins,
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    let currentStaminaRegen = typeof player?.staminaRegen === 'number' ? player.staminaRegen as number : 1;
    this.createUpgradeCard(cx, cardY, {
      name: 'Recovery',
      currentValue: () => currentStaminaRegen,
      maxValue: 5,
      label: (v) => `Level: ${v} / 5`,
      nextLabel: (v) => { const t = STAMINA_REGEN_TIERS.find(x => x.from === v); return t ? `Next: ${t.from} → ${t.to}` : 'MAX LEVEL'; },
      costLabel: (v) => { const t = STAMINA_REGEN_TIERS.find(x => x.from === v); return t ? `${t.cost} coins` : ''; },
      isMaxed: (v) => STAMINA_REGEN_TIERS.find(x => x.from === v) === undefined,
      onUpgrade: async () => { await upgradeStaminaRegen(); const u = getPlayer(); currentStaminaRegen = typeof u?.staminaRegen === 'number' ? u.staminaRegen as number : currentStaminaRegen; },
      onCoinsChanged: refreshCoins,
    }, trackUpg);
    cardY += CARD_H + CARD_GAP;

    const upgradeContentHeight = cardY + 20;

    // ── Character Cards ──────────────────────────────────────────────────────
    let chrY = 100;

    const trackChr = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      characterObjects.push(obj); return obj;
    };

    const playerXp       = typeof player?.maxXp === 'number' ? player.maxXp as number : 0;
    const unlockedChars  = Array.isArray(player?.unlockedCharacters) ? player!.unlockedCharacters as string[] : ['christian'];
    let equippedChar     = typeof player?.equippedCharacter === 'string' ? player.equippedCharacter as string : 'christian';

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

    // ── Scroll setup ─────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, Math.max(upgradeContentHeight, charContentHeight));

    this.input.on('wheel', (_ptr: unknown, _objs: unknown[], _dx: number, deltaY: number) => {
      const contentH = activeTab === 'upgrades' ? upgradeContentHeight : charContentHeight;
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.cameras.main.scrollY + deltaY * 0.5,
        0,
        contentH - H
      );
    });

    if (Math.max(upgradeContentHeight, charContentHeight) > H) {
      this.add.text(cx, H - 16, '▼ scroll for more', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '14px',
        color: '#888888',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
    }

    // Hide character cards initially
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    characterObjects.forEach(o => (o as any).setVisible(false));
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

    const isUnlocked  = unlockedChars.includes(charDef.key);
    let   isEquipped  = equippedChar === charDef.key;
    const isFree      = charDef.coinCost === 0;
    const canAffordXp = playerXp >= charDef.xpRequired;
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

    track(this.add.text(textX, y + PAD + 28, charDef.role, {
      ...baseStyle, fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0, 0));

    track(this.add.text(textX, y + PAD + 52, isFree ? 'Free' : `Cost: ${charDef.coinCost} coins`, {
      ...baseStyle, fontSize: '14px', color: isFree ? '#44cc66' : '#ffd700',
    }).setOrigin(0, 0));

    if (charDef.xpRequired > 0) {
      track(this.add.text(textX, y + PAD + 72, `Requires: ${charDef.xpRequired} XP`, {
        ...baseStyle, fontSize: '14px', color: canAffordXp ? '#88cc88' : '#888888',
      }).setOrigin(0, 0));
    }

    const statusText = track(this.add.text(cardX + CHAR_CARD_W - PAD, y + CHAR_CARD_H - PAD, '', {
      ...baseStyle, fontSize: '15px', color: '#ff4444',
    }).setOrigin(1, 1));

    const actionBtnY = y + CHAR_CARD_H - PAD - 16;
    let actionRef: Phaser.GameObjects.Text | null = null;

    if (isEquipped) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, 'EQUIPPED', {
        ...baseStyle, fontSize: '22px', color: '#44cc66',
      }).setOrigin(1, 0.5));
    } else if (canBeEquipped) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, 'EQUIP', {
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
          statusText.setText(err instanceof Error ? err.message : 'Failed');
        } finally {
          busy = false;
        }
      });
    } else if (canAffordXp) {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, 'BUY', {
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
          actionRef!.setText('EQUIP').setColor('#c2baba');
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
              statusText.setText(err2 instanceof Error ? err2.message : 'Failed');
            } finally {
              busy = false;
            }
          });
        } catch (err) {
          statusText.setText(err instanceof Error ? err.message : 'Failed');
        } finally {
          busy = false;
        }
      });
    } else {
      actionRef = track(this.add.text(cardX + CHAR_CARD_W - PAD, actionBtnY, 'LOCKED', {
        ...baseStyle, fontSize: '22px', color: '#555555',
      }).setOrigin(1, 0.5));
    }

    return {
      setEquipped: (nowEquipped: boolean) => {
        if (!canBeEquipped || !actionRef) return;
        isEquipped = nowEquipped;
        drawBg(nowEquipped);
        if (nowEquipped) {
          actionRef.setText('EQUIPPED').setColor('#44cc66').disableInteractive();
        } else {
          actionRef.setText('EQUIP').setColor('#c2baba').setInteractive({ useHandCursor: true });
        }
      },
    };
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

    track(this.add.text(cardX + PAD, y + PAD, 'No Reload', {
      ...baseStyle,
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0, 0));

    if (hasNoReload) {
      track(this.add.text(cx, y + CARD_H / 2 + 10, 'UNLOCKED', {
        ...baseStyle,
        fontSize: '28px',
        color: '#44cc66',
      }).setOrigin(0.5, 0.5));
      return;
    }

    if (reloadTime < 5) {
      track(this.add.text(cx, y + CARD_H / 2 + 10, 'Max out Reload Speed first', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '18px',
        color: '#666666',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5, 0.5));
      return;
    }

    const bottomY = y + CARD_H - PAD - 28;

    track(this.add.text(cardX + PAD, bottomY, 'Eliminates reload requirement', {
      ...baseStyle,
      fontSize: '15px',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5));

    const costText = track(this.add.text(cx, bottomY, '5000 coins', {
      ...baseStyle,
      fontSize: '17px',
      color: '#ffd700',
    }).setOrigin(0.5, 0.5));

    const errorText = track(this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1));

    let busy = false;
    const upgradeBtn = track(this.add.text(cardX + CARD_W - PAD, bottomY, 'UPGRADE', {
      ...baseStyle,
      fontSize: '22px',
      color: '#c2baba',
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
        upgradeBtn.setText('UNLOCKED').setColor('#44cc66').disableInteractive();
        costText.setText('');
      } catch (err: unknown) {
        errorText.setText(err instanceof Error ? err.message : 'Upgrade failed');
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
      ...baseStyle,
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0, 0));

    const valueText = track(this.add.text(cardX + PAD, y + PAD + 28, config.label(config.currentValue()), {
      ...baseStyle,
      fontSize: '18px',
    }).setOrigin(0, 0));

    const barX = cardX + PAD;
    const barY = y + PAD + 58;
    const barW = CARD_W - PAD * 2;

    const barBg = track(this.add.graphics());
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(barX, barY, barW, BAR_H, 4);

    const barFill = track(this.add.graphics());
    const barProxy = { ratio: config.currentValue() / config.maxValue };

    const redrawBar = () => {
      barFill.clear();
      barFill.fillStyle(0x44cc66, 1);
      barFill.fillRoundedRect(barX, barY, barW * barProxy.ratio, BAR_H, 4);
    };
    redrawBar();

    const bottomY = y + CARD_H - PAD - 28;

    const nextText = track(this.add.text(cardX + PAD, bottomY, config.nextLabel(config.currentValue()), {
      ...baseStyle,
      fontSize: '17px',
    }).setOrigin(0, 0.5));

    const costText = track(this.add.text(cx, bottomY, config.costLabel(config.currentValue()), {
      ...baseStyle,
      fontSize: '17px',
      color: '#ffd700',
    }).setOrigin(0.5, 0.5));

    const errorText = track(this.add.text(cardX + PAD, y + CARD_H - 4, '', {
      fontFamily: 'Impact, Arial black, sans-serif',
      fontSize: '15px',
      color: '#ff4444',
    }).setOrigin(0, 1));

    let busy = false;
    const upgradeBtn = track(this.add.text(cardX + CARD_W - PAD, bottomY, 'UPGRADE', {
      ...baseStyle,
      fontSize: '22px',
      color: '#c2baba',
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

    if (config.isMaxed(config.currentValue())) {
      upgradeBtn.setText('MAX').setColor('#666666').disableInteractive();
      costText.setText('');
      nextText.setText('MAX LEVEL');
    }
  }
}
