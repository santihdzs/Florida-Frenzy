import Phaser from 'phaser';
import { Card, generateDeck, compareCards, ELEMENT_COLORS, Element } from '../utils/cards';

export class DuelScene extends Phaser.Scene {
  private playerHp = 100;
  private opponentHp = 100;
  private playerDeck: Card[] = [];
  private opponentDeck: Card[] = [];
  private cardObjects: Phaser.GameObjects.Container[] = [];
  private messageText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private opponentHpBar!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private opponentHpText!: Phaser.GameObjects.Text;
  private isAnimating = false;
  private readonly PLAYER_HP_X = 50;
  private readonly PLAYER_HP_Y = 50;
  private readonly OPPONENT_HP_X = 750;
  private readonly OPPONENT_HP_Y = 50;

  constructor() {
    super({ key: 'DuelScene' });
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1a, 0x0f0f1a, 1);
    bg.fillRect(0, 0, width, height);

    // HP Bars at top
    this.createHpBars();

    // Battle area (center) - aligned with HP bars
    this.add.text(centerX, 60, 'VS', {
      fontSize: '36px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Message text
    this.messageText = this.add.text(centerX, 420, 'Choose a card!', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Placeholder for character pic in middle (with shadow)
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(centerX, 310, 120, 40); // Horizontal oval shadow
    
    const placeholder = this.add.graphics();
    placeholder.lineStyle(3, 0x666666);
    placeholder.strokeRect(centerX - 50, 200, 100, 100); // Larger square

    // Generate decks
    this.playerDeck = generateDeck();
    this.opponentDeck = generateDeck();
    this.renderCards();
  }

  private createHpBars() {
    const centerX = this.cameras.main.width / 2;

    // Player HP (top left)
    this.add.text(this.PLAYER_HP_X, 30, 'Player', { fontSize: '18px', color: '#00ff88' });
    this.playerHpBar = this.add.graphics();
    this.updateHpBar(this.playerHpBar, this.playerHp, this.PLAYER_HP_X, this.PLAYER_HP_Y);
    this.playerHpText = this.add.text(this.PLAYER_HP_X, this.PLAYER_HP_Y + 25, `${this.playerHp}/100 HP`, {
      fontSize: '14px',
      color: '#ffffff'
    });

    // Opponent HP (top right)
    this.add.text(this.OPPONENT_HP_X, 30, 'Opponent', { fontSize: '18px', color: '#ff4444' });
    this.opponentHpBar = this.add.graphics();
    this.updateHpBar(this.opponentHpBar, this.opponentHp, this.OPPONENT_HP_X, this.OPPONENT_HP_Y);
    this.opponentHpText = this.add.text(this.OPPONENT_HP_X, this.OPPONENT_HP_Y + 25, `${this.opponentHp}/100 HP`, {
      fontSize: '14px',
      color: '#ffffff'
    });
  }

  private updateHpBar(graphics: Phaser.GameObjects.Graphics, hp: number, x: number, y: number, hpText?: Phaser.GameObjects.Text) {
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
    // Update text
    if (hpText) {
      hpText.setText(`${hp}/100 HP`);
    }
  }

  private renderCards() {
    // Clear old cards
    this.cardObjects.forEach(card => card.destroy());
    this.cardObjects = [];

    const centerX = this.cameras.main.width / 2;
    const cardWidth = 100;
    const spacing = 25;
    const totalWidth = 5 * cardWidth + 4 * spacing;
    const startX = centerX - totalWidth / 2;

    this.playerDeck.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing) + cardWidth / 2;
      const y = 520;

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

    // Opponent randomly selects a card
    const opponentCard = this.opponentDeck[Math.floor(Math.random() * this.opponentDeck.length)];

    // Show opponent's card (right side) and player card (left side) at battle height
    const centerX = this.cameras.main.width / 2;
    const battleY = 300;
    
    // Move player card to left side of battle area
    cardContainer.setPosition(centerX - 300, battleY);
    cardContainer.setScale(1.2);
    
    // Show opponent card on right side
    const opponentCardContainer = this.createCardContainer(centerX + 300, battleY, opponentCard, 0);
    opponentCardContainer.setScale(1.2);

    // Compare
    const result = compareCards(card.element, card.power, opponentCard.element, opponentCard.power);

    let message = '';
    let messageColor = '#ffffff';

    if (result === 'win') {
      message = 'You win!';
      messageColor = '#00ff88';
      this.opponentHp -= 25;
      this.updateHpBar(this.opponentHpBar, this.opponentHp, this.OPPONENT_HP_X, this.OPPONENT_HP_Y, this.opponentHpText);
    } else if (result === 'lose') {
      message = 'You lose!';
      messageColor = '#ff4444';
      this.playerHp -= 25;
      this.updateHpBar(this.playerHpBar, this.playerHp, this.PLAYER_HP_X, this.PLAYER_HP_Y, this.playerHpText);
    } else {
      message = 'Draw!';
      messageColor = '#ffaa00';
    }

    this.messageText.setText(message);
    this.messageText.setColor(messageColor);

    // Check for game over
    this.time.delayedCall(2000, () => {
      opponentCardContainer.destroy();
      this.isAnimating = false; // Must be false before renderCards for interactivity
      
      // Replace used card with a new one
      const cardIndex = this.playerDeck.indexOf(card);
      if (cardIndex !== -1) {
        const elements: Element[] = ['fire', 'water', 'earth', 'electric', 'venom'];
        this.playerDeck[cardIndex] = {
          id: `card-${Date.now()}`,
          element: elements[Math.floor(Math.random() * elements.length)],
          power: Math.floor(Math.random() * 5) + 1
        };
      }
      
      this.renderCards();

      if (this.playerHp <= 0) {
        this.gameOver(false);
      } else if (this.opponentHp <= 0) {
        this.gameOver(true);
      } else {
        // New round - regenerate opponent's deck
        this.opponentDeck = generateDeck();
        this.messageText.setText('Choose a card!');
        this.messageText.setColor('#ffffff');
      }
    });
  }

  private gameOver(playerWon: boolean) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);

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
