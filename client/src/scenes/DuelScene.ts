/*
* Santiago Hernandez - A01787550
* Manuel Montero - A01660761
* Yael Ordaz - A01786776
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
* ChatGPT was used to assist in writing and optimizing some of the code in this file
* and Copilot to comment about 50% of the comments in this file
*/ 

import Phaser from 'phaser'; // direct import to ensure Phaser types are available in this file

import { fetchCards } from '../api/cardsApi'; // API function to fetch card data from the server
import { mapCardData } from '../utils/cardsMapper'; // utility function to convert database card format to the Card type used in the client application
// import { getBaseCardPool, type Card } from '../utils/cards'; // import the Card type for type annotations in this scene
import { fetchActiveDeck } from '../api/deckApi';
import { translations } from '../utils/translations.js';

import { PLAYER_VISUALS } from '../utils/playerConfig.js'; // configuration for player character visuals, including references to the sprite keys used in this scene and their rendering parameters
import { PLAYER_ID_TO_KEY, PLAYER_NAME_TO_KEY, normalizePlayerCharacterKey, type ActiveCharacterStats, type PlayerCharacterKey } from '../utils/playerTypes.js'; 


import {
  Card, // card data model used throughout the duel scene
  buildHand, // utility for drawing an opening hand from a deck
  canPlayCard, // shared legality check for card/table matching
  drawOneCard, // utility for drawing a single card from a pile
  ELEMENT_COLORS, // element-to-color map used when rendering cards
  // generateDeck, // utility for creating a shuffled deck
  getSpecialCardPool, // utility for generating the pool of special effect cards based on level and rarity
  shuffleCards, // utility for randomizing card order in a pile
  isCounterBonusTrigger, // checks if a card play should trigger a counter bonus based on the current table card
  // ICE_CARD_POOL,  // predefined pool of Ice wildcard cards used in certain effects and enemy decks
  getBaseCardPool,
  getIceCardPool,
  getLegendaryCardPool, // utility for generating the pool of base cards, used for guaranteed deck content and table card generation
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
  // ENEMY_IDLE_SCALE,
  // ENEMY_ATTACK_SCALE,
  // ENEMY_HURT1_SCALE,
  // ENEMY_HURT2_SCALE,
} from '../utils/duelConfig'; // constants for duel mechanics and rendering parameters

// import { createBaseDiscardPile } from '../utils/duelSetup';

import { updateHpBar, updateEnergyBar, updateShieldBar } from '../utils/duelUi'; // reusable UI rendering functions for HP and energy bars

import { CombatState, createEmptyCombatState } from '../utils/combatState'; // combat status container and reset helper

import type { RunData } from './RunScene'; // run-progress data passed into this scene
import { completeRun, getPlayer, beatPythra } from '../utils/auth.js'; // API call to save run result
import { showLoadingScreen } from '../utils/loadingScreen.js';
import { transitionTo } from '../utils/sceneTransition.js';

import { MAP_CONFIGS } from '../utils/mapConfig.js'; // background pairing per run map

import cardFrame from '../assets/sprites/FFCardFront.webp'; // card frame image

// element-specific card art used for the table card and the card backs in the deck and discard pile
import cardFireSpecial from '../assets/sprites/CardFire.webp'; 
import cardWaterSpecial from '../assets/sprites/CardWater.webp';
import cardSandSpecial from '../assets/sprites/CardSand.webp';
import cardSwampSpecial from '../assets/sprites/CardSwamp.webp';

import cardIceWildcard from '../assets/sprites/CardIceFront.webp'; // sprite for the Ice wildcard

import christianIdle from '../assets/characters/christian/Christian_v4_resized.webp'; // Christian idle sprite
import christianAttack1 from '../assets/characters/christian/Christian_attack-1.webp'; // Christian attack animation frame 1
import christianAttack2 from '../assets/characters/christian/Christian_attack-2.webp'; // Christian attack animation frame 2
import christianDamage1 from '../assets/characters/christian/Christian_damage-1.webp'; // Christian hurt sprite 1
import christianDamage2 from '../assets/characters/christian/Christian_damage-2.webp'; // Christian hurt sprite 2
import christinDefeated from '../assets/characters/christian/Christian_defeated.webp'; // Christian defeated sprite

import gustavIdle from '../assets/characters/gustav/Gustav_v3_resized.webp'; // Gustav idle sprite
import gustavAttack1 from '../assets/characters/gustav/Gustav_attack-1.webp'; // Gustav attack animation frame 1
import gustavAttack2 from '../assets/characters/gustav/Gustav_attack-2.webp'; // Gustav attack animation frame 2
import gustavDamage1 from '../assets/characters/gustav/Gustav_damage-1.webp'; // Gustav hurt sprite 1
import gustavDamage2 from '../assets/characters/gustav/Gustav_damage-2.webp'; // Gustav hurt sprite 2
import gustavDefeated from '../assets/characters/gustav/Gustav_defeated.webp'; // Gustav defeated sprite

import gavinIdle from '../assets/characters/gavin/Gavin_v3_resized.webp'; // Gavin idle sprite
import gavinAttack1 from '../assets/characters/gavin/Gavin_attack-1.webp'; // Gavin attack animation frame 1
import gavinAttack2 from '../assets/characters/gavin/Gavin_attack-2.webp'; // Gavin attack animation frame 2
import gavinDamage1 from '../assets/characters/gavin/Gavin_damage-1.webp'; // Gavin hurt sprite 1
import gavinDamage2 from '../assets/characters/gavin/Gavin_damage-2.webp'; // Gavin hurt sprite 2
import gavinDefeated from '../assets/characters/gavin/Gavin_defeated.webp'; // Gavin defeated sprite

import eddyIdle from '../assets/characters/eddy/Eddy_v2_resized.webp'; // Eddy idle sprite
import eddyAttack1 from '../assets/characters/eddy/Eddy_attack-1.webp'; // Eddy attack animation frame 1
import eddyAttack2 from '../assets/characters/eddy/Eddy_attack-2.webp'; // Eddy attack animation frame 2
import eddyDamage1 from '../assets/characters/eddy/Eddy_damage-1.webp'; // Eddy hurt sprite 1
import eddyDamage2 from '../assets/characters/eddy/Eddy_damage-2.webp'; // Eddy hurt sprite 2
import eddyDefeated from '../assets/characters/eddy/Eddy_defeated.webp'; // Eddy defeated sprite

import { BOSS_VISUALS } from '../utils/bossConfig.js';

import skawlIdle from '../assets/characters/skawl/Skawl_resized.webp'; // Skawl idle sprite
import skawlAttack1 from '../assets/characters/skawl/Skawl_attack-1.webp'; // Skawl attack animation frame 1
import skawlAttack2 from '../assets/characters/skawl/Skawl_attack-2.webp'; // Skawl attack animation frame 2
import skawlUlti1 from '../assets/characters/skawl/Skawl_ulti-1.webp'; // Skawl ultimate animation frame 1
import skawlUlti2 from '../assets/characters/skawl/Skawl_ulti-2.webp'; // Skawl ultimate animation frame 2
import skawlDamage1 from '../assets/characters/skawl/Skawl_damage-1.webp'; // Skawl hurt sprite 1
import skawlDamage2 from '../assets/characters/skawl/Skawl_damage-2.webp'; // Skawl hurt sprite 2
import skawlDefeated from '../assets/characters/skawl/Skawl_defeated.webp'; // Skawl defeated sprite

import rabyzIdle from '../assets/characters/rabyz/Rabyz_resized.webp'; // Rabyz idle sprite
import rabyzAttack1 from '../assets/characters/rabyz/Rabyz_attack-1.webp'; // Rabyz attack animation frame 1
import rabyzAttack2 from '../assets/characters/rabyz/Rabyz_attack-2.webp'; // Rabyz attack animation frame 2
import rabyzUlti1 from '../assets/characters/rabyz/Rabyz_ulti-1.webp'; // Rabyz ultimate animation frame 1
import rabyzUlti2 from '../assets/characters/rabyz/Rabyz_ulti-2.webp'; // Rabyz ultimate animation frame 2
import rabyzDamage1 from '../assets/characters/rabyz/Rabyz_damage-1.webp'; // Rabyz hurt sprite 1
import rabyzDamage2 from '../assets/characters/rabyz/Rabyz_damage-2.webp'; // Rabyz hurt sprite 2
import rabyzDefeated from '../assets/characters/rabyz/Rabyz_defeated.webp'; // Rabyz defeated sprite

import boldearIdle from '../assets/characters/boldear/Boldear_resized.webp'; // Boldear idle sprite
import boldearAttack1 from '../assets/characters/boldear/Boldear_attack-1.webp'; // Boldear attack animation frame 1
import boldearAttack2 from '../assets/characters/boldear/Boldear_attack-2.webp'; // Boldear attack animation frame 2
import boldearUlti1 from '../assets/characters/boldear/Boldear_ulti-1.webp'; // Boldear ultimate animation frame 1
import boldearUlti2 from '../assets/characters/boldear/Boldear_ulti-2.webp'; // Boldear ultimate animation frame 2
import boldearDamage1 from '../assets/characters/boldear/Boldear_damage-1.webp'; // Boldear hurt sprite 1
import boldearDamage2 from '../assets/characters/boldear/Boldear_damage-2.webp'; // Boldear hurt sprite 2
import boldearDefeated from '../assets/characters/boldear/Boldear_defeated.webp'; // Boldear defeated sprite

import pythraEvolution1 from '../assets/characters/pythra/Pythra_evolution-1_resized.webp'; // Pythra evolution phase 1 sprite
import pythraAttack1 from '../assets/characters/pythra/Pythra_attack-1.webp'; // Pythra attack animation frame 1
import pythraAttack2 from '../assets/characters/pythra/Pythra_attack-2.webp'; // Pythra attack animation frame 2
import pythraUlti1 from '../assets/characters/pythra/Pythra_ulti-1.webp'; // Pythra ultimate animation frame 1
import pythraUlti2 from '../assets/characters/pythra/Pythra_ulti-2.webp'; // Pythra ultimate animation frame 2
import pythraPrepare1 from '../assets/characters/pythra/Pythra_prepare-1.webp'; // Pythra evolution preparation sprite 1
import pythraPrepare2 from '../assets/characters/pythra/Pythra_prepare-2.webp'; // Pythra evolution preparation sprite 2
import pythraEvolution2 from '../assets/characters/pythra/Pythra_evolution-2.webp'; // Pythra evolution phase 2 sprite
import pythraAttack3 from '../assets/characters/pythra/Pythra_attack-3.webp'; // Pythra attack animation frame 3 used in phase 2
import pythraAttack4 from '../assets/characters/pythra/Pythra_attack-4.webp'; // Pythra attack animation frame 4 used in phase 2
import pythraUlti3 from '../assets/characters/pythra/Pythra_ulti-3.webp'; // Pythra ultimate animation frame 3 used in phase 2
import pythraUlti4 from '../assets/characters/pythra/Pythra_ulti-4.webp'; // Pythra ultimate animation frame 4 used in phase 2
import pythraPrepare3 from '../assets/characters/pythra/Pythra_prepare-3.webp'; // Pythra evolution preparation sprite 3 used in phase 2
import pythraPrepare4 from '../assets/characters/pythra/Pythra_prepare-4.webp'; // Pythra evolution preparation sprite 4 used in phase 2
import pythraEvolution3 from '../assets/characters/pythra/Pythra_evolution-3.webp'; // Pythra evolution phase 3 sprite used in phase 2
import pythraAttack5 from '../assets/characters/pythra/Pythra_attack-5.webp'; // Pythra attack animation frame 5 used in phase 3
import pythraAttack6 from '../assets/characters/pythra/Pythra_attack-6.webp'; // Pythra attack animation frame 6 used in phase 3
import pythraUlti5 from '../assets/characters/pythra/Pythra_ulti-5.webp'; // Pythra ultimate animation frame 5 used in phase 3
import pythraUlti6 from '../assets/characters/pythra/Pythra_ulti-6.webp'; // Pythra ultimate animation frame 6 used in phase 3
import pythraDamage1 from '../assets/characters/pythra/Pythra_damage-1.webp'; // Pythra hurt sprite 1
import pythraDamage2 from '../assets/characters/pythra/Pythra_damage-2.webp'; // Pythra hurt sprite 2
import pythraDefeated from '../assets/characters/pythra/Pythra_defeated.webp'; // Pythra defeated sprite

import music from '../assets/music/Cane_Field_Siege.mp3'; // background music for the duel, imported directly for Vite compatibility
import { DuelBossData } from '../utils/bossTypes.js';

