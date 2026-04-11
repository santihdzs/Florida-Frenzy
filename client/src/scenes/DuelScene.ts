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
import type { RunData } from './EvergladesScene';

import backgroundImg from '../assets/backgrounds/everglades.jpg';

import christianIdle from '../assets/characters/christian/Christian_v4_resized.png';
import christianAttack1 from '../assets/characters/christian/Christian_attack-1.png';
import christianAttack2 from '../assets/characters/christian/Christian_attack-2.png';
import christianDamage1 from '../assets/characters/christian/Christian_damage-1.png';
import christianDamage2 from '../assets/characters/christian/Christian_damage-2.png';

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
  blockedNumberTurnCounter: number | null;
}

export class DuelScene extends Phaser.Scene {
  private readonly MAX_HP = 100;
  private readonly MAX_ENERGY = 20;
  private readonly HAND_SIZE = 5;
  private readonly PLAYER_DECK_SIZE = 12;
  private readonly DISCARD_BASE_SIZE = 72;

  private readonly PLAYER_IDLE_SCALE = 0.33;
  private readonly PLAYER_ATTACK_SCALE = 0.33;
  private readonly PLAYER_HURT_SCALE = 0.33;

  private readonly ENEMY_IDLE_SCALE = 0.38;
  private readonly ENEMY_ATTACK_SCALE = 0.38;
  private readonly ENEMY_HURT1_SCALE = 0.38;
  private readonly ENEMY_HURT2_SCALE = 0.38;

  private playerHp = this.MAX_HP;
  private enemyHp = this.MAX_HP;

  private playerElementalEnergy = 0;
  private playerInstinctEnergy = 0;
  private enemyElementalEnergy = 0;
  private enemyInstinctEnergy = 0;

  private levelsWon = 0;
  private level = 0;
  private totalCoins = 0;
  private totalXp = 0;
  private duelCoins = 0;
  private duelXp = 0;

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
  private discardTopCardObject?: Phaser.GameObjects.Container;
  private discardClickZone?: Phaser.GameObjects.Zone;
  private discardDrawHintText!: Phaser.GameObjects.Text; // the '!' stands for "definite assignment assertion" since this will be initialized in create() and we want to avoid it being possibly undefined in event handlers
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
  private totalXpText!: Phaser.GameObjects.Text;
  private totalCoinsText!: Phaser.GameObjects.Text;

  private playerCharacter!: Phaser.GameObjects.Image;
  private enemyCharacter!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Graphics;
  private enemyShadow!: Phaser.GameObjects.Graphics;

  private isAnimating = false;
  private currentEnemyImage = 'enemy-default';

  constructor() {
    super({ key: 'DuelScene' });
  }

  init(data: Partial<RunData>) {
    this.level      = data.level ?? 0;
    this.totalCoins = data.totalCoins ?? 0;
    this.totalXp    = data.totalXp ?? 0;
  }

  preload() {
    this.load.image('background',     backgroundImg);
    this.load.image('christian-idle', christianIdle);
    this.load.image('christian-attack-1', christianAttack1);
    this.load.image('christian-attack-2', christianAttack2);
    this.load.image('christian-damage-1', christianDamage1);
    this.load.image('christian-damage-2', christianDamage2);
    this.load.image('enemy-default',  enemyDefault);
    this.load.image('enemy-attack-1', enemyAttack1);
    this.load.image('enemy-attack-2', enemyAttack2);
    this.load.image('enemy-hurt-1',   enemyHurt1);
    this.load.image('enemy-hurt-2',   enemyHurt2);
  }

  create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    this.resetDuelState();

    this.add.image(centerX, height / 2, 'background');

    this.drawHudPanels();
    this.createHud();
    this.createCharacters();
    this.setupDecks();
    this.renderTableCard();
    this.renderDiscardTopCard();
    this.renderCards();
    this.refreshHud();
    // this.updateInstruction();

