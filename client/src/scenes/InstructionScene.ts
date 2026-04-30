import Phaser from "phaser";
import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.ts';

export class InstructionScene extends Phaser.Scene {
    private scrollContainer!: Phaser.GameObjects.Container;
    private scrollMask!: Phaser.Display.Masks.GeometryMask;
    private contentHeight: number = 0;

    constructor() {
        super({ key: 'InstructionScene' });
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        this.input.enabled = true;

        // Get current language for translations
        const langKey = this.registry.get('language') || 'en';
        const t = translations[langKey];

        this.cameras.main.setBackgroundColor('#1a1a1a');

        const bgWidth = width * 0.8;
        const bgHeight = height * 0.7;
        const bgX = centerX - bgWidth / 2;
        const bgY = 120;

        //background plate
        const bgGraphics = this.add.graphics();
        bgGraphics.fillStyle(0x333333, 0.9);
        bgGraphics.fillRoundedRect(bgX, bgY, bgWidth, bgHeight, 10);
        bgGraphics.lineStyle(4, 0x666666);
        bgGraphics.strokeRoundedRect(bgX, bgY, bgWidth, bgHeight, 10);

        // Title
        this.add.text(centerX, 60, t.how_to_play, {
            fontFamily: 'Impact', fontSize: '42px', color: '#acacac', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        // Scrollable content container
        this.scrollContainer = this.add.container(bgX + 20, bgY + 20);

        let yOffset = 0;

        // Function to create a section with a title and content, and add it to the scroll container
        const contentWidth = bgWidth * 0.75;

        const createSection = (title: string, content: string, color = '#acacac') => {
            // Centered title
            const titleText = this.add.text(bgWidth / 2, yOffset, title, {
                fontFamily: 'Impact, Arial',
                fontSize: '26px',
                color: '#ffcc00',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5, 0);

            // offset be calculated based on the height of the title and some padding
            yOffset += titleText.height + 10;

            const contentText = this.add.text(bgWidth / 2, yOffset, content, {
                fontFamily: 'Impact, Arial',
                fontSize: '18px',
                color: color,
                stroke: '#000',
                strokeThickness: 2,
                wordWrap: { width: contentWidth }, // content width padding
                align: 'center'
            }).setOrigin(0.5, 0);

            contentText.setLineSpacing(8);

            // Update the yOffset for the next section, adding some extra space after the content
            yOffset += contentText.height + 35;

            // Add the title and content to the scroll container
            this.scrollContainer.add([titleText, contentText]);
        };

        //instructions text
        createSection(t.mision, t.mision_desc);

        createSection(t.controls, t.controls_desc);

        createSection(t.game_flow, t.game_flow_desc);

        createSection(t.card_rules, t.card_rules_desc);

        createSection(t.energy_system, t.energy_system_desc);

        createSection(t.card_types, t.card_types_desc);

        createSection(t.roguelite, t.roguelite_desc);

        // After creating all sections, set the total content height and create a mask to limit the visible area of the scroll container
        this.contentHeight = yOffset;
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(bgX, bgY, bgWidth, bgHeight, 10);
        this.scrollMask = maskShape.createGeometryMask();
        this.scrollContainer.setMask(this.scrollMask);

        // scroll logic
        this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
            this.scrollContainer.y -= deltaY * 0.5; // Smoother scrolling
            this.limitScroll(bgY + 20, bgHeight);
        });

        // back to menu button
        this.createMetalBtn(centerX, height - 50, 250, 50, t.back_to_menu, () => {
            transitionTo(this, 'MenuScene');
        });

        this.events.on('shutdown', () => {
            this.input.off('wheel');
        });
    }

    private limitScroll(startY: number, bgHeight: number) {
        // limit scroll between the top of the content and the bottom of the content minus the visible area
        const minHeight = startY - (this.contentHeight - bgHeight + 40);
        if (this.scrollContainer.y > startY) this.scrollContainer.y = startY;
        if (this.scrollContainer.y < minHeight) this.scrollContainer.y = minHeight;
    }

    createMetalBtn(x: number, y: number, w: number, h: number, label: string, callback: () => void) {
        const container = this.add.container(x, y);
        const graphics = this.add.graphics();
        
        const draw = (pressed: boolean) => {
            graphics.clear();
            graphics.fillStyle(0x000000, 0.4);
            graphics.fillRoundedRect(-w/2 + 3, -h/2 + 3, w, h, 6);
            graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
            graphics.fillRoundedRect(-w/2, -h/2, w, h, 4);
            graphics.fillStyle(pressed ? 0x333333 : 0x999999, 1);
            graphics.fillRect(-w/2 + 4, -h/2 + 4, w - 8, h/2 - 4);
            graphics.fillStyle(pressed ? 0x111111 : 0x666666, 1);
            graphics.fillRect(-w/2 + 4, 0, w - 8, h/2 - 4);
        };

        draw(false);
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Impact', fontSize: '20px', color: '#fff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        container.add([graphics, text]);
        container.setSize(w, h).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { draw(true); text.y = 2; })
            .on('pointerup', () => { draw(false); text.y = 0; callback(); })
            .on('pointerout', () => { draw(false); text.y = 0; });
    }
}