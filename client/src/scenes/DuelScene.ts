/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* Main script for the DuelScene, which manages the card-based combat system of the game.
* This script defines the DuelScene class, which extends Phaser.Scene, 
* and contains all the logic for handling the player's and enemy's decks, hands, 
* and the combat mechanics. It includes methods for initializing the scene, 
* creating the user interface, rendering cards, handling player input, applying card effects, 
* and managing the flow of the levels themselves. 
* The script also defines a CombatState interface to track various status effects and conditions 
* for both the player and the enemy during combat.
* 
* (thank you Copilot for helping me with the comments in this one)
*/ 

import Phaser from 'phaser'; // direct import to ensure Phaser types are available in this file
import {
  Card, // card data model used throughout the duel scene
  buildHand, // utility for drawing an opening hand from a deck
  canPlayCard, // shared legality check for card/table matching
  drawOneCard, // utility for drawing a single card from a pile
  ELEMENT_COLORS, // element-to-color map used when rendering cards
  generateDeck, // utility for creating a shuffled deck
} from '../utils/cards'; // from cards.ts module

import {
  MAX_HP,
  MAX_ENERGY,
  HAND_SIZE,
  PLAYER_DECK_SIZE,
  DISCARD_BASE_SIZE,
  PLAYER_IDLE_SCALE,
  PLAYER_ATTACK_SCALE,
  PLAYER_HURT_SCALE,
  ENEMY_IDLE_SCALE,
  ENEMY_ATTACK_SCALE,
  ENEMY_HURT1_SCALE,
  ENEMY_HURT2_SCALE,
} from '../utils/duelConfig'; // constants for duel mechanics and rendering parameters

import { createBaseDiscardPile } from '../utils/duelSetup';

import { updateHpBar, updateEnergyBar } from '../utils/duelUi'; // reusable UI rendering functions for HP and energy bars

import { CombatState, createEmptyCombatState } from '../utils/combatState'; // combat status container and reset helper

import type { RunData } from './EvergladesScene'; // run-progress data passed into this scene
import { completeRun } from '../utils/auth.js'; // API call to save run result

import backgroundImg from '../assets/backgrounds/everglades.jpg'; // duel background image

import christianIdle from '../assets/characters/christian/Christian_v4_resized.png'; // Christian idle sprite
import christianAttack1 from '../assets/characters/christian/Christian_attack-1.png'; // Christian attack animation frame 1
import christianAttack2 from '../assets/characters/christian/Christian_attack-2.png'; // Christian attack animation frame 2
import christianDamage1 from '../assets/characters/christian/Christian_damage-1.png'; // Christian hurt sprite 1
import christianDamage2 from '../assets/characters/christian/Christian_damage-2.png'; // Christian hurt sprite 2

// import enemyDefault from '../assets/characters/default/enemy-gator.png'; // enemy idle sprite
// import enemyAttack1 from '../assets/characters/default/attack-1.png'; // enemy attack animation frame 1
// import enemyAttack2 from '../assets/characters/default/attack-2.png'; // enemy attack animation frame 2
// import enemyHurt1 from '../assets/characters/default/hurt-1.png'; // enemy hurt sprite 1
// import enemyHurt2 from '../assets/characters/default/hurt-2.png'; // enemy hurt sprite 2

import skawlIdle from '../assets/characters/skawl/Skawl_resized.png'; // Skawl idle sprite
import skawlAttack1 from '../assets/characters/skawl/Skawl_attack-1.png'; // Skawl attack animation frame 1
import skawlAttack2 from '../assets/characters/skawl/Skawl_attack-2.png'; // Skawl attack animation frame 2
import skawlDamage1 from '../assets/characters/skawl/Skawl_damage-1.png'; // Skawl hurt sprite 1
import skawlDamage2 from '../assets/characters/skawl/Skawl_damage-2.png'; // Skawl hurt sprite 2
import skawlDefeated from '../assets/characters/skawl/Skawl_defeated.png'; // Skawl defeated sprite

export class DuelScene extends Phaser.Scene {
  private isShowingQuitDialog = false;
  private runEnded = false;
  private sidebarNavHandler: EventListener | null = null;
  private playerHp = MAX_HP; // player current HP
  private enemyHp = MAX_HP; // enemy current HP

  private playerElementalEnergy = 0; // player elemental energy meter
  private playerInstinctEnergy = 0; // player instinct energy meter
  private enemyElementalEnergy = 0; // enemy elemental energy meter
  private enemyInstinctEnergy = 0; // enemy instinct energy meter

  private levelsWon = 0; // count of duel victories in this run
  private level = 1; // current level value passed in from the run
  private runId = 0; // server-side run id, passed through from EvergladesScene
  private totalCoins = 0; // coins earned before this duel
  private totalXp = 0; // XP earned before this duel
  private duelCoins = 0; // coins earned during this duel
  private duelXp = 0; // XP earned during this duel

  private playerDeck: Card[] = []; // player's draw deck
  private enemyDeck: Card[] = []; // enemy's draw deck
  private playerHand: Card[] = []; // cards currently in the player's hand
  private enemyHand: Card[] = []; // cards currently in the enemy's hand
  private discardPile: Card[] = []; // shared discard pile
  private tableCard!: Card; // current table card, assigned during setup

  private playerState: CombatState = createEmptyCombatState(); // player status effects and counters
  private enemyState: CombatState = createEmptyCombatState(); // enemy status effects and counters

  private cardObjects: Phaser.GameObjects.Container[] = []; // rendered player hand card containers
  private currentTableCardObject?: Phaser.GameObjects.Container; // rendered table card container
  private discardTopCardObject?: Phaser.GameObjects.Container; // rendered discard top card container
  private discardClickZone?: Phaser.GameObjects.Zone; // invisible click target for the discard pile
  protected discardDrawHintText!: Phaser.GameObjects.Text; // initialized in create() for input guidance
  private levelText!: Phaser.GameObjects.Text; // level indicator at the top
  protected instructionText!: Phaser.GameObjects.Text; // gameplay instruction text
  private battleMessageText!: Phaser.GameObjects.Text; // short combat feedback message
  protected tableCardLabel!: Phaser.GameObjects.Text; // label above the table card
  private discardCountText!: Phaser.GameObjects.Text; // discard count display
  private deckCountText!: Phaser.GameObjects.Text; // deck count display
  private playerShieldText!: Phaser.GameObjects.Text; // player shield display
  private enemyShieldText!: Phaser.GameObjects.Text; // enemy shield display

  private playerHpBar!: Phaser.GameObjects.Graphics; // player HP bar graphics
  private enemyHpBar!: Phaser.GameObjects.Graphics; // enemy HP bar graphics
  private playerHpText!: Phaser.GameObjects.Text; // player HP label
  private enemyHpText!: Phaser.GameObjects.Text; // enemy HP label
  private playerEeBar!: Phaser.GameObjects.Graphics; // player elemental energy bar renderer
  private playerEiBar!: Phaser.GameObjects.Graphics; // player instinct energy bar renderer
  private enemyEeBar!: Phaser.GameObjects.Graphics; // enemy elemental energy bar renderer
  private enemyEiBar!: Phaser.GameObjects.Graphics; // enemy instinct energy bar renderer

  private playerDamageText!: Phaser.GameObjects.Text; // floating player damage text
  private enemyDamageText!: Phaser.GameObjects.Text; // floating enemy damage text
  private totalXpText!: Phaser.GameObjects.Text; // total XP display
  private totalCoinsText!: Phaser.GameObjects.Text; // total coin display

  private playerCharacter!: Phaser.GameObjects.Image; // player character sprite
  private enemyCharacter!: Phaser.GameObjects.Image; // enemy character sprite
  private playerShadow!: Phaser.GameObjects.Graphics; // player shadow graphic
  private enemyShadow!: Phaser.GameObjects.Graphics; // enemy shadow graphic

