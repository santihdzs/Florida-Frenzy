import Phaser from 'phaser';
import { Card, buildHand, canPlayCard, compareCards, drawOneCard, ELEMENT_COLORS, generateDeck } from '../utils/cards';

// Import assets directly for Vite
// Estos errores se arreglarian con un d.ts file, pero funciona bien
import backgroundImg from '../assets/backgrounds/everglades.jpg';
import enemyDefault from '../assets/characters/default/enemy-gator.png';
import enemyAttack1 from '../assets/characters/default/attack-1.png';
import enemyAttack2 from '../assets/characters/default/attack-2.png';
import enemyHurt1 from '../assets/characters/default/hurt-1.png';
import enemyHurt2 from '../assets/characters/default/hurt-2.png';

export class DuelScene extends Phaser.Scene {
  private readonly MAX_HP = 100;
  private readonly MAX_ENERGY = 20;
  private readonly HAND_SIZE = 5;
  private readonly DUEL_DAMAGE = 25;

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

  private lastPlayerCard: Card | null = null;
  private lastEnemyCard: Card | null = null;

  private cardObjects: Phaser.GameObjects.Container[] = [];
  private currentTableCardObject?: Phaser.GameObjects.Container;

  private roundText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private battleMessageText!: Phaser.GameObjects.Text;
  private tableCardLabel!: Phaser.GameObjects.Text;
  private discardCountText!: Phaser.GameObjects.Text;
  private deckCountText!: Phaser.GameObjects.Text;

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

  constructor() {
    super({ key: 'DuelScene' });
  }

  init(data: { levelCount?: number }) {
    this.levelCount = data.levelCount ?? 0;
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

  create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    this.add.image(centerX, height / 2, 'background');

    this.drawHudPanels();
    this.createHud();
    this.createCharacters();
    this.setupDecks();
    this.renderTableCard();
    this.renderCards();
    this.refreshHud();
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

  private createHud() {
    // top center info panel
    const centerX = this.cameras.main.width / 2;

    this.roundText = this.add.text(centerX, 52, 'Round 1', {
      fontSize: '36px',
      color: '#ffaa00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.battleMessageText = this.add.text(centerX, 86, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.instructionText = this.add.text(centerX, 548, 'Choose a valid card or right-click to discard.', {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tableCardLabel = this.add.text(centerX, 192, 'Table Card', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Player HUD
    this.add.text(48, 34, 'Player', { fontSize: '22px', color: '#00ff88', fontStyle: 'bold' });
    this.playerHpBar = this.add.graphics();
    this.playerHpText = this.add.text(48, 86, '', { fontSize: '16px', color: '#ffffff' });
    this.add.text(48, 112, 'EE', { fontSize: '15px', color: '#9ae66e', fontStyle: 'bold' });
    this.playerEeBar = this.add.graphics();
    this.add.text(48, 138, 'EI', { fontSize: '15px', color: '#69c0ff', fontStyle: 'bold' });
    this.playerEiBar = this.add.graphics();

    // Enemy HUD
    this.add.text(this.cameras.main.width - 292, 34, 'Enemy', { fontSize: '22px', color: '#ff6666', fontStyle: 'bold' });
    this.enemyHpBar = this.add.graphics();
    this.enemyHpText = this.add.text(this.cameras.main.width - 292, 86, '', { fontSize: '16px', color: '#ffffff' });
    this.add.text(this.cameras.main.width - 292, 112, 'EE', { fontSize: '15px', color: '#9ae66e', fontStyle: 'bold' });
    this.enemyEeBar = this.add.graphics();
    this.add.text(this.cameras.main.width - 292, 138, 'EI', { fontSize: '15px', color: '#69c0ff', fontStyle: 'bold' });
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

    this.deckCountText = this.add.text(centerX - 230, 466, '', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.discardCountText = this.add.text(centerX + 230, 466, '', {
      fontSize: '18px',
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
    this.playerDeck = generateDeck(12);
    this.enemyDeck = generateDeck(12);

    // Randomly draw initial hands from decks (removing from deck)
    this.playerHand = buildHand(this.playerDeck, this.HAND_SIZE);
    this.enemyHand = buildHand(this.enemyDeck, this.HAND_SIZE);

    const openingPool = generateDeck(12);
    const firstTableCard = drawOneCard(openingPool);
    if (!firstTableCard) {
      throw new Error('Could not generate initial table card.');
    }

    this.tableCard = firstTableCard;
    this.discardPile = [firstTableCard];
  }

  private refreshHud() {
    this.updateHpBar(this.playerHpBar, this.playerHp, 48, 58, this.playerHpText);
    this.updateHpBar(this.enemyHpBar, this.enemyHp, this.cameras.main.width - 292, 58, this.enemyHpText);
    this.updateEnergyBar(this.playerEeBar, this.playerElementalEnergy, 82, 116, 220, 12, 0x7cd957);
    this.updateEnergyBar(this.playerEiBar, this.playerInstinctEnergy, 82, 142, 220, 12, 0x4db8ff);
    this.updateEnergyBar(this.enemyEeBar, this.enemyElementalEnergy, this.cameras.main.width - 258, 116, 220, 12, 0x7cd957);
    this.updateEnergyBar(this.enemyEiBar, this.enemyInstinctEnergy, this.cameras.main.width - 258, 142, 220, 12, 0x4db8ff);

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

    const color = hp > 50 ? 0x00ff88 : hp > 25 ? 0xffaa00 : 0xff4444; // Green > 50%, Orange 25-50%, Red < 25%
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
    bg.fillRoundedRect(-42, -52, 84, 104, 12);
    bg.lineStyle(2, 0xffffff, 0.85);
    bg.strokeRoundedRect(-42, -52, 84, 104, 12);

    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
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
      const isPlayable = canPlayCard(card, this.tableCard);
      const cardContainer = this.createCardContainer(x, y, card, isPlayable);
      this.cardObjects.push(cardContainer);
    });
  }

  private renderTableCard(highlightColor = 0xffffff) {
    this.currentTableCardObject?.destroy();
    const centerX = this.cameras.main.width / 2;
    this.currentTableCardObject = this.createCardContainer(centerX, 305, this.tableCard, true, true, highlightColor);
  }

  private createCardContainer(
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

    if (!isStatic) {
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

          if (!isPlayable) {
            this.showBattleMessage('Invalid move', '#ff6666');
            return;
          }

          this.playCard(card);
        });
    }

    return container;
  }

  private playCard(card: Card) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const previousTableCard = this.tableCard;
    const enemyCard = this.chooseEnemyCard(previousTableCard);

    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id);
    this.discardPile.push(card);
    this.tableCard = card;
    this.renderTableCard(0x00ff88);
    this.addEnergyFromCard(card, 'player', previousTableCard);
    this.animateEnemyAttack();

    if (!enemyCard) {
      this.showBattleMessage('Enemy draws...', '#ffaa00');
      this.finishTurnAfterDelay();
      return;
    }

    const result = compareCards(card, enemyCard);
    this.resolveTurnResult(result);

    this.time.delayedCall(900, () => {
      this.discardPile.push(enemyCard);
      this.tableCard = enemyCard;
      this.renderTableCard(0xff6666);
      this.addEnergyFromCard(enemyCard, 'enemy', card);
      this.updateEnemyPose();
      this.finishTurnAfterDelay();
    });
  }

