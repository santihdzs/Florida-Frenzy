import Phaser from 'phaser';
import { Card, generateDeck, compareCards, ELEMENT_COLORS, Element } from '../utils/cards';

export class DuelScene extends Phaser.Scene {
  private playerHp = 100;
  private opponentHp = 100;
  private playerDeck: Card[] = [];
  private opponentDeck: Card[] = [];
  private selectedCard: Card | null = null;
  private cardObjects: Phaser.GameObjects.Container[] = [];
  private messageText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private opponentHpBar!: Phaser.GameObjects.Graphics;
  private isAnimating = false;

  constructor() {
    super({ key: 'DuelScene' });
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1a, 0x0f0f1a, 1);
    bg.fillRect(0, 0, 800, 600);

    // Title / Back button
    const backBtn = this.add.text(30, 30, '< Menu', {
      fontSize: '20px',
      color: '#888888'
    }).setInteractive({ useHandCursor: true })
      .on('pointerover', () => backBtn.setColor('#00ff88'))
      .on('pointerout', () => backBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));

    // HP Bars at top
    this.createHpBars();

    // Battle area (center)
    this.add.text(centerX, 120, 'VS', {
      fontSize: '36px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Player area (bottom)
    this.add.text(centerX, 420, 'Your Cards', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Message text
    this.messageText = this.add.text(centerX, 200, 'Choose a card!', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Generate decks
    this.playerDeck = generateDeck();
    this.opponentDeck = generateDeck();
    this.renderCards();
  }

  private createHpBars() {
    const centerX = this.cameras.main.width / 2;

    // Player HP (bottom)
    this.add.text(50, 520, 'Player', { fontSize: '18px', color: '#00ff88' });
    this.playerHpBar = this.add.graphics();
    this.updateHpBar(this.playerHpBar, this.playerHp, 50, 540);

    // Opponent HP (top)
    this.add.text(50, 50, 'Opponent', { fontSize: '18px', color: '#ff4444' });
    this.opponentHpBar = this.add.graphics();
    this.updateHpBar(this.opponentHpBar, this.opponentHp, 50, 70);
  }

  private updateHpBar(graphics: Phaser.GameObjects.Graphics, hp: number, x: number, y: number) {
    graphics.clear();
    // Background
    graphics.fillStyle(0x333333);
    graphics.fillRect(x, y, 200, 20);
    // HP
    const hpColor = hp > 50 ? 0x00ff88 : hp > 25 ? 0xffaa00 : 0xff4444;
    graphics.fillStyle(hpColor);
    graphics.fillRect(x, y, (hp / 100) * 200, 20);
    // Border
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeRect(x, y, 200, 20);
  }

  private renderCards() {
    // Clear old cards
    this.cardObjects.forEach(card => card.destroy());
    this.cardObjects = [];

    const centerX = this.cameras.main.width / 2;
    const cardWidth = 100;
    const spacing = 20;
    const startX = centerX - (5 * cardWidth + 4 * spacing) / 2;

    this.playerDeck.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = 500;

      const container = this.createCardContainer(x, y, card, index);
      this.cardObjects.push(container);
    });
  }

  private createCardContainer(x: number, y: number, card: Card, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.graphics();
    const color = ELEMENT_COLORS[card.element];
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-45, -65, 90, 130, 10);
    bg.lineStyle(3, 0xffffff);
    bg.strokeRoundedRect(-45, -65, 90, 130, 10);

    // Element text
    const elementText = this.add.text(0, -30, card.element.toUpperCase(), {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Power number
    const powerText = this.add.text(0, 30, card.power.toString(), {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, elementText, powerText]);
    container.setSize(90, 130);

    // Interaction
    if (!this.isAnimating) {
      container.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          container.setScale(1.1);
        })
        .on('pointerout', () => {
          container.setScale(1);
        })
        .on('pointerdown', () => this.playCard(card, container));
    }

    return container;
  }

  private playCard(card: Card, cardContainer: Phaser.GameObjects.Container) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.selectedCard = card;

    // Opponent randomly selects a card
    const opponentCardIndex = Math.floor(Math.random() * this.opponentDeck.length);
    const opponentCard = this.opponentDeck[opponentDeck.length - 1]; // Just use last for simplicity

    // Show opponent's card
    const centerX = this.cameras.main.width / 2;
    const opponentCardContainer = this.createCardContainer(centerX, 180, opponentCard, 0);
    opponentCardContainer.setScale(1.2);

    // Compare
    const result = compareCards(card.element, card.power, opponentCard.element, opponentCard.power);

    // Update message
    const elementEmoji: Record<Element, string> = {
      fire: '🔥',
      water: '💧',
      earth: '🌍',
      storm: '⚡',
      venom: '☠️'
    };

    const playerCardText = `${elementEmoji[card.element]} ${card.power}`;
    const opponentCardText = `${elementEmoji[opponentCard.element]} ${opponentCard.power}`;

    let message = '';
    let messageColor = '#ffffff';

    if (result === 'win') {
      message = `You win! ${playerCardText} beats ${opponentCardText}`;
      messageColor = '#00ff88';
      this.opponentHp -= 25;
      this.updateHpBar(this.opponentHpBar, this.opponentHp, 50, 70);
    } else if (result === 'lose') {
      message = `You lose! ${opponentCardText} beats ${playerCardText}`;
      messageColor = '#ff4444';
      this.playerHp -= 25;
      this.updateHpBar(this.playerHpBar, this.playerHp, 50, 540);
    } else {
      message = `Draw! Both played ${playerCardText}`;
      messageColor = '#ffaa00';
    }

    this.messageText.setText(message);
    this.messageText.setColor(messageColor);

    // Check for game over
    this.time.delayedCall(2000, () => {
      opponentCardContainer.destroy();
      this.isAnimating = false;

      if (this.playerHp <= 0) {
        this.gameOver(false);
      } else if (this.opponentHp <= 0) {
        this.gameOver(true);
      } else {
        // New round - regenerate opponent's deck
        this.opponentDeck = generateDeck();
        this.selectedCard = null;
        this.messageText.setText('Choose a card!');
        this.messageText.setColor('#ffffff');
      }
    });
  }

  private gameOver(playerWon: boolean) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, 800, 600);

    const resultText = playerWon ? 'You Win!' : 'You Lose!';
    const resultColor = playerWon ? '#00ff88' : '#ff4444';

    this.add.text(centerX, centerY - 50, resultText, {
      fontSize: '64px',
      color: resultColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const restartBtn = this.add.text(centerX, centerY + 50, 'Play Again', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88'))
      .on('pointerout', () => restartBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(centerX, centerY + 110, 'Menu', {
      fontSize: '24px',
      color: '#888888'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#ffffff'))
      .on('pointerout', () => menuBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
