import Phaser from 'phaser';
import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.js';
import evTilesUrl from '../assets/maps/everglades.webp';
// Import cropped Clancy image
import clanUrl from '../assets/sprites/Klan.webp';
import music from '../assets/music/Lowland_Hymn.mp3';
import { getPlayer } from '../utils/auth.js';

import christianSheet from '../assets/characters/christian/Christian_SpriteSheet.webp';
import gavinSheet     from '../assets/characters/gavin/Gavin_SpriteSheet.webp';
import gustavSheet    from '../assets/characters/gustav/Gustav_SpriteSheet.webp';
import eddySheet      from '../assets/characters/eddy/Eddy_SpriteSheet.webp';

const TILE = 48;
const WORLD_W = 1200;
const WORLD_H = 800;

const KEY_EV_TILES = 'ev-tiles'; // Everglades tiles key
const KEY_SPR_PROJ = 'spr-projectile';
const KEY_CLAN = 'spr-clan'; // portrait key

const PLAYER_SIZE = 48;
const PLAYER_SPEED = 220;
const PLAYER_SPRINT = 340;

// Character sprite sheet URLs
const CHAR_SHEET_URLS: Partial<Record<string, string>> = {
    christian: christianSheet,
    gavin:     gavinSheet,
    gustav:    gustavSheet,
    eddy:      eddySheet,
};

// Character sprite sheet dimensions and frame cuts
const CHAR_SHEETS = {
    christian: { xCuts: [0, 293, 587, 880],   yCuts: [0, 300, 600, 900,  1200] },
    gavin:     { xCuts: [0, 292, 584, 876],    yCuts: [0, 304, 608, 912,  1216] },
    gustav:    { xCuts: [0, 292, 584, 875],    yCuts: [0, 304, 608, 912,  1216] },
    eddy:      { xCuts: [0, 293, 587, 880],    yCuts: [0, 300, 599, 899,  1198] },
} as const;
type CharSheetKey = keyof typeof CHAR_SHEETS; // character keys type used for type safety when referencing character sprite sheets

// Tutorial projectile constants
const PROJ_SIZE = 8;
const PROJ_SPEED = 420;

export class TutorialScene extends Phaser.Scene {
    private t: Record<string, any> = {}; // Translations for current language
    private px = 100; // Player's x position
    private py = 300; // Player's y position
    private playerImg!: Phaser.GameObjects.Sprite; // Player sprite
    private playerSkin: CharSheetKey = 'christian'; // Default character skin key
    private lastPlayerDir = 'down'; // Track last direction for idle frame orientation
    private clanPortrait!: Phaser.GameObjects.Image; // cutted photo
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; // Arrow keys input
    private instructionText!: Phaser.GameObjects.Text; // Tutorial instruction text in the HUD
    private step = 0; // Tutorial progression step
    private keys!: { // WASD and other keys input
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        SHIFT: Phaser.Input.Keyboard.Key;
        SPACE: Phaser.Input.Keyboard.Key;
    };
    private projectiles: any[] = []; // Active projectiles in the scene
    private dialogContainer!: Phaser.GameObjects.Container; //HUB container // Container for the HUD elements (background, portrait, text)

    constructor() {
        super({ key: 'TutorialScene' }); // Scene key for Phaser's scene management
    }

    init() {
        const equipped = (getPlayer()?.equippedCharacter as string | undefined) ?? 'christian'; // Get equipped character from player data, default to 'christian' if not set or invalid
        this.playerSkin = (equipped in CHAR_SHEETS) ? equipped as CharSheetKey : 'christian'; // Ensure the equipped character is valid, otherwise fallback to 'christian'
        this.lastPlayerDir = 'down'; // Default starting direction for idle frame orientation
    }

    preload() {
        this.load.spritesheet(KEY_EV_TILES, evTilesUrl, { frameWidth: 16, frameHeight: 16 }); // Load tileset with correct frame dimensions
        // Load portrait image
        this.load.image(KEY_CLAN, clanUrl);
        this.load.audio('tutorial-music', music);

        // Load character sprite sheet based on equipped character, with fallback to 'christian' if something goes wrong
        const skinUrl = CHAR_SHEET_URLS[this.playerSkin] ?? christianSheet;
        if (!this.textures.exists(this.playerSkin))
            this.load.image(this.playerSkin, skinUrl);
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0); // Fade in from black at the start of the scene
        if (this.input.keyboard) this.input.keyboard.enabled = true; // Ensure keyboard input is enabled for this scene
        this.generateTextures(); // Generate procedural textures (like projectiles) if they don't already exist

