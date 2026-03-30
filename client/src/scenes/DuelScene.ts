import Phaser from 'phaser';
import { Card, generateDeck, compareCards, ELEMENT_COLORS, Element } from '../utils/cards';

// Import assets directly for Vite
// Estos errores se arreglarian con un d.ts file, pero funciona bien
import backgroundImg from '../assets/backgrounds/everglades.jpg';
import enemyDefault from '../assets/characters/default/enemy-gator.png';
import enemyAttack1 from '../assets/characters/default/attack-1.png';
import enemyAttack2 from '../assets/characters/default/attack-2.png';
import enemyHurt1 from '../assets/characters/default/hurt-1.png';
import enemyHurt2 from '../assets/characters/default/hurt-2.png';

export class DuelScene extends Phaser.Scene {
  private playerHp = 100;
  private opponentHp = 100;
  private totalXp = 0;
  private totalCoins = 0;
  private roundsWon = 0;
  private levelCount = 0;
  private playerHand: Card[] = [];
  private opponentHand: Card[] = [];
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
  private playerDamageText!: Phaser.GameObjects.Text;
  private opponentDamageText!: Phaser.GameObjects.Text;
  private characterShadow!: Phaser.GameObjects.Graphics;
  private characterPlaceholder!: Phaser.GameObjects.Image;
  private currentEnemyImage = 'enemy-default';
  private isAttacking = false;
  private isAnimating = false;
  private readonly PLAYER_HP_X = 50;
  private readonly PLAYER_HP_Y = 80;
  private readonly OPPONENT_HP_X = 920;
  private readonly OPPONENT_HP_Y = 80;

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
    const centerX = this.cameras.main.width / 2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background image
    this.add.image(centerX, height / 2, 'background');

    // Translucent panels for UI readability
    
    // Top panel - HP bars area
    const topPanel = this.add.graphics();
    topPanel.fillStyle(0x000000, 0.8);
    topPanel.fillRoundedRect(30, 30, 280, 160, 10);
    topPanel.fillRoundedRect(width - 300, 30, 280, 120, 10);
    
    // Center top panel - Round and battle message
    const centerTopPanel = this.add.graphics();
    centerTopPanel.fillStyle(0x000000, 0.6);
    centerTopPanel.fillRoundedRect(centerX - 125, 45, 250, 47, 10);
    
    // Bottom panel - Message above deck
    const bottomPanel = this.add.graphics();
    bottomPanel.fillStyle(0x000000, 0.6);
    bottomPanel.fillRoundedRect(centerX - 365, 490, 730, 255, 10);
    
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

    // Enemy gator in middle (with shadow)
    this.characterShadow = this.add.graphics();
    this.characterShadow.fillStyle(0x000000, 0.3);
    this.characterShadow.fillEllipse(centerX, 430, 230, 40);
    
    this.characterPlaceholder = this.add.image(centerX, 300, this.currentEnemyImage).setScale(0.5);

    // Generate decks
    this.playerDeck = generateDeck(12);
    this.opponentDeck = generateDeck(12);

    this.playerHand = this.playerDeck.splice(0, 5);
    this.opponentHand = this.opponentDeck.splice(0, 5);

