import Phaser from "phaser";
import { transitionTo } from '../utils/sceneTransition.js';
import titleBackground from '../assets/title-background.webp';

export class HistoryScene extends Phaser.Scene {
    private scrollContainer!: Phaser.GameObjects.Container;
    private scrollMask!: Phaser.Display.Masks.GeometryMask;
    private contentHeight: number = 0;

  constructor() {
    super({ key: 'HistoryScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);
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
    this.add.text(cx, 50, 'HISTORY', {
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

    const storyText ="THE SWAMP REBELION\n\n" +
      "In the murky and contaminated waters of the Florida swampland, radiation and industrial waste altered the course of nature. From this toxic mud emerged the Croc Clan, a group of crocodiles that developed human intelligence due to the chemicals. With a strong punk identity, these warriors learned to survive by recycling the trash abandoned in the rivers and landfills.\n\n" +
      "However, their home is under threat. The surrounding areas have been invaded by cruel factions of rats, raccoons and bears. Unlike the Croc Clan, these enemies are the result of bio-cybernetic experiments that ran amok. They acquired their intelligence by directly connecting their brains to computers, becoming ruthless machines willing to do anything. This entire cyber army is led by the fearsome python, Pythra.\n\n" +
      "To defend their territory, the Croc Clan does not use conventional weapons, but have mastered the 'ancient art' of Florida Frenzy. Through legendary relics in the form of cards, these warriors channel the Elemental Energy of their environment and their own wild instinct to unleash devastating abilities.\n\n" +
      "Now it's your turn. Choose your warrior, venture into the chaos of the swampland and prove who is the true king of the food chain.";
    const textStyle = {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '24px',
        color: '#e0e0e0',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'justify',
        wordWrap: { width: bgW - 60 },
    };

    const historyText = this.add.text(10, 0, storyText, textStyle).setOrigin(0);
    this.scrollContainer.add(historyText);
    this.contentHeight = historyText.height;

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

