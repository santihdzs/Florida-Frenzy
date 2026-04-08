import Phaser from 'phaser';
import { Card, generateDeck, compareCards, ELEMENT_COLORS } from '../utils/cards';

import backgroundImg from '../assets/backgrounds/everglades.jpg';
import enemyDefault   from '../assets/characters/default/enemy-gator.png';
import enemyAttack1   from '../assets/characters/default/attack-1.png';
import enemyAttack2   from '../assets/characters/default/attack-2.png';
import enemyHurt1     from '../assets/characters/default/hurt-1.png';
import enemyHurt2     from '../assets/characters/default/hurt-2.png';

export class DuelScene extends Phaser.Scene {
  private playerHp   = 100;
  private opponentHp = 100;
  private totalXp    = 0;
  private totalCoins = 0;
  private roundsWon  = 0;
  private level      = 0;

  private playerDeck:   Card[] = [];
  private opponentDeck: Card[] = [];
  private cardObjects:  Phaser.GameObjects.Container[] = [];

  private messageText!:        Phaser.GameObjects.Text;
  private battleMessageText!:  Phaser.GameObjects.Text;
  private roundText!:          Phaser.GameObjects.Text;
  private playerHpBar!:        Phaser.GameObjects.Graphics;
  private opponentHpBar!:      Phaser.GameObjects.Graphics;
  private playerHpText!:       Phaser.GameObjects.Text;
  private opponentHpText!:     Phaser.GameObjects.Text;
  private totalXpText!:        Phaser.GameObjects.Text;
  private totalCoinsText!:     Phaser.GameObjects.Text;
  private playerDamageText!:   Phaser.GameObjects.Text;
  private opponentDamageText!: Phaser.GameObjects.Text;
  private characterShadow!:    Phaser.GameObjects.Graphics;
  private characterPlaceholder!: Phaser.GameObjects.Image;
  private currentEnemyImage = 'enemy-default';
  private isAnimating = false;

  private readonly PLAYER_HP_X   =  50;
  private readonly PLAYER_HP_Y   =  80;
  private readonly OPPONENT_HP_X = 920;
  private readonly OPPONENT_HP_Y =  80;

  constructor() {
    super({ key: 'DuelScene' });
  }

  init(data: { level?: number }) {
    this.level       = data.level ?? 0;
    this.playerHp    = 100;
    this.opponentHp  = 100;
    this.totalXp     = 0;
    this.totalCoins  = 0;
    this.roundsWon   = 0;
    this.playerDeck  = [];
    this.opponentDeck = [];
    this.cardObjects  = [];
    this.isAnimating  = false;
    this.currentEnemyImage = 'enemy-default';
  }

  preload() {
    this.load.image('background',    backgroundImg);
    this.load.image('enemy-default', enemyDefault);
    this.load.image('enemy-attack-1', enemyAttack1);
    this.load.image('enemy-attack-2', enemyAttack2);
    this.load.image('enemy-hurt-1',  enemyHurt1);
    this.load.image('enemy-hurt-2',  enemyHurt2);
  }