export class DuelScene extends Phaser.Scene {
  private allDbCards: Card[] = []; // full card list fetched from the server, used for deck generation 
  private baseCardsFromDb: Card[] = []; // subset of allDbCards that are the base cards, used for guaranteed deck content and table card generation
  private effectCardsFromDb: Card[] = []; // subset of allDbCards that are the effect cards, used for populating the special card pool for deck generation
  private rareCardsFromDb: Card[] = []; // subset of allDbCards that are the rare cards, used for populating the special card pool for deck generation
  private legendaryCardsFromDb: Card[] = []; // subset of allDbCards that are the legendary cards, used for populating the special card pool for deck generation

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
  private runId = 0; // server-side run id, passed through from RunScene
  private totalCoins = 0; // coins accumulated across this run
  private totalXp = 0; // XP accumulated across this run

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
  private playerShieldBar!: Phaser.GameObjects.Graphics; // player shield bar graphics
  private enemyShieldBar!: Phaser.GameObjects.Graphics; // enemy shield bar graphics  
  private playerShieldText!: Phaser.GameObjects.Text; // player shield display
  private enemyShieldText!: Phaser.GameObjects.Text; // enemy shield display

  private playerMaxHp = MAX_HP; // player's max HP, used for scaling the HP bar and for certain card effects that reference max HP
  private enemyMaxHp = MAX_HP; // enemy's max HP, used for scaling the HP bar and for certain card effects that reference max HP
  private playerHpBar!: Phaser.GameObjects.Graphics; // player HP bar graphics
  private enemyHpBar!: Phaser.GameObjects.Graphics; // enemy HP bar graphics
  private playerHpText!: Phaser.GameObjects.Text; // player HP label
  private enemyHpText!: Phaser.GameObjects.Text; // enemy HP label
  private playerEeBar!: Phaser.GameObjects.Graphics; // player elemental energy bar renderer
  private playerEiBar!: Phaser.GameObjects.Graphics; // player instinct energy bar renderer
  private enemyEeBar!: Phaser.GameObjects.Graphics; // enemy elemental energy bar renderer
  private enemyEiBar!: Phaser.GameObjects.Graphics; // enemy instinct energy bar renderer

  private playerHealText!: Phaser.GameObjects.Text; // floating player heal text
  private enemyHealText!: Phaser.GameObjects.Text; // floating enemy heal text
  private playerShieldDeltaText!: Phaser.GameObjects.Text; // floating player shield gain/loss text
  private enemyShieldDeltaText!: Phaser.GameObjects.Text; // floating enemy shield gain/loss text
  private playerDamageText!: Phaser.GameObjects.Text; // floating player damage text
  private enemyDamageText!: Phaser.GameObjects.Text; // floating enemy damage text
  private totalXpText!: Phaser.GameObjects.Text; // total XP display
  private totalCoinsText!: Phaser.GameObjects.Text; // total coin display

  private selectedBoss?: DuelBossData; // the boss selected for the duel, assigned when the player reaches the end zone in RunScene and used to configure the DuelScene enemy
  private bossLivesRemaining = 1; // only for Pythra
  private currentMap?: string; // Phaser texture key for the active RunScene map, forwarded back on cycle advance
  private pythraPhase = 1; // tracks Pythra's evolution phase for animation purposes

  private selectedPlayerKey: PlayerCharacterKey = 'christian';
  private activeCharacterStats: ActiveCharacterStats = {
    characterGameId: 1,
    characterName: 'Christian',
    characterKey: 'christian',
    baseHp: 120,
    baseAttack: 2,
    baseDefense: 5,
    chUltimate: 'Vertical Leap',
    chUltimateDesc: 'Recovers 55% of current HP and 30% shield. Gains a valid card based on the table card.',
  }; // stats for the player's active character, used for rendering and certain card effects

  private playerCharacter!: Phaser.GameObjects.Image; // player character sprite
  private enemyCharacter!: Phaser.GameObjects.Image; // enemy character sprite
  private playerShadow!: Phaser.GameObjects.Graphics; // player shadow graphic
  private enemyShadow!: Phaser.GameObjects.Graphics; // enemy shadow graphic

