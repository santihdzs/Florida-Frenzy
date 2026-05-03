import Phaser from 'phaser';
import { transitionTo } from '../utils/sceneTransition.js';
import titleBackground from '../assets/title-background.webp';

import christianImg from '../assets/characters/christian/Christian_v4_resized.webp';
import gustavImg from '../assets/characters/gustav/Gustav_v3_resized.webp';
import gavinImg from '../assets/characters/gavin/Gavin_v3_resized.webp';
import eddyImg from '../assets/characters/eddy/Eddy_v2_resized.webp';
import klancyImg from '../assets/characters/klancy/Klancy_v1_resized.webp';
import skawlImg from '../assets/characters/skawl/Skawl_resized.webp';
import rabyzImg from '../assets/characters/rabyz/Rabyz_resized.webp';
import boldearImg from '../assets/characters/boldear/Boldear_resized.webp';
import pythraImg from '../assets/characters/pythra/Pythra_evolution-1_resized.webp';
import { translations } from '../utils/translations.js'; // Importing translations for multilingual support

interface CharacterDef {
  key: string;
  name: string;
  role: string;
  desc: string;
  imgPath: string;
}

// function to get character definitions with translated roles and descriptions based on the current language
const getHeroes: (t: Record<string, string>) => CharacterDef[] = (t) => [
  { key: 'st-christian', name: 'Christian', role: t.christian_role, desc: t.christian_desc, imgPath: christianImg },
  { key: 'st-gustav',    name: 'Gustav',    role: t.gustav_role,    desc: t.gustav_desc,    imgPath: gustavImg },
  { key: 'st-gavin',     name: 'Gavin',     role: t.gavin_role,     desc: t.gavin_desc,     imgPath: gavinImg },
  { key: 'st-eddy',      name: 'Eddy',      role: t.eddy_role,      desc: t.eddy_desc,      imgPath: eddyImg },
  { key: 'st-klancy',    name: 'Klancy',    role: t.klancy_role,    desc: t.klancy_desc,    imgPath: klancyImg },
];

// function to get enemy character definitions with translated roles and descriptions based on the current language
const getEnemies: (t: Record<string, string>) => CharacterDef[] = (t) => [
  { key: 'st-skawl',   name: 'Skawl',   role: t.skawl_role,   desc: t.skawl_desc,   imgPath: skawlImg },
  { key: 'st-rabyz',   name: 'Rabyz',   role: t.rabyz_role,   desc: t.rabyz_desc,   imgPath: rabyzImg },
  { key: 'st-boldear', name: 'Boldear', role: t.boldear_role, desc: t.boldear_desc, imgPath: boldearImg },
  { key: 'st-pythra',  name: 'Pythra',  role: t.pythra_role,  desc: t.pythra_desc,  imgPath: pythraImg },
];

export class StoryScene extends Phaser.Scene {
  // The scroll implentation is based un a chatGPT example of a scrollable container, but is modified and expanded by us to fit the needs of our story scene, including adding a mask to limit the visible area and implementing a custom method for drawing stylized buttons that match the theme of the game. The character definitions are also structured to allow for easy translation of roles and descriptions based on the selected language, ensuring that the story content is accessible in multiple languages. The overall design and layout of the scene are hand-crafted by us to create an engaging and visually appealing presentation of the game's story and characters.
  private scrollContainer!: Phaser.GameObjects.Container; // Container that holds all the scrollable content (lore text and character cards)
  private scrollMask!: Phaser.Display.Masks.GeometryMask; // Mask to limit the visible area of the scroll container to the background area
  private contentHeight = 0;

  constructor() {
    super({ key: 'StoryScene' });
  }

