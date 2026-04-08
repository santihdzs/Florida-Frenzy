import Phaser from 'phaser';
import {
  Card,
  buildHand,
  canPlayCard,
  drawOneCard,
  ELEMENT_COLORS,
  generateDeck,
  getBaseCardPool,
  shuffleCards,
} from '../utils/cards';

// Import assets directly for Vite
// Estos errores se arreglarian con un d.ts file, pero funciona bien
import backgroundImg from '../assets/backgrounds/everglades.jpg';
import enemyDefault from '../assets/characters/default/enemy-gator.png';
import enemyAttack1 from '../assets/characters/default/attack-1.png';
import enemyAttack2 from '../assets/characters/default/attack-2.png';
import enemyHurt1 from '../assets/characters/default/hurt-1.png';
import enemyHurt2 from '../assets/characters/default/hurt-2.png';

interface CombatState {
  shield: number;
  poisonTurnCounter: number;
  poisonDamage: number;
  burnTurnCounter: number;
  burnDamage: number;
  weakenTurnCounter: number;
  weakenEffectValue: number;
  reflectTurnCounter: number;
  reflectPercent: number;
  blockFireTurnCounter: number;
  stunTurnCounter: number;
  jamTurnCounter: number;
  chainFireBonus: number;
  sandBuffTurnCounter: number;
  sandBuffPercent: number;
  energyBoostTurnCounter: number;
  energyBoostPercent: number;
  discardDrawTurnCounter: number;
  blockedNumberTurnCounter:number | null;
}

export class DuelScene extends Phaser.Scene {
  // Game constants (can be tweaked for balance)
  private readonly MAX_HP = 100;
  private readonly MAX_ENERGY = 20;
  private readonly HAND_SIZE = 5;
  private readonly PLAYER_DECK_SIZE = 12;
  private readonly DISCARD_BASE_SIZE = 72; // 36 base cards * 2 (for duplicates in deck generation)

  private playerHp = this.MAX_HP;
  private enemyHp = this.MAX_HP;

  private playerElementalEnergy = 0;
  private playerInstinctEnergy = 0;
  private enemyElementalEnergy = 0;
  private enemyInstinctEnergy = 0;

  private roundsWon = 0;
  private levelCount = 0;

  private playerDeck: Card[] = [];
  private enemyDeck: Card[] = [];
  private playerHand: Card[] = [];
  private enemyHand: Card[] = [];
  private discardPile: Card[] = [];
  private tableCard!: Card;

  private playerState: CombatState = this.createEmptyCombatState();
  private enemyState: CombatState = this.createEmptyCombatState();

  private cardObjects: Phaser.GameObjects.Container[] = [];
  private currentTableCardObject?: Phaser.GameObjects.Container;
  private drawButton?: Phaser.GameObjects.Text; // the '?' on the variable declarations indicates that these properties are optional and may be undefined

  private roundText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private battleMessageText!: Phaser.GameObjects.Text;
  private tableCardLabel!: Phaser.GameObjects.Text;
  private discardCountText!: Phaser.GameObjects.Text;
  private deckCountText!: Phaser.GameObjects.Text;
  private playerShieldText!: Phaser.GameObjects.Text;
  private enemyShieldText!: Phaser.GameObjects.Text;

  private playerHpBar!: Phaser.GameObjects.Graphics;
  private enemyHpBar!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private playerEeBar!: Phaser.GameObjects.Graphics;
  private playerEiBar!: Phaser.GameObjects.Graphics;
  private enemyEeBar!: Phaser.GameObjects.Graphics;
  private enemyEiBar!: Phaser.GameObjects.Graphics;

  private playerDamageText!: Phaser.GameObjects.Text;
  private enemyDamageText!: Phaser.GameObjects.Text;

  private playerCharacter!: Phaser.GameObjects.Image;
  private enemyCharacter!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Graphics;
  private enemyShadow!: Phaser.GameObjects.Graphics;

  private isAnimating = false;
  private currentEnemyImage = 'enemy-default';

  // Scene lifecycle methods
  constructor() {
    super({ key: 'DuelScene' });
  }

  init(data: { levelCount?: number }) {
    this.levelCount = data.levelCount ?? 0; // for reference: '??' stands for nullish coalescing, so if data.levelCount is undefined or null, it will default to 0
  }

  preload() {
    // Load background image
    this.load.image('background', backgroundImg);
    // Load enemy character images
    this.load.image('enemy-default', enemyDefault);
    this.load.image('enemy-attack-1', enemyAttack1);
    this.load.image('enemy-attack-2', enemyAttack2);
    this.load.image('enemy-hurt-1', enemyHurt1);
    this.load.image('enemy-hurt-2', enemyHurt2);
  }

  // Set up the scene with background, HUD, characters, and initial game state
  create() {
    const { width, height } = this.cameras.main; // Main camera dimensions for centering elements
    const centerX = width / 2;

    this.resetDuelState(); // initialize or reset all game state variables for a new duel

    this.add.image(centerX, height / 2, 'background');

    this.drawHudPanels();
    this.createHud();
    this.createCharacters();
    this.setupDecks();
    this.renderTableCard();
    this.renderCards();
    this.refreshHud();
    this.updateInstruction();
  }

