/*
*
* Santiago Hernandez - A01787550
* Manuel Montero - A01660761
* Yael Ordaz - A01786776
* 
* This Scene manages the deck building interface of the game, 
* allowing players to create and customize their decks of cards.
* 
* ChatGPT was used to assist in writing and optimizing some of the code in this file
* 
*/


import Phaser from 'phaser';
import titleBackground from '../assets/title-background.png'; // background image for the deck builder scene

import {
  getBaseCardPool,
  getSpecialCardPool,
  getIceCardPool,
  getLegendaryCardPool,
  type Card,
  ELEMENT_COLORS,
} from '../utils/cards'; // importing card-related functions and types to build the card collections and render them in the deck builder interface

import {
  type ClanRank,
  computeClanRank,
} from '../../../server/src/services/user.service'; // importing clan rank types and functions to determine the player's rank based on their progress, which affects deck building options and restrictions

import {
  canUseCardInDeck,
  getDeckSlotLimit,
  getUnlockRankForCard,
  loadLocalDeckStorage,
  saveLocalDeckStorage,
  type LocalDeckStorage,
} from '../utils/deckHelpers'; // importing functions and types related to deck storage and management, allowing the scene to save and load deck configurations from localStorage, enforce deck building rules based on player rank, and manage the state of the current deck being edited

import { fetchDeckBootstrap, saveDeckToBackend, activateDeckInBackend } from '../api/deckApi';
import { mapCardData } from '../utils/cardsMapper';
import { getPlayer } from '../utils/auth.js';

type BrowserRow = {
  title: string;
  cards: Card[];
}; // defines the structure for a row in the card browser panel, which groups cards by category and element for easier navigation when building a deck

let _pendingDeckIndex: number | null = null;

export class DeckScene extends Phaser.Scene {
  private storage!: LocalDeckStorage; // holds the player's deck configurations loaded from localStorage
  private selectedDeckIndex = 0;
  private _requestedDeckIndex: number | null = null;
  private deckCharacterGameIds: number[] = [1, 1, 1];
  private deckIds: (number | null)[] = [null, null, null];
  
  // default values for clan rank and slot limit, which will be updated based on the player's actual rank
  private clanRank: ClanRank = 'ROOKIE';
  private slotLimit = 12;

  private allCards: Card[] = [];
  private browserRows: BrowserRow[] = [];

  private messageText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;

  private deckSlotsContainer!: Phaser.GameObjects.Container;
  private browserContainer!: Phaser.GameObjects.Container;
  private browserMask!: Phaser.Display.Masks.GeometryMask;
  private browserContentHeight = 0;
  private browserPanelRect!: Phaser.Geom.Rectangle;

  private currentDeckCards: Card[] = [];
  private deckStatusObjects: Phaser.GameObjects.GameObject[] = [];
  private isDirty = false;
  private saveBtnContainer: Phaser.GameObjects.Container | null = null;
  private browserCardRefs: Map<string, { addedOverlay: Phaser.GameObjects.Graphics; addedText: Phaser.GameObjects.Text }> = new Map();

  constructor() {
    super({ key: 'DeckScene' });
  } // initializes the DeckScene with a unique key for Phaser's scene management system

  preload() {
    this.load.image('title-background', titleBackground);
  }

  init(_data: Record<string, unknown>) {
    this._requestedDeckIndex = _pendingDeckIndex;
    this.saveBtnContainer = null;
  }

  async create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;

    // // temporal / local rank and deck data management - to be replaced with actual player data integration
    // const fakeBestLevel = Number(localStorage.getItem('ff_fake_best_level') ?? '15');
    // this.clanRank = computeClanRank(fakeBestLevel);
    // this.slotLimit = getDeckSlotLimit(this.clanRank);

    // this.storage = loadLocalDeckStorage();
    // this.selectedDeckIndex = Phaser.Math.Clamp(this.storage.selectedDeckIndex ?? 0, 0, 2);