        // Get current language for translations
        const langKey = this.registry.get('language') || 'en';
        this.t = translations[langKey];

        //music
        let currentMusic = this.registry.get('music');
        if (currentMusic && currentMusic.key !== 'tutorial-music') {
            currentMusic.stop();
            currentMusic = null; // Clear reference to old music so we can start the tutorial music
        }
        if (!currentMusic || !currentMusic.isPlaying) {
            const tutorialMusic = this.sound.add('tutorial-music', { loop: true, volume: 0.5 }); // Create and play tutorial music if it's not already playing
            this.registry.set('music', tutorialMusic); // Store reference to the currently playing music in the registry for global access
            tutorialMusic.play(); // Start playing the tutorial music
        }
        
        // background
        this.add.tileSprite(0, 0, WORLD_W, WORLD_H, KEY_EV_TILES, 75)
            .setOrigin(0, 0).setDisplaySize(WORLD_W, WORLD_H).setTileScale(TILE/16);

        // player
        this.sliceCharSheetFrames(this.playerSkin); // Slice the character sprite sheet into individual frames for animation if not already done, ensuring we have the necessary frames for walking animations based on the equipped character skin
        this.createWalkAnimations(this.playerSkin); // Create walking animations for the character if they don't already exist, using the sliced frames from the character sprite sheet to define the animation sequences for each direction (down, left, right, up)
        const playerScale = PLAYER_SIZE / (CHAR_SHEETS[this.playerSkin].xCuts[1] - CHAR_SHEETS[this.playerSkin].xCuts[0]); // Calculate scale factor to ensure the character sprite is rendered at the correct size (48x48) based on the dimensions of the frames in the sprite sheet, allowing for consistent player size regardless of the original sprite sheet dimensions
        this.playerImg = this.add.sprite(this.px, this.py, this.playerSkin, `${this.playerSkin}-walk-down-1`) // Create the player sprite at the initial position with the default idle frame (facing down), using the appropriate frame from the sliced character sprite sheet based on the equipped character skin, and set its origin to the top-left corner for easier positioning, while also setting its depth to ensure it renders above the background and scaling it to match the defined player size for consistent visual appearance in the game world
            .setOrigin(0, 0).setDepth(5).setScale(playerScale); // Set origin to top-left for easier positioning, depth to ensure it renders above the background, and scale to match defined player size for consistent visual appearance regardless of original sprite sheet dimensions
        this.playerImg.play(`${this.playerSkin}-walk-down`); // Start with a walking animation to ensure the player sprite is properly initialized and ready to transition to idle frames when movement stops, using the appropriate animation key based on the equipped character skin and defaulting to the 'down' direction for the initial animation state, which will be updated dynamically in the update loop based on player input for movement direction changes.

        //HUB Clan
        const HUD_X = 800; // X position
        const HUD_Y = 50;  // Y position 
        const HUD_W = 380; // widht
        const HUD_H = 100; // height 

        // Dark styled dialog background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85); // Nearly opaque fill
        bg.fillRoundedRect(0, 0, HUD_W, HUD_H, 12);
        bg.lineStyle(2, 0x8899cc).strokeRoundedRect(0, 0, HUD_W, HUD_H, 12); // Blue border

        // Clan portrait in the corner
        this.clanPortrait = this.add.image(10, 10, KEY_CLAN)
            .setOrigin(0, 0)
            .setDisplaySize(80, 80); // space in the corner