  private createEmptyCombatState(): CombatState {
    return {
      shield: 0,
      poisonTurnCounter: 0,
      poisonDamage: 0,
      burnTurnCounter: 0,
      burnDamage: 0,
      weakenTurnCounter: 0,
      weakenEffectValue: 0,
      reflectTurnCounter: 0,
      reflectPercent: 0,
      blockFireTurnCounter: 0,
      stunTurnCounter: 0,
      jamTurnCounter: 0,
      chainFireBonus: 0,
      sandBuffTurnCounter: 0,
      sandBuffPercent: 0,
      energyBoostTurnCounter: 0,
      energyBoostPercent: 0,
      discardDrawTurnCounter: 0,
      blockedNumberTurnCounter: null, // set at null to indicate no card is currently blocked, will store the power value of the blocked card when a block is active
    };
  }

private resetDuelState() {
  this.playerHp = this.MAX_HP;
  this.enemyHp = this.MAX_HP;

  this.playerElementalEnergy = 0;
  this.playerInstinctEnergy = 0;
  this.enemyElementalEnergy = 0;
  this.enemyInstinctEnergy = 0;

  this.roundsWon = 0;

  this.playerDeck = [];
  this.enemyDeck = [];
  this.playerHand = [];
  this.enemyHand = [];
  this.discardPile = [];

  this.playerState = this.createEmptyCombatState();
  this.enemyState = this.createEmptyCombatState();

  this.cardObjects = [];
  this.currentTableCardObject = undefined;

  this.isAnimating = false;
  this.currentEnemyImage = 'enemy-default';
}

  private drawHudPanels() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    const panels = this.add.graphics();
    panels.fillStyle(0x000000, 0.72);