  protected isAnimating = false; // locks input while a turn animation is running
  private currentEnemyImage = 'enemy-default'; // tracks which enemy texture is currently active

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig = { key: 'DuelScene' }) {
    super(config); // scene key used by Phaser
  }

  init(data: Partial<RunData>) {
    this.level = data.level ?? 1; // restore level if passed in, otherwise start at level 1
    this.totalCoins = data.totalCoins ?? 0; // restore accumulated coins
    this.totalXp = data.totalXp ?? 0; // restore accumulated XP
    this.runId = data.runId ?? 0; // restore run id for server persistence
  }

  preload() {
    this.load.image('background', backgroundImg); // load duel background
    this.load.image('christian-idle', christianIdle); // load Christian idle sprite
    this.load.image('christian-attack-1', christianAttack1); // load Christian attack sprite 1
    this.load.image('christian-attack-2', christianAttack2); // load Christian attack sprite 2
    this.load.image('christian-damage-1', christianDamage1); // load Christian hurt sprite 1
    this.load.image('christian-damage-2', christianDamage2); // load Christian hurt sprite 2
    // this.load.image('enemy-default',  enemyDefault); // load enemy idle sprite
    // this.load.image('enemy-attack-1', enemyAttack1); // load enemy attack sprite 1
    // this.load.image('enemy-attack-2', enemyAttack2); // load enemy attack sprite 2
    // this.load.image('enemy-hurt-1',   enemyHurt1); // load enemy hurt sprite 1
    // this.load.image('enemy-hurt-2',   enemyHurt2); // load enemy hurt sprite 2
    this.load.image('enemy-default', skawlIdle); // load Skawl idle sprite
    this.load.image('enemy-attack-1', skawlAttack1); // load Skawl attack sprite 1
    this.load.image('enemy-attack-2', skawlAttack2); // load Skawl attack sprite 2
    this.load.image('enemy-hurt-1', skawlDamage1); // load Skawl hurt sprite 1
    this.load.image('enemy-hurt-2', skawlDamage2); // load Skawl hurt sprite 2
    this.load.image('enemy-defeated', skawlDefeated); // load Skawl defeated sprite
  }

  create() {
    console.log('DuelScene create() called');
    console.log('Active scenes:', this.scene.manager.getScenes(true).map((s: Phaser.Scene) => s.scene.key));

    const { width, height } = this.cameras.main; // current scene dimensions
    const centerX = width / 2; // horizontal center point

    this.resetDuelState(); // clear all duel state before building the scene

    this.add.image(centerX, height / 2, 'background').setDepth(0); // place the background in the center

    this.createCharacters(); // place player and enemy sprites
    this.drawHudPanels(); // draw the dark HUD containers behind the UI
    this.createHud(); // build the text bars and labels
    this.setupDecks(); // create and populate decks, hands, and discard pile
    this.renderTableCard(); // render the initial table card
    this.renderDiscardTopCard(); // render the top discard card
    this.renderCards(); // render the starting hand
    this.refreshHud(); // sync HUD values with current state
    // this.updateInstruction(); // kept commented out as in your current code

    const keyP = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P); // shortcut for advancing the run
    keyP.on('down', () => this.advanceToNextCycle()); // move to the next Everglades scene on P press

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); // key for opening the pause menu
    escKey?.on('down', () => {
      if (this.scene.isActive('PauseScene')) return; // prevent opening multiple pause menus
      this.scene.launch('PauseScene', { returnScene: 'DuelScene', runId: this.runId, totalCoins: this.totalCoins + this.duelCoins, totalXp: this.totalXp + this.duelXp, level: this.level }); // open the pause menu and tell it to return here when resuming
      this.scene.pause(); // pause the duel scene
    });

    const pauseButton = this.add.text(20, 690, 'PAUSE', {
      fontSize: '28px',
      color: '#feec00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { left: 10, right: 10, top: 4, bottom: 4 },
    }).setInteractive({ useHandCursor: true }).setDepth(1000); // on-screen pause button in the top-left corner

    pauseButton.on('pointerdown', () => {
      if (this.scene.isActive('PauseScene')) return; // prevent opening multiple pause menus
      this.scene.pause(); // pause the duel scene
      this.scene.launch('PauseScene', { returnScene: 'DuelScene', runId: this.runId, totalCoins: this.totalCoins + this.duelCoins, totalXp: this.totalXp + this.duelXp, level: this.level }); // open the pause menu and tell it to return here when resuming
    });

    // Sidebar navigation guard — only active in DuelScene, not subclasses (e.g. TutorialScene2)
    if (this.scene.key === 'DuelScene') {
      const onSidebarNavRequest = ((e: Event) => {
        if (this.isShowingQuitDialog) return;
        this.isShowingQuitDialog = true;
        const target = (e as CustomEvent<{ target: string }>).detail.target;
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        const W  = this.cameras.main.width;
        const H  = this.cameras.main.height;

        const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.7)
          .setDepth(9999).setScrollFactor(0);
        const boxBg = this.add.graphics().setDepth(10000).setScrollFactor(0);
        boxBg.fillStyle(0x1a1a1a, 0.9);
        boxBg.fillRoundedRect(cx - 200, cy - 100, 400, 200, 12);
        const promptText = this.add.text(cx, cy - 48, 'Quit current game?', {
          fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
        const subText = this.add.text(cx, cy - 10, 'Your current run will end', {
          fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
        const yesBtn = this.add.text(cx - 75, cy + 58, 'YES', {
          fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
          backgroundColor: '#8b0000', padding: { x: 30, y: 10 },
        }).setOrigin(0.5).setDepth(10001).setScrollFactor(0)
          .setInteractive({ useHandCursor: true });
        const noBtn = this.add.text(cx + 75, cy + 58, 'NO', {
          fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
          backgroundColor: '#006400', padding: { x: 30, y: 10 },
        }).setOrigin(0.5).setDepth(10001).setScrollFactor(0)
          .setInteractive({ useHandCursor: true });

        const destroyDialog = () => {
          overlay.destroy(); boxBg.destroy();
          promptText.destroy(); subText.destroy();
          yesBtn.destroy(); noBtn.destroy();
        };

        yesBtn.on('pointerup', () => {
          destroyDialog();
          this.endRun();
          this.scene.stop();
          this.game.scene.start(target);
        });
        noBtn.on('pointerup', () => {
          destroyDialog();
          this.isShowingQuitDialog = false;
        });
      }) as EventListener;

      this.sidebarNavHandler = onSidebarNavRequest;
      window.addEventListener('sidebar-nav-request', this.sidebarNavHandler);
    }

    this.events.on('shutdown', () => {
      this.time.removeAllEvents();
      this.tweens.killAll();
      this.input.keyboard?.removeAllKeys(true);
      this.input.removeAllListeners();
      if (this.sidebarNavHandler) {
        window.removeEventListener('sidebar-nav-request', this.sidebarNavHandler);
        this.sidebarNavHandler = null;
      }
    });
  }

  private advanceToNextCycle() {
    this.scene.start('EvergladesScene', { // transition back to the overworld progression scene
      level: this.level + 1, // advance to the next level
      step: 0, // reset step counter
      totalCoins: this.totalCoins + this.duelCoins, // carry forward coins earned in this duel
      totalXp: this.totalXp + this.duelXp, // carry forward XP earned in this duel
      runId: this.runId, // preserve run id for server persistence
    });
  }

  private resetDuelState() {
    // Reset boolean flags — these persist across scene restarts since Phaser reuses the instance
    this.runEnded = false;
    this.isShowingQuitDialog = false;
    this.sidebarNavHandler = null;

    this.playerHp = MAX_HP; // restore player HP
    this.enemyHp = MAX_HP; // restore enemy HP
    this.playerElementalEnergy = 0; // reset player elemental energy
    this.playerInstinctEnergy = 0; // reset player instinct energy
    this.enemyElementalEnergy = 0; // reset enemy elemental energy
    this.enemyInstinctEnergy = 0; // reset enemy instinct energy
    this.levelsWon = 0; // reset victory count
    this.duelCoins = 0; // reset duel coin reward
    this.duelXp = 0; // reset duel XP reward
    this.playerDeck = []; // clear player deck
    this.enemyDeck = []; // clear enemy deck
    this.playerHand = []; // clear player hand
    this.enemyHand = []; // clear enemy hand
    this.discardPile = []; // clear discard pile
    this.playerState = createEmptyCombatState(); // reset player status effects
    this.enemyState = createEmptyCombatState(); // reset enemy status effects
    this.cardObjects = []; // clear rendered hand objects
    this.currentTableCardObject = undefined; // clear table card object reference
    this.isAnimating = false; // unlock combat input
    this.currentEnemyImage = 'enemy-default'; // restore default enemy texture reference
  }

  private drawHudPanels() {
    const { width, height } = this.cameras.main; // use camera size so UI scales with the scene
    const centerX = width / 2; // center point for symmetric panels
    const panels = this.add.graphics(); // graphics object used to draw HUD boxes
    // panels.setDepth(20); // ensure panels are on top of the sprites but behind the text and cards
    panels.fillStyle(0x000000, 0.72); // translucent black for readability
    panels.fillRoundedRect(25, 20, 315, 195, 18); // left player HUD panel
    panels.fillRoundedRect(width - 340, 20, 315, 195, 18); // right enemy HUD panel
    panels.fillRoundedRect(centerX - 190, 24, 380, 90, 18); // top center level/message panel
    panels.fillRoundedRect(centerX - 120, 165, 240, 260, 24); // table card area panel
    panels.fillRoundedRect(centerX - 430, height - 235, 860, 210, 24); // deck/discard area panel
    panels.fillRoundedRect(centerX - 310, 440, 620, 78, 18); // instruction bar panel
  }

  private createHud() {
    const centerX = this.cameras.main.width / 2; // shared horizontal center for top HUD

    this.levelText = this.add.text(centerX, 50, `Level ${this.level}`, {
      fontSize: '36px',
      color: '#ffaa00',
      fontStyle: 'bold',
    }).setOrigin(0.5); // center the level title

    this.battleMessageText = this.add.text(centerX, 86, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5); // short combat feedback line

    this.tableCardLabel = this.add.text(centerX, 192, 'Table Card', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5); // label above the main card in play

    this.instructionText = this.add.text(centerX, 540, 'Choose a valid card or right-click to discard.', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5); // player guidance text

    this.add.text(48, 34, 'Player', {
      fontSize: '22px',
      color: '#00ff88',
      fontStyle: 'bold',
    }); // player panel label

    this.playerHpBar = this.add.graphics(); // player HP bar renderer
    this.playerHpText = this.add.text(48, 86, '', { 
      fontSize: '16px', 
      color: '#ffffff' 
    }); // player HP text

    this.playerShieldText = this.add.text(48, 116, '', { 
      fontSize: '15px', 
      color: '#7fd7ff' 
    }); // player shield text

    this.add.text(48, 136, 'EE', { 
      fontSize: '15px', 
      color: '#9ae66e', 
      fontStyle: 'bold' 
    }); // elemental energy label

    this.playerEeBar = this.add.graphics(); // player elemental energy bar renderer
    this.add.text(48, 166, 'EI', { 
      fontSize: '15px', 
      color: '#69c0ff', 
      fontStyle: 'bold' 
    }); // instinct energy label

    this.playerEiBar = this.add.graphics(); // player instinct energy bar renderer

    this.totalXpText = this.add.text(48, 188, `XP: ${this.totalXp}`, {
      fontSize: '14px',
      color: '#66ccff',
    }); // running XP total

    this.totalCoinsText = this.add.text(170, 188, `Coins: ${this.totalCoins}`, {
      fontSize: '14px',
      color: '#ffd700',
    }); // running coin total

    this.add.text(this.cameras.main.width - 292, 34, 'Enemy', {
      fontSize: '22px',
      color: '#ff6666',
      fontStyle: 'bold',
    }); // enemy panel label

    this.enemyHpBar = this.add.graphics(); // enemy HP bar renderer
    this.enemyHpText = this.add.text(this.cameras.main.width - 292, 86, '', {
      fontSize: '16px',
      color: '#ffffff',
    }); // enemy HP text

    this.enemyShieldText = this.add.text(this.cameras.main.width - 292, 116, '', {
      fontSize: '15px',
      color: '#7fd7ff',
    }); // enemy shield text

    this.add.text(this.cameras.main.width - 292, 136, 'EE', {
      fontSize: '15px',
      color: '#9ae66e',
      fontStyle: 'bold',
    }); // enemy elemental energy label

    this.enemyEeBar = this.add.graphics(); // enemy elemental energy bar renderer

    this.add.text(this.cameras.main.width - 292, 166, 'EI', {
      fontSize: '15px',
      color: '#69c0ff',
      fontStyle: 'bold',
    }); // enemy instinct energy label

    this.enemyEiBar = this.add.graphics(); // enemy instinct energy bar renderer

    this.playerDamageText = this.add.text(215, 85, '', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold',
    }); // floating damage text for the player

    this.enemyDamageText = this.add.text(this.cameras.main.width - 125, 85, '', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold',
    }); // floating damage text for the enemy

    this.deckCountText = this.add.text(centerX - 248, 466, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5); // deck counter display

    this.discardCountText = this.add.text(centerX + 245, 466, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5); // discard counter display

    this.drawDeckPlaceholder(centerX - 135, 478, 'Deck'); // visual placeholder for the deck pile

    this.discardDrawHintText = this.add.text(centerX + 243, 486, '<- Click to draw', {
      fontSize: '12px',
      color: '#eed112',
      fontStyle: 'bold',
    }).setOrigin(0.5); // hint under the discard pile
  }

  private createCharacters() {
    const centerY = 327; // vertical placement shared by both characters
    this.playerShadow = this.add.graphics(); // shadow under the player sprite
    this.playerShadow.fillStyle(0x000000, 0.3); // subtle shadow opacity
    this.playerShadow.fillEllipse(185, 442, 210, 36); // player shadow shape
    // this.playerShadow.setDepth(5); // ensure shadows are behind the characters but above the background

    this.enemyShadow = this.add.graphics(); // shadow under the enemy sprite
    this.enemyShadow.fillStyle(0x000000, 0.3); // subtle shadow opacity
    this.enemyShadow.fillEllipse(1010, 430, 185, 32); // enemy shadow shape
    // this.enemyShadow.setDepth(5); // ensure shadows are behind the characters but above the background

    this.playerCharacter = this.add.image(185, centerY + 5, 'christian-idle').setScale(PLAYER_IDLE_SCALE); // player sprite on the left
    this.enemyCharacter = this.add.image(1010, centerY, this.currentEnemyImage).setScale(ENEMY_IDLE_SCALE).setFlipX(true); // flipped enemy sprite on the right
  }

  private setupDecks() {
    this.playerDeck = generateDeck(PLAYER_DECK_SIZE); // build the player's starting deck
    this.enemyDeck = generateDeck(PLAYER_DECK_SIZE); // build the enemy's starting deck
    this.playerHand = buildHand(this.playerDeck, HAND_SIZE); // draw the player's starting hand
    this.enemyHand = buildHand(this.enemyDeck, HAND_SIZE); // draw the enemy's starting hand
    this.discardPile = createBaseDiscardPile(DISCARD_BASE_SIZE); // seed the discard pile from the base card pool
    const openingCard = createBaseDiscardPile(1)[0]; // generate the first table card
    if (!openingCard) throw new Error('Could not generate initial table card.'); // fail early if setup data is invalid
    this.tableCard = openingCard; // place the opening card on the table
  }

  private refreshHud() {
    updateHpBar(this.playerHpBar, this.playerHp, 48, 58, this.playerHpText); // update player HP visuals
    updateHpBar(this.enemyHpBar, this.enemyHp, this.cameras.main.width - 292, 58, this.enemyHpText); // update enemy HP visuals
    updateEnergyBar(this.playerEeBar, this.playerElementalEnergy, 82, 138, 220, 12, 0x7cd957); // update player elemental energy
    updateEnergyBar(this.playerEiBar, this.playerInstinctEnergy, 82, 166, 220, 12, 0x4db8ff); // update player instinct energy
    updateEnergyBar(this.enemyEeBar, this.enemyElementalEnergy, this.cameras.main.width - 258, 138, 220, 12, 0x7cd957); // update enemy elemental energy
    updateEnergyBar(this.enemyEiBar, this.enemyInstinctEnergy, this.cameras.main.width - 258, 166, 220, 12, 0x4db8ff); // update enemy instinct energy
    this.playerShieldText.setText(`Shield: ${this.playerState.shield}`); // refresh player shield text
    this.enemyShieldText.setText(`Shield: ${this.enemyState.shield}`); // refresh enemy shield text
    this.deckCountText.setText(`Deck: ${this.playerDeck.length}`); // refresh player deck count
    this.discardCountText.setText(`Discard: ${this.discardPile.length}`); // refresh discard count
    this.totalXpText.setText(`XP: ${this.totalXp + this.duelXp}`); // refresh total XP display
    this.totalCoinsText.setText(`Coins: ${this.totalCoins + this.duelCoins}`); // refresh total coin display
  }

  private drawDeckPlaceholder(
    x: number,
    y: number,
    label: string,
    onClick?: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y); // wrapper for deck visuals
    const bg = this.add.graphics(); // background graphic for the placeholder

    bg.fillStyle(0x1a1a1a, 0.9); // dark fill to look like a card stack
    bg.fillRoundedRect(-32, -42, 64, 84, 12); // deck-sized rounded rectangle
    bg.lineStyle(2, 0xffffff, 0.85); // bright outline
    bg.strokeRoundedRect(-32, -42, 64, 84, 12); // outline border

    const text = this.add.text(0, 0, label, {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5); // centered deck label

    container.add([bg, text]); // combine background and label into one object
    container.setSize(64, 84); // clickable bounds

    if (onClick) {
      container.setInteractive({ useHandCursor: true }) // make the placeholder clickable
        .on('pointerover', () => container.setScale(1.05)) // hover zoom for feedback
        .on('pointerout', () => container.setScale(1)) // restore size when leaving
        .on('pointerdown', onClick); // run the provided handler on click
    }

    return container; // return the assembled placeholder
  }

  private renderCards() {
    this.cardObjects.forEach((cardObject) => cardObject.destroy()); // remove old hand card renders
    this.cardObjects = []; // clear object cache
    const centerX = this.cameras.main.width / 2; // horizontal center for card layout
    const startX = centerX - 310; // left-most hand card position
    const y = this.cameras.main.height - 110; // shared hand row y position
    const spacing = 155; // distance between cards
    
    this.playerHand.forEach((card, index) => {
      const x = startX + index * spacing; // spread cards across the hand row
      const isPlayable = this.isPlayerCardPlayable(card); // determine whether the card can be selected
      const cardContainer = this.createCardContainer(x, y, card, isPlayable); // render the card UI
      this.cardObjects.push(cardContainer); // keep reference for cleanup
    });
  }

  private renderTableCard(highlightColor = 0xffffff) {
    this.currentTableCardObject?.destroy(); // remove the previous table card render
    const centerX = this.cameras.main.width / 2; // center the table card
    this.currentTableCardObject = this.createCardContainer(centerX, 305, this.tableCard, true, true, highlightColor); // render the active table card as static
  }

  private createCardContainer(x: number, y: number, card: Card, isPlayable: boolean, isStatic = false, outlineColor = 0xffffff): Phaser.GameObjects.Container {
    const container = this.add.container(x, y); // wrapper for card visuals and interaction
    const bg = this.add.graphics(); // graphics object for the card body
    const baseColor = ELEMENT_COLORS[card.element] ?? 0xffffff; // color chosen from the card's element
    bg.fillStyle(baseColor, isPlayable || isStatic ? 1 : 0.45); // fade non-playable hand cards
    bg.fillRoundedRect(-58, -78, 116, 156, 12); // card background shape
    bg.lineStyle(3, outlineColor, 1); // border color for the card
    bg.strokeRoundedRect(-58, -78, 116, 156, 12); // draw the border

    const rarityLabel = this.add.text(0, -54, card.rarity.toUpperCase(), { fontSize: '11px', color: '#f3f3f3', fontStyle: 'bold' }).setOrigin(0.5); // rarity label
    const elementText = this.add.text(0, -26, card.element.toUpperCase(), { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5); // element label
    const powerValue = card.power === null ? 'FX' : String(card.power); // show FX for effect cards
    const powerText = this.add.text(0, 28, powerValue, { fontSize: '42px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5); // large power display
    const footerText = this.add.text(0, 58, isStatic ? 'TABLE' : (isPlayable ? 'PLAY' : 'LOCK'), { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5); // footer action label

    container.add([bg, rarityLabel, elementText, powerText, footerText]); // combine all card layers
    container.setSize(116, 156); // interaction bounds

    if (!isStatic) {
      container.setInteractive({ useHandCursor: true }) // enable hover/click behavior for hand cards
        .on('pointerover', () => { if (!this.isAnimating) container.setScale(isPlayable ? 1.08 : 1.03); }) // subtle hover effect
        .on('pointerout', () => { container.setScale(1); }) // restore size after hover
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) { 
            this.discardPlayerCard(card); 
            return; 
          } // right-click discards the card

          if (!this.isPlayerCardPlayable(card)) { 
            this.showBattleMessage('Invalid move. Draw or discard.', '#ff6666'); 
            return; 
          } // block illegal plays

          this.playPlayerCard(card); // play legal card
        });
    }
    return container; // return the finished container
  }

  private renderDiscardTopCard() {
    this.discardTopCardObject?.destroy(); // remove old discard preview
    this.discardClickZone?.destroy(); // remove previous click zone

    const centerX = this.cameras.main.width / 2; // center reference for the discard area
    const discardX = centerX + 135; // x position of the discard pile
    const discardY = 478; // y position of the discard pile

    const topCard = this.discardPile[0]; // use the topmost discard card

    if (!topCard) {
      this.discardTopCardObject = this.drawDeckPlaceholder(discardX, discardY, 'Empty'); // show empty state if discard is blank
      return;
    }

    this.discardTopCardObject = this.createCardContainer(discardX, discardY, topCard, true, true, 0xffffff); // render the top discard card as static
    this.discardTopCardObject.setScale(0.55); // shrink the preview to fit the pile area
    
    this.discardClickZone = this.add.zone(discardX, discardY, 150, 110) // invisible hotspot over the discard pile
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.handlePlayerDrawAction(); // draw from discard when clicked
      })
      .on('pointerover', () => {
        if (!this.isAnimating) this.discardTopCardObject?.setScale(0.60); // enlarge preview on hover
      })
      .on('pointerout', () => {
        this.discardTopCardObject?.setScale(0.55); // restore preview size when leaving
      });
  }

  private isPlayerCardPlayable(card: Card): boolean {
    if (!canPlayCard(card, this.tableCard)) return false; // enforce element/power compatibility
    if (this.playerState.blockedNumberTurnCounter !== null && card.power === this.playerState.blockedNumberTurnCounter) return false; // block forbidden number plays
    return true; // card is legal to play
  }

  private handlePlayerDrawAction() {
    if (this.isAnimating) return; // prevent input during turn resolution

    const drawn = this.drawOneAvailableCard(); // try to draw from discard
    
    if (!drawn) {
      this.refreshHud(); // keep HUD synced even when no card is drawn
      this.renderDiscardTopCard(); // refresh discard preview state
      this.renderCards(); // refresh hand visuals
      return;
    }

    this.showBattleMessage(`Drawn: ${drawn.element.toUpperCase()} ${drawn.power ?? 'FX'}`, '#00d4ff'); // confirm the draw result
    // this.updateInstruction(); // kept commented out as in your current code

    this.refreshHud(); // update bars and counters
    this.renderDiscardTopCard(); // redraw discard pile top card
    this.renderCards(); // redraw hand
  }

  private playPlayerCard(card: Card) {
    if (this.isAnimating) return; // block repeated actions during animation
    this.isAnimating = true; // lock the scene while the turn resolves
    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id); // remove the selected card from the hand
    this.discardPile.push(card); // send played card to discard
    const previousTableCard = this.tableCard; // keep the previous table card for energy rules
    this.tableCard = card; // new card becomes the active table card
    this.renderTableCard(0x00ff88); // highlight the table card in player color
    this.addEnergyFromCard(card, 'player', previousTableCard); // award energy based on the play
    this.applyCardEffects(card, 'player'); // resolve the card's effect and damage
    this.animatePlayerAttack(); // play the player attack pose
    this.time.delayedCall(550, () => { // brief pause before handing control to the enemy
      if (this.checkCombatEnded()) return; // stop if the duel ended
      this.handleEnemyTurn(); // continue to enemy turn
    });
  }

  private handleEnemyTurn() {
    this.applyStartOfTurnStatusEffects('enemy'); // apply enemy poison/burn before action
    if (this.checkCombatEnded()) return; // stop if status damage ended the duel
    
    if (this.enemyState.stunTurnCounter > 0) {
      this.enemyState.stunTurnCounter -= 1; // consume one stun turn
      this.showBattleMessage('Enemy is stunned!', '#7ed9ff'); // explain why the enemy skipped its turn
      this.finishLevel(); // end the level without a play
      return;
    }

    const enemyCard = this.getEnemyPlayableCard(); // select a legal enemy card

    if (!enemyCard) { 
      this.showBattleMessage('Enemy cannot play.', '#ffaa00'); 
      this.finishLevel(); return; 
    } // no move available

    this.discardPile.push(enemyCard); // move the enemy card to discard
    const previousTableCard = this.tableCard; // preserve previous table card for energy gain
    this.tableCard = enemyCard; // set the enemy card as the current table card
    this.renderTableCard(0xff6666); // show the table card in enemy color
    this.addEnergyFromCard(enemyCard, 'enemy', previousTableCard); // award enemy energy gains
    this.animateEnemyAttack(); // play enemy attack pose
    this.applyCardEffects(enemyCard, 'enemy'); // resolve enemy card effects
    this.time.delayedCall(700, () => { // delay before ending the level
      if (this.checkCombatEnded()) return; // stop if the duel ended
      this.finishLevel(); // continue back to level cleanup
    });
  }

  private refillHandFromDeckOnly(hand: Card[], deck: Card[]) {
    while (hand.length < HAND_SIZE && deck.length > 0) { // refill until hand is full or deck is empty
      const nextCard = drawOneCard(deck); // draw the next card from the deck
      if (!nextCard) break; // stop if the deck draw failed
      hand.push(nextCard); // add the drawn card to the hand
    }
  }

  private finishLevel() {
    this.refillHandFromDeckOnly(this.playerHand, this.playerDeck); // refill the player's hand from deck only
    this.refillHandFromDeckOnly(this.enemyHand, this.enemyDeck); // refill the enemy's hand from deck only

    this.applyStartOfTurnStatusEffects('player'); // apply player poison/burn at the start of the next cycle
    if (this.checkCombatEnded()) return; // stop if the player was defeated by status damage

    this.tickEndOfTurnFlags(this.playerState); // reduce player status durations
    this.tickEndOfTurnFlags(this.enemyState); // reduce enemy status durations
    this.refreshHud(); // update UI after status changes
    this.renderDiscardTopCard(); // redraw discard pile preview
    this.renderCards(); // redraw the player's hand
    // this.updateInstruction(); // kept commented out as in your current code
    this.playerDamageText.setText(''); // clear player damage popup
    this.enemyDamageText.setText(''); // clear enemy damage popup
    this.updatePlayerPose(); // restore player pose based on remaining HP
    this.updateEnemyPose(); // restore enemy pose based on remaining HP
    this.isAnimating = false; // unlock input for the next turn
  }

  private getEnemyPlayableCard(): Card | null {
    let chosen = this.enemyHand.find((card) => this.isEnemyCardPlayable(card)) ?? null; // use a card already in hand if possible
    if (!chosen) chosen = this.drawUntilPlayable('enemy', this.tableCard, true); // otherwise search deck/discard for a playable card
    if (!chosen) return null; // no legal card exists
    this.enemyHand = this.enemyHand.filter((handCard) => handCard.id !== chosen?.id); // remove the chosen card from hand
    return chosen; // return the playable card
  }

  private isEnemyCardPlayable(card: Card): boolean {
    if (!canPlayCard(card, this.tableCard)) return false; // enforce shared card compatibility
    if (this.enemyState.blockedNumberTurnCounter !== null && card.power === this.enemyState.blockedNumberTurnCounter) return false; // honor blocked-number status
    if (this.enemyState.jamTurnCounter > 0 && card.rarity !== 'base') return false; // jam blocks non-base cards
    if (this.enemyState.blockFireTurnCounter > 0 && card.element === 'fire') return false; // fire block status
    return true; // card can be played
  }

  private incrementDiscardFatigue(side: 'player' | 'enemy') {
    const state = side === 'player' ? this.playerState : this.enemyState; // choose the correct combat state

    state.discardDrawTurnCounter += 1; // count each discard-based draw

    if (state.discardDrawTurnCounter % 10 !== 0) return; // only apply fatigue every 10 draws

    const threshold = state.discardDrawTurnCounter; // use total draw count to determine fatigue tier
    const damage = threshold >= 30 ? 9 : threshold >= 20 ? 7 : 5; // escalate fatigue damage over time

    this.applyDirectDamage(side, damage, `${damage} fatigue`); // apply fatigue damage as direct damage
  }

  private drawUntilPlayable(side: 'player' | 'enemy', tableCard: Card, addToHand: boolean): Card | null {
    const deck = side === 'player' ? this.playerDeck : this.enemyDeck; // pick the correct deck
    const hand = side === 'player' ? this.playerHand : this.enemyHand; // pick the correct hand
    while (deck.length > 0) {
      const candidate = drawOneCard(deck); // draw from deck
      if (!candidate) break; // stop if no card is returned
      hand.push(candidate); // temporarily store the card in hand
      if ((side === 'player' ? this.isPlayerCardPlayable(candidate) : this.isEnemyCardPlayable(candidate)) && canPlayCard(candidate, tableCard)) return candidate; // return once a legal playable card is found
    }
    const discardLen = this.discardPile.length; // snapshot discard count before cycling it
    for (let i = 0; i < discardLen; i += 1) {
      const candidate = drawOneCard(this.discardPile); // pull one card from discard
      if (!candidate) break; // stop if discard draw fails
      this.incrementDiscardFatigue(side); // repeated discard draws build fatigue
      const isPlayable = side === 'player' ? this.isPlayerCardPlayable(candidate) : this.isEnemyCardPlayable(candidate); // check side-specific legality

      if (isPlayable && canPlayCard(candidate, tableCard)) { 
        if (addToHand) hand.push(candidate); 
        return candidate; 
      } // keep the first usable card

      this.discardPile.push(candidate); // return unusable cards to discard
    }
    return null; // no playable card was found
  }

  private drawOneAvailableCard(): Card | null {
    if (this.playerDeck.length > 0) {
      return null; // drawing from discard is disabled while deck cards remain
    }

    if (this.playerHand.length >= HAND_SIZE) {
      this.showBattleMessage('Discard or play a card before drawing!', '#ffaa00'); // explain why drawing is blocked
      return null;
    }

    const drawn = drawOneCard(this.discardPile); // draw from the discard pile
    if (!drawn) return null; // no card available

    this.incrementDiscardFatigue('player'); // drawing from discard increases fatigue
    this.playerHand.push(drawn); // add the drawn card to the hand
    return drawn; // return the drawn card
  }

  // private endOfLevelDraw(hand: Card[], deck: Card[]) {
  //   const nextCard = drawOneCard(deck);
  //   if (nextCard) hand.push(nextCard);
  // } // kept commented out as in your current code

  private applyCardEffects(card: Card, attacker: 'player' | 'enemy') {
    const isPlayer = attacker === 'player'; // boolean used to branch between player and enemy
    const attackerState = isPlayer ? this.playerState : this.enemyState; // status state for the card owner
    const defenderState = isPlayer ? this.enemyState : this.playerState; // status state for the target
    let damage = card.baseDamage; // start with base damage
    let selfDamage = 0; // recoil damage is tracked separately
    if (attackerState.weakenTurnCounter > 0) damage = Math.max(0, damage - attackerState.weakenEffectValue); // weaken reduces damage

    if (attackerState.chainFireBonus > 0 && card.element === 'fire') { 
      damage += attackerState.chainFireBonus; 
      attackerState.chainFireBonus = 0; 
    } // chain bonus is consumed on fire attacks
    
    if (attackerState.sandBuffTurnCounter > 0 && card.element === 'sand') damage += Math.ceil(damage * attackerState.sandBuffPercent / 100); // sand buff increases damage for sand cards
    switch (card.effect) {
      case 'DAMAGE': break; // raw damage card, no extra effect handling
      case 'SHIELD': attackerState.shield += card.shieldValue; damage = 0; break; // convert effect into shield
      case 'POISON': defenderState.poisonTurnCounter = Math.max(defenderState.poisonTurnCounter, card.effectDuration); defenderState.poisonDamage = Math.max(defenderState.poisonDamage, card.effectValue); damage = 0; break; // apply poison over time
      case 'WEAKEN': defenderState.weakenTurnCounter = Math.max(defenderState.weakenTurnCounter, card.effectDuration || 1); defenderState.weakenEffectValue = Math.max(defenderState.weakenEffectValue, card.effectValue); damage = 0; break; // apply weaken debuff
      case 'BURN': defenderState.burnTurnCounter = Math.max(defenderState.burnTurnCounter, card.effectDuration); defenderState.burnDamage = Math.max(defenderState.burnDamage, card.effectValue); break; // apply burn over time
      case 'BLOCK_FIRE': defenderState.blockFireTurnCounter = Math.max(defenderState.blockFireTurnCounter, card.effectDuration || 1); break; // prevent fire cards for a short time
      case 'RAGE': if ((isPlayer ? this.playerHp : this.enemyHp) <= MAX_HP / 2) damage *= 2; break; // double damage when under half HP
      case 'EXPLOSION': selfDamage = card.effectValue; break; // explosion damages the attacker too
      case 'CHAIN': attackerState.chainFireBonus = Math.max(attackerState.chainFireBonus, card.effectValue); break; // store a future fire bonus
      case 'HEAL': attackerState.shield += card.shieldValue; this.healSide(attacker, Math.ceil(card.shieldValue * (card.effectValue / 100))); damage = 0; break; // heal and grant shield
      case 'DOUBLE_SHIELD': attackerState.shield = attackerState.shield > 0 ? attackerState.shield * 2 : card.shieldValue; damage = 0; break; // double existing shield or set a base shield
      case 'CLEANSE': this.cleanseNegative(attackerState); damage = 0; break; // remove negative effects from the attacker
      case 'REFLECT': attackerState.reflectTurnCounter = Math.max(attackerState.reflectTurnCounter, card.effectDuration || 1); attackerState.reflectPercent = Math.max(attackerState.reflectPercent, card.effectValue); damage = 0; break; // enable reflect
      case 'ENERGY_BOOST': attackerState.energyBoostTurnCounter = Math.max(attackerState.energyBoostTurnCounter, card.effectDuration || 1); attackerState.energyBoostPercent = Math.max(attackerState.energyBoostPercent, card.effectValue); damage = 0; break; // boost energy gains for a duration
      case 'TOXIC': defenderState.poisonTurnCounter = Math.max(defenderState.poisonTurnCounter, card.effectDuration); defenderState.poisonDamage = Math.max(defenderState.poisonDamage, card.effectValue); damage = 0; break; // apply poison with toxic wording
      case 'DECAY': defenderState.shield = Math.max(0, defenderState.shield - Math.ceil(defenderState.shield * (card.effectValue / 100))); damage = 0; break; // reduce enemy shield by percentage
      case 'EXTEND': defenderState.poisonTurnCounter += card.effectValue; defenderState.burnTurnCounter += card.effectValue; defenderState.weakenTurnCounter += card.effectValue; damage = 0; break; // extend negative effect durations
      case 'WEAKEN_ATTACK': defenderState.weakenTurnCounter = Math.max(defenderState.weakenTurnCounter, card.effectDuration || 1); defenderState.weakenEffectValue = Math.max(defenderState.weakenEffectValue, card.effectValue); damage = 0; break; // same weaken logic under attack-focused name
      case 'LIFESTEAL': this.healSide(attacker, Math.ceil(damage * (card.effectValue / 100))); break; // heal based on dealt damage
      case 'BLOCK_NUMBER': defenderState.blockedNumberTurnCounter = this.tableCard.power; damage = 0; break; // block the current table number
      case 'BLIND': damage = 0; break; // remove damage but keep the card action
      case 'SHIELD_BOOST': attackerState.shield += card.shieldValue; damage = 0; break; // add shield directly
      case 'WILDCARD': damage = 0; break; // placeholder effect
      case 'BUFF': attackerState.sandBuffTurnCounter = Math.max(attackerState.sandBuffTurnCounter, card.effectDuration || 1); attackerState.sandBuffPercent = Math.max(attackerState.sandBuffPercent, card.effectValue); damage = 0; break; // grant a temporary damage buff
      case 'STUN': defenderState.stunTurnCounter = Math.max(defenderState.stunTurnCounter, card.effectDuration || 1); damage = 0; break; // prevent the defender's next action
      case 'JAM': defenderState.jamTurnCounter = Math.max(defenderState.jamTurnCounter, card.effectDuration || 1); damage = 0; break; // block non-base enemy cards
      case 'DOUBLE_PLAY': case 'FORCE_DRAW': case 'AMPLIFY': case 'IMMUNITY': case 'HAND_RESET': case 'RANDOM_STATUS': case 'EXECUTE': damage = card.baseDamage; break; // reserved / shared effect bucket
      default: break; // ignore unsupported effects
    }
    if (damage > 0) this.applyAttackDamage(attacker, damage, card.element); // resolve normal attack damage
    if (selfDamage > 0) this.applyDirectDamage(attacker, selfDamage, `${selfDamage} recoil`); // resolve self-damage separately
    this.refreshHud(); // update the UI after effect resolution
  }

  private applyAttackDamage(attacker: 'player' | 'enemy', rawDamage: number, element: Card['element']) {
    const isPlayer = attacker === 'player'; // identify the attacking side
    const defenderState = isPlayer ? this.enemyState : this.playerState; // choose the defending side
    let remainingDamage = rawDamage; // damage left after shield absorption
    if (defenderState.shield > 0) { 
      const absorbed = Math.min(defenderState.shield, remainingDamage); // shield cannot absorb more than it has
      defenderState.shield -= absorbed; // reduce shield by the absorbed amount
      remainingDamage -= absorbed; // subtract absorbed damage from the incoming hit
    }
    if (remainingDamage <= 0) { 
      this.showBattleMessage('Shield blocked the attack!', '#7fd7ff'); // notify the player that the hit was fully blocked
      return; 
    }

    if (isPlayer) { 
      this.enemyHp = Math.max(0, this.enemyHp - remainingDamage); // apply damage to the enemy
      this.enemyDamageText.setText(`-${remainingDamage}`); // show enemy damage popup
      this.showBattleMessage(`Player used ${element.toUpperCase()}`, '#00ff88'); // show attack feedback for the player
      this.updateEnemyPose(); // update enemy sprite based on HP
    }

    else { 
      this.playerHp = Math.max(0, this.playerHp - remainingDamage); // apply damage to the player
      this.playerDamageText.setText(`-${remainingDamage}`); // show player damage popup
      this.showBattleMessage(`Enemy used ${element.toUpperCase()}`, '#ff6666'); // show attack feedback for the enemy
      this.updatePlayerPose(); // update player sprite based on HP
    }

    if (defenderState.reflectTurnCounter > 0) {
      const reflected = Math.max(1, Math.floor(remainingDamage * (defenderState.reflectPercent / 100))); // compute reflected damage amount
      if (isPlayer) { 
        this.playerHp = Math.max(0, this.playerHp - reflected); // reflect damage back to the player
        this.playerDamageText.setText(`-${reflected}`); // update player damage popup
      }

      else { 
        this.enemyHp = Math.max(0, this.enemyHp - reflected); // reflect damage back to the enemy
        this.enemyDamageText.setText(`-${reflected}`); // update enemy damage popup
      }
    }
  }

  private applyDirectDamage(side: 'player' | 'enemy', amount: number, reason: string) {
    if (amount <= 0) return; // ignore invalid damage values
    const state = side === 'player' ? this.playerState : this.enemyState; // pick the correct side state
    let remaining = amount; // damage that still needs to pass through shield

    if (state.shield > 0) { 
      const absorbed = Math.min(state.shield, remaining); 
      state.shield -= absorbed; remaining -= absorbed; 
    } // shield also blocks direct damage

    if (remaining <= 0) return; // shield absorbed everything

    // apply the leftover damage to HP and show the appropriate popup and message
    if (side === 'player') { 
      this.playerHp = Math.max(0, this.playerHp - remaining); 
      this.playerDamageText.setText(`-${remaining}`); 
    }

    else { 
      this.enemyHp = Math.max(0, this.enemyHp - remaining); 
      this.enemyDamageText.setText(`-${remaining}`); 
    }

    this.showBattleMessage(reason, '#ffaa00'); // explain the source of the damage
    this.refreshHud(); // keep the HUD in sync
  }

  private healSide(side: 'player' | 'enemy', amount: number) {
    if (amount <= 0) return; // ignore invalid healing values

    if (side === 'player') this.playerHp = Math.min(MAX_HP, this.playerHp + amount); // heal player up to max HP
    else this.enemyHp = Math.min(MAX_HP, this.enemyHp + amount); // heal enemy up to max HP
  }

  private cleanseNegative(state: CombatState) {
    state.poisonTurnCounter = 0; state.poisonDamage = 0; // clear poison
    state.burnTurnCounter = 0; state.burnDamage = 0; // clear burn
    state.weakenTurnCounter = 0; state.weakenEffectValue = 0; // clear weaken
    state.blockFireTurnCounter = 0; state.blockedNumberTurnCounter = null; // clear fire and number block effects
  }

  private applyStartOfTurnStatusEffects(side: 'player' | 'enemy') {
    const state = side === 'player' ? this.playerState : this.enemyState; // get the combat state for this side
    if (state.poisonTurnCounter > 0) { 
      this.applyDirectDamage(side, state.poisonDamage, `${state.poisonDamage} poison`); 
      state.poisonTurnCounter -= 1; 
    } // apply poison tick

    if (state.burnTurnCounter > 0) { 
      this.applyDirectDamage(side, state.burnDamage, `${state.burnDamage} burn`); 
      state.burnTurnCounter -= 1; 
    } // apply burn tick
  }

  private tickEndOfTurnFlags(state: CombatState) {
    if (state.weakenTurnCounter > 0) state.weakenTurnCounter -= 1; // reduce weaken duration
    if (state.reflectTurnCounter > 0) state.reflectTurnCounter -= 1; // reduce reflect duration
    if (state.blockFireTurnCounter > 0) state.blockFireTurnCounter -= 1; // reduce fire block duration
    if (state.jamTurnCounter > 0) state.jamTurnCounter -= 1; // reduce jam duration
    if (state.sandBuffTurnCounter > 0) state.sandBuffTurnCounter -= 1; // reduce buff duration
    if (state.energyBoostTurnCounter > 0) state.energyBoostTurnCounter -= 1; // reduce energy boost duration
    if (state.weakenTurnCounter === 0) state.weakenEffectValue = 0; // clear weaken effect value when expired
    if (state.reflectTurnCounter === 0) state.reflectPercent = 0; // clear reflect percent when expired
    if (state.sandBuffTurnCounter === 0) state.sandBuffPercent = 0; // clear sand buff when expired
    if (state.energyBoostTurnCounter === 0) state.energyBoostPercent = 0; // clear energy boost when expired
    if (state.blockFireTurnCounter === 0) state.blockedNumberTurnCounter = null; // clear blocked number when fire block expires
  }

  private addEnergyFromCard(card: Card, side: 'player' | 'enemy', previousTableCard: Card) {
    const doubleMatch = this.isDoubleMatch(card, previousTableCard); // detect matching element and number
    const state = side === 'player' ? this.playerState : this.enemyState; // pick the correct side state
    const bonusMultiplier = state.energyBoostTurnCounter > 0 ? (1 + state.energyBoostPercent / 100) : 1; // energy boost modifies gain
    const elementalGain = Math.ceil((doubleMatch ? card.energyEGain + 1 : card.energyEGain) * bonusMultiplier); // calculate elemental gain
    const instinctGain = Math.ceil((doubleMatch ? card.energyIGain + 1 : card.energyIGain) * bonusMultiplier); // calculate instinct gain

    if (side === 'player') { 
      this.playerElementalEnergy = Math.min(MAX_ENERGY, this.playerElementalEnergy + elementalGain); 
      this.playerInstinctEnergy = Math.min(MAX_ENERGY, this.playerInstinctEnergy + instinctGain); 
    }

    else { 
      this.enemyElementalEnergy = Math.min(MAX_ENERGY, this.enemyElementalEnergy + elementalGain); 
      this.enemyInstinctEnergy = Math.min(MAX_ENERGY, this.enemyInstinctEnergy + instinctGain); 
    }
  }

  private isDoubleMatch(card: Card, previousTableCard: Card): boolean {
    return card.element === previousTableCard.element && card.power !== null && previousTableCard.power !== null && card.power === previousTableCard.power; // both element and power must match
  }

  // private updateInstruction() {
  //   const hasPlayable = this.playerHand.some((card) => this.isPlayerCardPlayable(card));
  //   this.instructionText.setText(hasPlayable ? 'Choose a valid card or right-click to discard.' : 'No valid move in hand. Press Draw or right-click to discard.');
  // } // kept commented out as in your current code

  private showBattleMessage(message: string, color = '#ffffff') {
    this.battleMessageText.setText(message); // update the message text
    this.battleMessageText.setColor(color); // set the message color
  }

  private animatePlayerAttack() {
    const attackImage = Math.random() < 0.5 ? 'christian-attack-1' : 'christian-attack-2'; // randomize attack pose
    this.playerCharacter.setTexture(attackImage).setScale(PLAYER_ATTACK_SCALE).setY(335); // switch to attack pose
  }

  private animateEnemyAttack() {
    const attackImage = Math.random() < 0.5 ? 'enemy-attack-1' : 'enemy-attack-2'; // randomize enemy attack pose
    this.enemyCharacter.setTexture(attackImage).setScale(ENEMY_ATTACK_SCALE).setFlipX(true).setY(327); // switch to attack pose and keep flip
  }

  private updatePlayerPose() {
    if (this.playerHp <= 25) { 
      this.playerCharacter.setTexture('christian-damage-2').setScale(PLAYER_HURT_SCALE).setY(335); // critical HP pose
      return; 
    }

    if (this.playerHp <= 50) { 
      this.playerCharacter.setTexture('christian-damage-1').setScale(PLAYER_HURT_SCALE).setY(335); // wounded pose
      return; 
    }

    this.playerCharacter.setTexture('christian-idle').setScale(PLAYER_IDLE_SCALE).setY(335); // healthy idle pose
  }

  private updateEnemyPose() {
    if (this.enemyHp <= 0) { 
      this.currentEnemyImage = 'enemy-defeated'; 
      this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(ENEMY_IDLE_SCALE).setFlipX(true).setY(340); // defeated pose with slight position adjustment
      return; 
    } // defeated pose

    if (this.enemyHp <= 25) { 
      this.currentEnemyImage = 'enemy-hurt-2'; 
      this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(ENEMY_HURT2_SCALE).setFlipX(true).setY(327); // critical enemy pose
      return; 
    }

    if (this.enemyHp <= 50) { 
      this.currentEnemyImage = 'enemy-hurt-1'; 
      this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(ENEMY_HURT1_SCALE).setFlipX(true).setY(327); // wounded enemy pose
      return; 
    }

    this.currentEnemyImage = 'enemy-default'; // restore the default enemy texture
    this.enemyCharacter.setTexture(this.currentEnemyImage).setScale(ENEMY_IDLE_SCALE).setFlipX(true).setY(327); // healthy idle pose
  }

  private discardPlayerCard(card: Card) {
    if (this.isAnimating) return; // prevent discarding during animations
    
    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id); // remove the selected card from hand
    this.discardPile.push(card); // place the card into the discard pile

    this.refillHandFromDeckOnly(this.playerHand, this.playerDeck); // refill the hand from deck if possible
    this.showBattleMessage('Card discarded', '#ffaa00'); // confirm the discard action
    this.refreshHud(); // sync HUD values
    this.renderDiscardTopCard(); // refresh discard preview
    this.renderCards(); // redraw hand cards
    // this.updateInstruction(); // kept commented out as in your current code
  }

  private checkCombatEnded(): boolean {
    this.refreshHud(); // make sure final values are visible before transition
    if (this.playerHp <= 0) { 
      this.gameOver(); 
      return true; 
    } // player lost

    if (this.enemyHp <= 0) { 
      this.updateEnemyPose(); // show the defeated enemy pose before transitioning
      this.levelsWon += 1; 
      this.levelText.setText(`Level ${this.levelsWon + 1}`); 
      this.time.delayedCall(500, () => { // brief pause to let the defeated pose register before showing the victory screen
        this.showVictoryCutscene(); 
      });

      return true; 
    } // enemy lost

    return false; // combat continues
  }

  private showVictoryCutscene() {
    const centerX = this.cameras.main.width / 2; // center point for the victory overlay
    const centerY = this.cameras.main.height / 2; // vertical center for the victory overlay

    const xpWon = 100 + (this.level * 50); // XP scales with level
    this.duelXp += xpWon; // award XP for victory
    this.duelCoins += 50; // award coins for victory
    this.refreshHud(); // show updated totals immediately

    const overlay = this.add.graphics(); // overlay graphic for the victory screen
    overlay.fillStyle(0x000000, 1.0); // full-screen dark overlay
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height); // cover the scene

    this.add.text(centerX, centerY - 80, 'Enemy Defeated!', { fontSize: '48px', color: '#00ff88', fontStyle: 'bold' }).setOrigin(0.5); // victory headline
    this.add.text(centerX, centerY - 10, `+${xpWon} XP  |  +50 Coins`, { fontSize: '26px', color: '#ffffff' }).setOrigin(0.5); // reward summary
    this.add.text(centerX, centerY + 30, `Run Total — XP: ${this.totalXp + this.duelXp}  Coins: ${this.totalCoins + this.duelCoins}`, { fontSize: '20px', color: '#ffd700' }).setOrigin(0.5); // updated totals

    const continueBtn = this.add.text(centerX, centerY + 120, 'Continue', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ff88')) // hover feedback
      .on('pointerout', () => continueBtn.setColor('#ffffff')) // restore default color
      .on('pointerdown', () => this.advanceToNextCycle()); // proceed to next cycle
  }

  endRun() {
    console.log('endRun() called, runId:', this.runId);
    if (this.runEnded) return;
    this.runEnded = true;
    // Use committed totals only — duelCoins/duelXp are only committed to RunData on a WIN (advanceToNextCycle)
    console.log('completeRun args:', { runId: this.runId, coins: this.totalCoins, xp: this.totalXp, maxLevel: this.level });
    completeRun(this.runId, this.totalCoins, this.totalXp, this.level)
      .catch((err: unknown) => console.error('completeRun failed:', err));
    if (this.sidebarNavHandler) {
      window.removeEventListener('sidebar-nav-request', this.sidebarNavHandler);
      this.sidebarNavHandler = null;
    }
  }

  private gameOver() {
    if (this.runEnded) return;
    this.endRun();
    const centerX = this.cameras.main.width / 2; // center point for the game over overlay
    const centerY = this.cameras.main.height / 2; // vertical center for the overlay
    const grandCoins = this.totalCoins + this.duelCoins; // final coin total for the run
    const grandXp = this.totalXp + this.duelXp; // final XP total for the run

    const overlay = this.add.graphics(); // full-screen overlay graphic
    overlay.fillStyle(0x000000, 1.0); // solid black background
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height); // cover the whole scene

    this.add.text(centerX, centerY - 100, 'Game Over', { fontSize: '64px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5); // game over title
    this.add.text(centerX, centerY - 20, `Levels Won: ${this.levelsWon}`, { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5); // run victory count
    this.add.text(centerX, centerY + 20, `Total XP: ${grandXp}  |  Total Coins: ${grandCoins}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(0.5); // final rewards summary

    const restartBtn = this.add.text(centerX, centerY + 90, 'Play Again', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88')) // hover feedback
      .on('pointerout', () => restartBtn.setColor('#ffffff')) // restore default color
      .on('pointerdown', () => this.scene.start('EvergladesScene', { level: 1, step: 0, totalCoins: 0, totalXp: 0, runId: 0 })); // start a fresh run

    const menuBtn = this.add.text(centerX, centerY + 150, 'Menu', { fontSize: '24px', color: '#888888' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#ffffff')) // hover feedback
      .on('pointerout', () => menuBtn.setColor('#888888')) // restore default color
      .on('pointerdown', () => { this.time.delayedCall(100, () => { this.scene.start('MenuScene'); }); }); // return to the main menu
  }
}