  preload() {
    // Preload all character portraits and the title background image
    const allChars = [...getHeroes(translations['en']), ...getEnemies(translations['en'])];
    allChars.forEach((c) => {
      if (!this.textures.exists(c.key)) this.load.image(c.key, c.imgPath); // Only load if not already in the texture manager to avoid duplicates when switching languages
    });

    if (!this.textures.exists('title-background')) {
      this.load.image('title-background', titleBackground);
    }
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    this.input.enabled = true;

    // Get current language for translations
    const langKey = this.registry.get('language') || 'en'; // Default to English if not set
    const t = translations[langKey]; // Get the translations for the current language to use in the scene (this allows the story scene to display text in the selected language, and also ensures that character roles and descriptions are shown in the correct language)
    const HEROES = getHeroes(t); // Get heroes with current language
    const ENEMIES = getEnemies(t); // Get enemies with current language

    this.add.image(cx, height / 2, 'title-background');
    this.cameras.main.setBackgroundColor('#1a1a1a');
    this.add.rectangle(0, 0, width, height, 0x000000, 0.45).setOrigin(0);

    this.add.text(cx, 50, 'STORY', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '48px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5);

    const bgX = width * 0.08;
    const bgY = 100;
    const bgW = width * 0.84;
    const bgH = height - 180;

    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x222222, 0.85);
    bgGraphics.fillRoundedRect(bgX, bgY, bgW, bgH, 12);
    bgGraphics.lineStyle(4, 0x666666);
    bgGraphics.strokeRoundedRect(bgX, bgY, bgW, bgH, 12);

    this.scrollContainer = this.add.container(bgX + 20, bgY + 20); // Container for all scrollable content, positioned with some padding inside the background area
    let yOffset = 0; // Track the vertical position for adding content to the scroll container, starting at 0 and increasing as we add lore text and character cards

    const addSectionTitle = (text: string, color: string) => {
      const t = this.add.text(bgW / 2, yOffset, text, {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '28px',
        color,
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5, 0);
      this.scrollContainer.add(t);
      yOffset += t.height + 10; // Move yOffset down for the next content, adding some extra space after the title

      const div = this.add.graphics();
      div.lineStyle(2, color === '#ffcc00' ? 0xffcc00 : 0xff4444, 0.6);
      div.lineBetween(40, yOffset - 4, bgW - 40, yOffset - 4);
      this.scrollContainer.add(div);
      yOffset += 14; // Add extra space after the divider for better separation between sections
    };

    const addLore = () => {
      // Use current language for lore text
      const t_local = translations[this.registry.get('language') || 'en']; // Get the translations for the current language to access the lore text, ensuring it's displayed in the correct language

      const lore = t_local.lore_text;
        
      const t = this.add.text(10, yOffset, lore, { // The lore text is displayed in the current language, and the content is wrapped to fit within the background area with some padding
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '20px',
        color: '#e0e0e0',
        stroke: '#000000',
        strokeThickness: 2,
        wordWrap: { width: bgW - 60 },
        lineSpacing: 6,
      }).setOrigin(0, 0);
      this.scrollContainer.add(t); // Add the lore text to the scroll container so it will be part of the scrollable content
      yOffset += t.height + 30; // Move yOffset down for the next content, adding extra space after the lore section for better separation before the character cards
    };

    // Function to add a character card for a given character definition, including portrait, name, role, and description, all styled and laid out within a card design. The character's role and description are displayed in the current language based on the translations provided to the getHeroes and getEnemies functions.
    const addCharacterCard = (char: CharacterDef) => {
      const cardW = bgW - 90;
      const cardH = 180;
      const cardX = bgW / 2;
      const cardY = yOffset + cardH / 2; // Position the card based on the current yOffset, which tracks where we are in the scrollable content. The card is centered horizontally within the background area, and its vertical position is determined by yOffset to ensure it is placed correctly in the scroll flow. After adding the card, yOffset will be increased by the card's height plus some extra space to position the next content correctly below it.

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1a1a1a, 0.9);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
      cardBg.lineStyle(2, 0x555555, 0.8);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);

      const cardContainer = this.add.container(cardX, cardY);
      cardContainer.add(cardBg);

      const portrait = this.add.image(-cardW / 2 + 70, 0, char.key).setScale(0.55);
      if (portrait.height * portrait.scaleY > cardH - 20) {
        portrait.setScale((cardH - 20) / portrait.height);
      }
      cardContainer.add(portrait);

      cardContainer.add(this.add.text(-cardW / 2 + 160, -cardH / 2 + 14, char.name, {
        fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '24px', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0, 0));

      cardContainer.add(this.add.text(-cardW / 2 + 160, -cardH / 2 + 42, char.role, {
        fontFamily: 'Impact, Arial, sans-serif', fontSize: '16px', color: '#aaaaaa', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0));

      cardContainer.add(this.add.text(-cardW / 2 + 160, -cardH / 2 + 66, char.desc, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#cccccc', wordWrap: { width: cardW - 200 }, lineSpacing: 4,
      }).setOrigin(0, 0));

      this.scrollContainer.add(cardContainer);
      yOffset += cardH + 16; // Move yOffset down for the next content, adding extra space after the character card for better separation
    };

    addSectionTitle(t.story_rebelion_title, '#ffcc00');
    addLore();

    addSectionTitle(t.story_heroes_title, '#ffcc00');
    HEROES.forEach(addCharacterCard);

    yOffset += 20;

    addSectionTitle(t.story_enemies_title, '#ff4444');
    ENEMIES.forEach(addCharacterCard);

    yOffset += 30;
    this.contentHeight = yOffset;

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(bgX, bgY, bgW, bgH, 12);
    this.scrollMask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(this.scrollMask);

    // Add mouse wheel scrolling to allow the user to scroll through the content if it exceeds the height of the background area. The scroll is limited to prevent scrolling past the top or bottom of the content, ensuring a smooth and controlled scrolling experience.
    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      this.scrollContainer.y -= deltaY * 0.5;
      this.limitScroll(bgY + 20, bgH);
    });

    this.createMetalBtn(cx, height - 45, 280, 55, t.back_to_menu, () => {
      transitionTo(this, 'MenuScene');
    });

    this.events.on('shutdown', () => { this.input.off('wheel'); });
  }

  // Method to limit the vertical scrolling of the content within the bounds of the background area, ensuring that the user cannot scroll past the top or bottom of the content. This is called whenever the user scrolls to adjust the position of the scroll container and keep it within the defined limits.
  private limitScroll(startY: number, bgHeight: number) {
    const minHeight = startY - (this.contentHeight - bgHeight + 40);
    if (this.scrollContainer.y > startY) this.scrollContainer.y = startY;
    if (this.scrollContainer.y < minHeight) this.scrollContainer.y = minHeight;
  }

  // Custom method to draw a stylized "metal plate" background for buttons, with different appearance based on whether it's pressed or not
  // IA was used to creat the style, but the implementation was hand-coded by us based on the generated design
  private createMetalBtn(x: number, y: number, w: number, h: number, label: string, callback: () => void) {
    const container = this.add.container(x, y);
    const graphics = this.add.graphics();

    const draw = (pressed: boolean) => {
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
    // The button text is styled with a metallic look using stroke and shadow, and the font is chosen to match the theme of the game. The text color changes on hover for interactivity feedback.
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '22px', color: '#c2baba', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Add interactive behavior for the button, including visual feedback on hover and click, and executing the callback when clicked
    container.add([graphics, text]);
    container.setSize(w, h).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { draw(true); text.y = 2; })
      .on('pointerup',   () => { draw(false); text.y = 0; callback(); })
      .on('pointerout',  () => { draw(false); text.y = 0; text.setColor('#c2baba'); })
      .on('pointerover', () => { text.setColor('#226d1b'); });
  }
}