  protected isAnimating = false; // locks input while a turn animation is running
  // private currentEnemyImage = 'enemy-default'; // tracks which enemy texture is currently active

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig = { key: 'DuelScene' }) {
    super(config); // scene key used by Phaser
  }

  // Translation table loaded in create(), used by tf()
  private t: Record<string, any> = {};
 
  // Helper: resolves both plain strings and interpolation functions
  private tf(key: string, ...args: any[]): string {
    const val = this.t[key];
    if (typeof val === 'function') return val(...args);
    return val ?? key;
  }

  init(data: Partial<RunData>) {
    this.level = data.level ?? 1; // restore level if passed in, otherwise start at level 1
    this.totalCoins = data.totalCoins ?? 0; // restore accumulated coins
    this.totalXp = data.totalXp ?? 0; // restore accumulated XP
    this.runId = data.runId ?? 0; // restore run id for server persistence
    this.selectedPlayerKey = normalizePlayerCharacterKey(getPlayer()?.equippedCharacter); // restore selected character from user data, default to 'christian' if not set or unrecognized
    this.selectedBoss = data.selectedBoss; // restore selected boss if passed in from RunScene, otherwise will be assigned when player reaches end zone in RunScene
    this.bossLivesRemaining = this.selectedBoss?.enemyName === 'Pythra' ? 3 : 1; // if the selected boss is Pythra, set lives to 2 to account for her evolution phase
    this.pythraPhase = 1; // reset Pythra phase to 1 at the start of each duel, will evolve when her HP reaches 0 until she has no lives remaining
    this.currentMap = data.currentMap;
  }

  preload() {
    showLoadingScreen(this);

    if (!this.cache.audio.has('duel-music'))       this.load.audio('duel-music', music);
    const bg = Object.values(MAP_CONFIGS).find(m => m.key === this.currentMap) ?? MAP_CONFIGS['everglades'];
    if (!this.textures.exists(bg.bgKey))            this.load.image(bg.bgKey, bg.bgUrl);
    if (!this.textures.exists('card-frame'))        this.load.image('card-frame', cardFrame);
    if (!this.textures.exists('card-fire-special')) this.load.image('card-fire-special', cardFireSpecial);
    if (!this.textures.exists('card-water-special'))this.load.image('card-water-special', cardWaterSpecial);
    if (!this.textures.exists('card-sand-special')) this.load.image('card-sand-special', cardSandSpecial);
    if (!this.textures.exists('card-swamp-special'))this.load.image('card-swamp-special', cardSwampSpecial);
    if (!this.textures.exists('card-ice-wildcard')) this.load.image('card-ice-wildcard', cardIceWildcard);

    if (!this.textures.exists('christian-idle'))    this.load.image('christian-idle', christianIdle);
    if (!this.textures.exists('christian-attack-1'))this.load.image('christian-attack-1', christianAttack1);
    if (!this.textures.exists('christian-attack-2'))this.load.image('christian-attack-2', christianAttack2);
    if (!this.textures.exists('christian-damage-1'))this.load.image('christian-damage-1', christianDamage1);
    if (!this.textures.exists('christian-damage-2'))this.load.image('christian-damage-2', christianDamage2);
    if (!this.textures.exists('christian-defeated'))this.load.image('christian-defeated', christinDefeated);

    if (!this.textures.exists('gustav-idle'))      this.load.image('gustav-idle', gustavIdle);
    if (!this.textures.exists('gustav-attack-1'))  this.load.image('gustav-attack-1', gustavAttack1);
    if (!this.textures.exists('gustav-attack-2'))  this.load.image('gustav-attack-2', gustavAttack2);
    if (!this.textures.exists('gustav-damage-1'))  this.load.image('gustav-damage-1', gustavDamage1);
    if (!this.textures.exists('gustav-damage-2'))  this.load.image('gustav-damage-2', gustavDamage2);
    if (!this.textures.exists('gustav-defeated'))  this.load.image('gustav-defeated', gustavDefeated);

    if (!this.textures.exists('gavin-idle'))       this.load.image('gavin-idle', gavinIdle);
    if (!this.textures.exists('gavin-attack-1'))   this.load.image('gavin-attack-1', gavinAttack1);
    if (!this.textures.exists('gavin-attack-2'))   this.load.image('gavin-attack-2', gavinAttack2);
    if (!this.textures.exists('gavin-damage-1'))   this.load.image('gavin-damage-1', gavinDamage1);
    if (!this.textures.exists('gavin-damage-2'))   this.load.image('gavin-damage-2', gavinDamage2);
    if (!this.textures.exists('gavin-defeated'))   this.load.image('gavin-defeated', gavinDefeated);

    if (!this.textures.exists('eddy-idle'))        this.load.image('eddy-idle', eddyIdle);
    if (!this.textures.exists('eddy-attack-1'))    this.load.image('eddy-attack-1', eddyAttack1);
    if (!this.textures.exists('eddy-attack-2'))    this.load.image('eddy-attack-2', eddyAttack2);
    if (!this.textures.exists('eddy-damage-1'))    this.load.image('eddy-damage-1', eddyDamage1);
    if (!this.textures.exists('eddy-damage-2'))    this.load.image('eddy-damage-2', eddyDamage2);
    if (!this.textures.exists('eddy-defeated'))    this.load.image('eddy-defeated', eddyDefeated);

    const bossName = this.selectedBoss?.enemyName ?? 'Skawl';

    if (bossName === 'Skawl') {
      if (!this.textures.exists('skawl-idle'))     this.load.image('skawl-idle', skawlIdle);
      if (!this.textures.exists('skawl-attack-1')) this.load.image('skawl-attack-1', skawlAttack1);
      if (!this.textures.exists('skawl-attack-2')) this.load.image('skawl-attack-2', skawlAttack2);
      if (!this.textures.exists('skawl-ulti-1'))   this.load.image('skawl-ulti-1', skawlUlti1);
      if (!this.textures.exists('skawl-ulti-2'))   this.load.image('skawl-ulti-2', skawlUlti2);
      if (!this.textures.exists('skawl-damage-1')) this.load.image('skawl-damage-1', skawlDamage1);
      if (!this.textures.exists('skawl-damage-2')) this.load.image('skawl-damage-2', skawlDamage2);
      if (!this.textures.exists('skawl-defeated')) this.load.image('skawl-defeated', skawlDefeated);
    } else if (bossName === 'Rabyz') {
      if (!this.textures.exists('rabyz-idle'))     this.load.image('rabyz-idle', rabyzIdle);
      if (!this.textures.exists('rabyz-attack-1')) this.load.image('rabyz-attack-1', rabyzAttack1);
      if (!this.textures.exists('rabyz-attack-2')) this.load.image('rabyz-attack-2', rabyzAttack2);
      if (!this.textures.exists('rabyz-ulti-1'))   this.load.image('rabyz-ulti-1', rabyzUlti1);
      if (!this.textures.exists('rabyz-ulti-2'))   this.load.image('rabyz-ulti-2', rabyzUlti2);
      if (!this.textures.exists('rabyz-damage-1')) this.load.image('rabyz-damage-1', rabyzDamage1);
      if (!this.textures.exists('rabyz-damage-2')) this.load.image('rabyz-damage-2', rabyzDamage2);
      if (!this.textures.exists('rabyz-defeated')) this.load.image('rabyz-defeated', rabyzDefeated);
    } else if (bossName === 'Boldear') {
      if (!this.textures.exists('boldear-idle'))     this.load.image('boldear-idle', boldearIdle);
      if (!this.textures.exists('boldear-attack-1')) this.load.image('boldear-attack-1', boldearAttack1);
      if (!this.textures.exists('boldear-attack-2')) this.load.image('boldear-attack-2', boldearAttack2);
      if (!this.textures.exists('boldear-ulti-1'))   this.load.image('boldear-ulti-1', boldearUlti1);
      if (!this.textures.exists('boldear-ulti-2'))   this.load.image('boldear-ulti-2', boldearUlti2);
      if (!this.textures.exists('boldear-damage-1')) this.load.image('boldear-damage-1', boldearDamage1);
      if (!this.textures.exists('boldear-damage-2')) this.load.image('boldear-damage-2', boldearDamage2);
      if (!this.textures.exists('boldear-defeated')) this.load.image('boldear-defeated', boldearDefeated);
    } else if (bossName === 'Pythra') {
      if (!this.textures.exists('pythra-evolution-1')) this.load.image('pythra-evolution-1', pythraEvolution1);
      if (!this.textures.exists('pythra-attack-1'))    this.load.image('pythra-attack-1', pythraAttack1);
      if (!this.textures.exists('pythra-attack-2'))    this.load.image('pythra-attack-2', pythraAttack2);
      if (!this.textures.exists('pythra-ulti-1'))      this.load.image('pythra-ulti-1', pythraUlti1);
      if (!this.textures.exists('pythra-ulti-2'))      this.load.image('pythra-ulti-2', pythraUlti2);
      if (!this.textures.exists('pythra-prepare-1'))   this.load.image('pythra-prepare-1', pythraPrepare1);
      if (!this.textures.exists('pythra-prepare-2'))   this.load.image('pythra-prepare-2', pythraPrepare2);
      if (!this.textures.exists('pythra-evolution-2')) this.load.image('pythra-evolution-2', pythraEvolution2);
      if (!this.textures.exists('pythra-attack-3'))    this.load.image('pythra-attack-3', pythraAttack3);
      if (!this.textures.exists('pythra-attack-4'))    this.load.image('pythra-attack-4', pythraAttack4);
      if (!this.textures.exists('pythra-ulti-3'))      this.load.image('pythra-ulti-3', pythraUlti3);
      if (!this.textures.exists('pythra-ulti-4'))      this.load.image('pythra-ulti-4', pythraUlti4);
      if (!this.textures.exists('pythra-prepare-3'))   this.load.image('pythra-prepare-3', pythraPrepare3);
      if (!this.textures.exists('pythra-prepare-4'))   this.load.image('pythra-prepare-4', pythraPrepare4);
      if (!this.textures.exists('pythra-evolution-3')) this.load.image('pythra-evolution-3', pythraEvolution3);
      if (!this.textures.exists('pythra-attack-5'))    this.load.image('pythra-attack-5', pythraAttack5);
      if (!this.textures.exists('pythra-attack-6'))    this.load.image('pythra-attack-6', pythraAttack6);
      if (!this.textures.exists('pythra-ulti-5'))      this.load.image('pythra-ulti-5', pythraUlti5);
      if (!this.textures.exists('pythra-ulti-6'))      this.load.image('pythra-ulti-6', pythraUlti6);
      if (!this.textures.exists('pythra-damage-1'))    this.load.image('pythra-damage-1', pythraDamage1);
      if (!this.textures.exists('pythra-damage-2'))    this.load.image('pythra-damage-2', pythraDamage2);
      if (!this.textures.exists('pythra-defeated'))    this.load.image('pythra-defeated', pythraDefeated);
    }
  }

  private async loadCardsFromBackend(): Promise<void> {
    const rawCards = await fetchCards(); // fetch raw card data from the server
    const mappedCards: Card[] = rawCards.map(mapCardData); // convert raw card data to Card type used in the client

    this.allDbCards = mappedCards; // store the full card list for reference
    this.baseCardsFromDb = mappedCards.filter((card: Card) => card.rarity === 'base'); // extract base cards for guaranteed deck content and table card generation
    this.effectCardsFromDb = mappedCards.filter((card: Card) => card.rarity === 'effect'); // extract effect cards for populating the special card pool for deck generation
    this.rareCardsFromDb = mappedCards.filter((card: Card) => card.rarity === 'rare'); // extract rare cards for populating the special card pool for deck generation
    this.legendaryCardsFromDb = mappedCards.filter((card: Card) => card.rarity === 'legendary'); // extract legendary cards for populating the special card pool for deck generation
  }

  private async tryLoadCards(): Promise<void> {
    try {
      await this.loadCardsFromBackend(); // attempt to load card data from the server
      console.log('Cards loaded successfully from backend: ', this.allDbCards.length);
    } 
    
    catch (error) {
      console.error('Failed to load cards from backend (using local fallback): ', error);

      this.baseCardsFromDb = getBaseCardPool(); // use local fallback for base cards if server load fails
      this.effectCardsFromDb = getSpecialCardPool(); // empty effect card pool if server load fails, resulting in simpler decks
      this.rareCardsFromDb = getIceCardPool(); // empty rare card pool if server load fails
      this.legendaryCardsFromDb = getLegendaryCardPool(); // use local fallback for legendary cards if server load fails, ensuring legendary cards are still available in the game
      this.allDbCards = [
        ...this.baseCardsFromDb, 
        ...this.effectCardsFromDb, 
        ...this.rareCardsFromDb, 
        ...this.legendaryCardsFromDb
      ]; // reconstruct the full card list from the subsets}
    }
  }

  private async initializeDuel():Promise<void> {
    await this.tryLoadCards(); // ensure card data is loaded before proceeding with duel setup

    await this.setupDecks(); // create and populate player and enemy decks
    this.renderTableCard(); // generate and render the initial table card
    this.renderDiscardTopCard(); // render the top card of the discard pile
    this.renderCards(); // draw the starting hand for both player and enemy
    this.refreshHud(); // sync the HUD with the initial state of the duel
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    if (this.input.keyboard) this.input.keyboard.enabled = true;

    const { width, height } = this.cameras.main; // current scene dimensions
    const centerX = width / 2; // horizontal center point

    // Load translations for the active language
    const langKey = this.registry.get('language') || 'en';
    this.t = translations[langKey];

    let currentMusic = this.registry.get('music');
    if (currentMusic && currentMusic.key !== 'duel-music') {
        currentMusic.stop();
        currentMusic = null; // Limpiamos para crear la nueva
    }
    if (!currentMusic || !currentMusic.isPlaying) {
        const duelMusic = this.sound.add('duel-music', { loop: true, volume: 0.5 });
        this.registry.set('music', duelMusic);
        duelMusic.play();
    } 

    this.events.once('shutdown', () => {
        const currentMusic = this.registry.get('music');
        if (currentMusic) {
            currentMusic.stop();
        }
    });

    this.resetDuelState(); // clear all duel state before building the scene

    const bgCfg = Object.values(MAP_CONFIGS).find(m => m.key === this.currentMap) ?? MAP_CONFIGS['everglades'];
    this.add.image(centerX, height / 2, bgCfg.bgKey).setDepth(0); // place the background in the center

    this.createCharacters(); // place player and enemy sprites
    this.drawHudPanels(); // draw the dark HUD containers behind the UI
    this.createHud(); // build the text bars and labels
    this.initializeDuel().catch((error: Error) => {
      const msg = error?.message ?? 'Failed to start duel.';
      this.add.text(centerX, height / 2, msg, {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '26px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: 600 },
      }).setOrigin(0.5).setDepth(20);
      this.time.delayedCall(3000, () => transitionTo(this, 'MenuScene'));
    }); // initialize the duel with loaded card data
    // this.updateInstruction(); // kept commented out as in your current code

    if (getPlayer()?.isAdmin) {
      const keyP = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P); // shortcut for advancing the run
      keyP.on('down', () => this.advanceToNextCycle()); // move to the next run scene on P press
    }

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); // key for opening the pause menu
    escKey?.on('down', () => {
      if (this.scene.isActive('PauseScene')) return; // prevent opening multiple pause menus
      this.scene.launch('PauseScene', { returnScene: this.scene.key, runId: this.runId, totalCoins: this.totalCoins, totalXp: this.totalXp, level: this.level }); // open the pause menu and tell it to return here when resuming
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
      this.scene.launch('PauseScene', { returnScene: this.scene.key, runId: this.runId, totalCoins: this.totalCoins, totalXp: this.totalXp, level: this.level }); // open the pause menu and tell it to return here when resuming
      this.scene.pause(); // pause the duel scene
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
        const promptText = this.add.text(cx, cy - 48, this.tf('duel_quit_title'), {
          fontSize: '28px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
        const subText = this.add.text(cx, cy - 10, this.tf('duel_quit_sub'), {
          fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
        const yesBtn = this.add.text(cx - 75, cy + 58, this.tf('duel_quit_yes'), {
          fontSize: '22px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
          backgroundColor: '#8b0000', padding: { x: 30, y: 10 },
        }).setOrigin(0.5).setDepth(10001).setScrollFactor(0)
          .setInteractive({ useHandCursor: true });
        const noBtn = this.add.text(cx + 75, cy + 58, this.tf('duel_quit_no'), {
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

  private async advanceToNextCycle() {
    if ((this as any).__transitioning) return;

    const runData: RunData = {
      level: this.level + 1,
      step: 0,
      totalCoins: this.totalCoins,
      totalXp: this.totalXp,
      runId: this.runId,
      currentMap: this.currentMap,
    };

    if (this.selectedBoss?.enemyName === 'Pythra') {
      const firstTime = await beatPythra();
      if (firstTime) {
        transitionTo(this, 'EndScene', runData);
        return;
      }
    }

    transitionTo(this, 'RunScene', runData);
  }

  private resetDuelState() {
    // Reset boolean flags — these persist across scene restarts since Phaser reuses the instance
    (this as any).__transitioning = false; // guard against stale transitionTo flag blocking the P key skip
    this.runEnded = false;
    this.isShowingQuitDialog = false;
    this.sidebarNavHandler = null;

    this.levelsWon = 0; // reset victory count

    this.playerDeck = []; // clear player deck
    this.enemyDeck = []; // clear enemy deck
    this.playerHand = []; // clear player hand
    this.enemyHand = []; // clear enemy hand
    this.discardPile = []; // clear discard pile

    this.playerState = createEmptyCombatState(); // reset player status effects
    this.enemyState = createEmptyCombatState(); // reset enemy status effects

    this.playerMaxHp = this.activeCharacterStats.baseHp; // restore player max HP from active character
    this.playerHp = this.playerMaxHp; // reset player HP to max
    this.playerState.shield = this.activeCharacterStats.baseDefense; // starting shield comes from character base defense

    this.enemyMaxHp = this.selectedBoss?.enemyBaseHp ?? MAX_HP; // set enemy max HP, using boss HP when available
    this.enemyHp = this.enemyMaxHp; // reset enemy HP to max

    this.playerElementalEnergy = 10; // keep your current testing values
    this.playerInstinctEnergy = 10;
    this.enemyElementalEnergy = 10;
    this.enemyInstinctEnergy = 10;

    this.cardObjects = []; // clear rendered hand objects
    this.currentTableCardObject = undefined; // clear table card object reference
    this.discardTopCardObject = undefined; // clear discard top card reference
    this.discardClickZone = undefined; // clear discard click zone
    this.isAnimating = false; // unlock combat input

    console.log('selected boss: ', this.selectedBoss); // temporal log
  }

  private drawHudPanels() {
    const { width, height } = this.cameras.main; // use camera size so UI scales with the scene
    const centerX = width / 2; // center point for symmetric panels
    const panels = this.add.graphics(); // graphics object used to draw HUD boxes
    panels.setDepth(1); // ensure panels are on top of the sprites but behind the text and cards
    this.drawMetalPlate(panels, 315, 195, false, 25, 20); // player panel
    this.drawMetalPlate(panels, 315, 195, false, width - 340, 20); // enemy panel
    this.drawMetalPlate(panels, 380, 90, false, centerX - 190, 24); // top center panel for level and messages
    this.drawMetalPlate(panels, 240, 260, false, centerX - 120, 165); // center panel for deck cards and deck/discard info
    this.drawMetalPlate(panels, 720, 210, false, centerX - 360, height - 235); // bottom panel for the table card (hand bar)
    this.drawMetalPlate(panels, 620, 78, false, centerX - 310, 440); // deck and discard panel above the hand bar

  }

  private createHud() {
    const centerX = this.cameras.main.width / 2; // shared horizontal center for top HUD

    this.levelText = this.add.text(centerX, 50, this.tf('duel_level', this.level), {
      fontSize: '36px',
      color: '#d1fcb2',
      fontStyle: 'bold',
      stroke: '#080808',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6); // center the level title and ensure it's above the panels but below the cards
    this.levelText.setShadow(1, 1, '#84ff00', 2, false, true); // add a shadow to the level text for better visibility
    this.levelText.setAlpha(0.9);


    this.battleMessageText = this.add.text(centerX, 86, '', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5); // short combat feedback line and position it just below the level text
    this.battleMessageText.setShadow(1, 1, '#000000', 2, false, true); // add a shadow to the battle message text for better visibility
    this.battleMessageText.setAlpha(0.9); // slightly fade the battle message text for a more integrated look

    this.tableCardLabel = this.add.text(centerX, 185, this.tf('duel_table_card'), {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(5).setShadow(1, 1, '#84ff00', 2, false, true).setAlpha(0.9); // label above the main card in play

    this.instructionText = this.add.text(centerX, 540, this.tf('duel_instruction'), {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(5); // player guidance text
    this.instructionText.setShadow(1, 1, '#000000', 2, false, true); // add a shadow to the instruction text for better visibility
    this.instructionText.setAlpha(0.9); // slightly fade the instruction text for a more integrated look


    this.add.text(125, 28, this.tf('duel_player'), {
      fontSize: '22px',
      color: '#00ff88',
      fontStyle: 'bold',
      stroke: '#003311',
      strokeThickness: 4
    }).setDepth(6).setShadow(2, 2, '#000000', 2); // player panel label

    this.playerHpBar = this.add.graphics().setDepth(5); // player HP bar renderer
    this.playerHpText = this.add.text(120, 59, '', { 
      fontSize: '16px', 
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#003311',
      strokeThickness: 4
    }).setDepth(6); // player HP text is on a higher depth than the bar so it appears on top
    this.playerHpText.setShadow(1, 1, '#000000', 2, false, true); // add a shadow to the player HP text for better visibility
    this.playerHpText.setAlpha(0.9); // slightly fade the player HP text for a more integrated look

    this.playerShieldBar = this.add.graphics().setDepth(5); // player shield bar renderer
    this.playerShieldText = this.add.text(150, 86, '', { 
      fontSize: '15px', 
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#003311',
      strokeThickness: 4
    }).setDepth(6); // player shield text
    this.playerShieldText.setShadow(1, 1, '#000000', 2, false, true); // add a shadow to the player shield text for better visibility
    this.playerShieldText.setAlpha(0.9); // slightly fade the player shield text for a more integrated look

    this.add.text(48, 136, this.tf('duel_ee'), { 
      fontSize: '15px', 
      color: '#9ae66e', 
      fontStyle: 'bold' 
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9); // elemental energy label

    this.playerEeBar = this.add.graphics().setDepth(5); // player elemental energy bar renderer
    this.add.text(48, 166, this.tf('duel_ie'), { 
      fontSize: '15px', 
      color: '#69c0ff', 
      fontStyle: 'bold' 
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9); // instinct energy label

    this.playerEiBar = this.add.graphics().setDepth(5); // player instinct energy bar renderer

    this.totalXpText = this.add.text(48, 188, this.tf('duel_xp', this.totalXp), {
      fontSize: '14px',
      color: '#66ccff',
      fontStyle: 'bold'
    }).setDepth(5); // running XP total
    this.totalXpText.setShadow(1, 1, '#000000', 2, false, true); // add a shadow to the total XP text for better visibility
    this.totalXpText.setAlpha(0.9); // slightly fade the total XP text for a more integrated look

    this.totalCoinsText = this.add.text(170, 188, this.tf('duel_coins', this.totalCoins), {
      fontSize: '14px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setDepth(5); // running coin total
    this.totalCoinsText.setShadow(1, 1, '#000000', 2, false, true); // add a shadow to the total coins text for better visibility
    this.totalCoinsText.setAlpha(0.9); // slightly fade the total coins text for a more integrated look

    this.add.text(this.cameras.main.width - 220, 28, this.tf('duel_enemy'), {
      fontSize: '22px',
      color: '#ff6666',
      fontStyle: 'bold',
      stroke: '#003311',
      strokeThickness: 4
    }).setDepth(5).setShadow(2, 2, '#000000', 2); // enemy panel label

    this.enemyHpBar = this.add.graphics().setDepth(5); // enemy HP bar renderer
    this.enemyHpText = this.add.text(this.cameras.main.width - 220, 59, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#003311',
      strokeThickness: 4
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9); // enemy HP text

    this.enemyShieldBar = this.add.graphics().setDepth(5); // enemy shield bar renderer
    this.enemyShieldText = this.add.text(this.cameras.main.width - 190, 86, '', {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#003311',
      strokeThickness: 4
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9); // enemy shield text

    this.add.text(this.cameras.main.width - 292, 136, this.tf('duel_ee'), {
      fontSize: '15px',
      color: '#9ae66e',
      fontStyle: 'bold',
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9); // enemy elemental energy label

    this.enemyEeBar = this.add.graphics().setDepth(5); // enemy elemental energy bar renderer

    this.add.text(this.cameras.main.width - 292, 166, this.tf('duel_ie'), {
      fontSize: '15px',
      color: '#69c0ff',
      fontStyle: 'bold',
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9); // enemy instinct energy label

    this.enemyEiBar = this.add.graphics().setDepth(5); // enemy instinct energy bar renderer

    this.playerHealText = this.add.text(215, 58, '', {
      fontSize: '18px',
      color: '#ff66cc',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9).setDepth(7); // floating heal text for the player, positioned above the player HP bar

    this.enemyHealText = this.add.text(this.cameras.main.width - 125, 58, '', {
      fontSize: '18px',
      color: '#ff66cc',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9).setDepth(7); // floating heal text for the enemy, positioned above the enemy HP bar

    this.playerDamageText = this.add.text(215, 58, '', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9).setDepth(7); // floating damage text for the player

    this.enemyDamageText = this.add.text(this.cameras.main.width - 125, 58, '', {
      fontSize: '18px',
      color: '#ff6666',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9).setDepth(7); // floating damage text for the enemy

    this.playerShieldDeltaText = this.add.text(215, 84, '', {
      fontSize: '18px',
      color: '#ffa77f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9).setDepth(7); // floating shield gain/loss text for the player, positioned above the player shield bar

    this.enemyShieldDeltaText = this.add.text(this.cameras.main.width - 125, 84, '', {
      fontSize: '18px',
      color: '#ffa77f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(5).setShadow(1, 1, '#000000', 2, false, true).setAlpha(0.9).setDepth(7); // floating shield gain/loss text for the enemy, positioned above the enemy shield bar

    this.deckCountText = this.add.text(centerX - 230, 462, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(5).setShadow(1, 1, '#84ff00', 2, false, true).setAlpha(0.9); // deck counter display

    this.discardCountText = this.add.text(centerX + 240, 462, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(5).setShadow(1, 1, '#84ff00', 2, false, true).setAlpha(0.9); // discard counter display

    this.drawDeckPlaceholder(centerX - 135, 478, 'Deck').setDepth(5); // visual placeholder for the deck pile

    this.discardDrawHintText = this.add.text(centerX + 243, 489, this.tf('duel_discard_hint'), {
      fontSize: '12px',
      color: '#eed112',
      fontStyle: 'bold',
      stroke: '#fffb00',
    }).setOrigin(0.5).setDepth(5).setShadow(1, 1, '#373600', 2, false, true).setAlpha(0.9); // hint under the discard pile
  }

  private createCharacters() {
    const bossConfig = this.getCurrentBossConfig();
    const currentPhase = this.getCurrentBossVisual();
    const playerVisual = PLAYER_VISUALS[this.selectedPlayerKey].duel;

    this.playerShadow = this.add.graphics().setDepth(0);
    this.playerShadow.fillStyle(0x000000, 0.22);
    this.playerShadow.fillEllipse(playerVisual.x, playerVisual.y + 90, 150, 32);

    this.enemyShadow = this.add.graphics().setDepth(0);
    this.enemyShadow.fillStyle(0x000000, 0.22);
    this.enemyShadow.fillEllipse(bossConfig.x + 90, bossConfig.y + 95, 170, 34);

    this.playerCharacter = this.add.image(
      playerVisual.x, playerVisual.y, playerVisual.idleKey
    )
      .setScale(playerVisual.idleScale)
      .setFlipX(playerVisual.flipX)
      .setDepth(playerVisual.depth);

    this.enemyCharacter = this.add.image(bossConfig.x, bossConfig.y, currentPhase.idleKey)
      .setScale(bossConfig.idleScale)
      .setFlipX(bossConfig.flipX)
      .setDepth(bossConfig.depth);
  }

  private cloneDeckCard(card: Card, index: number): Card {
    return {
      ...card, // copy all properties from the source card
      id: `${card.id}-deck-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // generate a unique ID for this instance of the card in the deck
    };
  }

  private async loadPlayerDeckFromBackend(): Promise<boolean> {
    const player = getPlayer();
    const playerId = Number(player?.id);

    if (!Number.isFinite(playerId) || playerId <= 0) {
      console.warn('No valid playerId found. Falling back to local deck generation.');
      return false;
    }

    const response = await fetchActiveDeck(playerId);

    if (!response?.deck?.cards || !Array.isArray(response.deck.cards)) {
      console.warn('Active deck response is invalid. Falling back to local deck generation.');
      return false;
    }

    const mappedCards: Card[] = response.deck.cards.map((entry: any, index: number) => {
      const dbCard = entry.card;
      if (!dbCard) return null; // skip invalid entries

      const mapped = mapCardData(dbCard);
      return this.cloneDeckCard(mapped, index); // create a unique instance of the card for the player's deck
    }).filter((card: Card | null): card is Card => Boolean(card)); // filter out any null entries resulting from invalid data

    const shuffled = shuffleCards(mappedCards); // shuffle the loaded deck to add variability to the starting hand and draw order

    this.playerDeck = shuffled.slice(5); // use the shuffled loaded deck as the player's deck, leaving the top 5 cards to be drawn into the starting hand
    this.playerHand = shuffled.slice(0, 5); // draw the top 5 cards from the loaded deck into the player's starting hand

    console.log('Active deck loaded from backend:', { 
      total: shuffled.length, 
      hand: this.playerHand.length, 
      deck: this.playerDeck.length, 
    });

    return true; // indicate that the deck was successfully loaded from the backend
  }

  private async setupDecks() {
    const basePool = this.baseCardsFromDb.length > 0 ? this.baseCardsFromDb : getBaseCardPool(); // ensure we have a base card pool to draw from, even if the server load failed
    const effectPool = this.effectCardsFromDb.length > 0 ? this.effectCardsFromDb : getSpecialCardPool(); // ensure we have an effect card pool to draw from, even if the server load failed
    const rarePool = this.rareCardsFromDb.length > 0 ? this.rareCardsFromDb : getIceCardPool(); // ensure we have a rare card pool to draw from, even if the server load failed

    const playerId = Number(getPlayer()?.id);
    try {
      const activeDeckResponse = await fetchActiveDeck(playerId);
      const activeDeck = activeDeckResponse.deck;

      this.selectedPlayerKey = 
      activeDeck.characterKey
      ?? PLAYER_ID_TO_KEY[activeDeck.characterGameId]
      ?? PLAYER_NAME_TO_KEY[activeDeck.characterName]
      ?? 'christian'; // default to Christian if we can't determine the character key from the active deck data for some reason

      this.activeCharacterStats = {
        characterGameId: activeDeck.characterGameId,
        characterName: activeDeck.characterName,
        characterKey: this.selectedPlayerKey,
        baseHp: activeDeck.baseHp ?? 120,
        baseAttack: activeDeck.baseAttack ?? 2,
        baseDefense: activeDeck.baseDefense ?? 5,
        chUltimate: activeDeck.chUltimate ?? null,
        chUltimateDesc: activeDeck.chUltimateDesc ?? null,
      };

      const allCardsById = new Map<number, Card>(this.allDbCards.map(card => [Number(card.id), card]));

      const activeDeckCards: Card[] = activeDeck.cards
      .map((entry: { cardGameId: number }) => allCardsById.get(entry.cardGameId))
      .filter((card: Card | undefined): card is Card => Boolean(card));
    const loadedFromBackendDeck = await this.loadPlayerDeckFromBackend(); // attempt to load the player's deck from the backend, which also sets up the starting hand if successful

      if (activeDeckCards.length >= HAND_SIZE) {
        this.playerDeck = shuffleCards([...activeDeckCards]);
      } 
      
      else {
        const fallbackPool = shuffleCards([...basePool, ...effectPool, ...rarePool]);
        this.playerDeck = shuffleCards([...activeDeckCards, ...fallbackPool].slice(0, PLAYER_DECK_SIZE));
      }
    }

    catch (error) {
      console.error('Failed to load active deck from backend, using fallback:', error);

      this.selectedPlayerKey = normalizePlayerCharacterKey(getPlayer()?.equippedCharacter);
    // const playerPool = [...basePool, ...effectPool, ...rarePool]; // combine the different rarity pools to create the player's card pool for deck generation
    const enemyPool = this.buildEnemyPoolForBoss(); // build the enemy's card pool based on the selected boss's AI level and associated card access

      const fallbackPlayerPool = [...basePool, ...effectPool, ...rarePool];
      this.playerDeck = this.generateDeckFromPool(fallbackPlayerPool, PLAYER_DECK_SIZE);
    }

    const enemyPool = this.buildEnemyPoolForBoss();
    this.enemyDeck = this.generateDeckFromPool(enemyPool, PLAYER_DECK_SIZE);

    this.playerHand = buildHand(this.playerDeck, HAND_SIZE);
    this.enemyHand = buildHand(this.enemyDeck, HAND_SIZE);

    const discardSeed = shuffleCards([...basePool]).slice(0, DISCARD_BASE_SIZE);
    this.discardPile = discardSeed;
    this.tableCard = drawOneCard(this.discardPile) ?? shuffleCards([...basePool])[0];

    this.playerMaxHp = this.activeCharacterStats.baseHp;
    this.playerHp = this.playerMaxHp;
    this.playerState.shield = this.activeCharacterStats.baseDefense;

    this.enemyMaxHp = this.selectedBoss?.enemyBaseHp ?? MAX_HP;
    this.enemyHp = this.enemyMaxHp;
  }

  private generateDeckFromPool(pool: Card[], size: number): Card[] {
    const shuffled = shuffleCards(pool);
    const deck: Card[] = [];

    for (let i = 0; i < size; i++) {
      const source = shuffled[i % shuffled.length];
      deck.push({
        ...source,
        id: `${source.id}-deck-${i}-${Math.random().toString(36).slice(2, 7)}`,
      });
    }

    return shuffleCards(deck);
  }

  private createDiscardPileFromPool(pool: Card[], size: number): Card[] {
    const shuffled = shuffleCards(pool);
    const pile: Card[] = [];

    for (let i = 0; i < size; i++) {
      const source = shuffled[i % shuffled.length];
      pile.push({
        ...source,
        id: `${source.id}-discard-${i}-${Math.random().toString(36).slice(2, 7)}`,
      });
    }

    return pile;
  }

  private getCurrentBossConfig() {
    if (!this.selectedBoss) {
      console.warn('No boss selected for this duel, falling back to Skawl visuals'); // log a warning if we don't have a boss selected, since this should generally not happen and indicates a setup issue
      return BOSS_VISUALS.Skawl; // default to Skawl's visuals if no boss is selected, to ensure the game still functions even with a setup issue
    }
    return BOSS_VISUALS[this.selectedBoss.enemyName];
  }

  private getCurrentBossVisual() {
    const config = this.getCurrentBossConfig();
    const phaseIndex = Math.min(this.pythraPhase - 1, config.phases.length - 1); // ensure we don't go out of bounds on the phase array
    return config.phases[phaseIndex];
  }

  private buildEnemyPoolForBoss(): Card[] {
    const boss = this.selectedBoss;

    if (!boss) {
      return [...this.baseCardsFromDb, ...this.effectCardsFromDb]; // if for some reason we don't have a boss selected, fall back to a simpler pool to avoid breaking the game
    }

    if (boss.aiLevel === 'EASY') {
      return [...this.baseCardsFromDb, ...this.effectCardsFromDb];
    } // easy bosses only have access to base and effect cards

    if (boss.aiLevel === 'MEDIUM') {
      return [...this.baseCardsFromDb, ...this.effectCardsFromDb, ...this.rareCardsFromDb];
    } // medium bosses can also use rare cards

    return [
      ...this.baseCardsFromDb,
      ...this.effectCardsFromDb,
      ...this.rareCardsFromDb,
      // ...this.legendaryCardsFromDb,
    ]; // Pythra can use everything
  }

  private updatePythraPhaseVisuals(): void { // this method updates Pythra's sprite based on his current phase, which changes as the player depletes his lives
    if (this.selectedBoss?.enemyName !== 'Pythra') return;

    const bossConfig = BOSS_VISUALS.Pythra;
    const phaseIndex = Math.min(this.pythraPhase - 1, bossConfig.phases.length - 1);
    const currentPhase = bossConfig.phases[phaseIndex];

    this.enemyCharacter
      .setTexture(currentPhase.idleKey)
      .setScale(bossConfig.idleScale)
      .setFlipX(bossConfig.flipX)
      .setY(bossConfig.y); // update the enemy sprite to match the new phase visuals
  }

  private handleEnemyDefeat(): boolean {
    if (this.selectedBoss?.enemyName === 'Pythra' && this.bossLivesRemaining > 1) {
      this.bossLivesRemaining -= 1;
      this.pythraPhase += 1;

      this.enemyHp = this.selectedBoss.enemyBaseHp;
      this.updatePythraPhaseVisuals();
      this.showBattleMessage(this.tf('duel_pythra_evolved', this.bossLivesRemaining), '#ff9966');
      return false;
    }

    return true;
  }

  private setEnemyToIdle(): void {
    const bossConfig = this.getCurrentBossConfig();
    const currentPhase = this.getCurrentBossVisual();

    this.enemyCharacter
      .setTexture(currentPhase.idleKey)
      .setScale(bossConfig.idleScale)
      .setPosition(bossConfig.x, bossConfig.y)
      .setDepth(bossConfig.depth); // reset the enemy sprite to the idle texture for the current phase, which is used after the enemy takes an action to visually indicate it's the player's turn again
  }

  // // temporal special effect deck generator
  // private generateSpecialDeck(pool: Card[], size: number): Card[] {
  //   const shuffledPool = shuffleCards(pool);
  //   const deck: Card[] = [];

  //   for (let i = 0; i < size; i++) {
  //     const source = shuffledPool[i % shuffledPool.length];
  //     deck.push({
  //       ...source,
  //       id: `${source.id}-specialdeck-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  //     });
  //   }

  //   return shuffleCards(deck); // final shuffle to mix the repeated cards
  // }

  private refreshHud() {
    updateHpBar(this.playerHpBar, this.playerHp, this.playerMaxHp, 48, 58, this.playerHpText); // update player HP visuals
    updateHpBar(this.enemyHpBar, this.enemyHp, this.enemyMaxHp, this.cameras.main.width - 292, 58, this.enemyHpText); // update enemy HP visuals

    updateEnergyBar(this.playerEeBar, this.playerElementalEnergy, 82, 138, 220, 12, 0x7cd957); // update player elemental energy
    updateEnergyBar(this.playerEiBar, this.playerInstinctEnergy, 82, 166, 220, 12, 0x4db8ff); // update player instinct energy
    updateEnergyBar(this.enemyEeBar, this.enemyElementalEnergy, this.cameras.main.width - 258, 138, 220, 12, 0x7cd957); // update enemy elemental energy
    updateEnergyBar(this.enemyEiBar, this.enemyInstinctEnergy, this.cameras.main.width - 258, 166, 220, 12, 0x4db8ff); // update enemy instinct energy
    updateShieldBar(this.playerShieldBar, this.playerState.shield, 48, 84, this.playerShieldText); // update player shield visuals
    updateShieldBar(this.enemyShieldBar, this.enemyState.shield, this.cameras.main.width - 292, 84, this.enemyShieldText); // update enemy shield visuals
    
    this.deckCountText.setText(this.tf('duel_deck_count', this.playerDeck.length)); // refresh player deck count
    this.discardCountText.setText(this.tf('duel_discard_count', this.discardPile.length)); // refresh discard count
    this.totalXpText.setText(this.tf('duel_xp', this.totalXp)); // refresh total XP display
    this.totalCoinsText.setText(this.tf('duel_coins', this.totalCoins)); // refresh total coin display
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

  private getCardFrameKey(card: Card): string { // determines which card frame to use based on the card's rarity and element
    if (card.rarity === 'effect') { // if the card is an effect card, use the special frame corresponding to its element
      switch (card.element) {
        case 'fire': return 'card-fire-special';
        case 'water': return 'card-water-special';
        case 'sand': return 'card-sand-special';
        case 'swamp': return 'card-swamp-special';
        default: return 'card-frame';
      }
    }

    if (card.rarity === 'rare' && card.element === 'ice') {
      return 'card-ice-wildcard'; // special wildcard frame for rare ice cards
    }

    return 'card-frame'; // for non-effect cards, use the standard frame regardless of element
  }

  private getCardFooterLabel(card: Card, isPlayable: boolean, isStatic: boolean, footerOverride?: string): string { // some names might be too long to fit in the footer
    if (footerOverride) return footerOverride; // if an override is provided (e.g. for the table card), use it directly

    if (card.rarity === 'effect') {
      const shortNames: Record<string, string> = { // predefined short labels for known effect cards to fit in the footer
        'Burn Strike': 'BURN',
        'Half Break': 'BREAK',
        'Rage Boost': 'RAGE',
        'Explosion': 'BOOM',
        'Chain Fire': 'CHAIN',
        'Healing Wave': 'HEAL',
        'Shield Surge': 'SURGE',
        'Cleanse': 'CLEAN',
        'Reflect': 'REFLECT',
        'Flow State': 'FLOW',
        'Toxic Spread': 'TOXIC',
        'Decay': 'DECAY',
        'Infection': 'INFECT',
        'Corrosion': 'CORRODE',
        'Leech': 'LEECH',
        'Quicksand': 'QUICK',
        'Dust Blind': 'BLIND',
        'Barrier': 'BARRIER',
        'Skywalker': 'SKY',
        'Sandstorm': 'STORM',
      };

      return shortNames[card.name] ?? 'SPECIAL'; // use the short name if available, otherwise default to 'SPECIAL' for unknown effect cards
    }

    if (card.rarity === 'rare' && card.element === 'ice') {
      const rareIceNames: Record<string, string> = { // special short labels for rare ice cards
        'Ice Stun': 'STUN',
        'Ice Jam': 'JAM',
        'Ice Overdrive': 'O-DRIVE',
        'Ice Shift': 'SHIFT',
        'Ice Flood': 'FLOOD',
      };

      return rareIceNames[card.name] ?? 'ICE'; // use the special rare ice name if available, otherwise default to 'ICE'
    }

    if (isStatic) return 'TABLE'; // static table card gets a unique label

    return isPlayable ? 'PLAY' : 'LOCK';
  }

  private renderCards() {
    this.cardObjects.forEach((cardObject) => cardObject.destroy()); // remove old hand card renders
    this.cardObjects = []; // clear object cache
    const centerX = this.cameras.main.width / 2; // horizontal center for card layout
    const startX = centerX - 280; // left-most hand card position
    const y = this.cameras.main.height - 110; // shared hand row y position
    const spacing = 140; // distance between cards
    
    this.playerHand.forEach((card, index) => {
      const x = startX + index * spacing; // spread cards across the hand row
      const cardY = card.rarity === 'rare' && card.element === 'ice' ? y - 10 : y; // slightly raise rare ice cards to fit the special frame design
      const isPlayable = this.isPlayerCardPlayable(card); // determine whether the card can be selected

      const cardContainer = this.createCardContainer(x, cardY, card, isPlayable); // render the card UI
      cardContainer.setDepth(10); // ensure cards are on top of all other UI elements
      this.cardObjects.push(cardContainer); // keep reference for cleanup
    });
  }

  private renderTableCard(highlightColor = 0xffffff) {
    this.currentTableCardObject?.destroy(); // remove the previous table card render
    const centerX = this.cameras.main.width / 2; // center the table card
    this.currentTableCardObject = this.createCardContainer(centerX, 305, this.tableCard, true, true, highlightColor); // render the active table card as static
    this.currentTableCardObject.setDepth(10); // ensure the table card is above the background and panels but below the hand cards
    this.currentTableCardObject.setScale(1.12); // slightly smaller than hand cards to fit the table area
  }

  private createCardContainer(x: number, y: number, card: Card, isPlayable: boolean, isStatic = false, outlineColor = 0xffffff, footerOverride?: string, frameOffsetX = 0): // renders a card with the appropriate visuals based on its properties and whether it's interactable
  Phaser.GameObjects.Container {
    const container = this.add.container(x, y); // wrapper for all card visuals and interactions

    const baseColor = ELEMENT_COLORS[card.element] ?? 0xffffff; // base color determined by the card's element, with a fallback to white
    const alpha = isPlayable || isStatic ? 1 : 0.12; // fully opaque if the card is playable or static, otherwise dimmed to indicate it's not selectable
    
    const isEffectCard = card.rarity === 'effect'; // check if the card is an effect card for tooltip purposes
    const isIceCard = card.rarity === 'rare' && card.element === 'ice'; // special case for rare ice cards that have a unique frame and may need a custom tooltip
    
    const cardWidth = isIceCard ? 118 : (isEffectCard ? 118 : 122); // slightly narrower width for effect cards to accommodate the special frame design
    const cardHeight = isIceCard ? 162 : (isEffectCard ? 197 : 161);

    const innerBg = this.add.graphics();
    innerBg.fillStyle(baseColor, alpha); // fill color based on element and playability

    innerBg.fillRoundedRect(-44, -62, 88, 134, 16); // slightly smaller than the frame to create a border effect

    innerBg.lineStyle(2, outlineColor, isStatic ? 0.9 : 0.35); // brighter outline for static cards, subtler for non-playable ones
    innerBg.strokeRoundedRect(-44, -62, 88, 134, 16); // outline around the card background

    let lockOverlay: Phaser.GameObjects.Graphics | null = null;

    if (!isPlayable && !isStatic) {
      lockOverlay = this.add.graphics(); // create a lock overlay for non-playable cards
      lockOverlay.fillStyle(0x000000, 0.28); // semi-transparent black to obscure the card
      lockOverlay.fillRoundedRect(-44, -62, 88, 134, 16); // same size as the card background
    }

    const frameKey = this.getCardFrameKey(card); // determine which frame to use based on card properties
    const frame = this.add.image(frameOffsetX, 0, frameKey); // card frame image
    frame.setDisplaySize(cardWidth, cardHeight); // scale the frame to fit the card dimensions

    const rarityY = isEffectCard ? -61 : -48; // adjust rarity label position for effect cards to fit within the special frame design
    const rarityLabel = this.add.text(0, rarityY, card.rarity.toUpperCase(), {
      fontSize: '10px',
      color: '#f4f1e8',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5); // rarity label at the top of the card

    rarityLabel.setVisible(!isIceCard); // hide the rarity label for rare ice cards since the frame already indicates it's a wildcard

    const elementY = isEffectCard ? 28 : -20; // adjust element label position for effect cards to avoid overlap with the rarity label
    const elementText = this.add.text(0, elementY, card.element.toUpperCase(), {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5); // element label below the rarity, centered and with a stroke for readability

    elementText.setVisible(!isIceCard); // hide the standard element text for rare ice cards since the frame already indicates it's a wildcard

    const powerTextY = isIceCard ? 30 : 22; // adjust power text position for rare ice cards to fit within the special frame design
    const showPowerText = card.rarity !== 'effect'; // only show power for non-effect cards, as effect cards use the footer for their label
    const powerFontSize = isIceCard && card.name === 'Ice Flood' ? '18px' : '36px'; // slightly smaller font size for the rare ice card with a longer name to fit within the frame
    const powerValue = card.power === null ? 'FX' : String(card.power); // display 'FX' for cards with variable power, otherwise show the numeric value
    const powerText = this.add.text(0, powerTextY, powerValue, {
      fontSize: powerFontSize,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5); // power value in the middle of the card, with a larger font size for emphasis

    powerText.setVisible(showPowerText); // hide the power text if it's an effect card, since it doesn't have a fixed power value
    const showPowerForIceCard = !isEffectCard && (!isIceCard || card.name === 'Ice Flood'); // only show power for non-effect cards, and for the rare ice card if it's the one that has a fixed power value
    powerText.setVisible(showPowerForIceCard); // hide the power text for the rare ice card if it's not the one with a fixed power value

    const footerLabel = this.getCardFooterLabel(card, isPlayable, isStatic, footerOverride); // determine footer text based on card properties and overrides
    const footerY = isIceCard ? 60 : (isEffectCard ? 46 : 58); // adjust footer position for effect cards to fit within the special frame design
    const footerText = this.add.text(0, footerY, footerLabel, {
      fontSize: '12px',
      color: '#f7f30a',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5); // footer text indicating the card's status (static, playable, or locked)

    let tooltipBg: Phaser.GameObjects.Graphics | null = null; // background for the tooltip that appears on special effect cards when hovered
    let tooltipText: Phaser.GameObjects.Text | null = null;
    let infoText: Phaser.GameObjects.Text | null = null;
    let infoZone: Phaser.GameObjects.Zone | null = null;

    const infoX = isIceCard ? -0 : 39;
    const infoY = isIceCard ? -8 : -72;
    const infoFontSize = isIceCard ? '32px' : '14px';
    if (card.rarity === 'effect' || isIceCard) {
      infoText = this.add.text(infoX, infoY, '?', {
        fontSize: infoFontSize,
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
      }).setOrigin(0.5); // small question mark icon to indicate more information is available on hover

      infoZone = this.add.zone(infoX, infoY, isIceCard ? 34 : 24, isIceCard ? 34 : 24).setOrigin(0.5); // invisible interactive area over the info icon

      tooltipBg = this.add.graphics(); // background for the tooltip that appears when hovering over the info icon
      tooltipBg.fillStyle(0x000000, 0.9);

      if (isIceCard) {
        tooltipBg.fillRoundedRect(-170, -209, 339, 132, 17); // larger tooltip for rare ice cards to accommodate the longer description of the wildcard mechanic (40% bigger)
      }
      else {
        tooltipBg.fillRoundedRect(-126, -177, 251, 94, 13); // standard tooltip size for effect cards (40% bigger)
      }

      tooltipBg.setVisible(false);

      tooltipText = this.add.text(0, isIceCard ? -143 : -130, card.effectDescription ?? 'No description', {
        fontSize: isIceCard ? '20px' : '18px',
        color: '#fff200',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6,
        wordWrap: { width: isIceCard ? 302 : 225 },
      }).setOrigin(0.5).setVisible(false); // tooltip text that shows the card's effect description, hidden by default (40% bigger)
    }

    container.add([
      innerBg,
      ...(lockOverlay ? [lockOverlay] : []), // conditionally add the lock overlay if it exists
      frame,
      rarityLabel,
      elementText,
      powerText,
      footerText,
      ...(tooltipBg ? [tooltipBg] : []),
      ...(tooltipText ? [tooltipText] : []),
      ...(infoText ? [infoText] : []),
      ...(infoZone ? [infoZone] : []),
    ]); // assemble all card visuals into the container

    if (infoZone && tooltipBg && tooltipText) {
      infoZone
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          tooltipBg?.setVisible(true);
          tooltipText?.setVisible(true);
        })
        .on('pointerout', () => {
          tooltipBg?.setVisible(false);
          tooltipText?.setVisible(false);
        });
    }

    container.setSize(cardWidth, cardHeight); // set the container's interactive area to match the card dimensions

    if (!isStatic) {
      container
        .setSize(cardWidth, cardHeight)
        .setInteractive({ useHandCursor: true })
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
            if (!this.hasEnoughEnergy(card, 'player')) {
              this.showBattleMessage(`Missing Energy --> ${card.energyECost}EE/${card.energyICost}IE`, '#ff4444');
            }

            else {
              this.showBattleMessage('Invalid move. Draw or discard.', '#ff6666');
            }

            return;
          }

          this.playPlayerCard(card);
        });
    }

    return container; // return the fully assembled card container for rendering
  }

  private renderDiscardTopCard() {
    this.discardTopCardObject?.destroy(); // remove old discard preview
    this.discardClickZone?.destroy(); // remove previous click zone

    const centerX = this.cameras.main.width / 2; // center reference for the discard area
    const discardX = centerX + 145; // x position of the discard pile
    const discardY = 478; // y position of the discard pile

    const topCard = this.discardPile[0]; // use the topmost discard card

    if (!topCard) {
      this.discardTopCardObject = this.drawDeckPlaceholder(discardX, discardY, 'Empty'); // show empty state if discard is blank
      return;
    }

    this.discardTopCardObject = this.createCardContainer(discardX, discardY, topCard, true, true, 0xffffff, 'DISC', 1); // render the top discard card as static
    this.discardTopCardObject.setScale(0.68).setDepth(5); // shrink the preview to fit the pile area and set depth below the hand cards
    
    this.discardClickZone = this.add.zone(discardX, discardY, 150, 110) // invisible hotspot over the discard pile
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.handlePlayerDrawAction(); // draw from discard when clicked
      })
      .on('pointerover', () => {
        if (!this.isAnimating) this.discardTopCardObject?.setScale(0.74); // enlarge preview on hover
      })
      .on('pointerout', () => {
        this.discardTopCardObject?.setScale(0.68); // restore preview size when leaving
      });
  }

  private showHealIndicator(side: 'player' | 'enemy', amount: number) { // displays a floating heal indicator above the specified side when healing occurs
    if (amount <= 0) return; // only show the indicator for actual healing

    const text = side === 'player' ? this.playerHealText : this.enemyHealText; // choose the appropriate text object based on the side
    text.setText(`+${amount}`); // set the text to show the amount healed

    this.time.delayedCall(700, () => {
      text.setText(''); // clear the text after a short delay to keep the UI clean
    });
  }

  private showShieldGainIndicator(side: 'player' | 'enemy', amount: number) { // displays a floating shield gain indicator above the specified side when shield is gained
    if (amount <= 0) return;

    const text = side === 'player' ? this.playerShieldDeltaText : this.enemyShieldDeltaText;
    text.setColor('#ffa77f');
    text.setText(`+${amount} SH`);

    this.time.delayedCall(700, () => {
      text.setText('');
    });
  }

  private showShieldLossIndicator(side: 'player' | 'enemy', amount: number) {
    if (amount <= 0) return; // only show the indicator for actual shield loss

    const text = side === 'player' ? this.playerShieldDeltaText : this.enemyShieldDeltaText; // choose the appropriate text object based on the side
    text.setColor('#ffa77f');
    text.setText(`-${amount} SH`); // set the text to show the amount of shield lost

    this.time.delayedCall(700, () => {
      text.setText(''); // clear the text after a short delay to keep the UI clean
    });
  }

  private hasEnoughEnergy(card: Card, side: 'player' | 'enemy'): boolean { // checks if the specified side has enough energy to play the given card
    const elementalEnergy = side === 'player' ? this.playerElementalEnergy : this.enemyElementalEnergy;
    const instinctEnergy = side === 'player' ? this.playerInstinctEnergy : this.enemyInstinctEnergy;

    return elementalEnergy >= card.energyECost && instinctEnergy >= card.energyICost; // must have enough of both energy types to play the card
  }

  private isPlayerCardPlayable(card: Card): boolean {
    if (this.playerState.blockedNumberTurnCounter !== null && card.power === this.playerState.blockedNumberTurnCounter) return false;
    if (this.playerState.jamTurnCounter > 0 && card.rarity !== 'base') return false;
    if (this.playerState.blockFireTurnCounter > 0 && card.element === 'fire') return false;
    if (!this.hasEnoughEnergy(card, 'player')) return false;

    if (this.tableCard.name === 'Ice Flood') {
      const responderState = this.playerState;

      if (
        responderState.iceFloodLockTurnCounter > 0 &&
        responderState.forcedResponseNumber !== null
      ) {
        return (
          card.rarity === 'base' &&
          card.power === responderState.forcedResponseNumber
        );
      }

      return true;
    }

    if (!canPlayCard(card, this.tableCard)) return false;

    return true;
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
    const previousTableCard = this.tableCard; // keep the previous table card for energy rules

    const resolvedCard =
      card.name === 'Ice Flood' 
      ? (
        previousTableCard.rarity === 'base'
        ? { ...card, power: previousTableCard.power } // if the table card is a base card, copy its power value for this play
        : { ...card, power: null } // if the table card is not a base card, the power is variable and determined by the effect, so we set it to null to indicate it should display as 'FX' and be resolved in the effect logic
      )
      : card; // for all other cards, the resolved card is the same as the played card


    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id); // remove the selected card from the hand
    this.discardPile.push(resolvedCard); // send played card to discard
    this.tableCard = resolvedCard; // new card becomes the active table card
    this.renderTableCard(0x00ff88); // highlight the table card in player color
    this.spendEnergy(resolvedCard, 'player'); // reduce energy based on the card's cost
    this.addEnergyFromCard(resolvedCard, 'player', previousTableCard); // award energy based on the play
    this.applyCardEffects(resolvedCard, 'player', previousTableCard); // resolve the card's effect and damage
    this.animatePlayerAttack(); // play the player attack pose

    this.time.delayedCall(550, () => { // brief pause before handing control to the enemy
      if (this.checkCombatEnded()) return; // stop if the duel ended

      if (this.playerState.doublePlayTurnCounter > 0) {
        this.playerState.doublePlayTurnCounter -= 1; // consume one double play turn
        this.refreshHud(); // update HUD to reflect the consumed double play turn
        this.renderDiscardTopCard(); // refresh discard preview in case the double play allows drawing a card that changes the top of the discard
        this.renderCards(); // refresh hand in case the double play allows drawing a card into the hand
        this.isAnimating = false; // unlock input for the additional play
        this.showBattleMessage('Play one more card!', '#7ed9ff'); // prompt the player to take another action if they have a double play active
        return;
      }

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
    this.spendEnergy(enemyCard, 'enemy'); // reduce enemy energy based on the card's cost
    this.addEnergyFromCard(enemyCard, 'enemy', previousTableCard); // award enemy energy gains
    this.animateEnemyAttack(); // play enemy attack pose
    this.applyCardEffects(enemyCard, 'enemy', previousTableCard); // resolve enemy card effects
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

  private refillHandFromDiscardIfEmpty(side: 'player' | 'enemy') {
    const hand = side === 'player' ? this.playerHand : this.enemyHand; // select the correct hand

    if (hand.length > 0) return; // only refill from discard if the hand is completely empty
    if (this.discardPile.length === 0) return; // stop if there are no cards in discard to draw (practically impossible)

    while (hand.length < HAND_SIZE && this.discardPile.length > 0) {
      const nextCard = drawOneCard(this.discardPile);
      if (!nextCard) break; // stop if discard draw fails

      this. incrementDiscardFatigue(side); // track fatigue from drawing extra cards
      hand.push(nextCard); // add the drawn card to the hand
    }
  }

  private spendEnergy(card: Card, side: 'player' | 'enemy') {
    if (side === 'player') { // reduce the player's energy by the card's cost, ensuring it doesn't go below zero
      this.playerElementalEnergy = Math.max(0, this.playerElementalEnergy - card.energyECost);
      this.playerInstinctEnergy = Math.max(0, this.playerInstinctEnergy - card.energyICost);
    }

    else { // reduce the enemy's energy by the card's cost, ensuring it doesn't go below zero
      this.enemyElementalEnergy = Math.max(0, this.enemyElementalEnergy - card.energyECost);
      this.enemyInstinctEnergy = Math.max(0, this.enemyInstinctEnergy - card.energyICost);
    }
  }

  private finishLevel() {
    this.refillHandFromDeckOnly(this.playerHand, this.playerDeck); // refill the player's hand from deck only
    this.refillHandFromDeckOnly(this.enemyHand, this.enemyDeck); // refill the enemy's hand from deck only

    if (this.playerDeck.length === 0 && this.playerHand.length === 0) {
      this.refillHandFromDiscardIfEmpty('player'); // if the player has no cards left in hand, allow drawing from discard to prevent deadlock
    }

    if (this.enemyDeck.length === 0 && this.enemyHand.length === 0) {
      this.refillHandFromDiscardIfEmpty('enemy'); // if the enemy has no cards left in hand, allow drawing from discard to prevent deadlock
    }

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
    this.playerHealText.setText(''); // clear player heal popup
    this.enemyHealText.setText(''); // clear enemy heal popup
    this.playerShieldDeltaText.setText(''); // clear player shield change popup
    this.enemyShieldDeltaText.setText(''); // clear enemy shield change popup
    this.updatePlayerPose(); // restore player pose based on remaining HP
    this.updateEnemyPose(); // restore enemy pose based on remaining HP
    this.isAnimating = false; // unlock input for the next turn
  }

  private getEnemyPlayableCard(): Card | null {
    let chosen = this.enemyHand.find((card) => this.isEnemyCardPlayable(card)) ?? null; // use a card already in hand if possible
    if (!chosen) chosen = this.drawUntilPlayable('enemy', this.tableCard, true); // otherwise search deck/discard for a playable card
    if (!chosen) return null; // no legal card exists

    if (this.enemyState.jamTurnCounter > 0 && chosen.rarity === 'effect') {
      return null;
    }

    this.enemyHand = this.enemyHand.filter((handCard) => handCard.id !== chosen?.id); // remove the chosen card from hand
    return chosen; // return the playable card
  }

  private isEnemyCardPlayable(card: Card): boolean {
    if (this.enemyState.blockedNumberTurnCounter !== null && card.power === this.enemyState.blockedNumberTurnCounter) return false;
    if (this.enemyState.jamTurnCounter > 0 && card.rarity !== 'base') return false;
    if (this.enemyState.blockFireTurnCounter > 0 && card.element === 'fire') return false;
    if (!this.hasEnoughEnergy(card, 'enemy')) return false;

    if (this.tableCard.name === 'Ice Flood') {
      const responderState = this.enemyState;

      if (
        responderState.iceFloodLockTurnCounter > 0 &&
        responderState.forcedResponseNumber !== null
      ) {
        return (
          card.rarity === 'base' &&
          card.power === responderState.forcedResponseNumber
        );
      }

      return true;
    }

    if (!canPlayCard(card, this.tableCard)) return false;

    return true;
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
      this.showBattleMessage(this.tf('duel_discard_first'), '#ffaa00'); // explain why drawing is blocked
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

  private applyCardEffects(card: Card, attacker: 'player' | 'enemy', previousTableCard?: Card) {
    const isPlayer = attacker === 'player'; // boolean used to branch between player and enemy
    const attackerState = isPlayer ? this.playerState : this.enemyState; // status state for the card owner
    const defenderState = isPlayer ? this.enemyState : this.playerState; // status state for the target
    let damage = card.baseDamage; // start with base damage
    let selfDamage = 0; // recoil damage is tracked separately
    if (attackerState.weakenTurnCounter > 0) damage = Math.max(0, damage - attackerState.weakenEffectValue); // weaken reduces damage

    if (attacker === 'player') {
      damage += this.activeCharacterStats.baseAttack;
    } // add the player's character attack stat to the damage for player cards

    if (attackerState.chainFireBonus > 0 && card.element === 'fire') { 
      damage += attackerState.chainFireBonus; 
      attackerState.chainFireBonus = 0; 
    } // chain bonus is consumed on fire attacks

    const gotCounterBonus = previousTableCard ? isCounterBonusTrigger(card, previousTableCard) : false; // check if the new card triggers a counter bonus against the previous table card
    if (gotCounterBonus) {
      if (card.element === 'fire' || card.element === 'swamp') {
        damage += 10; // flat bonus for countering with fire/swamp
      }
      
      else if (card.element === 'water' || card.element === 'sand') {
        attackerState.shield += 10; // defensive bonus for countering with water/sand
      }
    }
 
    if (attackerState.sandBuffTurnCounter > 0 && card.element === 'sand') damage += Math.ceil(damage * attackerState.sandBuffPercent / 100); // sand buff increases damage for sand cards
    switch (card.effect) {
      case 'DAMAGE': 
        break; // raw damage card, no extra effect handling

      case 'SHIELD': {
        const beforeShield = attackerState.shield;
        attackerState.shield += card.shieldValue; 
        this.showShieldGainIndicator(attacker, attackerState.shield - beforeShield);
        damage = 0;
        break; // convert effect into shield
      }

      case 'POISON': 
        defenderState.poisonTurnCounter = Math.max(defenderState.poisonTurnCounter, card.effectDuration); 
        defenderState.poisonDamage = Math.max(defenderState.poisonDamage, card.effectValue); 
        damage = 0; 
        break; // apply poison over time

      case 'WEAKEN': 
        defenderState.weakenTurnCounter = Math.max(defenderState.weakenTurnCounter, card.effectDuration || 1); 
        defenderState.weakenEffectValue = Math.max(defenderState.weakenEffectValue, card.effectValue);  
        break; // apply weaken debuff

      case 'BURN': 
        defenderState.burnTurnCounter = Math.max(defenderState.burnTurnCounter, card.effectDuration); 
        defenderState.burnDamage = Math.max(defenderState.burnDamage, card.effectValue); 
        break; // apply burn over time
      
      case 'BLOCK_FIRE': 
        defenderState.blockFireTurnCounter = Math.max(defenderState.blockFireTurnCounter, card.effectDuration || 1); 
        break; // prevent fire cards for a short time

      case 'RAGE': {
        const defenderHP = isPlayer ? this.enemyHp : this.playerHp;
        if (defenderHP <= MAX_HP / 2) damage *= 2; // double damage if the opponent is below half health
        break; // conditional damage boost based on opponent's HP
      }

      case 'EXPLOSION': 
        selfDamage = card.effectValue; 
        break; // explosion damages the attacker too
      case 'CHAIN': 
        attackerState.chainFireBonus = Math.max(attackerState.chainFireBonus, card.effectValue); 
        break; // store a future fire bonus
      
      case 'HEAL': {
        attackerState.shield += card.shieldValue;
        this.healSide(attacker, card.effectValue);
        damage = 0;
        break; // heal and grant shield
      }

      case 'DOUBLE_SHIELD': 
        attackerState.shield = attackerState.shield > 0 ? attackerState.shield * 2 : card.shieldValue; 
        damage = 0; 
        break; // double existing shield or set a base shield
      
      case 'CLEANSE': 
        this.cleanseNegative(attackerState); 
        damage = 0; 
        break; // remove negative effects from the attacker
      
      case 'REFLECT': 
        attackerState.reflectTurnCounter = Math.max(attackerState.reflectTurnCounter, card.effectDuration || 1); 
        attackerState.reflectPercent = Math.max(attackerState.reflectPercent, card.effectValue); 
        damage = 0; 
        break; // enable reflect

      case 'ENERGY_BOOST': 
        attackerState.energyBoostTurnCounter = Math.max(attackerState.energyBoostTurnCounter, card.effectDuration || 1); 
        attackerState.energyBoostPercent = Math.max(attackerState.energyBoostPercent, card.effectValue); 
        damage = 0; 
        break; // boost energy gains for a duration
      
      case 'TOXIC': 
        defenderState.poisonTurnCounter = Math.max(defenderState.poisonTurnCounter, card.effectDuration); 
        defenderState.poisonDamage = Math.max(defenderState.poisonDamage, card.effectValue); 
        damage = 0; 
        break; // apply poison with toxic wording
      
      case 'DECAY': 
        defenderState.shield = Math.max(0, defenderState.shield - Math.ceil(defenderState.shield * (card.effectValue / 100))); 
        damage = 0; 
        break; // reduce enemy shield by percentage
      
      case 'EXTEND': 
        defenderState.poisonTurnCounter += card.effectValue; 
        defenderState.burnTurnCounter += card.effectValue; 
        defenderState.weakenTurnCounter += card.effectValue; 
        damage = 0; 
        break; // extend negative effect durations
      
      case 'WEAKEN_ATTACK': 
        defenderState.weakenTurnCounter = Math.max(defenderState.weakenTurnCounter, card.effectDuration || 1); 
        defenderState.weakenEffectValue = Math.max(defenderState.weakenEffectValue, card.effectValue); 
        damage = 0; 
        break; // same weaken logic under attack-focused name
      
      case 'LIFESTEAL': 
        this.healSide(attacker, Math.ceil(damage * (card.effectValue / 100))); 
        break; // heal based on dealt damage
      
      case 'BLOCK_NUMBER': 
        defenderState.blockedNumberTurnCounter = this.tableCard.power; 
        damage = 0; 
        break; // block the current table number
      
      case 'BLIND': 
        damage = 0; 
        break; // remove damage but keep the card action
      
      case 'SHIELD_BOOST': 
        attackerState.shield += card.shieldValue; 
        damage = 0; 
        break; // add shield directly
      
      case 'WILDCARD': 
        damage = 0; 
        break; // placeholder effect
      
      case 'BUFF': 
        attackerState.sandBuffTurnCounter = Math.max(attackerState.sandBuffTurnCounter, card.effectDuration || 1); 
        attackerState.sandBuffPercent = Math.max(attackerState.sandBuffPercent, card.effectValue); 
        damage = 0; 
        break; // grant a temporary damage buff
      
      case 'STUN': 
        defenderState.stunTurnCounter = Math.max(defenderState.stunTurnCounter, card.effectDuration || 1); 
        damage = 0; 
        break; // prevent the defender's next action
      
      case 'JAM': 
        defenderState.jamTurnCounter = Math.max(defenderState.jamTurnCounter, card.effectDuration || 1); 
        damage = 0;
        selfDamage = 0;
        break; // block non-base enemy cards

      case 'HAND_RESET': {
        const defenderHand = attacker === 'player' ? this.enemyHand : this.playerHand; // identify the defender's hand to be reset

        // move all cards from the defender's hand to the discard pile
        this.discardPile.push(...defenderHand);
        defenderHand.length = 0;

        // draw new cards from the discard pile to refill the defender's hand, ensuring that any effects that interact with hand size or contents are properly triggered
        while (defenderHand.length < HAND_SIZE && this.discardPile.length > 0) {
          const drawn = drawOneCard(this.discardPile);
          if (!drawn) break;
          defenderHand.push(drawn);
        }

        damage = 0; // this card's primary effect is the hand reset, so it doesn't deal direct damage
        break;
      }

      // case 'AMPLIFY': {
      //   if (previousTableCard?.rarity === 'base') {
      //     defenderState.forcedResponseNumber = previousTableCard.power;
      //     defenderState.iceFloodLockTurnCounter = 1;
      //     damage = 0;
      //   } 
        
      //   else {
      //     attackerState.shield += 15;
      //     this.healSide(attacker, 15);
      //     damage = 0;
      //   }

      //   break;
      // }

      case 'AMPLIFY': {
        const previousTableCard = this.tableCard;

        if (previousTableCard?.rarity === 'base' && previousTableCard.power !== null) {
          defenderState.forcedResponseNumber = previousTableCard.power;
          defenderState.iceFloodLockTurnCounter = 1;
          damage = 0;
        } else {
          attackerState.shield += 25;
          this.healSide(attacker, 25);

          defenderState.forcedResponseNumber = null;
          defenderState.iceFloodLockTurnCounter = 0;

          damage = 0;
        }

        break;
      }
      
      case 'DOUBLE_PLAY':
        attackerState.doublePlayTurnCounter = Math.max(attackerState.doublePlayTurnCounter, 1);
        damage = 0;
        break; // placeholder for a complex effect that would allow playing an additional card immediately
      

      // case 'FORCE_DRAW': case 'IMMUNITY': case 'RANDOM_STATUS': case 'EXECUTE':  damage = card.baseDamage; break; // reserved / shared effect bucket

      default: break; // ignore unsupported effects
    }

    if (card.effect === 'JAM') {
      damage = 0; // explicitly ensure jam does no damage even if the card has a base damage value, as its primary function is to block enemy cards rather than deal damage
      selfDamage = 0; // also ensure that jam does not cause self-damage, as it is meant to be a tactical control card rather than a risky attack
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

      if (absorbed > 0) {
        this.showShieldLossIndicator(isPlayer ? 'enemy' : 'player', absorbed); // show shield loss popup if any damage was absorbed
      }
    }

    if (remainingDamage <= 0) { 
      this.showBattleMessage(this.tf('duel_shield_blocked'), '#7fd7ff'); // notify the player that the hit was fully blocked
      return; 
    }

    if (isPlayer) { 
      this.enemyHp = Math.max(0, this.enemyHp - remainingDamage); // apply damage to the enemy
      this.enemyDamageText.setText(`-${remainingDamage}`); // show enemy damage popup
      this.showBattleMessage(this.tf('duel_player_used', { element: element.toUpperCase() }), '#00ff88'); // show attack feedback for the player
      this.updateEnemyPose(); // update enemy sprite based on HP
    }

    else { 
      this.playerHp = Math.max(0, this.playerHp - remainingDamage); // apply damage to the player
      this.playerDamageText.setText(`-${remainingDamage}`); // show player damage popup
      this.showBattleMessage(this.tf('duel_enemy_used', { element: element.toUpperCase() }), '#ff6666'); // show attack feedback for the enemy
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
      state.shield -= absorbed; 
      remaining -= absorbed; 

      if (absorbed > 0) {
          this.showShieldLossIndicator(side, absorbed);
      } // show shield loss popup if any damage was absorbed
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

    if (side === 'player') {
      const before = this.playerHp;
      this.playerHp = Math.min(MAX_HP, this.playerHp + amount);
      const healed = this.playerHp - before;
      this.showHealIndicator('player', healed);
    }

    else {
      const before = this.enemyHp;
      this.enemyHp = Math.min(MAX_HP, this.enemyHp + amount);
      const healed = this.enemyHp - before;
      this.showHealIndicator('enemy', healed);
    }
    
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

    if (state.iceFloodLockTurnCounter > 0) {
      state.iceFloodLockTurnCounter -= 1; // reduce Ice Flood lock duration
      if (state.iceFloodLockTurnCounter === 0) {
        state.forcedResponseNumber = null; // clear the forced response number when the lock expires
      }
    }
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
    const playerVisual = PLAYER_VISUALS[this.selectedPlayerKey].duel;
    const attackImage = playerVisual.attackKeys[Math.floor(Math.random() * playerVisual.attackKeys.length)]; // randomly select an attack pose from the available options for the player character

    this.playerCharacter
      .setTexture(attackImage)
      .setScale(playerVisual.attackScale)
      .setFlipX(playerVisual.flipX)
      .setPosition(playerVisual.x, playerVisual.y)
      .setDepth(playerVisual.depth);
  }

  private animateEnemyAttack() {
    const bossConfig = this.getCurrentBossConfig(); // get the current boss configuration for attack pose details
    const currentPhase = this.getCurrentBossVisual(); // determine the current visual phase based on HP thresholds
    const attackImage = currentPhase.attackKeys[Math.floor(Math.random() * currentPhase.attackKeys.length)]; // randomly select an attack pose from the available options for this boss and phase

    this.enemyCharacter
      .setTexture(attackImage)
      .setScale(bossConfig.attackScale)
      .setFlipX(bossConfig.flipX)
      .setPosition(bossConfig.x, bossConfig.y)
      .setDepth(bossConfig.depth); // switch to the appropriate attack pose based on the current boss and phase
  }

  private updatePlayerPose() {
    const playerVisual = PLAYER_VISUALS[this.selectedPlayerKey].duel;
    const hpRatio = this.playerHp / Math.max(1, this.playerMaxHp);

    if (this.playerHp <= 0) {
      this.playerCharacter
        .setTexture(playerVisual.defeatedKey)
        .setScale(playerVisual.defeatedScale)
        .setFlipX(playerVisual.flipX)
        .setPosition(playerVisual.x, playerVisual.y)
        .setDepth(playerVisual.depth);
      return;
    }

    if (hpRatio <= 0.25 && playerVisual.hurtKeys[1]) {
      this.playerCharacter
        .setTexture(playerVisual.hurtKeys[1])
        .setScale(playerVisual.hurtScale)
        .setFlipX(playerVisual.flipX)
        .setPosition(playerVisual.x, playerVisual.y)
        .setDepth(playerVisual.depth);
      return;
    }

    if (hpRatio <= 0.5 && playerVisual.hurtKeys[0]) {
      this.playerCharacter
        .setTexture(playerVisual.hurtKeys[0])
        .setScale(playerVisual.hurtScale)
        .setFlipX(playerVisual.flipX)
        .setPosition(playerVisual.x, playerVisual.y)
        .setDepth(playerVisual.depth);
      return;
    }

    this.playerCharacter
      .setTexture(playerVisual.idleKey)
      .setScale(playerVisual.idleScale)
      .setFlipX(playerVisual.flipX)
      .setPosition(playerVisual.x, playerVisual.y)
      .setDepth(playerVisual.depth);
  }

  private updateEnemyPose() {
    const bossConfig = this.getCurrentBossConfig(); // get the current boss configuration for pose thresholds
    const currentPhase = this.getCurrentBossVisual(); // determine the current visual phase based on HP thresholds

    const hpRatio = this.enemyHp / Math.max(1, this.enemyMaxHp); // calculate current HP ratio for more flexible pose thresholds

    if (this.enemyHp <= 0) { 
      this.enemyCharacter
      .setTexture(bossConfig.defeatedKey)
      .setScale(bossConfig.defeatedScale)
      .setFlipX(bossConfig.flipX)
      .setPosition(bossConfig.x, bossConfig.y)
      .setDepth(bossConfig.depth);
      return; 
    } // defeated poses are defined per boss for maximum visual impact

    const hurtKeys = currentPhase.hurtKeys;
    if (hpRatio <= 0.25 && hurtKeys[1]) { 
      this.enemyCharacter
      .setTexture(hurtKeys[1])
      .setScale(bossConfig.hurtScale)
      .setFlipX(bossConfig.flipX)
      .setPosition(bossConfig.x, bossConfig.y)
      .setDepth(bossConfig.depth);
      return; 
    }

    if (hpRatio <= 0.5 && hurtKeys[0]) { 
      this.enemyCharacter
      .setTexture(hurtKeys[0])
      .setScale(bossConfig.hurtScale)
      .setFlipX(bossConfig.flipX)
      .setPosition(bossConfig.x, bossConfig.y)
      .setDepth(bossConfig.depth);
      return; 
    }

    this.setEnemyToIdle(); // default to idle pose if above 50% HP
  }

  private discardPlayerCard(card: Card) {
    if (this.isAnimating) return; // prevent discarding during animations
    
    this.playerHand = this.playerHand.filter((handCard) => handCard.id !== card.id); // remove the selected card from hand
    this.discardPile.push(card); // place the card into the discard pile

    this.refillHandFromDeckOnly(this.playerHand, this.playerDeck); // refill the hand from deck if possible
    
    if (this.playerDeck.length === 0 && this.playerHand.length === 0) {
      this.refillHandFromDiscardIfEmpty('player'); // if the hand is empty after refilling from deck, allow drawing from discard to prevent deadlock
    }

    this.showBattleMessage('Card discarded', '#ffaa00'); // confirm the discard action
    this.refreshHud(); // sync HUD values
    this.renderDiscardTopCard(); // refresh discard preview
    this.renderCards(); // redraw hand cards
    // this.updateInstruction(); // kept commented out as in your current code
  }

  private checkCombatEnded(): boolean {
    this.refreshHud(); // make sure final values are visible before transition
    if (this.playerHp <= 0) { 
      this.updatePlayerPose(); // show the defeated player pose before transitioning
      this.time.delayedCall(500, () => { // brief pause to let the defeated pose register before showing the game over screen
        this.gameOver(); 
      });

      return true; 
    } // player lost

    if (this.enemyHp <= 0) { 
      const duelReallyEnded = this.handleEnemyDefeat(); // run enemy defeat logic and check if the duel truly ended or if there are additional phases

      if (!duelReallyEnded) {
        this.refreshHud();
        this.renderCards();
        this.renderTableCard();
        this.renderDiscardTopCard();
        this.updateEnemyPose();
        return false;
      } // if the duel has truly ended, show the victory cutscene after a brief pause to let the final hit and defeated pose register

      this.updateEnemyPose();
      this.levelsWon += 1;
      this.levelText.setText(`Level ${this.levelsWon + 1}`);
      this.time.delayedCall(500, () => {
        this.showVictoryCutscene();
      }); // show the victory cutscene after a brief delay to allow the final hit and defeated pose to register

      return true; 
    } // enemy lost

    return false; // combat continues
  }

  private showVictoryCutscene() {
    const centerX = this.cameras.main.width / 2; // center point for the victory overlay
    const centerY = this.cameras.main.height / 2; // vertical center for the victory overlay

    // Commit flat duel win rewards to RunData
    this.totalCoins += 100;
    this.totalXp    += 250;
    this.refreshHud(); // show updated totals immediately

    const overlay = this.add.graphics(); // overlay graphic for the victory screen
    overlay.fillStyle(0x000000, 1.0); // full-screen dark overlay
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height); // cover the scene
    overlay.setDepth(15);

    this.add.text(centerX, centerY - 80, 'Enemy Defeated!', { fontSize: '48px', color: '#00ff88', fontStyle: 'bold' }).setOrigin(0.5).setDepth(16); // victory headline
    this.add.text(centerX, centerY - 10, `+250 XP  |  +100 Coins`, { fontSize: '26px', color: '#ffffff' }).setOrigin(0.5).setDepth(16); // reward summary
    this.add.text(centerX, centerY + 30, `Run Total — XP: ${this.totalXp}  Coins: ${this.totalCoins}`, { fontSize: '20px', color: '#ffd700' }).setOrigin(0.5).setDepth(16); // updated totals

    const continueBtn = this.add.text(centerX, centerY + 120, 'Continue', { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ff88')) // hover feedback
      .on('pointerout', () => continueBtn.setColor('#ffffff')) // restore default color
      .on('pointerdown', () => this.advanceToNextCycle()).setDepth(16); // proceed to next cycle
  }

  endRun() {
    if (this.runEnded) return;
    this.runEnded = true;
    completeRun(this.runId, this.totalCoins, this.totalXp, this.level, this.levelsWon)
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
    const grandCoins = this.totalCoins;
    const grandXp    = this.totalXp;

    const overlay = this.add.graphics(); // full-screen overlay graphic
    overlay.fillStyle(0x000000, 1.0); // solid black background
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height); // cover the whole scene
    overlay.setDepth(15);

    this.add.text(centerX, centerY - 100, 'Game Over', { fontSize: '64px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5).setDepth(16); // game over title
    this.add.text(centerX, centerY - 20, `Levels Won: ${this.levelsWon}`, { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5).setDepth(16); // run victory count
    this.add.text(centerX, centerY + 20, `Total XP: ${grandXp}  |  Total Coins: ${grandCoins}`, { fontSize: '24px', color: '#ffd700' }).setOrigin(0.5).setDepth(16); // final rewards summary

    const restartBtn = this.add.text(centerX, centerY + 90, 'Play Again', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5).setDepth(16).setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88')) // hover feedback
      .on('pointerout', () => restartBtn.setColor('#ffffff')) // restore default color
      .on('pointerdown', () => transitionTo(this, 'RunScene', { level: 1, step: 0, totalCoins: 0, totalXp: 0, runId: 0 })); // start a fresh run

    const menuBtn = this.add.text(centerX, centerY + 150, 'Menu', { fontSize: '24px', color: '#888888' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#ffffff')) // hover feedback
      .on('pointerout', () => menuBtn.setColor('#888888')) // restore default color
      .on('pointerdown', () => { this.time.delayedCall(100, () => { transitionTo(this, 'MenuScene'); }); }).setDepth(16); // return to the main menu
  }

  private drawMetalPlate(graphics: Phaser.GameObjects.Graphics, width: number, height: number, pressed: boolean, x: number, y: number) {
    // Drop shadow for depth
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRoundedRect(x + 4, y + 4, width, height, 6);
    // Body of the plate
    graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
    graphics.fillRoundedRect(x, y, width, height, 4);
    const topColor = pressed ? 0x333333 : 0x999999;
    const bottomColor = pressed ? 0x111111 : 0x666666;
    // Light source is from the top, so the top half is lighter and the bottom half is darker to create a beveled effect
    graphics.fillStyle(topColor, 1);
    graphics.fillRect(x + 4, y + 4, width - 8, (height / 2) - 4);
    graphics.fillStyle(bottomColor, 1);
    graphics.fillRect(x + 4, y + (height / 2), width - 8, (height / 2) - 4);
    if (!pressed) {
        graphics.lineStyle(2, 0xffffff, 0.3);
        graphics.lineBetween(x + 5, y + 5, x + width - 5, y + 5);
    }
    // Rivets
    const rivetColor = pressed ? 0x000000 : 0x222222;
    const offset = 12;
    const rSize = 4;
    const corners = [
        [x + offset, y + offset], 
        [x + width - offset, y + offset], 
        [x + offset, y + height - offset], 
        [x + width - offset, y + height - offset]
    ];
    corners.forEach(pos => {
        graphics.fillStyle(rivetColor, 1);
        graphics.fillCircle(pos[0], pos[1], rSize);
        if(!pressed) {
            graphics.fillStyle(0xffffff, 0.2);
            graphics.fillCircle(pos[0] - 1, pos[1] - 1, rSize / 2);
        }
    });
  }
}