  private discardPlayerCard(card: Card) {
    if (this.isAnimating) return;
    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id);
    this.discardPile.push(card);
    this.showBattleMessage('Card discarded', '#ffaa00');
    this.refillHand(this.playerHand, this.playerDeck);
    this.refreshHud();
    this.renderCards();
  }

  private chooseEnemyCard(tableCard: Card): Card | null {
    const playableCards = this.enemyHand.filter((card) => canPlayCard(card, tableCard));

    let chosen = playableCards[0] ?? null;

    if (!chosen) {
      const drawnCard = drawOneCard(this.enemyDeck);
      if (drawnCard) {
        this.enemyHand.push(drawnCard);
        if (canPlayCard(drawnCard, tableCard)) {
          chosen = drawnCard;
        }
      }
    }

    if (!chosen) return null;
    this.enemyHand = this.enemyHand.filter((handCard) => handCard.id !== chosen?.id);
    return chosen;
  }

  private resolveTurnResult(result: 'win' | 'lose' | 'draw') {
    this.playerDamageText.setText('');
    this.enemyDamageText.setText('');

    if (result === 'win') {
      this.enemyHp = Math.max(0, this.enemyHp - this.DUEL_DAMAGE);
      this.enemyDamageText.setText(`-${this.DUEL_DAMAGE}`);
      this.showBattleMessage('Hit!', '#00ff88');
      return;
    }

    if (result === 'lose') {
      this.playerHp = Math.max(0, this.playerHp - this.DUEL_DAMAGE);
      this.playerDamageText.setText(`-${this.DUEL_DAMAGE}`);
      this.showBattleMessage('Miss!', '#ff6666');
      return;
    }

    this.showBattleMessage('Draw!', '#ffaa00');
  }

  private finishTurnAfterDelay() {
    this.time.delayedCall(1400, () => {
      this.playerDamageText.setText('');
      this.enemyDamageText.setText('');

      this.refillHand(this.playerHand, this.playerDeck);
      this.refillHand(this.enemyHand, this.enemyDeck);
      this.refreshHud();

      if (this.playerHp <= 0) {
        this.gameOver();
        return;
      }

      if (this.enemyHp <= 0) {
        this.roundsWon += 1;
        this.roundText.setText(`Round ${this.roundsWon + 1}`);
        this.showVictoryCutscene();
        return;
      }

      this.renderCards();
      this.isAnimating = false;
      this.showBattleMessage('Choose a valid card or right-click to discard.', '#ffffff');
    });
  }

  private refillHand(hand: Card[], deck: Card[]) {
    while (hand.length < this.HAND_SIZE) {
      const nextCard = drawOneCard(deck);
      if (!nextCard) break;
      hand.push(nextCard);
    }
  }

  private addEnergyFromCard(card: Card, side: 'player' | 'enemy', previousTableCard: Card) {
    const doubleMatch = this.isDoubleMatch(card, previousTableCard);
    const elementalGain = doubleMatch ? card.energyEGain + 1 : card.energyEGain;
    const instinctGain = doubleMatch ? card.energyIGain + 1 : card.energyIGain;

    if (side === 'player') {
      this.playerElementalEnergy = Phaser.Math.Clamp(this.playerElementalEnergy + elementalGain, 0, this.MAX_ENERGY);
      this.playerInstinctEnergy = Phaser.Math.Clamp(this.playerInstinctEnergy + instinctGain, 0, this.MAX_ENERGY);
      this.lastPlayerCard = card;
    } 
    
    else {
      this.enemyElementalEnergy = Phaser.Math.Clamp(this.enemyElementalEnergy + elementalGain, 0, this.MAX_ENERGY);
      this.enemyInstinctEnergy = Phaser.Math.Clamp(this.enemyInstinctEnergy + instinctGain, 0, this.MAX_ENERGY);
      this.lastEnemyCard = card;
    }
  }

  private isDoubleMatch(card: Card, previousTableCard: Card) {
    return (
      card.element === previousTableCard.element
      && card.power !== null
      && previousTableCard.power !== null
      && card.power === previousTableCard.power
    );
  }

  private animateEnemyAttack() {
    const attackImages = ['enemy-attack-1', 'enemy-attack-2'];
    this.currentEnemyImage = attackImages[Math.floor(Math.random() * attackImages.length)];
    this.enemyCharacter.setTexture(this.currentEnemyImage);
    this.enemyCharacter.setScale(0.43);
    this.enemyCharacter.setY(322);
  }

  private updateEnemyPose() {
    if (this.enemyHp <= 25) {
      this.enemyCharacter.setTexture('enemy-hurt-2');
      this.enemyCharacter.setScale(0.45);
      this.enemyCharacter.setY(334);
      return;
    }

    if (this.enemyHp <= 50) {
      this.enemyCharacter.setTexture('enemy-hurt-1');
      this.enemyCharacter.setScale(0.4);
      this.enemyCharacter.setY(328);
      return;
    }

    this.enemyCharacter.setTexture('enemy-default');
    this.enemyCharacter.setScale(0.38);
    this.enemyCharacter.setY(327);
  }

  private showBattleMessage(message: string, color = '#ffffff') {
    this.battleMessageText.setText(message);
    this.battleMessageText.setColor(color);
  }

  private showVictoryCutscene() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.94);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.add.text(centerX, centerY - 70, 'Enemy Defeated!', {
      fontSize: '48px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 8, 'Reward screen should go here next.', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 34, 'This matches the GDD better than coins in-duel.', {
      fontSize: '22px',
      color: '#ffaa00',
    }).setOrigin(0.5);

    const continueBtn = this.add.text(centerX, centerY + 120, 'Continue', {
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'bold',
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

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.94);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.add.text(centerX, centerY - 90, 'Game Over', {
      fontSize: '62px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 18, `Rounds won: ${this.roundsWon}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 24, 'Later this should route to the run summary / Swamp XP screen.', {
      fontSize: '22px',
      color: '#ffaa00',
      align: 'center',
      wordWrap: { width: 620 },
    }).setOrigin(0.5);

    const restartBtn = this.add.text(centerX, centerY + 118, 'Play Again', {
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88'))
      .on('pointerout', () => restartBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.restart());
  }
}