    this.renderCards();
  }

  private createHpBars() {

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
    
    // Damage text displays (hidden by default)
    this.playerDamageText = this.add.text(this.PLAYER_HP_X + 120, this.PLAYER_HP_Y + 30, '', {
      fontSize: '16px',
      color: '#ff4444',
      fontStyle: 'bold'
    });
    this.opponentDamageText = this.add.text(this.OPPONENT_HP_X + 120, this.OPPONENT_HP_Y + 30, '', {
      fontSize: '16px',
      color: '#ff4444',
      fontStyle: 'bold'
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

    this.playerHand.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing) + cardWidth / 2;
      const y = 650;

      const container = this.createCardContainer(x, y, card, index);
      this.cardObjects.push(container);
    });
  }

  private getEnemyImageForHp(): string {
    const hpPercent = this.opponentHp;
    if (hpPercent <= 25) {
      this.characterPlaceholder.setPosition(this.characterPlaceholder.x, 340);
      this.characterPlaceholder.setScale(0.8);
      return 'enemy-hurt-2';
    } else if (hpPercent <= 50) {
      return 'enemy-hurt-1';
    }
    return 'enemy-default';
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

    // Update enemy image to attack pose (randomly choose attack-1 or attack-2)
    const attackImages = ['enemy-attack-1', 'enemy-attack-2'];
    this.currentEnemyImage = attackImages[Math.floor(Math.random() * attackImages.length)];
    this.characterPlaceholder.setTexture(this.currentEnemyImage);
    this.isAttacking = true;
    this.characterPlaceholder.setPosition(this.characterPlaceholder.x, 310);
    this.characterPlaceholder.setScale(0.8);

    // Update message when picking - swap to "Current deck"
    this.messageText.setText('Current deck');
    this.messageText.setColor('#ffffff');

    // Opponent randomly selects a card
    const opponentCard = this.opponentHand[Math.floor(Math.random() * this.opponentHand.length)];
    if (!opponentCard) return;

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

    // Clear previous damage text
    this.playerDamageText.setText('');
    this.opponentDamageText.setText('');

    if (result === 'win') {
      battleMessage = 'Hit!';
      battleMessageColor = '#00ff88';
      this.opponentHp -= 25;
      this.updateHpBar(this.opponentHpBar, this.opponentHp, this.OPPONENT_HP_X, this.OPPONENT_HP_Y, this.opponentHpText);
      // Show -25 for opponent
      this.opponentDamageText.setText('-25');
    } else if (result === 'lose') {
      battleMessage = 'Miss!';
      battleMessageColor = '#ff4444';
      this.playerHp -= 25;
      this.updateHpBar(this.playerHpBar, this.playerHp, this.PLAYER_HP_X, this.PLAYER_HP_Y, this.playerHpText);
      // Show -25 for player
      this.playerDamageText.setText('-25');
    } else {
      battleMessage = 'Draw!';
      battleMessageColor = '#ffaa00';
    }

    // Show momentary battle message under round
    this.battleMessageText.setText(battleMessage);
    this.battleMessageText.setColor(battleMessageColor);

    // Message above deck stays as "Choose a card" during selection

    // Check for duel outcome
    this.time.delayedCall(2000, () => {
      opponentCardContainer.destroy();
      
      // Replace used card with a new one
      const handIndex = this.playerHand.indexOf(card);
      if (handIndex !== -1) {
        this.playerHand.splice(handIndex, 1);

        if (this.playerDeck.length > 0) {
          const nextCard = this.playerDeck.shift();
          if (nextCard) this.playerHand.push(nextCard);
        }
      }

      // Opponent also replaces used card
      const opponentHandIndex = this.opponentHand.indexOf(opponentCard);
      if (opponentHandIndex !== -1) {
        this.opponentHand.splice(opponentHandIndex, 1);

        if (this.opponentDeck.length > 0) {
          const nextOpponentCard = this.opponentDeck.shift();
          if (nextOpponentCard) this.opponentHand.push(nextOpponentCard);
        }
      }

      if (this.playerHp <= 0) {
        // Player lost - show game over screen with stats
        this.battleMessageText.setText('');
        this.playerDamageText.setText('');
        this.opponentDamageText.setText('');
        this.gameOver();
      } else if (this.opponentHp <= 0) {
        // Opponent defeated - show victory cutscene
        this.roundsWon++;
        this.roundText.setText(`Round ${this.roundsWon + 1}`);
        this.battleMessageText.setText('');
        this.playerDamageText.setText('');
        this.opponentDamageText.setText('');
        // Destroy character elements for cutscene
        this.characterShadow.destroy();
        this.characterPlaceholder.destroy();
        this.showVictoryCutscene(card, cardContainer);
      } else {
        // Continue duel
        this.battleMessageText.setText('');
        this.playerDamageText.setText('');
        this.opponentDamageText.setText('');
        this.opponentDeck = generateDeck();
        this.messageText.setText('Choose a card!');
        this.messageText.setColor('#ffffff');
        
        // Recreate character elements if needed
        if (!this.characterShadow || !this.characterPlaceholder) {
          const centerX = this.cameras.main.width / 2;
          this.characterShadow = this.add.graphics();
          this.characterShadow.fillStyle(0x000000, 0.3);
          this.characterShadow.fillEllipse(centerX, 430, 230, 40);
          
          this.currentEnemyImage = this.getEnemyImageForHp();
          this.characterPlaceholder = this.add.image(centerX, 300, this.currentEnemyImage).setScale(0.5);
        } else {
          // Update to correct image based on HP (keep attack position/scale if still hurting)
          const newImage = this.getEnemyImageForHp();
          if (newImage === 'enemy-default' || newImage === 'enemy-hurt-1') {
            this.characterPlaceholder.setPosition(this.characterPlaceholder.x, 300);
            this.characterPlaceholder.setScale(0.5);
          }
          this.characterPlaceholder.setTexture(newImage);
          this.isAttacking = false;
        }
        
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
    
    // Victory text (store in variables to destroy later)
    const victoryText = this.add.text(centerX, centerY - 80, 'Opponent Defeated!', {
      fontSize: '48px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // XP and coins
    const xpText = this.add.text(centerX, centerY, '+100 XP', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const coinsText = this.add.text(centerX, centerY + 50, '+50 Coins', {
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
        // back to platformer loop
        this.scene.start('PlatformerScene', { levelCount: this.levelCount });
      });
  }

  private gameOver() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Overlay (solid background)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, width, height);

    // Always show "Game Over" since victories continue
    this.add.text(centerX, centerY - 100, 'Game Over', {
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
