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

interface CharacterDef {
  key: string;
  name: string;
  role: string;
  desc: string;
  imgPath: string;
}

const HEROES: CharacterDef[] = [
  { key: 'st-christian', name: 'Christian', role: 'The Balanced Fighter', desc: 'A disciplined warrior of the Crock Clan. His ultimate recovers 50% of his health and 30% shield, making him a reliable frontline fighter.', imgPath: christianImg },
  { key: 'st-gustav',    name: 'Gustav',    role: 'The Fortress',          desc: 'Built like a tank, Gustav prioritizes defense over offense. His ultimate recovers 25% health but grants a massive 60% shield.', imgPath: gustavImg },
  { key: 'st-gavin',     name: 'Gavin',     role: 'The All-Rounder',       desc: 'A versatile clan member who balances offense and defense equally. His ultimate restores 30% health and 30% shield.', imgPath: gavinImg },
  { key: 'st-eddy',      name: 'Eddy',      role: 'The Berserker',         desc: 'A reckless fighter who sacrifices defense for raw survival. His ultimate recovers 75% health at the cost of 35% shield.', imgPath: eddyImg },
  { key: 'st-klancy',    name: 'Klancy',    role: 'Clan Leader & Mentor',  desc: 'The charismatic leader of the Crock Clan. Not a lizard — an alligator, and a classy one. He guides newcomers through the swamp and dreams of reclaiming their home.', imgPath: klancyImg },
];

const ENEMIES: CharacterDef[] = [
  { key: 'st-skawl',   name: 'Skawl',   role: 'Introductory Boss — The Wired Rat',     desc: 'A cybernetic rat born from toxic waste and lab experiments. Skawl favors quick, simple plays and serves as the first real test for new clan members.', imgPath: skawlImg },
  { key: 'st-rabyz',   name: 'Rabyz',   role: 'Control Boss — The Cyborg Raccoon',     desc: "A cunning raccoon augmented with machinery. Rabyz specializes in control tactics, special cards, and disrupting the player's rhythm.", imgPath: rabyzImg },
  { key: 'st-boldear', name: 'Boldear', role: 'Pressure Boss — The Augmented Bear',    desc: 'A hulking bear straight out of a Silicon Valley nightmare. Boldear applies relentless pressure with defensive and punishment-based strategies.', imgPath: boldearImg },
  { key: 'st-pythra',  name: 'Pythra',  role: 'Final Boss — The Python Mastermind',    desc: 'The supreme leader of the swamp threats. A python with a cartoon-villain complex who commands ice cards and complex control patterns. Defeating Pythra means reclaiming the swamp.', imgPath: pythraImg },
];

export class StoryScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollMask!: Phaser.Display.Masks.GeometryMask;
  private contentHeight = 0;

  constructor() {
    super({ key: 'StoryScene' });
  }

  preload() {
    if (!this.textures.exists('title-background')) {
      this.load.image('title-background', titleBackground);
    }
    [...HEROES, ...ENEMIES].forEach((c) => {
      if (!this.textures.exists(c.key)) this.load.image(c.key, c.imgPath);
    });
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    this.input.enabled = true;

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

    this.scrollContainer = this.add.container(bgX + 20, bgY + 20);
    let yOffset = 0;

    const addSectionTitle = (text: string, color: string) => {
      const t = this.add.text(bgW / 2, yOffset, text, {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '28px',
        color,
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5, 0);
      this.scrollContainer.add(t);
      yOffset += t.height + 10;

      const div = this.add.graphics();
      div.lineStyle(2, color === '#ffcc00' ? 0xffcc00 : 0xff4444, 0.6);
      div.lineBetween(40, yOffset - 4, bgW - 40, yOffset - 4);
      this.scrollContainer.add(div);
      yOffset += 14;
    };

    const addLore = () => {
      const lore =
        'THE SWAMP REBELLION\n\n' +
        'In the murky and contaminated waters of the Florida swampland, radiation and industrial waste altered the course of nature. From this toxic mud emerged the Croc Clan, a group of crocodiles that developed human intelligence due to the chemicals. With a strong punk identity, these warriors learned to survive by recycling the trash abandoned in the rivers and landfills.\n\n' +
        'However, their home is under threat. The surrounding areas have been invaded by cruel factions of rats, raccoons and bears. Unlike the Croc Clan, these enemies are the result of bio-cybernetic experiments that ran amok. They acquired their intelligence by directly connecting their brains to computers, becoming ruthless machines willing to do anything. This entire cyber army is led by the fearsome python, Pythra.\n\n' +
        'To defend their territory, the Croc Clan does not use conventional weapons, but have mastered the \'ancient art\' of Florida Frenzy. Through legendary relics in the form of cards, these warriors channel the Elemental Energy of their environment and their own wild instinct to unleash devastating abilities.\n\n' +
        'Now it\'s your turn. Choose your warrior, venture into the chaos of the swampland and prove who is the true king of the food chain.';

      const t = this.add.text(10, yOffset, lore, {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '20px',
        color: '#e0e0e0',
        stroke: '#000000',
        strokeThickness: 2,
        wordWrap: { width: bgW - 60 },
        lineSpacing: 6,
      }).setOrigin(0, 0);
      this.scrollContainer.add(t);
      yOffset += t.height + 30;
    };

    const addCharacterCard = (char: CharacterDef) => {
      const cardW = bgW - 90;
      const cardH = 180;
      const cardX = bgW / 2;
      const cardY = yOffset + cardH / 2;

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
      yOffset += cardH + 16;
    };

    addSectionTitle('THE SWAMP REBELLION', '#ffcc00');
    addLore();

    addSectionTitle('HEROES OF THE CROCK CLAN', '#ffcc00');
    HEROES.forEach(addCharacterCard);

    yOffset += 20;

    addSectionTitle('THREATS OF THE SWAMP', '#ff4444');
    ENEMIES.forEach(addCharacterCard);

    yOffset += 30;
    this.contentHeight = yOffset;

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(bgX, bgY, bgW, bgH, 12);
    this.scrollMask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(this.scrollMask);

    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      this.scrollContainer.y -= deltaY * 0.5;
      this.limitScroll(bgY + 20, bgH);
    });

    this.createMetalBtn(cx, height - 45, 280, 55, 'BACK TO MENU', () => {
      transitionTo(this, 'MenuScene');
    });

    this.events.on('shutdown', () => { this.input.off('wheel'); });
  }

  private limitScroll(startY: number, bgHeight: number) {
    const minHeight = startY - (this.contentHeight - bgHeight + 40);
    if (this.scrollContainer.y > startY) this.scrollContainer.y = startY;
    if (this.scrollContainer.y < minHeight) this.scrollContainer.y = minHeight;
  }

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
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '22px', color: '#c2baba', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([graphics, text]);
    container.setSize(w, h).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { draw(true); text.y = 2; })
      .on('pointerup',   () => { draw(false); text.y = 0; callback(); })
      .on('pointerout',  () => { draw(false); text.y = 0; text.setColor('#c2baba'); })
      .on('pointerover', () => { text.setColor('#226d1b'); });
  }
}
