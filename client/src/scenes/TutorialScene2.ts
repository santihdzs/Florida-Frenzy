import Phaser from 'phaser';
import { DuelScene } from './DuelScene';
import clanUrl from '../assets/sprites/Klan.png';
import { markTutorialComplete } from '../utils/auth.js';

export class TutorialScene2 extends DuelScene { // extends of the DuelScene because it inherits from it
    private clanPortrait!: Phaser.GameObjects.Image;
    private tutorialText!: Phaser.GameObjects.Text;
    private tutorialStep = 0;
    private tutorialContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'TutorialScene2' });
    }

    preload() {
        super.preload(); 
        this.load.image('spr-clan', clanUrl);
    }

    create() {
        super.create(); 
        this.createClanTutorialHud();
        this.startTutorial();
    }

    private createClanTutorialHud() {
        const { width, height } = this.cameras.main;
        
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRoundedRect(0, 0, 450, 110, 15);
        bg.lineStyle(3, 0x00ff88).strokeRoundedRect(0, 0, 450, 110, 15);

        this.clanPortrait = this.add.image(10, 10, 'spr-clan').setDisplaySize(90, 90).setOrigin(0);

        const textStyle = {
            fontFamily: 'Impact, Arial black, sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            wordWrap: { width: 320 }
        };

        this.tutorialText = this.add.text(115, 20, '', textStyle);

        // position for the container of instructions
        this.tutorialContainer = this.add.container(width / 2 - 225, height - 250, [bg, this.clanPortrait, this.tutorialText]);
        this.tutorialContainer.setDepth(10000); 
    }

    private startTutorial() {
        this.updateTutorialContent(
            'Watch out, Crock! This is the duel. Look at the Table Card in the center. You must match either the Element or the Number.',
            '#ffffff'
        );
        
        this.isAnimating = true; 
        
        // This delay is just for try to no call missclicks
        this.time.delayedCall(500, () => {
            this.input.once('pointerdown', () => this.nextStep());
        });
    }

    private nextStep() {
        this.tutorialStep++;

        switch(this.tutorialStep) {
            case 1:
                this.updateTutorialContent(
                    'If you don´t have a move, click on the Discard Pile (on the right) to draw a card. But watch out for fatigue!',
                    '#ffd700'
                );
                this.time.delayedCall(500, () => {
                    this.input.once('pointerdown', () => this.nextStep());
                });
                break;
            case 2:
                this.updateTutorialContent(
                    'Each card gives you EE (Elemental Energy) and EI (Instinct). Use them for brutal combos!',
                    '#00d4ff'
                );
                this.time.delayedCall(500, () => {
                    this.input.once('pointerdown', () => this.finishTutorial());
                });
                break;
        }
    }

    private updateTutorialContent(text: string, color: string) {
        this.tutorialText.setText(text);
        this.tutorialText.setColor(color);
        
        this.tweens.add({
            targets: this.clanPortrait,
            scale: (95/this.clanPortrait.width), // Pulso basado en escala real
            duration: 100,
            yoyo: true
        });
    }

    private finishTutorial() {
        this.updateTutorialContent('¡Enough talk! Show them what the Crock Clan is made of. Let´s fight!', '#00ff88');
        
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: this.tutorialContainer,
                alpha: 0,
                y: '+=100',
                duration: 500,
                onComplete: () => {
                    markTutorialComplete();
                    this.isAnimating = false;
                    this.tutorialContainer.destroy();
                }
            });
        });
    }
}