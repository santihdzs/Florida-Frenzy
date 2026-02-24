import Phaser from 'phaser';
import { Card, generateDeck, compareCards, ELEMENT_COLORS, Element } from '../utils/cards';

export class DuelScene extends Phaser.Scene {
  private playerHp = 100;
  private opponentHp = 100;
  private totalXp = 0;
  private totalCoins = 0;
  private roundsWon = 0;
  private playerDeck: Card[] = [];
  private opponentDeck: Card[] = [];
  private cardObjects: Phaser.GameObjects.Container[] = [];
  private messageText!: Phaser.GameObjects.Text;
  private battleMessageText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private opponentHpBar!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private opponentHpText!: Phaser.GameObjects.Text;
  private totalXpText!: Phaser.GameObjects.Text;
  private totalCoinsText!: Phaser.GameObjects.Text;
  private isAnimating = false;
  private readonly PLAYER_HP_X = 50;
  private readonly PLAYER_HP_Y = 80;
  private readonly OPPONENT_HP_X = 950;
  private readonly OPPONENT_HP_Y = 80;

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

    // Round counter (replaces VS)
    this.roundText = this.add.text(centerX, 70, 'Round 1', {
      fontSize: '42px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Battle message (Hit!/Miss!/Draw!) - appears momentarily under round
    this.battleMessageText = this.add.text(centerX, 115, '', {
      fontSize: '24px',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Message text above deck
    this.messageText = this.add.text(centerX, 525, 'Choose a card!', {
      fontSize: '30px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Placeholder for character pic in middle (with shadow)
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(centerX, 370, 120, 40); // Horizontal oval shadow
    
    const placeholder = this.add.graphics();
    placeholder.lineStyle(3, 0x666666);
    placeholder.strokeRect(centerX - 50, 260, 100, 100); // Larger square

    // Generate decks
    this.playerDeck = generateDeck();
    this.opponentDeck = generateDeck();
    this.renderCards();
  }

  private createHpBars() {
    const centerX = this.cameras.main.width / 2;

    // Player HP (top left)
    this.add.text(this.PLAYER_HP_X, (this.PLAYER_HP_Y - 30), 'Player', { fontSize: '20px', color: '#00ff88' });
    this.playerHpBar = this.add.graphics();
    this.updateHpBar(this.playerHpBar, this.playerHp, this.PLAYER_HP_X, this.PLAYER_HP_Y);
    this.playerHpText = this.add.text(this.PLAYER_HP_X, this.PLAYER_HP_Y + 30, `${this.playerHp}/100 HP`, {
      fontSize: '16px',
      color: '#ffffff'
    });
    // Total XP and Coins under player HP
    this.totalXpText = this.add.text(this.PLAYER_HP_X, this.PLAYER_HP_Y + 55, `XP: ${this.totalXp}`, {
      fontSize: '14px',
      color: '#66ccff'
    });
    this.totalCoinsText = this.add.text(this.PLAYER_HP_X, this.PLAYER_HP_Y + 75, `Coins: ${this.totalCoins}`, {
      fontSize: '14px',
      color: '#ffd700'
    });

    // Opponent HP (top right)
    this.add.text(this.OPPONENT_HP_X, (this.OPPONENT_HP_Y - 30), 'Opponent', { fontSize: '20px', color: '#ff4444' });
    this.opponentHpBar = this.add.graphics();
    this.updateHpBar(this.opponentHpBar, this.opponentHp, this.OPPONENT_HP_X, this.OPPONENT_HP_Y);
    this.opponentHpText = this.add.text(this.OPPONENT_HP_X, this.OPPONENT_HP_Y + 30, `${this.opponentHp}/100 HP`, {
      fontSize: '16px',
      color: '#ffffff'
    });
  }

  private updateHpBar(graphics: Phaser.GameObjects.Graphics, hp: number, x: number, y: number, hpText?: Phaser.GameObjects.Text) {
    graphics.clear();
    // Background
    graphics.fillStyle(0x333333);
    graphics.fillRect(x, y, 230, 24);
    // HP
    const hpColor = hp > 50 ? 0x00ff88 : hp > 25 ? 0xffaa00 : 0xff4444;
    graphics.fillStyle(hpColor);
    graphics.fillRect(x, y, (hp / 100) * 230, 24);
    // Border
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeRect(x, y, 230, 24);
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
    const cardWidth = 110;
    const spacing = 30;
    const totalWidth = 5 * cardWidth + 4 * spacing;
    const startX = centerX - totalWidth / 2;

    this.playerDeck.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing) + cardWidth / 2;
      const y = 650;

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
    bg.fillRoundedRect(-52, -72, 104, 145, 12);
    bg.lineStyle(3, 0xffffff);
    bg.strokeRoundedRect(-52, -72, 104, 145, 12);

    // Element text
    const elementText = this.add.text(0, -35, card.element.toUpperCase(), {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Power number
    const powerText = this.add.text(0, 35, card.power.toString(), {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, elementText, powerText]);
    container.setSize(104, 145);

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
    const battleY = 380;
    
    // Move player card to left side of battle area
    cardContainer.setPosition(centerX - 300, battleY);
    cardContainer.setScale(1.2);
    
    // Show opponent card on right side
    const opponentCardContainer = this.createCardContainer(centerX + 300, battleY, opponentCard, 0);
    opponentCardContainer.setScale(1.2);

    // Compare
    const result = compareCards(card.element, card.power, opponentCard.element, opponentCard.power);

    let battleMessage = '';
    let battleMessageColor = '#ffffff';
    let deckMessage = '';
    let deckMessageColor = '#ffffff';

    if (result === 'win') {
      battleMessage = 'Hit!';
      battleMessageColor = '#00ff88';
      deckMessage = 'Round won';
      deckMessageColor = '#00ff88';
      this.opponentHp -= 25;
      this.updateHpBar(this.opponentHpBar, this.opponentHp, this.OPPONENT_HP_X, this.OPPONENT_HP_Y, this.opponentHpText);
    } else if (result === 'lose') {
      battleMessage = 'Miss!';
      battleMessageColor = '#ff4444';
      deckMessage = 'Round lost';
      deckMessageColor = '#ff4444';
      this.playerHp -= 25;
      this.updateHpBar(this.playerHpBar, this.playerHp, this.PLAYER_HP_X, this.PLAYER_HP_Y, this.playerHpText);
    } else {
      battleMessage = 'Draw!';
      battleMessageColor = '#ffaa00';
      deckMessage = 'Draw';
      deckMessageColor = '#ffaa00';
    }

    // Show momentary battle message under round
    this.battleMessageText.setText(battleMessage);
    this.battleMessageText.setColor(battleMessageColor);

    // Show deck message
    this.messageText.setText(deckMessage);
    this.messageText.setColor(deckMessageColor);

    // Check for duel outcome
    this.time.delayedCall(2000, () => {
      opponentCardContainer.destroy();
      
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

      if (this.playerHp <= 0) {
        // Player lost - show game over screen with stats
        this.battleMessageText.setText('');
        this.gameOver(false);
      } else if (this.opponentHp <= 0) {
        // Opponent defeated - show victory cutscene
        this.roundsWon++;
        this.roundText.setText(`Round ${this.roundsWon + 1}`);
        this.battleMessageText.setText('');
        this.showVictoryCutscene(card, cardContainer);
      } else {
        // Continue duel
        this.battleMessageText.setText('');
        this.opponentDeck = generateDeck();
        this.messageText.setText('Choose a card!');
        this.messageText.setColor('#ffffff');
        this.isAnimating = false;
        this.renderCards();
      }
    });
  }

  private showVictoryCutscene(card: Card, cardContainer: Phaser.GameObjects.Container) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Award XP and coins
    this.totalXp += 100;
    this.totalCoins += 50;
    
    // Show cutscene overlay (solid background)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    // Victory text
    this.add.text(centerX, centerY - 80, 'Opponent Defeated!', {
      fontSize: '48px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // XP and coins
    this.add.text(centerX, centerY, '+100 XP', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 50, '+50 Coins', {
      fontSize: '32px',
      color: '#ffd700'
    }).setOrigin(0.5);
    
    // Continue button
    const continueBtn = this.add.text(centerX, centerY + 130, 'Continue', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ff88'))
      .on('pointerout', () => continueBtn.setColor('#ffffff'))
      .on('pointerdown', () => {
        // Clean up cutscene
        overlay.destroy();
        continueBtn.destroy();
        
        // Update total XP/Coins display
        this.totalXpText.setText(`XP: ${this.totalXp}`);
        this.totalCoinsText.setText(`Coins: ${this.totalCoins}`);
        
        // Reset HP for next duel
        this.playerHp = 100;
        this.opponentHp = 100;
        this.updateHpBar(this.playerHpBar, this.playerHp, this.PLAYER_HP_X, this.PLAYER_HP_Y, this.playerHpText);
        this.updateHpBar(this.opponentHpBar, this.opponentHp, this.OPPONENT_HP_X, this.OPPONENT_HP_Y, this.opponentHpText);
        
        // Regenerate opponent deck
        this.opponentDeck = generateDeck();
        
        // Reset message
        this.messageText.setText('Choose a card!');
        this.messageText.setColor('#ffffff');
        this.isAnimating = false;
        
        // Move card back and render
        this.renderCards();
      });
  }

  private gameOver(playerWon: boolean) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Overlay (solid background)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, width, height);

    // Always show "You Lose" since victories continue
    this.add.text(centerX, centerY - 100, 'You Lose!', {
      fontSize: '64px',
      color: '#ff4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Show total stats
    this.add.text(centerX, centerY - 20, `Total XP: ${this.totalXp}`, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 30, `Total Coins: ${this.totalCoins}`, {
      fontSize: '32px',
      color: '#ffd700'
    }).setOrigin(0.5);

    const restartBtn = this.add.text(centerX, centerY + 100, 'Play Again', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88'))
      .on('pointerout', () => restartBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(centerX, centerY + 160, 'Menu', {
      fontSize: '24px',
      color: '#888888'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#ffffff'))
      .on('pointerout', () => menuBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