    const keyP = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    keyP.on('down', () => this.advanceToNextCycle());
  }

  private advanceToNextCycle() {
    this.scene.start('EvergladesScene', {
      level: this.level + 1,
      step: 0,
      totalCoins: this.totalCoins + this.duelCoins,
      totalXp: this.totalXp + this.duelXp,
    });
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
      blockedNumberTurnCounter: null,
    };
  }

  private resetDuelState() {
    this.playerHp = this.MAX_HP;
    this.enemyHp = this.MAX_HP;
    this.playerElementalEnergy = 0;
    this.playerInstinctEnergy = 0;
    this.enemyElementalEnergy = 0;
    this.enemyInstinctEnergy = 0;
    this.levelsWon = 0;
    this.duelCoins = 0;
    this.duelXp = 0;
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
    panels.fillRoundedRect(25, 20, 315, 195, 18);
    panels.fillRoundedRect(width - 340, 20, 315, 195, 18);
    panels.fillRoundedRect(centerX - 190, 24, 380, 90, 18);
    panels.fillRoundedRect(centerX - 210, 165, 420, 260, 24);
    panels.fillRoundedRect(centerX - 430, height - 235, 860, 210, 24);
    panels.fillRoundedRect(centerX - 310, 440, 620, 78, 18);
  }

  private createHud() {
    const centerX = this.cameras.main.width / 2;

    this.roundText = this.add.text(centerX, 50, 'Round 1', {
      fontSize: '36px',
      color: '#ffaa00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.battleMessageText = this.add.text(centerX, 86, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tableCardLabel = this.add.text(centerX, 192, 'Table Card', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.instructionText = this.add.text(centerX, 540, 'Choose a valid card or right-click to discard.', {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(48, 34, 'Player', {
      fontSize: '22px',
      color: '#00ff88',
      fontStyle: 'bold',
    });

    this.playerHpBar = this.add.graphics();
    this.playerHpText = this.add.text(48, 86, '', { fontSize: '16px', color: '#ffffff' });
    this.playerShieldText = this.add.text(48, 108, '', { fontSize: '15px', color: '#7fd7ff' });
    this.add.text(48, 125, 'EE', { fontSize: '15px', color: '#9ae66e', fontStyle: 'bold' });
    this.playerEeBar = this.add.graphics();
    this.add.text(48, 155, 'EI', { fontSize: '15px', color: '#69c0ff', fontStyle: 'bold' });
    this.playerEiBar = this.add.graphics();

    this.totalXpText = this.add.text(48, 175, `XP: ${this.totalXp}`, {
      fontSize: '14px',
      color: '#66ccff',
    });

    this.totalCoinsText = this.add.text(170, 175, `Coins: ${this.totalCoins}`, {
      fontSize: '14px',
      color: '#ffd700',
    });

    this.add.text(this.cameras.main.width - 292, 34, 'Enemy', {
      fontSize: '22px',
      color: '#ff6666',
      fontStyle: 'bold',
    });

    this.enemyHpBar = this.add.graphics();
    this.enemyHpText = this.add.text(this.cameras.main.width - 292, 86, '', {
      fontSize: '16px',
      color: '#ffffff',
    });

    this.enemyShieldText = this.add.text(this.cameras.main.width - 292, 108, '', {
      fontSize: '15px',
      color: '#7fd7ff',
    });

    this.add.text(this.cameras.main.width - 292, 125, 'EE', {
      fontSize: '15px',
      color: '#9ae66e',
      fontStyle: 'bold',
    });

    this.enemyEeBar = this.add.graphics();

    this.add.text(this.cameras.main.width - 292, 155, 'EI', {
      fontSize: '15px',
      color: '#69c0ff',
      fontStyle: 'bold',
    });

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

    this.drawDeckPlaceholder(centerX - 135, 478, 'Deck');

    this.discardDrawHintText = this.add.text(centerX + 245, 486, 'Click to draw', {
      fontSize: '12px',
      color: '#dddddd',
    }).setOrigin(0.5);
  }

  private createCharacters() {
    const centerY = 327;
    this.playerShadow = this.add.graphics();
    this.playerShadow.fillStyle(0x000000, 0.3);
    this.playerShadow.fillEllipse(185, 442, 210, 36);

    this.enemyShadow = this.add.graphics();
    this.enemyShadow.fillStyle(0x000000, 0.3);
    this.enemyShadow.fillEllipse(1010, 430, 185, 32);

    this.playerCharacter = this.add.image(185, centerY + 5, 'christian-idle').setScale(this.PLAYER_IDLE_SCALE);
    this.enemyCharacter = this.add.image(1010, centerY, this.currentEnemyImage).setScale(-this.ENEMY_IDLE_SCALE, this.ENEMY_IDLE_SCALE);
  }

  private setupDecks() {
    this.playerDeck = generateDeck(this.PLAYER_DECK_SIZE);
    this.enemyDeck = generateDeck(this.PLAYER_DECK_SIZE);
    this.playerHand = buildHand(this.playerDeck, this.HAND_SIZE);
    this.enemyHand = buildHand(this.enemyDeck, this.HAND_SIZE);
    this.discardPile = this.createBaseDiscardPile(this.DISCARD_BASE_SIZE);
    const openingCard = this.createBaseDiscardPile(1)[0];
    if (!openingCard) throw new Error('Could not generate initial table card.');
    this.tableCard = openingCard;
  }

  private createBaseDiscardPile(size: number): Card[] {
    const basePool = getBaseCardPool();
    const cards: Card[] = [];
    for (let i = 0; i < size; i += 1) {
      const source = basePool[i % basePool.length];
      cards.push({
        ...source,
        id: `${source.id}-discard-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      });
    }
    return shuffleCards(cards);
  }

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
    this.totalXpText.setText(`XP: ${this.totalXp + this.duelXp}`);
    this.totalCoinsText.setText(`Coins: ${this.totalCoins + this.duelCoins}`);
  }

  private updateHpBar(graphics: Phaser.GameObjects.Graphics, hp: number, x: number, y: number, hpText: Phaser.GameObjects.Text) {
    graphics.clear();
    graphics.fillStyle(0x333333, 0.95);
    graphics.fillRoundedRect(x, y, 240, 20, 8);
    const color = hp > 50 ? 0x00ff88 : hp > 25 ? 0xffaa00 : 0xff4444;
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x, y, (Math.max(0, Math.min(hp, this.MAX_HP)) / this.MAX_HP) * 240, 20, 8);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRoundedRect(x, y, 240, 20, 8);
    hpText.setText(`${Math.max(0, hp)}/${this.MAX_HP} HP`);
  }

  private updateEnergyBar(graphics: Phaser.GameObjects.Graphics, value: number, x: number, y: number, width: number, height: number, fillColor: number) {
    graphics.clear();
    graphics.fillStyle(0x2b2b2b, 0.95);
    graphics.fillRoundedRect(x, y, width, height, 6);
    graphics.fillStyle(fillColor, 1);
    graphics.fillRoundedRect(x, y, (Math.max(0, Math.min(value, this.MAX_ENERGY)) / this.MAX_ENERGY) * width, height, 6);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRoundedRect(x, y, width, height, 6);
  }

  private drawDeckPlaceholder(
    x: number,
    y: number,
    label: string,
    onClick?: () => void
  ): Phaser.GameObjects.Container {
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
    container.setSize(64, 84);

    if (onClick) {
      container.setInteractive({ useHandCursor: true })
        .on('pointerover', () => container.setScale(1.05))
        .on('pointerout', () => container.setScale(1))
        .on('pointerdown', onClick);
    }

    return container;
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

  private createCardContainer(x: number, y: number, card: Card, isPlayable: boolean, isStatic = false, outlineColor = 0xffffff): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const baseColor = ELEMENT_COLORS[card.element] ?? 0xffffff;
    bg.fillStyle(baseColor, isPlayable || isStatic ? 1 : 0.45);
    bg.fillRoundedRect(-58, -78, 116, 156, 12);
    bg.lineStyle(3, outlineColor, 1);
    bg.strokeRoundedRect(-58, -78, 116, 156, 12);

    const rarityLabel = this.add.text(0, -54, card.rarity.toUpperCase(), { fontSize: '11px', color: '#f3f3f3', fontStyle: 'bold' }).setOrigin(0.5);
    const elementText = this.add.text(0, -26, card.element.toUpperCase(), { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const powerValue = card.power === null ? 'FX' : String(card.power);
    const powerText = this.add.text(0, 28, powerValue, { fontSize: '42px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const footerText = this.add.text(0, 58, isStatic ? 'TABLE' : (isPlayable ? 'PLAY' : 'LOCK'), { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    container.add([bg, rarityLabel, elementText, powerText, footerText]);
    container.setSize(116, 156);

    if (!isStatic) {
      container.setInteractive({ useHandCursor: true })
        .on('pointerover', () => { if (!this.isAnimating) container.setScale(isPlayable ? 1.08 : 1.03); })
        .on('pointerout', () => { container.setScale(1); })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) { this.discardPlayerCard(card); return; }
          if (!this.isPlayerCardPlayable(card)) { this.showBattleMessage('Invalid move. Draw or discard.', '#ff6666'); return; }
          this.playPlayerCard(card);
        });
    }
    return container;
  }

  private renderDiscardTopCard() {
    this.discardTopCardObject?.destroy();
    this.discardClickZone?.destroy();

    const centerX = this.cameras.main.width / 2;
    const discardX = centerX + 135;
    const discardY = 478;

    const topCard = this.discardPile[0];

    if (!topCard) {
      this.discardTopCardObject = this.drawDeckPlaceholder(discardX, discardY, 'Empty');
      return;
    }

    this.discardTopCardObject = this.createCardContainer(discardX, discardY, topCard, true, true, 0xffffff);
    this.discardTopCardObject.setScale(0.55);
    
    this.discardClickZone = this.add.zone(discardX, discardY, 150, 110)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.handlePlayerDrawAction();
      })
      .on('pointerover', () => {
        if (!this.isAnimating) this.discardTopCardObject?.setScale(0.60);
      })
      .on('pointerout', () => {
        this.discardTopCardObject?.setScale(0.55);
      });
  }

  private isPlayerCardPlayable(card: Card): boolean {
    if (!canPlayCard(card, this.tableCard)) return false;
    if (this.playerState.blockedNumberTurnCounter !== null && card.power === this.playerState.blockedNumberTurnCounter) return false;
    return true;
  }

  private handlePlayerDrawAction() {
    if (this.isAnimating) return;

    const drawn = this.drawOneAvailableCard();
    
    if (!drawn) {
      this.refreshHud();
      this.renderDiscardTopCard();
      this.renderCards();
      return;
    }

    this.showBattleMessage(`Drawn: ${drawn.element.toUpperCase()} ${drawn.power ?? 'FX'}`, '#00d4ff');
    // this.updateInstruction();

    this.refreshHud();
    this.renderDiscardTopCard();
    this.renderCards();
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
    this.animatePlayerAttack();
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
    if (!enemyCard) { this.showBattleMessage('Enemy cannot play.', '#ffaa00'); this.finishRound(); return; }
    this.discardPile.push(enemyCard);
    const previousTableCard = this.tableCard;
    this.tableCard = enemyCard;
    this.renderTableCard(0xff6666);
    this.addEnergyFromCard(enemyCard, 'enemy', previousTableCard);
    this.animateEnemyAttack();
    this.applyCardEffects(enemyCard, 'enemy');
    this.time.delayedCall(700, () => {
      if (this.checkCombatEnded()) return;
      this.finishRound();
    });
  }

  private refillHandFromDeckOnly(hand: Card[], deck: Card[]) {
    while (hand.length < this.HAND_SIZE && deck.length > 0) {
      const nextCard = drawOneCard(deck);
      if (!nextCard) break;
      hand.push(nextCard);
    }
  }

  private finishRound() {
    this.refillHandFromDeckOnly(this.playerHand, this.playerDeck);
    this.refillHandFromDeckOnly(this.enemyHand, this.enemyDeck);

    this.applyStartOfTurnStatusEffects('player');
    if (this.checkCombatEnded()) return;

    this.tickEndOfTurnFlags(this.playerState);
    this.tickEndOfTurnFlags(this.enemyState);
    this.refreshHud();
    this.renderDiscardTopCard();
    this.renderCards();
    // this.updateInstruction();
    this.playerDamageText.setText('');
    this.enemyDamageText.setText('');
    this.updatePlayerPose();
    this.updateEnemyPose();
    this.isAnimating = false;
  }

  private getEnemyPlayableCard(): Card | null {
    let chosen = this.enemyHand.find((card) => this.isEnemyCardPlayable(card)) ?? null;
    if (!chosen) chosen = this.drawUntilPlayable('enemy', this.tableCard, true);
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

  private incrementDiscardFatigue(side: 'player' | 'enemy') {
    const state = side === 'player' ? this.playerState : this.enemyState;

    state.discardDrawTurnCounter += 1;

    if (state.discardDrawTurnCounter % 10 !== 0) return;

    const threshold = state.discardDrawTurnCounter;
    const damage = threshold >= 30 ? 9 : threshold >= 20 ? 7 : 5;

    this.applyDirectDamage(side, damage, `${damage} fatigue`);
  }

  private drawUntilPlayable(side: 'player' | 'enemy', tableCard: Card, addToHand: boolean): Card | null {
    const deck = side === 'player' ? this.playerDeck : this.enemyDeck;
    const hand = side === 'player' ? this.playerHand : this.enemyHand;
    while (deck.length > 0) {
      const candidate = drawOneCard(deck);
      if (!candidate) break;
      hand.push(candidate);
      if ((side === 'player' ? this.isPlayerCardPlayable(candidate) : this.isEnemyCardPlayable(candidate)) && canPlayCard(candidate, tableCard)) return candidate;
    }
    const discardLen = this.discardPile.length;
    for (let i = 0; i < discardLen; i += 1) {
      const candidate = drawOneCard(this.discardPile);
      if (!candidate) break;
      this.incrementDiscardFatigue(side);
      const isPlayable = side === 'player' ? this.isPlayerCardPlayable(candidate) : this.isEnemyCardPlayable(candidate);
      if (isPlayable && canPlayCard(candidate, tableCard)) { if (addToHand) hand.push(candidate); return candidate; }
      this.discardPile.push(candidate);
    }
    return null;
  }

  private drawOneAvailableCard(): Card | null {
    if (this.playerDeck.length > 0) {
      return null; 
    }

    if (this.playerHand.length >= this.HAND_SIZE) {
      this.showBattleMessage('Discard or play a card before drawing!', '#ffaa00');
      return null;
    }

    const drawn = drawOneCard(this.discardPile);
    if (!drawn) return null;

    this.incrementDiscardFatigue('player');
    this.playerHand.push(drawn);
    return drawn;
  }

  // private endOfRoundDraw(hand: Card[], deck: Card[]) {
  //   const nextCard = drawOneCard(deck);
  //   if (nextCard) hand.push(nextCard);
  // }

  private applyCardEffects(card: Card, attacker: 'player' | 'enemy') {
    const isPlayer = attacker === 'player';
    const attackerState = isPlayer ? this.playerState : this.enemyState;
    const defenderState = isPlayer ? this.enemyState : this.playerState;
    let damage = card.baseDamage;
    let selfDamage = 0;
    if (attackerState.weakenTurnCounter > 0) damage = Math.max(0, damage - attackerState.weakenEffectValue);
    if (attackerState.chainFireBonus > 0 && card.element === 'fire') { damage += attackerState.chainFireBonus; attackerState.chainFireBonus = 0; }
    if (attackerState.sandBuffTurnCounter > 0 && card.element === 'sand') damage += Math.ceil(damage * attackerState.sandBuffPercent / 100);
    switch (card.effect) {
      case 'DAMAGE': break;
      case 'SHIELD': attackerState.shield += card.shieldValue; damage = 0; break;
      case 'POISON': defenderState.poisonTurnCounter = Math.max(defenderState.poisonTurnCounter, card.effectDuration); defenderState.poisonDamage = Math.max(defenderState.poisonDamage, card.effectValue); damage = 0; break;
      case 'WEAKEN': defenderState.weakenTurnCounter = Math.max(defenderState.weakenTurnCounter, card.effectDuration || 1); defenderState.weakenEffectValue = Math.max(defenderState.weakenEffectValue, card.effectValue); damage = 0; break;
      case 'BURN': defenderState.burnTurnCounter = Math.max(defenderState.burnTurnCounter, card.effectDuration); defenderState.burnDamage = Math.max(defenderState.burnDamage, card.effectValue); break;
      case 'BLOCK_FIRE': defenderState.blockFireTurnCounter = Math.max(defenderState.blockFireTurnCounter, card.effectDuration || 1); break;
      case 'RAGE': if ((isPlayer ? this.playerHp : this.enemyHp) <= this.MAX_HP / 2) damage *= 2; break;
      case 'EXPLOSION': selfDamage = card.effectValue; break;
      case 'CHAIN': attackerState.chainFireBonus = Math.max(attackerState.chainFireBonus, card.effectValue); break;
      case 'HEAL': attackerState.shield += card.shieldValue; this.healSide(attacker, Math.ceil(card.shieldValue * (card.effectValue / 100))); damage = 0; break;
      case 'DOUBLE_SHIELD': attackerState.shield = attackerState.shield > 0 ? attackerState.shield * 2 : card.shieldValue; damage = 0; break;
      case 'CLEANSE': this.cleanseNegative(attackerState); damage = 0; break;
      case 'REFLECT': attackerState.reflectTurnCounter = Math.max(attackerState.reflectTurnCounter, card.effectDuration || 1); attackerState.reflectPercent = Math.max(attackerState.reflectPercent, card.effectValue); damage = 0; break;
      case 'ENERGY_BOOST': attackerState.energyBoostTurnCounter = Math.max(attackerState.energyBoostTurnCounter, card.effectDuration || 1); attackerState.energyBoostPercent = Math.max(attackerState.energyBoostPercent, card.effectValue); damage = 0; break;
      case 'TOXIC': defenderState.poisonTurnCounter = Math.max(defenderState.poisonTurnCounter, card.effectDuration); defenderState.poisonDamage = Math.max(defenderState.poisonDamage, card.effectValue); damage = 0; break;
      case 'DECAY': defenderState.shield = Math.max(0, defenderState.shield - Math.ceil(defenderState.shield * (card.effectValue / 100))); damage = 0; break;
      case 'EXTEND': defenderState.poisonTurnCounter += card.effectValue; defenderState.burnTurnCounter += card.effectValue; defenderState.weakenTurnCounter += card.effectValue; damage = 0; break;
      case 'WEAKEN_ATTACK': defenderState.weakenTurnCounter = Math.max(defenderState.weakenTurnCounter, card.effectDuration || 1); defenderState.weakenEffectValue = Math.max(defenderState.weakenEffectValue, card.effectValue); damage = 0; break;
      case 'LIFESTEAL': this.healSide(attacker, Math.ceil(damage * (card.effectValue / 100))); break;
      case 'BLOCK_NUMBER': defenderState.blockedNumberTurnCounter = this.tableCard.power; damage = 0; break;
      case 'BLIND': damage = 0; break;
      case 'SHIELD_BOOST': attackerState.shield += card.shieldValue; damage = 0; break;
      case 'WILDCARD': damage = 0; break;
      case 'BUFF': attackerState.sandBuffTurnCounter = Math.max(attackerState.sandBuffTurnCounter, card.effectDuration || 1); attackerState.sandBuffPercent = Math.max(attackerState.sandBuffPercent, card.effectValue); damage = 0; break;
      case 'STUN': defenderState.stunTurnCounter = Math.max(defenderState.stunTurnCounter, card.effectDuration || 1); damage = 0; break;
      case 'JAM': defenderState.jamTurnCounter = Math.max(defenderState.jamTurnCounter, card.effectDuration || 1); damage = 0; break;
      case 'DOUBLE_PLAY': case 'FORCE_DRAW': case 'AMPLIFY': case 'IMMUNITY': case 'HAND_RESET': case 'RANDOM_STATUS': case 'EXECUTE': damage = card.baseDamage; break;
      default: break;
    }
    if (damage > 0) this.applyAttackDamage(attacker, damage, card.element);
    if (selfDamage > 0) this.applyDirectDamage(attacker, selfDamage, `${selfDamage} recoil`);
    this.refreshHud();
  }

  private applyAttackDamage(attacker: 'player' | 'enemy', rawDamage: number, element: Card['element']) {
    const isPlayer = attacker === 'player';
    const defenderState = isPlayer ? this.enemyState : this.playerState;
    let remainingDamage = rawDamage;
    if (defenderState.shield > 0) { 
      const absorbed = Math.min(defenderState.shield, remainingDamage); defenderState.shield -= absorbed; remainingDamage -= absorbed; 
    }
    if (remainingDamage <= 0) { 
      this.showBattleMessage('Shield blocked the attack!', '#7fd7ff'); return; 
    }

    if (isPlayer) { 
      this.enemyHp = Math.max(0, this.enemyHp - remainingDamage); 
      this.enemyDamageText.setText(`-${remainingDamage}`); 
      this.showBattleMessage(`Player used ${element.toUpperCase()}`, '#00ff88'); 
      this.updateEnemyPose();
    }

    else { 
      this.playerHp = Math.max(0, this.playerHp - remainingDamage); 
      this.playerDamageText.setText(`-${remainingDamage}`); 
      this.showBattleMessage(`Enemy used ${element.toUpperCase()}`, '#ff6666'); 
      this.updatePlayerPose();
    }

    if (defenderState.reflectTurnCounter > 0) {
      const reflected = Math.max(1, Math.floor(remainingDamage * (defenderState.reflectPercent / 100)));
      if (isPlayer) { 
        this.playerHp = Math.max(0, this.playerHp - reflected); 
        this.playerDamageText.setText(`-${reflected}`); 
      }

      else { 
        this.enemyHp = Math.max(0, this.enemyHp - reflected); 
        this.enemyDamageText.setText(`-${reflected}`); 
      }
    }
  }

  private applyDirectDamage(side: 'player' | 'enemy', amount: number, reason: string) {
    if (amount <= 0) return;
    const state = side === 'player' ? this.playerState : this.enemyState;
    let remaining = amount;
    if (state.shield > 0) { const absorbed = Math.min(state.shield, remaining); state.shield -= absorbed; remaining -= absorbed; }
    if (remaining <= 0) return;
    if (side === 'player') { this.playerHp = Math.max(0, this.playerHp - remaining); this.playerDamageText.setText(`-${remaining}`); }
    else { this.enemyHp = Math.max(0, this.enemyHp - remaining); this.enemyDamageText.setText(`-${remaining}`); }
    this.showBattleMessage(reason, '#ffaa00');
    this.refreshHud();
  }

  private healSide(side: 'player' | 'enemy', amount: number) {
    if (amount <= 0) return;
    if (side === 'player') this.playerHp = Math.min(this.MAX_HP, this.playerHp + amount);
    else this.enemyHp = Math.min(this.MAX_HP, this.enemyHp + amount);
  }

  private cleanseNegative(state: CombatState) {
    state.poisonTurnCounter = 0; state.poisonDamage = 0;
    state.burnTurnCounter = 0; state.burnDamage = 0;
    state.weakenTurnCounter = 0; state.weakenEffectValue = 0;
    state.blockFireTurnCounter = 0; state.blockedNumberTurnCounter = null;
  }

  private applyStartOfTurnStatusEffects(side: 'player' | 'enemy') {
    const state = side === 'player' ? this.playerState : this.enemyState;
    if (state.poisonTurnCounter > 0) { this.applyDirectDamage(side, state.poisonDamage, `${state.poisonDamage} poison`); state.poisonTurnCounter -= 1; }
    if (state.burnTurnCounter > 0) { this.applyDirectDamage(side, state.burnDamage, `${state.burnDamage} burn`); state.burnTurnCounter -= 1; }
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
    const elementalGain = Math.ceil((doubleMatch ? card.energyEGain + 1 : card.energyEGain) * bonusMultiplier);
    const instinctGain = Math.ceil((doubleMatch ? card.energyIGain + 1 : card.energyIGain) * bonusMultiplier);
    if (side === 'player') { this.playerElementalEnergy = Math.min(this.MAX_ENERGY, this.playerElementalEnergy + elementalGain); this.playerInstinctEnergy = Math.min(this.MAX_ENERGY, this.playerInstinctEnergy + instinctGain); }
    else { this.enemyElementalEnergy = Math.min(this.MAX_ENERGY, this.enemyElementalEnergy + elementalGain); this.enemyInstinctEnergy = Math.min(this.MAX_ENERGY, this.enemyInstinctEnergy + instinctGain); }
  }

  private isDoubleMatch(card: Card, previousTableCard: Card): boolean {
    return card.element === previousTableCard.element && card.power !== null && previousTableCard.power !== null && card.power === previousTableCard.power;
  }

  // private updateInstruction() {
  //   const hasPlayable = this.playerHand.some((card) => this.isPlayerCardPlayable(card));
  //   this.instructionText.setText(hasPlayable ? 'Choose a valid card or right-click to discard.' : 'No valid move in hand. Press Draw or right-click to discard.');
  // }

  private showBattleMessage(message: string, color = '#ffffff') {
    this.battleMessageText.setText(message);
    this.battleMessageText.setColor(color);
  }

  private animatePlayerAttack() {
    const attackImage = Math.random() < 0.5 ? 'christian-attack-1' : 'christian-attack-2';
    this.playerCharacter.setTexture(attackImage).setScale(this.PLAYER_ATTACK_SCALE).setY(335);
  }

  private animateEnemyAttack() {
    const attackImage = Math.random() < 0.5 ? 'enemy-attack-1' : 'enemy-attack-2';
    this.enemyCharacter.setTexture(attackImage).setScale(-this.ENEMY_ATTACK_SCALE, this.ENEMY_ATTACK_SCALE).setY(327);
  }

  private updatePlayerPose() {
    if (this.playerHp <= 25) { this.playerCharacter.setTexture('christian-damage-2').setScale(this.PLAYER_HURT_SCALE).setY(335); return; }
    if (this.playerHp <= 50) { this.playerCharacter.setTexture('christian-damage-1').setScale(this.PLAYER_HURT_SCALE).setY(335); return; }
    this.playerCharacter.setTexture('christian-idle').setScale(this.PLAYER_IDLE_SCALE).setY(335);
  }

  private updateEnemyPose() {
    if (this.enemyHp <= 25) { this.currentEnemyImage = 'enemy-hurt-2'; this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(-this.ENEMY_HURT2_SCALE, this.ENEMY_HURT2_SCALE).setY(327); return; }
    if (this.enemyHp <= 50) { this.currentEnemyImage = 'enemy-hurt-1'; this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(-this.ENEMY_HURT1_SCALE, this.ENEMY_HURT1_SCALE).setY(327); return; }
    this.currentEnemyImage = 'enemy-default';
    this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(-this.ENEMY_IDLE_SCALE, this.ENEMY_IDLE_SCALE).setY(327);
  }

  private discardPlayerCard(card: Card) {
    if (this.isAnimating) return;
    
    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id);
    this.discardPile.push(card);

    this.refillHandFromDeckOnly(this.playerHand, this.playerDeck);
    this.showBattleMessage('Card discarded', '#ffaa00');
    this.refreshHud();
    this.renderDiscardTopCard();
    this.renderCards();
    // this.updateInstruction();
  }

  private checkCombatEnded(): boolean {
    this.refreshHud();
    if (this.playerHp <= 0) { this.gameOver(); return true; }
    if (this.enemyHp <= 0) { this.levelsWon += 1; this.roundText.setText(`Level ${this.levelsWon + 1}`); this.showVictoryCutscene(); return true; }
    return false;
  }

  private showVictoryCutscene() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.duelXp += 100;
    this.duelCoins += 50;
    this.refreshHud();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.add.text(centerX, centerY - 80, 'Enemy Defeated!', { fontSize: '48px', color: '#00ff88', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(centerX, centerY - 10, `+100 XP  |  +50 Coins`, { fontSize: '26px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(centerX, centerY + 30, `Run Total — XP: ${this.totalXp + this.duelXp}  Coins: ${this.totalCoins + this.duelCoins}`, { fontSize: '20px', color: '#ffd700' }).setOrigin(0.5);

    const continueBtn = this.add.text(centerX, centerY + 120, 'Continue', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ff88'))
      .on('pointerout', () => continueBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.advanceToNextCycle());
  }

  private gameOver() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const grandCoins = this.totalCoins + this.duelCoins;
    const grandXp = this.totalXp + this.duelXp;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.add.text(centerX, centerY - 100, 'Game Over', { fontSize: '64px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(centerX, centerY - 20, `Levels Won: ${this.levelsWon}`, { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(centerX, centerY + 20, `Total XP: ${grandXp}  |  Total Coins: ${grandCoins}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(0.5);

    const restartBtn = this.add.text(centerX, centerY + 90, 'Play Again', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88'))
      .on('pointerout', () => restartBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(centerX, centerY + 150, 'Menu', { fontSize: '24px', color: '#888888' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#ffffff'))
      .on('pointerout', () => menuBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}