  create() {
    const centerX = this.cameras.main.width  / 2;
    const width   = this.cameras.main.width;
    const height  = this.cameras.main.height;

    this.add.image(centerX, height / 2, 'background');

    const panels = this.add.graphics();
    panels.fillStyle(0x000000, 0.8);
    panels.fillRoundedRect(30, 30, 280, 160, 10);
    panels.fillRoundedRect(width - 300, 30, 280, 120, 10);
    panels.fillStyle(0x000000, 0.6);
    panels.fillRoundedRect(centerX - 125, 45, 250, 47, 10);
    panels.fillRoundedRect(centerX - 365, 490, 730, 255, 10);

    this.createHpBars();

    this.roundText = this.add.text(centerX, 70, 'Round 1', {
      fontSize: '42px', color: '#ffaa00', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.battleMessageText = this.add.text(centerX, 115, '', {
      fontSize: '24px', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.messageText = this.add.text(centerX, 525, 'Choose a card!', {
      fontSize: '30px', color: '#ffffff',
    }).setOrigin(0.5);

    this.characterShadow = this.add.graphics();
    this.characterShadow.fillStyle(0x000000, 0.3);
    this.characterShadow.fillEllipse(centerX, 430, 230, 40);

    this.characterPlaceholder = this.add.image(centerX, 300, this.currentEnemyImage).setScale(0.5);

    this.playerDeck   = generateDeck();
    this.opponentDeck = generateDeck();
    this.renderCards();

    // Debug skip key
    const keyP = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    keyP.on('down', () => this.advanceToNextCycle());
  }

  private advanceToNextCycle() {
    this.scene.start('EvergladesScene', { level: this.level + 1, step: 0 });
  }

  // ── HP bars ──

  private createHpBars() {
    this.add.text(this.PLAYER_HP_X, this.PLAYER_HP_Y - 30, 'Player', {
      fontSize: '20px', color: '#00ff88',
    });
    this.playerHpBar = this.add.graphics();
    this.updateHpBar(this.playerHpBar, this.playerHp, this.PLAYER_HP_X, this.PLAYER_HP_Y);
    this.playerHpText = this.add.text(this.PLAYER_HP_X, this.PLAYER_HP_Y + 30,
      `${this.playerHp}/100 HP`, { fontSize: '16px', color: '#ffffff' });

    this.totalXpText = this.add.text(this.PLAYER_HP_X, this.PLAYER_HP_Y + 55,
      `XP: ${this.totalXp}`, { fontSize: '14px', color: '#66ccff' });
    this.totalCoinsText = this.add.text(this.PLAYER_HP_X, this.PLAYER_HP_Y + 75,
      `Coins: ${this.totalCoins}`, { fontSize: '14px', color: '#ffd700' });

    this.add.text(this.OPPONENT_HP_X, this.OPPONENT_HP_Y - 30, 'Opponent', {
      fontSize: '20px', color: '#ff4444',
    });
    this.opponentHpBar = this.add.graphics();
    this.updateHpBar(this.opponentHpBar, this.opponentHp, this.OPPONENT_HP_X, this.OPPONENT_HP_Y);
    this.opponentHpText = this.add.text(this.OPPONENT_HP_X, this.OPPONENT_HP_Y + 30,
      `${this.opponentHp}/100 HP`, { fontSize: '16px', color: '#ffffff' });

    this.playerDamageText = this.add.text(this.PLAYER_HP_X + 120, this.PLAYER_HP_Y + 30, '', {
      fontSize: '16px', color: '#ff4444', fontStyle: 'bold',
    });
    this.opponentDamageText = this.add.text(this.OPPONENT_HP_X + 120, this.OPPONENT_HP_Y + 30, '', {
      fontSize: '16px', color: '#ff4444', fontStyle: 'bold',
    });
  }

  private updateHpBar(
    graphics: Phaser.GameObjects.Graphics,
    hp: number, x: number, y: number,
    hpText?: Phaser.GameObjects.Text,
  ) {
    graphics.clear();
    graphics.fillStyle(0x333333);
    graphics.fillRect(x, y, 230, 24);
    graphics.fillStyle(hp > 50 ? 0x00ff88 : hp > 25 ? 0xffaa00 : 0xff4444);
    graphics.fillRect(x, y, (hp / 100) * 230, 24);
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeRect(x, y, 230, 24);
    hpText?.setText(`${hp}/100 HP`);
  }

  // ── Card rendering ──

  private renderCards() {
    this.cardObjects.forEach(c => c.destroy());
    this.cardObjects = [];

    const centerX   = this.cameras.main.width / 2;
    const cardWidth = 110;
    const spacing   = 30;
    const startX    = centerX - (5 * cardWidth + 4 * spacing) / 2;

    this.playerDeck.forEach((card, i) => {
      const x = startX + i * (cardWidth + spacing) + cardWidth / 2;
      this.cardObjects.push(this.createCardContainer(x, 650, card));
    });
  }

  private getEnemyImageForHp(): string {
    if (this.opponentHp <= 25) {
      this.characterPlaceholder.setPosition(this.characterPlaceholder.x, 340);
      this.characterPlaceholder.setScale(0.8);
      return 'enemy-hurt-2';
    }
    if (this.opponentHp <= 50) return 'enemy-hurt-1';
    return 'enemy-default';
  }

  private createCardContainer(x: number, y: number, card: Card): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(ELEMENT_COLORS[card.element], 1);
    bg.fillRoundedRect(-52, -72, 104, 145, 12);
    bg.lineStyle(3, 0xffffff);
    bg.strokeRoundedRect(-52, -72, 104, 145, 12);

    const elementText = this.add.text(0, -35, card.element.toUpperCase(), {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    const powerText = this.add.text(0, 35, (card.power ?? 0).toString(), {
      fontSize: '42px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, elementText, powerText]);
    container.setSize(104, 145);

    if (!this.isAnimating) {
      container.setInteractive({ useHandCursor: true })
        .on('pointerover', () => container.setScale(1.1))
        .on('pointerout',  () => container.setScale(1))
        .on('pointerdown', () => this.playCard(card, container));
    }

    return container;
  }

  // ── Card play / duel logic ──

  private playCard(card: Card, cardContainer: Phaser.GameObjects.Container) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.currentEnemyImage = Math.random() < 0.5 ? 'enemy-attack-1' : 'enemy-attack-2';
    this.characterPlaceholder.setTexture(this.currentEnemyImage);
    this.characterPlaceholder.setPosition(this.characterPlaceholder.x, 310);
    this.characterPlaceholder.setScale(0.8);

    this.messageText.setText('Current deck').setColor('#ffffff');

    const opponentCard = this.opponentDeck[
      Math.floor(Math.random() * this.opponentDeck.length)
    ];
    const centerX  = this.cameras.main.width / 2;
    const battleY  = 380;

    cardContainer.setPosition(centerX - 300, battleY).setScale(1.2);
    const opponentContainer = this.createCardContainer(centerX + 300, battleY, opponentCard);
    opponentContainer.setScale(1.2);

    const result = compareCards(card.element, card.power, opponentCard.element, opponentCard.power);

    this.playerDamageText.setText('');
    this.opponentDamageText.setText('');

    if (result === 'win') {
      this.battleMessageText.setText('Hit!').setColor('#00ff88');
      this.opponentHp -= 25;
      this.updateHpBar(this.opponentHpBar, this.opponentHp, this.OPPONENT_HP_X, this.OPPONENT_HP_Y, this.opponentHpText);
      this.opponentDamageText.setText('-25');
    } else if (result === 'lose') {
      this.battleMessageText.setText('Miss!').setColor('#ff4444');
      this.playerHp -= 25;
      this.updateHpBar(this.playerHpBar, this.playerHp, this.PLAYER_HP_X, this.PLAYER_HP_Y, this.playerHpText);
      this.playerDamageText.setText('-25');
    } else {
      this.battleMessageText.setText('Draw!').setColor('#ffaa00');
    }

    this.time.delayedCall(2000, () => {
      opponentContainer.destroy();

      const idx = this.playerDeck.indexOf(card);
      if (idx !== -1) {
        this.playerDeck[idx] = generateDeck(1)[0];
      }

      this.battleMessageText.setText('');
      this.playerDamageText.setText('');
      this.opponentDamageText.setText('');

      if (this.playerHp <= 0) {
        this.gameOver();
      } else if (this.opponentHp <= 0) {
        this.roundsWon++;
        this.roundText.setText(`Round ${this.roundsWon + 1}`);
        this.characterShadow.destroy();
        this.characterPlaceholder.destroy();
        this.showVictoryCutscene();
      } else {
        this.opponentDeck = generateDeck();
        this.messageText.setText('Choose a card!').setColor('#ffffff');

        const newImage = this.getEnemyImageForHp();
        if (newImage === 'enemy-default' || newImage === 'enemy-hurt-1') {
          this.characterPlaceholder.setPosition(this.characterPlaceholder.x, 300);
          this.characterPlaceholder.setScale(0.5);
        }
        this.characterPlaceholder.setTexture(newImage);

        this.isAnimating = false;
        this.renderCards();
      }
    });
  }

  // ── Victory cutscene ──

  private showVictoryCutscene() {
    const centerX = this.cameras.main.width  / 2;
    const centerY = this.cameras.main.height / 2;

    this.totalXp    += 100;
    this.totalCoins +=  50;

    this.totalXpText.setText(`XP: ${this.totalXp}`);
    this.totalCoinsText.setText(`Coins: ${this.totalCoins}`);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.add.text(centerX, centerY - 80, 'Opponent Defeated!', {
      fontSize: '48px', color: '#00ff88', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY, '+100 XP', {
      fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 50, '+50 Coins', {
      fontSize: '32px', color: '#ffd700',
    }).setOrigin(0.5);

    const continueBtn = this.add.text(centerX, centerY + 130, 'Continue', {
      fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ff88'))
      .on('pointerout',  () => continueBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.advanceToNextCycle());
  }

  // ── Game over ──

  private gameOver() {
    const centerX = this.cameras.main.width  / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1.0);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.add.text(centerX, centerY - 100, 'Game Over', {
      fontSize: '64px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 20, `Total XP: ${this.totalXp}`, {
      fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 30, `Total Coins: ${this.totalCoins}`, {
      fontSize: '32px', color: '#ffd700',
    }).setOrigin(0.5);

    const restartBtn = this.add.text(centerX, centerY + 100, 'Play Again', {
      fontSize: '32px', color: '#ffffff',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88'))
      .on('pointerout',  () => restartBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.restart());

    const menuBtn = this.add.text(centerX, centerY + 160, 'Menu', {
      fontSize: '24px', color: '#888888',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#ffffff'))
      .on('pointerout',  () => menuBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}