    // this.buildCardCollections();
    // this.loadSelectedDeckIntoDraft();

    // scene base
    this.add.image(cx, height / 2, 'title-background');
    this.cameras.main.setBackgroundColor('#1a1a1a');
    this.add.rectangle(0, 0, width, height, 0x000000, 0.45).setOrigin(0);

    this.add.text(cx, 42, 'DECK BUILDER', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '44px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5);

    this.rankText = this.add.text(cx, 82, `Rank: ${this.clanRank}  |  Slots: ${this.slotLimit}/21`, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '22px',
      color: '#dddddd',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.createMainPlate();
    this.createMessageBar();
    this.showMessage('Loading deck data...', '#dddddd');
    try {
        await this.loadBootstrapFromBackend();
        this.createTopDeckControls();
        this.createDeckSlotsPanel();
        this.createBrowserPanel();
        this.createBottomButtons();

        this.renderDeckSlots();
        this.renderBrowserCards();
        this.showMessage('Deck loaded.', '#00ff88');
    } 
    
    catch (error) {
        console.error(error);
        this.showMessage(error instanceof Error ? error.message : 'Failed to load deck data.', '#ff6666');
        this.createBottomButtons();
    }
  }

private async loadBootstrapFromBackend() {
    const player = getPlayer();
    const playerId = Number(player?.id);

    if (!Number.isFinite(playerId) || playerId <= 0) {
      this.showMessage('No logged-in player found.', '#ff6666');
      return;
    } // checks if there's a valid logged-in player before attempting to save the deck to the backend

  const bootstrap = await fetchDeckBootstrap(playerId);

  this.clanRank = bootstrap.player.clanRank;
  this.slotLimit = bootstrap.player.slotLimit;

  const mappedCards = (bootstrap.allCards as any[]).map(mapCardData);
  this.allCards = mappedCards;

  const byId = new Map(mappedCards.map(card => [Number(card.id), card]));

  const activeDeck = bootstrap.decks.find(d => d.isActive && d.cards.length === bootstrap.player.slotLimit);
  const activeIndex = activeDeck ? parseInt(activeDeck.deckName.split(' ')[1], 10) - 1 : -1;
  this.selectedDeckIndex = this._requestedDeckIndex ?? (activeIndex !== -1 ? activeIndex : 0);
  _pendingDeckIndex = null;

  this.storage = {
    selectedDeckIndex: this.selectedDeckIndex,
    decks: [0, 1, 2].map((index) => {
      const backendDeck = bootstrap.decks.find(deck => deck.deckName === `Deck ${index + 1}`);

      return {
        slotCards: backendDeck
          ? backendDeck.cards.map(cardEntry => String(cardEntry.cardGameId))
          : [],
        isActive: backendDeck?.isActive ?? (index === this.selectedDeckIndex),
        characterKey: 'christian',
      };
    }),
  };

  this.deckCharacterGameIds = [0, 1, 2].map(index => {
    const backendDeck = bootstrap.decks.find(d => d.deckName === `Deck ${index + 1}`);
    return backendDeck?.characterGameId ?? 1;
  });

  this.deckIds = [0, 1, 2].map(index => {
    const backendDeck = bootstrap.decks.find(d => d.deckName === `Deck ${index + 1}`);
    return backendDeck?.id ?? null;
  });

  this.browserRows = [
    { title: 'BASE — FIRE', cards: mappedCards.filter(c => c.rarity === 'base' && c.element === 'fire') },
    { title: 'BASE — WATER', cards: mappedCards.filter(c => c.rarity === 'base' && c.element === 'water') },
    { title: 'BASE — SWAMP', cards: mappedCards.filter(c => c.rarity === 'base' && c.element === 'swamp') },
    { title: 'BASE — SAND', cards: mappedCards.filter(c => c.rarity === 'base' && c.element === 'sand') },

    { title: 'SPECIAL — FIRE', cards: mappedCards.filter(c => c.rarity === 'effect' && c.element === 'fire') },
    { title: 'SPECIAL — WATER', cards: mappedCards.filter(c => c.rarity === 'effect' && c.element === 'water') },
    { title: 'SPECIAL — SWAMP', cards: mappedCards.filter(c => c.rarity === 'effect' && c.element === 'swamp') },
    { title: 'SPECIAL — SAND', cards: mappedCards.filter(c => c.rarity === 'effect' && c.element === 'sand') },

    { title: 'ICE', cards: mappedCards.filter(c => c.rarity === 'rare') },
    { title: 'LEGENDARY', cards: mappedCards.filter(c => c.rarity === 'legendary') },
  ];

  const selectedDeck = bootstrap.decks.find(deck => deck.deckName === `Deck ${this.selectedDeckIndex + 1}`);
  this.currentDeckCards = selectedDeck
    ? selectedDeck.cards
        .map(entry => byId.get(entry.cardGameId))
        .filter((card): card is Card => Boolean(card))
    : [];

  this.rankText.setText(`Rank: ${this.clanRank}  |  Slots: ${this.slotLimit}/21`); // update the rank and slot limit display in the UI based on the data loaded from the backend
  this.isDirty = false;
}

//   private buildCardCollections() {
//     const base = getBaseCardPool();
//     const special = getSpecialCardPool();
//     const ice = getIceCardPool();
//     const legendary = getLegendaryCardPool();

//     this.allCards = [...base, ...special, ...ice, ...legendary];

//     this.browserRows = [
//       { title: 'BASE — FIRE', cards: base.filter(c => c.element === 'fire') },
//       { title: 'BASE — WATER', cards: base.filter(c => c.element === 'water') },
//       { title: 'BASE — SWAMP', cards: base.filter(c => c.element === 'swamp') },
//       { title: 'BASE — SAND', cards: base.filter(c => c.element === 'sand') },

//       { title: 'SPECIAL — FIRE', cards: special.filter(c => c.element === 'fire') },
//       { title: 'SPECIAL — WATER', cards: special.filter(c => c.element === 'water') },
//       { title: 'SPECIAL — SWAMP', cards: special.filter(c => c.element === 'swamp') },
//       { title: 'SPECIAL — SAND', cards: special.filter(c => c.element === 'sand') },

//       { title: 'ICE', cards: ice },
//       { title: 'LEGENDARY', cards: legendary },
//     ];
//   } // builds the complete list of cards available in the game and organizes them into rows for the card browser panel

  private loadSelectedDeckIntoDraft() {
    const selected = this.storage.decks[this.selectedDeckIndex]; // retrieves the currently selected deck from storage based on the selectedDeckIndex
    const byId = new Map(this.allCards.map(card => [card.id, card])); // creates a mapping of card IDs to card objects for easy lookup when loading the deck's card IDs into the currentDeckCards array
    this.currentDeckCards = selected.slotCards
      .map(id => byId.get(id))
      .filter((card): card is Card => Boolean(card)); // maps the card IDs in the selected deck's slotCards to actual Card objects using the byId map
  } // loads the currently selected deck into the draft for editing

  private createMainPlate() {
    const { width, height } = this.cameras.main;
    const bgX = width * 0.05;
    const bgY = 100;
    const bgW = width * 0.90;
    const bgH = height - 160;

    const g = this.add.graphics();
    g.fillStyle(0x222222, 0.86);
    g.fillRoundedRect(bgX, bgY, bgW, bgH, 12);
    g.lineStyle(4, 0x666666);
    g.strokeRoundedRect(bgX, bgY, bgW, bgH, 12);
  }

  private createMessageBar() {
    const { width } = this.cameras.main;
    const cx = width / 2;

    const g = this.add.graphics();
    g.fillStyle(0x101010, 0.95);
    g.fillRoundedRect(cx - 300, 115, 600, 44, 8);
    g.lineStyle(3, 0xaaaaaa);
    g.strokeRoundedRect(cx - 300, 115, 600, 44, 8);

    this.messageText = this.add.text(cx, 137, 'Select cards to build your deck.', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '20px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5);
  }

  private createTopDeckControls() {
    const y = 180;

    this.saveBtnContainer = this.createMetalBtn(175, y - 25, 180, 48, 'SAVED', () => {
      this.saveCurrentDeck();
    }, '#c2baba');
    this.refreshSaveBtn();

    [890, 1010, 1130].forEach((x, i) => {
      const isViewing = i === this.selectedDeckIndex;
      if (isViewing) {
        const g = this.add.graphics();
        g.lineStyle(3, 0xffcc00, 1);
        g.strokeRoundedRect(x - 58, (y - 140) - 27, 116, 54, 7);
      }
      this.createMetalBtn(x, y - 140, 110, 48, `DECK ${i + 1}`, () => this.switchDeck(i), isViewing ? '#ffcc00' : '#c2baba');
    });

    const currentDeck = this.storage.decks[this.selectedDeckIndex];

    this.refreshDeckStatusWidget();

    const active = currentDeck.isActive ? 'ACTIVE' : 'INACTIVE';
    this.add.text(600, y + 8, `DECK ${this.selectedDeckIndex + 1} — ${active}`, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '24px',
      color: '#e3941d',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);
  }

  private async activateAndSwitchDeck(index: number) {
    const deckId = this.deckIds[index];
    if (!deckId) {
      this.showMessage('Save this deck before using it!', '#ff6666');
      return;
    }

    const player = getPlayer();
    const playerId = Number(player?.id);
    if (!Number.isFinite(playerId) || playerId <= 0) {
      this.showMessage('No logged-in player found.', '#ff6666');
      return;
    }

    try {
      await activateDeckInBackend({ playerId, deckId });
      _pendingDeckIndex = index;
      this.scene.restart();
    } catch (error) {
      console.error(error);
      this.showMessage(error instanceof Error ? error.message : 'Failed to activate deck.', '#ff6666');
    }
  }

  private refreshSaveBtn() {
    if (!this.saveBtnContainer) return;
    const graphics = this.saveBtnContainer.getAt(0) as Phaser.GameObjects.Graphics;
    const text = this.saveBtnContainer.getAt(1) as Phaser.GameObjects.Text;
    const w = 180; const h = 48;
    graphics.clear();
    if (this.isDirty) {
      graphics.fillStyle(0x000000, 0.4);
      graphics.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w, h, 6);
      graphics.fillStyle(0x444444, 1);
      graphics.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      graphics.fillStyle(0x999999, 1);
      graphics.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h / 2 - 4);
      graphics.fillStyle(0x666666, 1);
      graphics.fillRect(-w / 2 + 4, 0, w - 8, h / 2 - 4);
      text.setText('SAVE DECK');
      text.setColor('#c2baba');
      this.saveBtnContainer.setInteractive();
    } else {
      graphics.fillStyle(0x000000, 0.4);
      graphics.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w, h, 6);
      graphics.fillStyle(0x1a1a1a, 1);
      graphics.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      graphics.fillStyle(0x2a2a2a, 1);
      graphics.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h / 2 - 4);
      graphics.fillStyle(0x151515, 1);
      graphics.fillRect(-w / 2 + 4, 0, w - 8, h / 2 - 4);
      text.setText('SAVED');
      text.setColor('#555555');
      this.saveBtnContainer.disableInteractive();
    }
  }

  private refreshDeckStatusWidget() {
    this.deckStatusObjects.forEach(obj => obj.destroy());
    this.deckStatusObjects = [];

    const currentDeck = this.storage.decks[this.selectedDeckIndex];
    const isFull = this.currentDeckCards.length === this.slotLimit;
    const isActive = currentDeck.isActive;

    if (isFull && isActive) {
      const g = this.add.graphics();
      g.fillStyle(0x333333, 1);
      g.fillRoundedRect(930, 131, 180, 48, 4);
      g.lineStyle(2, 0xffcc00);
      g.strokeRoundedRect(930, 131, 180, 48, 4);
      const t = this.add.text(1020, 155, 'SELECTED', {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      this.deckStatusObjects.push(g, t);
    } else if (isFull && !isActive) {
      const btn = this.createMetalBtn(1020, 155, 180, 48, 'USE', () => this.activateAndSwitchDeck(this.selectedDeckIndex), '#00ff88');
      this.deckStatusObjects.push(btn);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x1e1e1e, 1);
      g.fillRoundedRect(930, 131, 180, 48, 4);
      g.lineStyle(2, 0x555555);
      g.strokeRoundedRect(930, 131, 180, 48, 4);
      const t = this.add.text(1020, 155, 'USE', {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '20px',
        color: '#555555',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      this.deckStatusObjects.push(g, t);
    }
  }

  private createDeckSlotsPanel() {
    this.deckSlotsContainer = this.add.container(110, 220); // container to hold the visual representation of the deck slots

    const g = this.add.graphics();
    g.fillStyle(0x141414, 0.96);
    g.fillRoundedRect(0, 0, 980, 220, 10);
    g.lineStyle(3, 0x555555);
    g.strokeRoundedRect(0, 0, 980, 220, 10);
    this.deckSlotsContainer.add(g);
  } // creates the panel where the player's current deck is displayed and edited 

  private renderDeckSlots() {
    this.deckSlotsContainer.removeAll(true);

    const g = this.add.graphics();
    g.fillStyle(0x141414, 0.96);
    g.fillRoundedRect(0, 0, 980, 220, 10);
    g.lineStyle(3, 0x555555);
    g.strokeRoundedRect(0, 0, 980, 220, 10);
    this.deckSlotsContainer.add(g);

    const slotPositions: { x: number; y: number }[] = [];

    // 8 + 7 + 6 = 21
    const rows = [
      { count: 8, startX: 38, y: 22 },
      { count: 7, startX: 92, y: 92 },
      { count: 6, startX: 145, y: 162 },
    ];

    rows.forEach(row => {
      for (let i = 0; i < row.count; i++) {
        slotPositions.push({ x: row.startX + i * 115, y: row.y });
      }
    }); // calculates the positions for the 21 card slots in the deck builder interface, arranged in three rows with specific spacing and alignment

    const unlockLetters = [
      ...Array(12).fill('R'),
      ...Array(3).fill('V'),
      ...Array(4).fill('E'),
      ...Array(2).fill('L'),
    ]; // defines the letters to display on locked slots based on the player's rank

    slotPositions.forEach((pos, index) => {
      const card = this.currentDeckCards[index] ?? null; // retrieves the card assigned to the current slot index
      const unlockedByRank = index < this.slotLimit;

      const slot = this.add.graphics(); // creates the visual representation of a single card slot
      slot.fillStyle(unlockedByRank ? 0x1f1f1f : 0x111111, 0.95); // fills the slot with a different color based on whether it's unlocked or locked by rank
      slot.fillRoundedRect(pos.x, pos.y, 90, 56, 10); // draws the rounded rectangle for the card slot
      slot.lineStyle(3, unlockedByRank ? 0xcc3333 : 0x777777); // sets the border color of the slot based on whether it's unlocked or locked by rank
      slot.strokeRoundedRect(pos.x, pos.y, 90, 56, 10); // draws the border for the card slot
      this.deckSlotsContainer.add(slot); // adds the slot graphics to the deckSlotsContainer

      if (card) {
        const text = this.add.text(pos.x + 45, pos.y + 28, this.getShortCardLabel(card), {
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: '16px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: 80 },
        }).setOrigin(0.5);

        const hitZone = this.add.rectangle(pos.x + 45, pos.y + 28, 90, 56, 0x000000, 0)
          .setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => this.removeCardFromDeck(index));
        this.deckSlotsContainer.add(text);
        this.deckSlotsContainer.add(hitZone);
      } 
      
      else if (!unlockedByRank) {
        const lockText = this.add.text(pos.x + 45, pos.y + 28, unlockLetters[index], {
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: '28px',
          color: '#ff3333',
          stroke: '#000000',
          strokeThickness: 5,
        }).setOrigin(0.5); // creates the text label for locked slots, displaying the corresponding letter based on the player's rank and the slot index

        this.deckSlotsContainer.add(lockText); // adds the lock text to the slot if it's locked by rank
      }
    });
  }

  private createBrowserPanel() {
    const { width, height } = this.cameras.main;
    const panelX = 90;
    const panelY = 465;
    const panelW = width - 180;
    const panelH = height - 555;

    const g = this.add.graphics();
    g.fillStyle(0x111111, 0.96);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    g.lineStyle(3, 0x555555);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

    this.browserContainer = this.add.container(panelX + 20, panelY + 20);
    this.browserPanelRect = new Phaser.Geom.Rectangle(panelX, panelY, panelW, panelH); // defines the rectangle area for the card browser panel, which will be used for masking and scrolling calculations

    const maskShape = this.make.graphics(); // creates a graphics object to define the mask shape for the card browser panel
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.browserMask = maskShape.createGeometryMask();
    this.browserContainer.setMask(this.browserMask);

    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      this.browserContainer.y -= deltaY * 0.6;
      this.limitBrowserScroll(panelY + 20, panelH);
    }); // adds an input listener for mouse wheel events to allow scrolling through the card browser panel
  }

  private renderBrowserCards() {
    this.browserContainer.removeAll(true);
    this.browserCardRefs.clear();

    const startX = 0;
    let yOffset = 0;
    const cardW = 105;
    const cardH = 138;
    const gap = 14;
    const columns = 8;

    for (const row of this.browserRows) {
        const title = this.add.text(0, yOffset, row.title, {
          fontFamily: 'Impact, Arial Black, sans-serif',
          fontSize: '28px',
          color: '#ffcc00',
          stroke: '#000000',
          strokeThickness: 5,
        }).setOrigin(0, 0);

        this.browserContainer.add(title);
        yOffset += 34;

        row.cards.forEach((card, index) => {
          const col = index % columns;
          const rowIndex = Math.floor(index / columns);

          const x = startX + col * (cardW + gap);
          const y = yOffset + rowIndex * (cardH + 12);

          const isUnlocked = canUseCardInDeck(card, this.clanRank);
          const isAlreadyAdded = this.currentDeckCards.some(c => c.id === card.id);
          const { container: cardObject, addedOverlay, addedText } = this.createBrowserCard(card, isUnlocked, isAlreadyAdded, getUnlockRankForCard(card));
          cardObject.setPosition(x, y);
          this.browserContainer.add(cardObject);
          if (addedOverlay && addedText) {
            this.browserCardRefs.set(String(card.id), { addedOverlay, addedText });
          }
        });

        const usedRows = Math.ceil(row.cards.length / columns);
        yOffset += usedRows * (cardH + 12) + 26;
    }

    this.browserContentHeight = yOffset;
  }

  private refreshBrowserCardStates() {
    for (const [cardId, { addedOverlay, addedText }] of this.browserCardRefs) {
      const inDeck = this.currentDeckCards.some(c => String(c.id) === cardId);
      addedOverlay.setVisible(inDeck);
      addedText.setVisible(inDeck);
    }
  }

  private createBrowserCard(
    card: Card,
    allowed: boolean,
    alreadyInDeck: boolean,
    unlockRank: ClanRank
  ): { container: Phaser.GameObjects.Container; addedOverlay: Phaser.GameObjects.Graphics | null; addedText: Phaser.GameObjects.Text | null } {
    const container = this.add.container(0, 0);

    const frameColor = ELEMENT_COLORS[card.element] ?? 0xffffff;

    const g = this.add.graphics();
    g.fillStyle(0x1c1c1c, 0.98);
    g.fillRoundedRect(0, 0, 105, 138, 8);
    g.lineStyle(3, frameColor, 1);
    g.strokeRoundedRect(0, 0, 105, 138, 8);

    const rarityLabel = this.add.text(52, 12, card.rarity.toUpperCase(), {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const nameText = this.add.text(52, 42, this.getBrowserCardName(card), {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 90 },
    }).setOrigin(0.5);

    const infoText = this.add.text(52, 106, this.getCardSummary(card), {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '12px',
      color: '#e5e5e5',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 92 },
    }).setOrigin(0.5);

    container.add([g, rarityLabel, nameText, infoText]);

    if (!allowed) {
      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.65);
      overlay.fillRoundedRect(0, 0, 105, 138, 8);
      container.add(overlay);

      const lockText = this.add.text(52, 69, `LOCKED\n${unlockRank}`, {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '18px',
        color: '#ff5555',
        stroke: '#000000',
        strokeThickness: 5,
        align: 'center',
      }).setOrigin(0.5);

      container.add(lockText);

      container.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, 105, 138),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });
      container.on('pointerdown', () => this.showMessage(`Unlocks at ${unlockRank}.`, '#ff6666'));
      return { container, addedOverlay: null, addedText: null };
    }

    const addedOverlay = this.add.graphics();
    addedOverlay.fillStyle(0x000000, 0.45);
    addedOverlay.fillRoundedRect(0, 0, 105, 138, 8);
    addedOverlay.setVisible(alreadyInDeck);

    const addedText = this.add.text(52, 69, 'ADDED', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '22px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setVisible(alreadyInDeck);

    container.add([addedOverlay, addedText]);

    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 105, 138),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!Phaser.Geom.Rectangle.Contains(this.browserPanelRect, pointer.worldX, pointer.worldY)) {
        return;
      }
      const inDeck = this.currentDeckCards.some(c => c.id === card.id);
      if (inDeck) {
        const idx = this.currentDeckCards.findIndex(c => c.id === card.id);
        if (idx !== -1) this.removeCardFromDeck(idx);
      } else {
        this.addCardToDeck(card);
      }
    });

    return { container, addedOverlay, addedText };
  }

  private addCardToDeck(card: Card) {
    if (!canUseCardInDeck(card, this.clanRank)) {
      this.showMessage(`This card is locked until ${getUnlockRankForCard(card)}.`, '#ff6666');
      return;
    } // checks if the card can be used in the deck based on the player's clan rank

    if (this.currentDeckCards.some(c => c.id === card.id)) {
      this.showMessage('This card is already in the deck.', '#ff6666');
      return;
    } // checks if the card is already in the current deck to prevent duplicates

    if (this.currentDeckCards.length >= this.slotLimit) {
      this.showMessage('Deck is full.', '#ff6666');
      return;
    } // checks if the current deck has reached the slot limit based on the player's rank before allowing a new card to be added

    this.currentDeckCards.push(card);
    this.isDirty = true;
    this.showMessage(`${card.name} added to deck.`, '#00ff88');
    this.renderDeckSlots();
    this.refreshBrowserCardStates();
    this.refreshSaveBtn();
    this.refreshDeckStatusWidget();
  }

  private removeCardFromDeck(index: number) {
    const removed = this.currentDeckCards[index];
    if (!removed) return; // if there's no card in the specified slot index, simply return without doing anything

    this.currentDeckCards.splice(index, 1);
    this.isDirty = true;
    this.showMessage(`${removed.name} removed from deck.`, '#ffcc00');
    this.renderDeckSlots();
    this.refreshBrowserCardStates();
    this.refreshSaveBtn();
    this.refreshDeckStatusWidget();
  }

  private switchDeck(index: number) {
    _pendingDeckIndex = index;
    this.scene.restart();
  }

  private async saveCurrentDeck() {
    const player = getPlayer();
    const playerId = Number(player?.id);

    if (!Number.isFinite(playerId) || playerId <= 0) {
      this.showMessage('No logged-in player found.', '#ff6666');
      return;
    } // checks if there's a valid logged-in player before attempting to save the deck to the backend

    try {
        const savedDeck = await saveDeckToBackend({
            playerId: playerId,
            slotIndex: this.selectedDeckIndex,
            characterGameId: this.deckCharacterGameIds[this.selectedDeckIndex],
            cardGameIds: this.currentDeckCards.map(card => Number(card.id)),
            makeActive: false,
        });

        if (savedDeck?.id) {
          this.deckIds[this.selectedDeckIndex] = savedDeck.id;
        }

        this.isDirty = false;
        this.refreshSaveBtn();
        this.showMessage(`Deck ${this.selectedDeckIndex + 1} saved successfully.`, '#00ff88');
    } catch (error) {
        console.error(error);
        this.showMessage(error instanceof Error ? error.message : 'Failed to save deck.', '#ff6666');
    }
  }

  private limitBrowserScroll(startY: number, panelHeight: number) {
    const minY = startY - Math.max(0, this.browserContentHeight - panelHeight + 30);
    if (this.browserContainer.y > startY) this.browserContainer.y = startY;
    if (this.browserContainer.y < minY) this.browserContainer.y = minY;
  } // limits the vertical scrolling of the card browser panel to prevent scrolling beyond the content area

  private getShortCardLabel(card: Card): string {
    if (card.rarity === 'base' && card.power !== null) {
      return `${card.element.toUpperCase()}\n${card.power}`;
    } // generates a short label for a card to display in the deck slots, showing the element and power for base cards, or just the name for other cards

    return card.name.replace(/\s+/g, '\n'); // for non-base cards, the label is simply the card's name with spaces replaced by newlines
  }

  private getBrowserCardName(card: Card): string {
    if (card.rarity === 'base' && card.power !== null) {
      return `${card.element.toUpperCase()} ${card.power}`;
    } // generates the name to display for a card in the browser panel

    return card.name.toUpperCase();
  }

  private getCardSummary(card: Card): string {
    if (card.rarity === 'base' && card.power !== null) {
      return `PWR ${card.power}`;
    } // generates a summary for a card to display in the deck slots, showing the power for base cards, or the element and energy costs for other cards

    return `${card.element.toUpperCase()}\nE:${card.energyECost} I:${card.energyICost}`;
  } // generates a summary for a card to display in the deck slots, showing the power for base cards, or the element and energy costs for other cards

  private showMessage(text: string, color = '#ffcc00') {
    this.messageText.setText(text);
    this.messageText.setColor(color);
  } // updates the message text in the message bar with the provided text and color

  private createBottomButtons() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;

    this.createMetalBtn(cx, height - 28, 280, 50, 'BACK TO MENU', () => {
      this.scene.start('MenuScene');
    });
  } // return to Menu button at the bottom of the screen

  private createMetalBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    callback: () => void,
    textColor = '#c2baba',
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const graphics = this.add.graphics();

    const draw = (pressed: boolean) => {
      graphics.clear();
      graphics.fillStyle(0x000000, 0.4);
      graphics.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w, h, 6);
      graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
      graphics.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      graphics.fillStyle(pressed ? 0x333333 : 0x999999, 1);
      graphics.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h / 2 - 4);
      graphics.fillStyle(pressed ? 0x111111 : 0x666666, 1);
      graphics.fillRect(-w / 2 + 4, 0, w - 8, h / 2 - 4);
    };

    draw(false);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '20px',
      color: textColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([graphics, text]);
    container
      .setSize(w, h)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { draw(true); text.y = 2; })
      .on('pointerup', () => { draw(false); text.y = 0; callback(); })
      .on('pointerout', () => { draw(false); text.y = 0; text.setColor(textColor); })
      .on('pointerover', () => { text.setColor('#226d1b'); });
    return container;
  } // same metal button style used in the MenuScene and the other scenes as well
}