    // left status panel
    panels.fillRoundedRect(25, 20, 315, 160, 18);
    // right status panel
    panels.fillRoundedRect(width - 340, 20, 315, 160, 18);
    // top center info panel
    panels.fillRoundedRect(centerX - 190, 24, 380, 90, 18);
    // center table area
    panels.fillRoundedRect(centerX - 210, 165, 420, 260, 24);
    // bottom hand area
    panels.fillRoundedRect(centerX - 430, height - 235, 860, 210, 24);
    // deck/discard mini area
    panels.fillRoundedRect(centerX - 310, 440, 620, 78, 18);
  }

  // All the texts, bars, labels, buttons, counters
  private createHud() {
    // top center info panel
    const centerX = this.cameras.main.width / 2;

    // Round # text square
    this.roundText = this.add.text(centerX, 50, 'Round 1', {
      fontSize: '36px',
      color: '#ffaa00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Battle message text below round number
    this.battleMessageText = this.add.text(centerX, 86, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Instruction text at bottom of info panel
    this.tableCardLabel = this.add.text(centerX, 192, 'Table Card', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.instructionText = this.add.text(centerX, 540, 'Choose a valid card or right-click to discard.', {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Draw button on bottom right to eat cards if player doesn't have any cards left on deck (or just as a reminder that they can discard if they have bad cards in hand)
    this.drawButton = this.add.text(centerX, 475, 'Draw', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#245fdd',
      padding: { left: 14, right: 14, top: 8, bottom: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.drawButton?.setScale(1.05))
      .on('pointerout', () => this.drawButton?.setScale(1))
      .on('pointerdown', () => this.handlePlayerDrawAction());

    // Player HUD
    this.add.text(48, 34, 'Player', { fontSize: '22px', color: '#00ff88', fontStyle: 'bold' });
    this.playerHpBar = this.add.graphics();
    this.playerHpText = this.add.text(48, 86, '', { fontSize: '16px', color: '#ffffff' });
    this.playerShieldText = this.add.text(48, 108, '', { fontSize: '15px', color: '#7fd7ff' });
    this.add.text(48, 125, 'EE', { fontSize: '15px', color: '#9ae66e', fontStyle: 'bold' });
    this.playerEeBar = this.add.graphics();
    this.add.text(48, 155, 'EI', { fontSize: '15px', color: '#69c0ff', fontStyle: 'bold' });
    this.playerEiBar = this.add.graphics();

    // Enemy HUD
    this.add.text(this.cameras.main.width - 292, 34, 'Enemy', { fontSize: '22px', color: '#ff6666', fontStyle: 'bold' });
    this.enemyHpBar = this.add.graphics();
    this.enemyHpText = this.add.text(this.cameras.main.width - 292, 86, '', { fontSize: '16px', color: '#ffffff' });
    this.enemyShieldText = this.add.text(this.cameras.main.width - 292, 108, '', { fontSize: '15px', color: '#7fd7ff' });
    this.add.text(this.cameras.main.width - 292, 125, 'EE', { fontSize: '15px', color: '#9ae66e', fontStyle: 'bold' });
    this.enemyEeBar = this.add.graphics();
    this.add.text(this.cameras.main.width - 292, 155, 'EI', { fontSize: '15px', color: '#69c0ff', fontStyle: 'bold' });
    this.enemyEiBar = this.add.graphics();

    this.playerDamageText = this.add.text(215, 85, '', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold',
    });

    this.enemyDamageText = this.add.text(this.cameras.main.width - 125, 85, '', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold',
    });

    this.deckCountText = this.add.text(centerX - 248, 466, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.discardCountText = this.add.text(centerX + 245, 466, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.drawDeckPlaceholder(centerX - 135, 478, 'Deck'); // Deck and discard placeholders (store in variables to update counts)
    this.drawDeckPlaceholder(centerX + 135, 478, 'Discard'); // (store in variables to update counts)
  }

  
  private createCharacters() {
    const centerY = 327; // a bit above center to leave room for HP bars and damage text

    this.playerShadow = this.add.graphics();
    this.playerShadow.fillStyle(0x000000, 0.3);
    this.playerShadow.fillEllipse(270, 417, 170, 28);

    this.enemyShadow = this.add.graphics();
    this.enemyShadow.fillStyle(0x000000, 0.3);
    this.enemyShadow.fillEllipse(1010, 417, 170, 28);

    // Placeholder: use same sprite mirrored until player asset is available.
    this.playerCharacter = this.add.image(270, centerY, 'enemy-default').setScale(-0.38, 0.38);
    this.enemyCharacter = this.add.image(1010, centerY, this.currentEnemyImage).setScale(0.38);
  }

  private setupDecks() {
    // Generate decks and initial hands 
    this.playerDeck = generateDeck(this.PLAYER_DECK_SIZE);
    this.enemyDeck = generateDeck(this.PLAYER_DECK_SIZE);

    // Randomly draw initial hands from decks (removing from deck)
    this.playerHand = buildHand(this.playerDeck, this.HAND_SIZE);
    this.enemyHand = buildHand(this.enemyDeck, this.HAND_SIZE);

    this.discardPile = this.createBaseDiscardPile(this.DISCARD_BASE_SIZE); // create discard pile with base cards (will be added to as cards are played/discarded)
    const openingCard = this.createBaseDiscardPile(1)[0]; // the centered card to be played with at the start

    if (!openingCard) {
      throw new Error('Could not generate initial table card.'); // only if createBaseDiscardPile returns an empty array, only for null checks 
    }

    this.tableCard = openingCard;
  }

  private createBaseDiscardPile(size: number): Card[] {
    const basePool = getBaseCardPool();
    const cards: Card[] = [];

    // to randomize the discard pile, we loop through the desired size and keep adding cards from the base pool in order
    for (let i = 0; i < size; i += 1) {
      const source = basePool[i % basePool.length];
      cards.push({
        ...source, // for reference, the '...' syntax is the spread operator, which creates a shallow copy of the source card object to ensure that we don't accidentally modify the original card definitions in the base pool when we add unique IDs for the discard pile
        id: `${source.id}-discard-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, // to mark discarded cards with unique IDs, we append a suffix to the original card ID that includes the index, current timestamp, and a random string; ensuring that even if the same card is discarded multiple times, each instance in the discard pile will have a unique ID
      });
    }

    return shuffleCards(cards);
  }

  // For constantly updating HP/energy bars, shield text, and deck/discard counts after actions are taken
  private refreshHud() {
    this.updateHpBar(this.playerHpBar, this.playerHp, 48, 58, this.playerHpText);
    this.updateHpBar(this.enemyHpBar, this.enemyHp, this.cameras.main.width - 292, 58, this.enemyHpText);
    this.updateEnergyBar(this.playerEeBar, this.playerElementalEnergy, 82, 126, 220, 12, 0x7cd957);
    this.updateEnergyBar(this.playerEiBar, this.playerInstinctEnergy, 82, 154, 220, 12, 0x4db8ff);
    this.updateEnergyBar(this.enemyEeBar, this.enemyElementalEnergy, this.cameras.main.width - 258, 126, 220, 12, 0x7cd957);
    this.updateEnergyBar(this.enemyEiBar, this.enemyInstinctEnergy, this.cameras.main.width - 258, 154, 220, 12, 0x4db8ff);

    this.playerShieldText.setText(`Shield: ${this.playerState.shield}`);
    this.enemyShieldText.setText(`Shield: ${this.enemyState.shield}`);
    this.deckCountText.setText(`Deck: ${this.playerDeck.length}`);
    this.discardCountText.setText(`Discard: ${this.discardPile.length}`);
  }

  private updateHpBar(
    graphics: Phaser.GameObjects.Graphics,
    hp: number,
    x: number,
    y: number,
    hpText: Phaser.GameObjects.Text,
  ) {
    graphics.clear();
    graphics.fillStyle(0x333333, 0.95);
    graphics.fillRoundedRect(x, y, 240, 20, 8);

    // color changes based on HP percentage: green above 50%, orange between 25% and 50%, red below 25%
    const color = hp > 50 ? 0x00ff88 : hp > 25 ? 0xffaa00 : 0xff4444;
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x, y, (Phaser.Math.Clamp(hp, 0, this.MAX_HP) / this.MAX_HP) * 240, 20, 8);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRoundedRect(x, y, 240, 20, 8);
    hpText.setText(`${Math.max(0, hp)}/${this.MAX_HP} HP`);
  }

  private updateEnergyBar(
    graphics: Phaser.GameObjects.Graphics,
    value: number,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number,
  ) {
    graphics.clear();
    graphics.fillStyle(0x2b2b2b, 0.95);
    graphics.fillRoundedRect(x, y, width, height, 6);
    graphics.fillStyle(fillColor, 1);
    graphics.fillRoundedRect(x, y, (Phaser.Math.Clamp(value, 0, this.MAX_ENERGY) / this.MAX_ENERGY) * width, height, 6);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRoundedRect(x, y, width, height, 6);
  }

  private drawDeckPlaceholder(x: number, y: number, label: string) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a1a, 0.9);
    bg.fillRoundedRect(-32, -42, 64, 84, 12);
    bg.lineStyle(2, 0xffffff, 0.85);
    bg.strokeRoundedRect(-32, -42, 64, 84, 12);

    const text = this.add.text(0, 0, label, {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, text]);
  }

  private renderCards() {
    this.cardObjects.forEach((cardObject) => cardObject.destroy());
    this.cardObjects = [];

    const centerX = this.cameras.main.width / 2;
    const startX = centerX - 310;
    const y = this.cameras.main.height - 110;
    const spacing = 155;

    this.playerHand.forEach((card, index) => {
      const x = startX + index * spacing;
      const isPlayable = this.isPlayerCardPlayable(card);
      const cardContainer = this.createCardContainer(x, y, card, isPlayable);
      this.cardObjects.push(cardContainer);
    });
  }

  private renderTableCard(highlightColor = 0xffffff) {
    this.currentTableCardObject?.destroy();
    const centerX = this.cameras.main.width / 2;
    this.currentTableCardObject = this.createCardContainer(centerX, 305, this.tableCard, true, true, highlightColor);
  }

  private createCardContainer( // visual representation of a card, with interactivity for playable cards and different styling for static table card
    x: number,
    y: number,
    card: Card,
    isPlayable: boolean,
    isStatic = false,
    outlineColor = 0xffffff,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();

    const baseColor = ELEMENT_COLORS[card.element] ?? 0xffffff;
    bg.fillStyle(baseColor, isPlayable || isStatic ? 1 : 0.45);
    bg.fillRoundedRect(-58, -78, 116, 156, 12);
    bg.lineStyle(3, outlineColor, 1);
    bg.strokeRoundedRect(-58, -78, 116, 156, 12);

    const rarityLabel = this.add.text(0, -54, card.rarity.toUpperCase(), {
      fontSize: '11px',
      color: '#f3f3f3',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const elementText = this.add.text(0, -26, card.element.toUpperCase(), {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const powerValue = card.power === null ? 'FX' : String(card.power);
    const powerText = this.add.text(0, 28, powerValue, {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const footerText = this.add.text(0, 58, isStatic ? 'TABLE' : (isPlayable ? 'PLAY' : 'LOCK'), {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, rarityLabel, elementText, powerText, footerText]);
    container.setSize(116, 156);

    if (!isStatic) { // if the card is in the player's hand, we add interactivity to play or discard it
      container.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (!this.isAnimating) container.setScale(isPlayable ? 1.08 : 1.03);
        })
        .on('pointerout', () => {
          container.setScale(1);
        })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) {
            this.discardPlayerCard(card);
            return;
          }

          if (!this.isPlayerCardPlayable(card)) {
            this.showBattleMessage('Invalid move. Draw or discard.', '#ff6666');
            return;
          }

          this.playPlayerCard(card);
        });
    }

    return container;
  }

  private isPlayerCardPlayable(card: Card): boolean {
    if (!canPlayCard(card, this.tableCard)) return false;
    if (this.playerState.blockedNumberTurnCounter !== null && card.power === this.playerState.blockedNumberTurnCounter) return false;
    return true;
  }

  private handlePlayerDrawAction() {
    if (this.isAnimating) return; // prevent drawing if an animation is currently playing to avoid state conflicts

    const hasPlayable = this.playerHand.some((card) => this.isPlayerCardPlayable(card));
    if (hasPlayable) {
      this.showBattleMessage('You already have a valid move.', '#ffaa00'); // in case the player clicks the draw button when they still have playable cards in hand
      return;
    }

    const drawn = this.drawUntilPlayable('player', this.tableCard, true);
    if (drawn) {
      this.showBattleMessage(`Drawn: ${drawn.element.toUpperCase()} ${drawn.power ?? 'FX'}`, '#00d4ff');
    } else {
      this.showBattleMessage('No playable card found.', '#ff6666');
    }

    this.refreshHud();
    this.renderCards();
    this.updateInstruction();
  }

  private playPlayerCard(card: Card) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id);
    this.discardPile.push(card);

    const previousTableCard = this.tableCard;
    this.tableCard = card;
    this.renderTableCard(0x00ff88);
    this.addEnergyFromCard(card, 'player', previousTableCard);
    this.applyCardEffects(card, 'player');
    this.animateEnemyAttack();

    this.time.delayedCall(550, () => {
      if (this.checkCombatEnded()) return;
      this.handleEnemyTurn();
    });
  }

  private handleEnemyTurn() {
    this.applyStartOfTurnStatusEffects('enemy');
    if (this.checkCombatEnded()) return;

    if (this.enemyState.stunTurnCounter > 0) {
      this.enemyState.stunTurnCounter -= 1;
      this.showBattleMessage('Enemy is stunned!', '#7ed9ff');
      this.finishRound();
      return;
    }

    const enemyCard = this.getEnemyPlayableCard();
    if (!enemyCard) {
      this.showBattleMessage('Enemy cannot play.', '#ffaa00');
      this.finishRound();
      return;
    }

    this.discardPile.push(enemyCard);
    const previousTableCard = this.tableCard;
    this.tableCard = enemyCard;
    this.renderTableCard(0xff6666);
    this.addEnergyFromCard(enemyCard, 'enemy', previousTableCard);
    this.applyCardEffects(enemyCard, 'enemy');
    this.updateEnemyPose();

    this.time.delayedCall(700, () => {
      if (this.checkCombatEnded()) return;
      this.finishRound();
    });
  }

  private finishRound() {
    this.endOfRoundDraw(this.playerHand, this.playerDeck);
    this.endOfRoundDraw(this.enemyHand, this.enemyDeck);

    this.applyStartOfTurnStatusEffects('player');
    if (this.checkCombatEnded()) return;

    this.tickEndOfTurnFlags(this.playerState);
    this.tickEndOfTurnFlags(this.enemyState);

    this.refreshHud();
    this.renderCards();
    this.updateInstruction();
    this.playerDamageText.setText('');
    this.enemyDamageText.setText('');
    this.isAnimating = false;
  }

  private getEnemyPlayableCard(): Card | null {
    let chosen = this.enemyHand.find((card) => this.isEnemyCardPlayable(card)) ?? null;

    if (!chosen) {
      chosen = this.drawUntilPlayable('enemy', this.tableCard, true);
    }

    if (!chosen) return null;

    this.enemyHand = this.enemyHand.filter((handCard) => handCard.id !== chosen?.id);
    return chosen;
  }

  private isEnemyCardPlayable(card: Card): boolean {
    if (!canPlayCard(card, this.tableCard)) return false;
    if (this.enemyState.blockedNumberTurnCounter !== null && card.power === this.enemyState.blockedNumberTurnCounter) return false;
    if (this.enemyState.jamTurnCounter > 0 && card.rarity !== 'base') return false;
    if (this.enemyState.blockFireTurnCounter > 0 && card.element === 'fire') return false;
    return true;
  }

  private drawUntilPlayable(
    side: 'player' | 'enemy',
    tableCard: Card,
    addToHand: boolean,
  ): Card | null {
    const deck = side === 'player' ? this.playerDeck : this.enemyDeck;
    const hand = side === 'player' ? this.playerHand : this.enemyHand;

    while (deck.length > 0) {
      const candidate = drawOneCard(deck);
      if (!candidate) break;

      hand.push(candidate);
      if ((side === 'player' ? this.isPlayerCardPlayable(candidate) : this.isEnemyCardPlayable(candidate)) && canPlayCard(candidate, tableCard)) {
        return candidate;
      }
    }

    const discardLen = this.discardPile.length;
    for (let i = 0; i < discardLen; i += 1) {
      const candidate = drawOneCard(this.discardPile);
      if (!candidate) break;

      this.incrementDiscardFatigue(side);

      const isPlayable = side === 'player' ? this.isPlayerCardPlayable(candidate) : this.isEnemyCardPlayable(candidate);
      if (isPlayable && canPlayCard(candidate, tableCard)) {
        if (addToHand) {
          hand.push(candidate);
        }
        return candidate;
      }

      this.discardPile.push(candidate);
    }

    return null;
  }

  private incrementDiscardFatigue(side: 'player' | 'enemy') {
    const state = side === 'player' ? this.playerState : this.enemyState;
    state.discardDrawTurnCounter += 1;

    if (state.discardDrawTurnCounter % 10 !== 0) return;

    const threshold = state.discardDrawTurnCounter;
    const damage = threshold >= 30 ? 9 : threshold >= 20 ? 7 : 5;
    this.applyDirectDamage(side, damage, `${damage} fatigue`);
  }

  private endOfRoundDraw(hand: Card[], deck: Card[]) {
    const nextCard = drawOneCard(deck);
    if (nextCard) {
      hand.push(nextCard);
    }
  }

  private applyCardEffects(card: Card, attacker: 'player' | 'enemy') {
    const isPlayer = attacker === 'player';
    const attackerState = isPlayer ? this.playerState : this.enemyState;
    const defenderState = isPlayer ? this.enemyState : this.playerState;

    let damage = card.baseDamage;
    let selfDamage = 0;

    if (attackerState.weakenTurnCounter > 0) {
      damage = Math.max(0, damage - attackerState.weakenEffectValue);
    }

    if (attackerState.chainFireBonus > 0 && card.element === 'fire') {
      damage += attackerState.chainFireBonus;
      attackerState.chainFireBonus = 0;
    }

    if (attackerState.sandBuffTurnCounter > 0 && card.element === 'sand') {
      damage += Math.ceil(damage * attackerState.sandBuffPercent / 100);
    }

    switch (card.effect) {
      case 'DAMAGE':
        break;

      case 'SHIELD':
        attackerState.shield += card.shieldValue;
        damage = 0;
        break;

      case 'POISON':
        defenderState.poisonTurnCounter = Math.max(defenderState.poisonTurnCounter, card.effectDuration);
        defenderState.poisonDamage = Math.max(defenderState.poisonDamage, card.effectValue);
        damage = 0;
        break;

      case 'WEAKEN':
        defenderState.weakenTurnCounter = Math.max(defenderState.weakenTurnCounter, card.effectDuration || 1);
        defenderState.weakenEffectValue = Math.max(defenderState.weakenEffectValue, card.effectValue);
        damage = 0;
        break;

      case 'BURN':
        defenderState.burnTurnCounter = Math.max(defenderState.burnTurnCounter, card.effectDuration);
        defenderState.burnDamage = Math.max(defenderState.burnDamage, card.effectValue);
        break;

      case 'BLOCK_FIRE':
        defenderState.blockFireTurnCounter = Math.max(defenderState.blockFireTurnCounter, card.effectDuration || 1);
        break;

      case 'RAGE':
        if ((isPlayer ? this.playerHp : this.enemyHp) <= this.MAX_HP / 2) {
          damage *= 2;
        }
        break;

      case 'EXPLOSION':
        selfDamage = card.effectValue;
        break;

      case 'CHAIN':
        attackerState.chainFireBonus = Math.max(attackerState.chainFireBonus, card.effectValue);
        break;

      case 'HEAL':
        attackerState.shield += card.shieldValue;
        this.healSide(attacker, Math.ceil(card.shieldValue * (card.effectValue / 100)));
        damage = 0;
        break;

      case 'DOUBLE_SHIELD':
        attackerState.shield = attackerState.shield > 0 ? attackerState.shield * 2 : card.shieldValue;
        damage = 0;
        break;

      case 'CLEANSE':
        this.cleanseNegative(attackerState);
        damage = 0;
        break;

      case 'REFLECT':
        attackerState.reflectTurnCounter = Math.max(attackerState.reflectTurnCounter, card.effectDuration || 1);
        attackerState.reflectPercent = Math.max(attackerState.reflectPercent, card.effectValue);
        damage = 0;
        break;

      case 'ENERGY_BOOST':
        attackerState.energyBoostTurnCounter = Math.max(attackerState.energyBoostTurnCounter, card.effectDuration || 1);
        attackerState.energyBoostPercent = Math.max(attackerState.energyBoostPercent, card.effectValue);
        damage = 0;
        break;

      case 'TOXIC':
        defenderState.poisonTurnCounter = Math.max(defenderState.poisonTurnCounter, card.effectDuration);
        defenderState.poisonDamage = Math.max(defenderState.poisonDamage, card.effectValue);
        damage = 0;
        break;

      case 'DECAY':
        defenderState.shield = Math.max(0, defenderState.shield - Math.ceil(defenderState.shield * (card.effectValue / 100)));
        damage = 0;
        break;

      case 'EXTEND':
        defenderState.poisonTurnCounter += card.effectValue;
        defenderState.burnTurnCounter += card.effectValue;
        defenderState.weakenTurnCounter += card.effectValue;
        damage = 0;
        break;

      case 'WEAKEN_ATTACK':
        defenderState.weakenTurnCounter = Math.max(defenderState.weakenTurnCounter, card.effectDuration || 1);
        defenderState.weakenEffectValue = Math.max(defenderState.weakenEffectValue, card.effectValue);
        damage = 0;
        break;

      case 'LIFESTEAL':
        this.healSide(attacker, Math.ceil(damage * (card.effectValue / 100)));
        break;

      case 'BLOCK_NUMBER':
        defenderState.blockedNumberTurnCounter = this.tableCard.power;
        damage = 0;
        break;

      case 'BLIND':
        damage = 0;
        break;

      case 'SHIELD_BOOST':
        attackerState.shield += card.shieldValue;
        damage = 0;
        break;

      case 'WILDCARD':
        damage = 0;
        break;

      case 'BUFF':
        attackerState.sandBuffTurnCounter = Math.max(attackerState.sandBuffTurnCounter, card.effectDuration || 1);
        attackerState.sandBuffPercent = Math.max(attackerState.sandBuffPercent, card.effectValue);
        damage = 0;
        break;

      case 'STUN':
        defenderState.stunTurnCounter = Math.max(defenderState.stunTurnCounter, card.effectDuration || 1);
        damage = 0;
        break;

      case 'JAM':
        defenderState.jamTurnCounter = Math.max(defenderState.jamTurnCounter, card.effectDuration || 1);
        damage = 0;
        break;

      case 'DOUBLE_PLAY':
      case 'FORCE_DRAW':
      case 'AMPLIFY':
      case 'IMMUNITY':
      case 'HAND_RESET':
      case 'RANDOM_STATUS':
      case 'EXECUTE':
        damage = card.baseDamage;
        break;

      default:
        break;
    }

    if (damage > 0) {
      this.applyAttackDamage(attacker, damage, card.element);
    }

    if (selfDamage > 0) {
      this.applyDirectDamage(attacker, selfDamage, `${selfDamage} recoil`);
    }

    this.refreshHud();
  }

  private applyAttackDamage(attacker: 'player' | 'enemy', rawDamage: number, element: Card['element']) {
    const isPlayer = attacker === 'player';
    const defenderState = isPlayer ? this.enemyState : this.playerState;
    const reflectState = defenderState;

    let remainingDamage = rawDamage;

    if (defenderState.shield > 0) {
      const absorbed = Math.min(defenderState.shield, remainingDamage);
      defenderState.shield -= absorbed;
      remainingDamage -= absorbed;
    }

    if (remainingDamage <= 0) {
      this.showBattleMessage('Shield blocked the attack!', '#7fd7ff');
      return;
    }

    if (isPlayer) {
      this.enemyHp = Math.max(0, this.enemyHp - remainingDamage);
      this.enemyDamageText.setText(`-${remainingDamage}`);
      this.showBattleMessage(`Player used ${element.toUpperCase()}`, '#00ff88');
    } else {
      this.playerHp = Math.max(0, this.playerHp - remainingDamage);
      this.playerDamageText.setText(`-${remainingDamage}`);
      this.showBattleMessage(`Enemy used ${element.toUpperCase()}`, '#ff6666');
    }

    if (reflectState.reflectTurnCounter > 0) {
      const reflected = Math.max(1, Math.floor(remainingDamage * (reflectState.reflectPercent / 100)));
      if (isPlayer) {
        this.playerHp = Math.max(0, this.playerHp - reflected);
        this.playerDamageText.setText(`-${reflected}`);
      } else {
        this.enemyHp = Math.max(0, this.enemyHp - reflected);
        this.enemyDamageText.setText(`-${reflected}`);
      }
    }
  }

  private applyDirectDamage(side: 'player' | 'enemy', amount: number, reason: string) {
    if (amount <= 0) return;

    const state = side === 'player' ? this.playerState : this.enemyState;
    let remaining = amount;

    if (state.shield > 0) {
      const absorbed = Math.min(state.shield, remaining);
      state.shield -= absorbed;
      remaining -= absorbed;
    }

    if (remaining <= 0) return;

    if (side === 'player') {
      this.playerHp = Math.max(0, this.playerHp - remaining);
      this.playerDamageText.setText(`-${remaining}`);
    } else {
      this.enemyHp = Math.max(0, this.enemyHp - remaining);
      this.enemyDamageText.setText(`-${remaining}`);
    }

    this.showBattleMessage(reason, '#ffaa00');
    this.refreshHud();
  }

  private healSide(side: 'player' | 'enemy', amount: number) {
    if (amount <= 0) return;
    if (side === 'player') {
      this.playerHp = Math.min(this.MAX_HP, this.playerHp + amount);
    } else {
      this.enemyHp = Math.min(this.MAX_HP, this.enemyHp + amount);
    }
  }

  private cleanseNegative(state: CombatState) {
    state.poisonTurnCounter = 0;
    state.poisonDamage = 0;
    state.burnTurnCounter = 0;
    state.burnDamage = 0;
    state.weakenTurnCounter = 0;
    state.weakenEffectValue = 0;
    state.blockFireTurnCounter = 0;
    state.blockedNumberTurnCounter = null;
  }

  private applyStartOfTurnStatusEffects(side: 'player' | 'enemy') {
    const state = side === 'player' ? this.playerState : this.enemyState;

    if (state.poisonTurnCounter > 0) {
      this.applyDirectDamage(side, state.poisonDamage, `${state.poisonDamage} poison`);
      state.poisonTurnCounter -= 1;
    }

    if (state.burnTurnCounter > 0) {
      this.applyDirectDamage(side, state.burnDamage, `${state.burnDamage} burn`);
      state.burnTurnCounter -= 1;
    }
  }

  private tickEndOfTurnFlags(state: CombatState) {
    if (state.weakenTurnCounter > 0) state.weakenTurnCounter -= 1;
    if (state.reflectTurnCounter > 0) state.reflectTurnCounter -= 1;
    if (state.blockFireTurnCounter > 0) state.blockFireTurnCounter -= 1;
    if (state.jamTurnCounter > 0) state.jamTurnCounter -= 1;
    if (state.sandBuffTurnCounter > 0) state.sandBuffTurnCounter -= 1;
    if (state.energyBoostTurnCounter > 0) state.energyBoostTurnCounter -= 1;

    if (state.weakenTurnCounter === 0) state.weakenEffectValue = 0;
    if (state.reflectTurnCounter === 0) state.reflectPercent = 0;
    if (state.sandBuffTurnCounter === 0) state.sandBuffPercent = 0;
    if (state.energyBoostTurnCounter === 0) state.energyBoostPercent = 0;
    if (state.blockFireTurnCounter === 0) state.blockedNumberTurnCounter = null;
  }

  private addEnergyFromCard(card: Card, side: 'player' | 'enemy', previousTableCard: Card) {
    const doubleMatch = this.isDoubleMatch(card, previousTableCard);
    const state = side === 'player' ? this.playerState : this.enemyState;
    const bonusMultiplier = state.energyBoostTurnCounter > 0 ? (1 + state.energyBoostPercent / 100) : 1;

    const elementalGainBase = doubleMatch ? card.energyEGain + 1 : card.energyEGain;
    const instinctGainBase = doubleMatch ? card.energyIGain + 1 : card.energyIGain;
    const elementalGain = Math.ceil(elementalGainBase * bonusMultiplier);
    const instinctGain = Math.ceil(instinctGainBase * bonusMultiplier);

    if (side === 'player') {
      this.playerElementalEnergy = Math.min(this.MAX_ENERGY, this.playerElementalEnergy + elementalGain);
      this.playerInstinctEnergy = Math.min(this.MAX_ENERGY, this.playerInstinctEnergy + instinctGain);
    } else {
      this.enemyElementalEnergy = Math.min(this.MAX_ENERGY, this.enemyElementalEnergy + elementalGain);
      this.enemyInstinctEnergy = Math.min(this.MAX_ENERGY, this.enemyInstinctEnergy + instinctGain);
    }
  }

  private isDoubleMatch(card: Card, previousTableCard: Card): boolean {
    return card.element === previousTableCard.element && card.power !== null && previousTableCard.power !== null && card.power === previousTableCard.power;
  }

  private updateInstruction() {
    const hasPlayable = this.playerHand.some((card) => this.isPlayerCardPlayable(card));
    const text = hasPlayable
      ? 'Choose a valid card or right-click to discard.'
      : 'No valid move in hand. Press Draw or right-click to discard.';

    this.instructionText.setText(text);
  }

  private showBattleMessage(message: string, color = '#ffffff') {
    this.battleMessageText.setText(message);
    this.battleMessageText.setColor(color);
  }

  private animateEnemyAttack() {
    const attackImages = ['enemy-attack-1', 'enemy-attack-2'];
    const attackImage = attackImages[Math.floor(Math.random() * attackImages.length)];
    this.enemyCharacter.setTexture(attackImage);
    this.enemyCharacter.setScale(0.42);
    this.enemyCharacter.setY(320);
  }

  private updateEnemyPose() {
    const hpPercent = this.enemyHp;
    if (hpPercent <= 25) {
      this.currentEnemyImage = 'enemy-hurt-2';
      this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(0.52).setY(340);
      return;
    }

    if (hpPercent <= 50) {
      this.currentEnemyImage = 'enemy-hurt-1';
      this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(0.42).setY(327);
      return;
    }

    this.currentEnemyImage = 'enemy-default';
    this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(0.38).setY(327);
  }

  private discardPlayerCard(card: Card) {
    if (this.isAnimating) return;

    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id);
    this.discardPile.push(card);
    this.endOfRoundDraw(this.playerHand, this.playerDeck);
    this.showBattleMessage('Card discarded', '#ffaa00');
    this.refreshHud();
    this.renderCards();
    this.updateInstruction();
  }

  private checkCombatEnded(): boolean {
    this.refreshHud();

    if (this.playerHp <= 0) {
      this.gameOver();
      return true;
    }

    if (this.enemyHp <= 0) {
      this.roundsWon += 1;
      this.roundText.setText(`Round ${this.roundsWon + 1}`);
      this.showVictoryCutscene();
      return true;
    }

    return false;
  }

  private showVictoryCutscene() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.add.text(centerX, centerY - 80, 'Enemy Defeated!', {
      fontSize: '48px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY, 'Assessment / reward screen pending', {
      fontSize: '26px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    const continueBtn = this.add.text(centerX, centerY + 120, 'Continue', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ff88'))
      .on('pointerout', () => continueBtn.setColor('#ffffff'))
      .on('pointerdown', () => {
        this.scene.start('PlatformerScene', { levelCount: this.levelCount });
      });
  }

  private gameOver() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, width, height);

    this.add.text(centerX, centerY - 100, 'Game Over', {
      fontSize: '64px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 20, `Rounds Won: ${this.roundsWon}`, {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const restartBtn = this.add.text(centerX, centerY + 90, 'Play Again', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88'))
      .on('pointerout', () => restartBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(centerX, centerY + 150, 'Menu', {
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#ffffff'))
      .on('pointerout', () => menuBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
