import Phaser from 'phaser';
import { transitionTo } from '../utils/sceneTransition.js';
import titleBackground from '../assets/title-background.webp';

// Hero imports (Crock Clan)
import christianImg from '../assets/characters/christian/Christian_v4_resized.webp';
import gustavImg from '../assets/characters/gustav/Gustav_v3_resized.webp';
import gavinImg from '../assets/characters/gavin/Gavin_v3_resized.webp';
import eddyImg from '../assets/characters/eddy/Eddy_v2_resized.webp';
import klancyImg from '../assets/characters/klancy/Klancy_v1_resized.webp';

// Enemy imports (Swamp Threats)
import skawlImg from '../assets/characters/skawl/Skawl_resized.webp';
import rabyzImg from '../assets/characters/rabyz/Rabyz_resized.webp';
import boldearImg from '../assets/characters/boldear/Boldear_resized.webp';
import pythraImg from '../assets/characters/pythra/Pythra_evolution-1_resized.webp';

// Character definition interface to structure character data for both heroes and enemies
interface CharacterDef {
  key: string;
  name: string;
  role: string;
  desc: string;
  imgPath: string;
}

// Predefined character data for heroes and enemies, including their unique keys, names, roles, descriptions, and image paths for loading their portraits in the character scene
const HEROES: CharacterDef[] = [
  {
    key: 'chr-christian',
    name: 'Christian',
    role: 'The Balanced Fighter',
    desc: 'A disciplined warrior of the Crock Clan. His ultimate recovers 50% of his health and 30% shield, making him a reliable frontline fighter.',
    imgPath: christianImg,
  },
  {
    key: 'chr-gustav',
    name: 'Gustav',
    role: 'The Fortress',
    desc: 'Built like a tank, Gustav prioritizes defense over offense. His ultimate recovers 25% health but grants a massive 60% shield.',
    imgPath: gustavImg,
  },
  {
    key: 'chr-gavin',
    name: 'Gavin',
    role: 'The All-Rounder',
    desc: 'A versatile clan member who balances offense and defense equally. His ultimate restores 30% health and 30% shield.',
    imgPath: gavinImg,
  },
  {
    key: 'chr-eddy',
    name: 'Eddy',
    role: 'The Berserker',
    desc: 'A reckless fighter who sacrifices defense for raw survival. His ultimate recovers 75% health at the cost of 35% shield.',
    imgPath: eddyImg,
  },
  {
    key: 'chr-klancy',
    name: 'Klancy',
    role: 'Clan Leader & Mentor',
    desc: 'The charismatic leader of the Crock Clan. Not a lizard — an alligator, and a classy one. He guides newcomers through the swamp and dreams of reclaiming their home.',
    imgPath: klancyImg,
  },
];

// Enemy characters with their unique keys, names, roles, descriptions, and image paths for loading their portraits in the character scene
const ENEMIES: CharacterDef[] = [
  {
    key: 'chr-skawl',
    name: 'Skawl',
    role: 'Introductory Boss — The Wired Rat',
    desc: 'A cybernetic rat born from toxic waste and lab experiments. Skawl favors quick, simple plays and serves as the first real test for new clan members.',
    imgPath: skawlImg,
  },
  {
    key: 'chr-rabyz',
    name: 'Rabyz',
    role: 'Control Boss — The Cyborg Raccoon',
    desc: 'A cunning raccoon augmented with machinery. Rabyz specializes in control tactics, special cards, and disrupting the player\'s rhythm.',
    imgPath: rabyzImg,
  },
  {
    key: 'chr-boldear',
    name: 'Boldear',
    role: 'Pressure Boss — The Augmented Bear',
    desc: 'A hulking bear straight out of a Silicon Valley nightmare. Boldear applies relentless pressure with defensive and punishment-based strategies.',
    imgPath: boldearImg,
  },
  {
    key: 'chr-pythra',
    name: 'Pythra',
    role: 'Final Boss — The Python Mastermind',
    desc: 'The supreme leader of the swamp threats. A python with a cartoon-villain complex who commands ice cards and complex control patterns. Defeating Pythra means reclaiming the swamp.',
    imgPath: pythraImg,
  },
];