        // Style text
        const textStyle = {
            fontFamily: 'Impact, Arial black, sans-serif',
            fontSize: '18px', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: 270 }
        };

        // instructions text
        this.instructionText = this.add.text(100, 15, this.t.tut_dialog_0, textStyle)
            .setAlign('left');

        // Container grouping the HUD background, portrait, and text
        this.dialogContainer = this.add.container(HUD_X, HUD_Y, [bg, this.clanPortrait, this.instructionText]);
        this.dialogContainer.setScrollFactor(0).setDepth(100);

        this.setupInput();

        // Pause handling
        const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); // Add Escape key for pausing the game, ensuring it doesn't interfere with other input handling in the scene and is properly scoped to this scene's input system to avoid conflicts with other scenes that may also use the Escape key for different purposes.
        escKey?.on('down', () => { // Listen for the 'down' event on the Escape key to trigger the pause functionality, allowing players to pause the game at any time by pressing Escape, while also ensuring that this input handling is properly scoped to this scene to prevent unintended interactions with other scenes that may also listen for the Escape key.
            if (this.scene.isActive('PauseScene')) return;
            this.scene.launch('PauseScene', { returnScene: 'TutorialScene' });
            this.scene.bringToTop('PauseScene');
            this.scene.pause();
        });

        // pause button in the HUD
        const pauseButton = this.add.text(20, 20, this.t.pause, {
            fontSize: '28px',
            color: '#feec00',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { left: 10, right: 10, top: 4, bottom: 4 },
        }).setInteractive({ useHandCursor: true }).setDepth(1000).setScrollFactor(0);

        // Handle pause button click, ensuring it properly triggers the pause functionality without causing unintended interactions with the rest of the scene's input handling, and also checking if the pause scene is already active to prevent multiple instances from being launched if the player clicks the pause button multiple times in quick succession.
        pauseButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation(); // Prevent the click from propagating to the scene and causing unintended interactions
            if (this.scene.isActive('PauseScene')) return;
            this.scene.launch('PauseScene', { returnScene: 'TutorialScene' });
            this.scene.bringToTop('PauseScene'); // Ensure the pause scene is above all others
            this.scene.pause();
        });
    }

    // Setup keyboard and pointer input handling for player movement, shooting, and tutorial progression, ensuring that all input is properly scoped to this scene and does not interfere with other scenes or global input handling in the game, while also providing responsive controls for the player to move around, shoot projectiles, and progress through the tutorial steps based on their actions.
    private setupInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
        }) as {
            W: Phaser.Input.Keyboard.Key;
            A: Phaser.Input.Keyboard.Key;
            S: Phaser.Input.Keyboard.Key;
            D: Phaser.Input.Keyboard.Key;
            SHIFT: Phaser.Input.Keyboard.Key;
            SPACE: Phaser.Input.Keyboard.Key;
        };

        // click shooting tutorial
        this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
            if (this.step >= 2) {
                this.fireProjectile(ptr);
                if (this.step === 2) {
                    this.step = 3;
                    this.clanDialog(this.t.tut_dialog_3, '#00ff88');
                }
            }
        });

        // Continue to next tutorial scene
        this.keys.SPACE.on('down', () => {
            if (this.step >= 3) {
                transitionTo(this, 'TutorialScene2');
            }
        });
    }

    // Update the tutorial dialog text and color, with a brief flash effect to draw attention to the change, ensuring that players are visually cued when the tutorial instructions update as they progress through the steps, while also allowing for different colors to be used for different types of messages (e.g., important instructions in bright colors) to enhance readability and engagement with the tutorial content.
    private clanDialog(text: string, color: string = '#ffffff') {
        this.instructionText.setText(text);
        this.instructionText.setColor(color);

        // Brief flash effect on dialog change
        this.tweens.add({
            targets: this.instructionText,
            alpha: 0.5,
            duration: 80,
            yoyo: true, // Fade out and back in quickly to create a flash effect
            ease: 'Sine.easeInOut'
        });
    }

    // Generate procedural textures for projectiles if they don't already exist, ensuring that we only create the texture once and reuse it for all projectiles to optimize performance and memory usage, while also providing a simple visual representation for the tutorial projectiles that can be easily distinguished from other game elements.
    private generateTextures() {
        if (this.textures.exists(KEY_SPR_PROJ)) return;
        const g = this.make.graphics();
        g.fillStyle(0x44aaff);
        g.fillRect(0, 0, PROJ_SIZE, PROJ_SIZE);
        g.generateTexture(KEY_SPR_PROJ, PROJ_SIZE, PROJ_SIZE);
        g.destroy();
    }

    // Slice the character sprite sheet into individual frames for animation if not already done, ensuring we have the necessary frames for walking animations based on the equipped character skin, which allows us to create smooth walking animations in all four directions (down, left, right, up) by defining the appropriate frames from the sprite sheet for each direction and animation state.
    private sliceCharSheetFrames(skinKey: CharSheetKey) {
        const sheet = CHAR_SHEETS[skinKey];  // Get the frame cut information for the specified character skin, which defines how to slice the sprite sheet into individual frames based on the known layout of the sprite sheet for that character, allowing us to programmatically generate the necessary frames for animations without hardcoding frame coordinates, while also ensuring that we only slice the frames once and reuse them for all animations to optimize performance and memory usage.
        const texture = this.textures.get(skinKey); // Get the texture object for the specified character skin, which allows us to add new frames to the texture based on the sliced sprite sheet, ensuring that we can create animations using these frames without needing to load separate images for each frame, while also checking if the frames already exist to avoid redundant slicing and texture generation, which helps optimize performance and memory usage in the game.
        const dirs = ['down', 'left', 'right', 'up']; // Define the order of directions corresponding to the rows in the sprite sheet, which allows us to systematically slice the frames for each direction based on their position in the sprite sheet, ensuring that we can create consistent animations for walking in all four directions by correctly mapping the frames to their respective animation states.
        for (let row = 0; row < 4; row++) { // Loop through each direction (row) in the sprite sheet, which allows us to slice the frames for walking animations in each direction by iterating through the rows of the sprite sheet, while also ensuring that we only slice the frames if they haven't already been added to the texture to optimize performance and memory usage, and to avoid redundant processing of the sprite sheet.
            for (let col = 0; col < 3; col++) { // Loop through each frame (column) in the current direction row, which allows us to slice the individual frames for the walking animation in the current direction by iterating through the columns of the sprite sheet, while also ensuring that we only slice and add the frames to the texture if they haven't already been added to optimize performance and memory usage, and to avoid redundant processing of the sprite sheet.
                const frameName = `${skinKey}-walk-${dirs[row]}-${col}`; // Construct a unique frame name for the current frame based on the character skin, direction, and frame index, which allows us to easily reference these frames when creating animations without needing to hardcode frame names or coordinates, while also ensuring that the naming convention is consistent and descriptive for better readability and maintainability of the code.
                if (!texture.has(frameName)) { // Check if the frame already exists in the texture to avoid redundant slicing and texture generation, which helps optimize performance and memory usage by ensuring that we only process the sprite sheet once for each frame, while also allowing us to reuse the generated frames for all animations that require them without needing to load separate images for each frame.
                    // Add the frame to the texture based on the calculated coordinates from the sprite sheet, using the defined cuts for the current character skin to determine the correct position and size of each frame, which allows us to programmatically generate the necessary frames for animations without hardcoding frame coordinates, while also ensuring that we correctly slice the frames based on the known layout of the sprite sheet for that character.
                    texture.add(
                        frameName, 0, 
                        sheet.xCuts[col], sheet.yCuts[row],
                        sheet.xCuts[col + 1] - sheet.xCuts[col],
                        sheet.yCuts[row + 1] - sheet.yCuts[row],
                    );
                }
            }
        }
    }

    // Create walking animations for the character if they don't already exist, using the sliced frames from the character sprite sheet to define the animation sequences for each direction (down, left, right, up), which allows us to create smooth walking animations by specifying the appropriate frames for each direction and setting the animation properties such as frame rate and repeat behavior, while also ensuring that we only create the animations once to optimize performance and memory usage by reusing the generated animations for all instances of the character in the scene.
    private createWalkAnimations(skinKey: CharSheetKey) {
        const dirs = ['down', 'left', 'right', 'up']; // Define the order of directions corresponding to the rows in the sprite sheet, which allows us to systematically create the walking animations for each direction based on the frames we sliced from the sprite sheet, ensuring that we can create consistent animations for walking in all four directions by correctly mapping the frames to their respective animation states, while also checking if the animations already exist to avoid redundant creation and optimize performance and memory usage in the game.
        for (const dir of dirs) { // Loop through each direction to create the corresponding walking animation, which allows us to define the animation sequences for walking in each direction by iterating through the defined directions and using the appropriate frames from the sliced sprite sheet, while also ensuring that we only create the animations if they haven't already been created to optimize performance and memory usage, and to avoid redundant processing of the sprite sheet and animation creation.
            const animKey = `${skinKey}-walk-${dir}`; // Construct a unique animation key for the walking animation in the current direction based on the character skin and direction, which allows us to easily reference these animations when playing them without needing to hardcode animation keys or frame sequences, while also ensuring that the naming convention is consistent and descriptive for better readability and maintainability of the code.
            if (!this.anims.exists(animKey)) { // Check if the animation already exists to avoid redundant creation and optimize performance and memory usage, which helps ensure that we only create the animations once for each direction and character skin, while also allowing us to reuse the generated animations for all instances of the character in the scene without needing to recreate them.
                // Create the walking animation for the current direction using the appropriate frames from the sliced sprite sheet, specifying the frame rate and repeat behavior to create a smooth walking animation, while also ensuring that we correctly reference the frames based on the naming convention we used when slicing the sprite sheet, allowing us to create consistent animations for walking in all four directions by correctly mapping the frames to their respective animation states.
                this.anims.create({
                    key: animKey,
                    frames: [
                        { key: skinKey, frame: `${skinKey}-walk-${dir}-0` },
                        { key: skinKey, frame: `${skinKey}-walk-${dir}-1` },
                        { key: skinKey, frame: `${skinKey}-walk-${dir}-2` },
                    ],
                    frameRate: 8,
                    repeat: -1,
                });
            }
        }
    }

    // Handle firing a projectile towards the pointer position when the player clicks, creating a new projectile object with velocity based on the angle to the pointer, and adding it to the list of active projectiles in the scene, while also ensuring that we properly manage the projectile's lifecycle by removing it when it goes out of bounds to optimize performance and memory usage in the game.
    private fireProjectile(ptr: Phaser.Input.Pointer) {
        const cx = this.px + PLAYER_SIZE / 2;
        const cy = this.py + PLAYER_SIZE / 2;
        const raw = Math.atan2(ptr.y - cy, ptr.x - cx);
        const ang = Math.round(raw / (Math.PI / 4)) * (Math.PI / 4);

        const proj = {
            x: cx - PROJ_SIZE / 2,
            y: cy - PROJ_SIZE / 2,
            vx: Math.cos(ang) * PROJ_SPEED,
            vy: Math.sin(ang) * PROJ_SPEED,
            img: this.add.image(cx, cy, KEY_SPR_PROJ).setOrigin(0.5).setDepth(10)
        };
        this.projectiles.push(proj);
    }

    // Update loop to handle player movement, projectile updates, and tutorial progression based on player actions, ensuring that all updates are properly scoped to this scene and do not interfere with other scenes or global game logic, while also providing responsive controls for the player to move around, shoot projectiles, and progress through the tutorial steps based on their actions and interactions with the game world.
    update(_time: number, delta: number) {
        const dt = delta / 1000;
        const speed = this.keys.SHIFT.isDown ? PLAYER_SPRINT : PLAYER_SPEED;

        // Movement
        let dx = 0;
        let dy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx = -speed * dt;
        else if (this.cursors.right.isDown || this.keys.D.isDown) dx = speed * dt;
        if (this.cursors.up.isDown || this.keys.W.isDown) dy = -speed * dt;
        else if (this.cursors.down.isDown || this.keys.S.isDown) dy = speed * dt;

        this.px += dx;
        this.py += dy;
        this.px = Phaser.Math.Clamp(this.px, 0, WORLD_W - PLAYER_SIZE);
        this.py = Phaser.Math.Clamp(this.py, 0, WORLD_H - PLAYER_SIZE);
        this.playerImg.setPosition(this.px, this.py);

        if (dx !== 0 || dy !== 0) {
            const dir = Math.abs(dx) >= Math.abs(dy)
                ? (dx > 0 ? 'right' : 'left')
                : (dy > 0 ? 'down' : 'up');
            if (dir !== this.lastPlayerDir || !this.playerImg.anims.isPlaying) {
                this.lastPlayerDir = dir;
                this.playerImg.play(`${this.playerSkin}-walk-${dir}`, true);
            }
            this.playerImg.anims.timeScale = this.keys.SHIFT.isDown ? 1.8 : 1;
        } else {
            this.playerImg.anims.stop();
            this.playerImg.setFrame(`${this.playerSkin}-walk-${this.lastPlayerDir}-1`);
        }

        // Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.img.setPosition(p.x, p.y);
            if (p.x < 0 || p.x > WORLD_W || p.y < 0 || p.y > WORLD_H) {
                p.img.destroy();
                this.projectiles.splice(i, 1);
            }
        }

        this.updateTutorialProgress();
    }

    // Update the tutorial progression based on the player's position and actions, ensuring that the tutorial steps progress sequentially as the player meets the required conditions (e.g., moving to certain areas, shooting projectiles), while also providing feedback through dialog updates to guide the player through the tutorial content and ensure they understand the mechanics being taught before moving on to the next step.
    private updateTutorialProgress() {
        // Sequential step progression
        if (this.step === 0 && this.px > 350) {
            this.step = 1;
            this.clanDialog(this.t.tut_dialog_1, '#ff8844');
        } 
        else if (this.step === 1 && this.px > 700) {
            this.step = 2;
            this.clanDialog(this.t.tut_dialog_2, '#00ff88');
        } 
    }
}