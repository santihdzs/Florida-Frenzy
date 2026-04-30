/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
* Extra scene for when the game is paused. 
* Provides options to resume, access settings, or return to the main menu. 
* Launched from DuelScene and other gameplay scenes when the player presses the pause button or ESC key. 
* Displays a semi-transparent overlay with menu options. 
* Handles input for navigating the pause menu and resuming or exiting the game.
*
* ChatGPT was used to assist in writing and optimizing some of the code in this file
*/ 

import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
    private returnScene = ''; // the scene to return to when resuming

    constructor() {
        super({ key: 'PauseScene' }); // unique key for this scene
    }

    init(data: { returnScene: string }) {
        this.returnScene = data.returnScene;
    }

    create() {
        // constants for layout
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        //for sounds in different scenes, we want to resume any paused music when resuming the game, so we don't have to worry about which scene we came from
        const globalMusic = this.registry.get('music') as Phaser.Sound.BaseSound;
        if (globalMusic) globalMusic.pause();

        this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0); // semi-transparent background

        this.add.text(centerX, centerY - 120, 'PAUSED', {
            fontFamily: 'Impact, sans-serif',
            fontSize: '52px',
            color: '#feec00',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5); // title text

        const resume = this.add.text(centerX, centerY - 20, 'Resume', {
            fontSize: '30px',
            color: '#ffffff',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }); // resume button
        
        const settings = this.add.text(centerX, centerY + 40, 'Settings', {
            fontSize: '30px',
            color: '#ffffff',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }); // settings button

        const menu = this.add.text(centerX, centerY + 100, ' Back to Menu', {
            fontSize: '26px',
            color: '#ffffff',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }); // back to menu button

        const doResume = () => {
            if(globalMusic) globalMusic.resume(); // resume the music when resuming the game
            this.scene.stop();
            this.scene.resume(this.returnScene);
        };

        resume.on('pointerdown', () => {
            doResume();
        }); // resume game on click

        settings.on('pointerdown', () => {
            this.scene.stop();
            this.scene.launch('SettingsScene', {
                fromPause: true,
                returnScene: this.returnScene,
            });
        }); // open settings on click, passing info that we came from pause menu

        menu.on('pointerdown', () => {
            if(globalMusic){
                globalMusic.stop(); // stop the music when returning to menu
                this.registry.remove('music'); // clear the music from the registry so it doesn't accidentally get resumed later
            }
            this.time.delayedCall(100, () => {
                const parentScene = this.scene.get(this.returnScene);
                if (parentScene && typeof (parentScene as any).endRun === 'function') {
                    (parentScene as any).endRun();
                }
                this.scene.stop(this.returnScene);
                this.scene.stop();
                this.scene.start('MenuScene');
            });
        }); // return to main menu on click, calling endRun() on the game scene then navigating to menu

        this.input.keyboard?.on('keydown-ESC',() => {
            doResume();
        }); // allow resuming with ESC key as well

    }
}