export class CharacterScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container; // Container for all scrollable content (character cards)
  private scrollMask!: Phaser.Display.Masks.GeometryMask; // Mask to restrict scrollable area to the background plate
  private contentHeight: number = 0; // Total height of the scrollable content, used to calculate scroll limits

  constructor() {
    super({ key: 'CharacterScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);

    // Load all character portraits
    [...HEROES, ...ENEMIES].forEach((c) => {
      this.load.image(c.key, c.imgPath); // Load each character's portrait image using their unique key and image path
    });
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    this.input.enabled = true;

    // Background
    this.add.image(cx, height / 2, 'title-background');
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // Dark overlay for readability
    this.add.rectangle(0, 0, width, height, 0x000000, 0.45).setOrigin(0);

    // Title
    this.add.text(cx, 50, 'CHARACTERS', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '48px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5);

    // Scrollable area dimensions
    const bgX = width * 0.08;
    const bgY = 100;
    const bgW = width * 0.84;
    const bgH = height - 180;

    // Background plate
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x222222, 0.85);
    bgGraphics.fillRoundedRect(bgX, bgY, bgW, bgH, 12);
    bgGraphics.lineStyle(4, 0x666666);
    bgGraphics.strokeRoundedRect(bgX, bgY, bgW, bgH, 12);

    // Scroll container
    this.scrollContainer = this.add.container(bgX + 20, bgY + 20);

    let yOffset = 0;

    // Function to create section titles with dividers
    const sectionTitle = (text: string, color: string) => {
      const t = this.add.text(bgW / 2, yOffset, text, {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '32px',
        color: color,
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5, 0);
      this.scrollContainer.add(t); // Add the section title to the scroll container so it moves with the content
      yOffset += t.height + 16;

      // Divider line
      const div = this.add.graphics();
      div.lineStyle(2, color === '#ffcc00' ? 0xffcc00 : 0xff4444, 0.6);
      div.lineBetween(40, yOffset - 6, bgW - 40, yOffset - 6);
      this.scrollContainer.add(div); // Add the divider to the scroll container

      yOffset += 10;
    };

    // Function to create character cards for both heroes and enemies
    const createCharacterCard = (char: CharacterDef) => {
      const cardW = bgW - 90; // card width
      const cardH = 180; // card height
      const cardX = bgW / 2; // center the card horizontally within the background plate
      const cardY = yOffset + cardH / 2; // position the card vertically based on the current yOffset, starting from the top of the scroll container

      // Card background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1a1a1a, 0.9); // Dark background for the card to make text and portrait pop
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8); // Draw the card background centered on (0,0) since it will be added to a container that is positioned at (cardX, cardY)
      cardBg.lineStyle(2, 0x555555, 0.8); // Add a subtle border to the card for better separation from the background
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8); // Stroke the card background with a rounded rectangle to give it a polished look

      const cardContainer = this.add.container(cardX, cardY); // Create a container for the card at the calculated position
      cardContainer.add(cardBg); // Add the card background to the card container so that all elements of the card are grouped together for easy positioning and scrolling

      // Portrait
      const portrait = this.add.image(-cardW / 2 + 70, 0, char.key).setScale(0.55); // Load the character's portrait image using their unique key and position it on the left side of the card
      // Clamp portrait height
      if (portrait.height * portrait.scaleY > cardH - 20) { // If the portrait's height exceeds the card's height minus some padding, scale it down to fit within the card
        const scale = (cardH - 20) / portrait.height;
        portrait.setScale(scale);
      }
      cardContainer.add(portrait); // Add the portrait to the card container so it moves with the card and scrolls with the content

      // Name
      const nameText = this.add.text(-cardW / 2 + 160, -cardH / 2 + 14, char.name, {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0, 0);
      cardContainer.add(nameText);

      // Role
      const roleText = this.add.text(-cardW / 2 + 160, -cardH / 2 + 42, char.role, {
        fontFamily: 'Impact, Arial, sans-serif',
        fontSize: '16px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0);
      cardContainer.add(roleText);

      // Description
      const descText = this.add.text(-cardW / 2 + 160, -cardH / 2 + 66, char.desc, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#cccccc',
        wordWrap: { width: cardW - 160 },
        lineSpacing: 4,
      }).setOrigin(0, 0);
      cardContainer.add(descText);

      this.scrollContainer.add(cardContainer);

      yOffset += cardH + 16;
    };

    // ── HEROES SECTION ──
    sectionTitle('HEROES OF THE CROCK CLAN', '#ffcc00');
    HEROES.forEach(createCharacterCard);

    // Spacer between sections
    yOffset += 20;

    // ── ENEMIES SECTION ──
    sectionTitle('THREATS OF THE SWAMP', '#ff4444');
    ENEMIES.forEach(createCharacterCard);

    // Bottom spacer
    yOffset += 30;

    this.contentHeight = yOffset;

    // Mask for scrolling
    const maskShape = this.make.graphics(); // Create a graphics object to define the mask shape for the scrollable area
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(bgX, bgY, bgW, bgH, 12);
    this.scrollMask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(this.scrollMask);

    // Scroll input
    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      this.scrollContainer.y -= deltaY * 0.5;
      this.limitScroll(bgY + 20, bgH);
    });

    // Back button
    this.createMetalBtn(cx, height - 45, 280, 55, 'BACK TO MENU', () => {
      transitionTo(this, 'MenuScene');
    });

    this.events.on('shutdown', () => {
      this.input.off('wheel'); // Clean up input listener when scene is shutdown
    });
  }

  private limitScroll(startY: number, bgHeight: number) { // Ensure the scroll container stays within the bounds of the content
    const minHeight = startY - (this.contentHeight - bgHeight + 40); // Calculate the minimum Y position based on content height and background height
    if (this.scrollContainer.y > startY) this.scrollContainer.y = startY; // Prevent scrolling past the top
    if (this.scrollContainer.y < minHeight) this.scrollContainer.y = minHeight; // Prevent scrolling past the bottom
  }

  private createMetalBtn( // Utility function to create a stylized metallic button with interactive states
    x: number, y: number, w: number, h: number,
    label: string, callback: () => void,
  ) {
    const container = this.add.container(x, y); // Create a container for the button at the specified position
    const graphics = this.add.graphics(); // Create a graphics object to draw the button's background and effects

    const draw = (pressed: boolean) => { // Function to draw the button in either pressed or unpressed state
      graphics.clear();
      graphics.fillStyle(0x000000, 0.4);
      graphics.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w, h, 6);
      graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
      graphics.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      graphics.fillStyle(pressed ? 0x333333 : 0x999999, 1);
      graphics.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h / 2 - 4);
      graphics.fillStyle(pressed ? 0x111111 : 0x666666, 1);
      graphics.fillRect(-w / 2 + 4, 0, w - 8, h / 2 - 4);
    };

    draw(false);
    const text = this.add.text(0, 0, label, { // Text style for the button label
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '22px',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([graphics, text]);
    container
      .setSize(w, h)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { draw(true); text.y = 2; })
      .on('pointerup', () => { draw(false); text.y = 0; callback(); })
      .on('pointerout', () => { draw(false); text.y = 0; })
      .on('pointerover', () => { text.setColor('#226d1b'); })
      .on('pointerout', () => { text.setColor('#c2baba'); });
  }
}

