import Phaser from 'phaser';
import { PhysicsBody, Platform, updateBody, checkWorldBounds } from '../physics/customPhysics';
import backgroundImg from '../assets/backgrounds/everglades.jpg';

// level geometry
const LEVEL_WIDTH = 4800;
const VIEW_HEIGHT = 750;
const GROUND_Y = VIEW_HEIGHT - 20;
const GROUND_THICKNESS = 40;
const PLATFORM_HEIGHT = 20;

// player
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 300;
const PLAYER_JUMP_VELOCITY = -500;
const PLAYER_GRAVITY = 800;

// floating platform generation
const PLAT_MIN_W = 120;
const PLAT_MAX_W = 280;
const PLAT_MIN_GAP_X = 100;
const PLAT_MAX_GAP_X = 260;
const PLAT_MIN_Y = 200;
const PLAT_MAX_Y = 620;
const PLAT_MAX_Y_JUMP = 160;

// hole generation
const HOLE_CHANCE = 0.25;
const HOLE_MIN_W = 200;
const HOLE_MAX_W = 500;
const HOLE_BRIDGE_PLAT_W = 120;

// shooting
const BULLET_SPEED = 800;
const BULLET_SIZE = 8;
const BULLET_LIFETIME_MS = 2000;

// game loop
const PLATFORMER_LEVELS_PER_DUEL = 3;

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  sprite: Phaser.GameObjects.Rectangle;
  life: number;
}

export class PlatformerScene extends Phaser.Scene {
  private player!: PhysicsBody;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private platforms: Platform[] = [];
  private bullets: Bullet[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private levelCount = 0;
  private levelComplete = false;

  constructor() {
    super({ key: 'PlatformerScene' });
  }

  // -- lifecycle --

  init(data: { levelCount?: number }) {
    this.levelCount = data.levelCount ?? 0;
    this.levelComplete = false;
  }

  preload() {
    this.load.image('platformer-bg', backgroundImg);
  }

  create() {
    // background tiled across the level
    for (let x = 0; x < LEVEL_WIDTH; x += 1200) {
      this.add.image(x + 600, VIEW_HEIGHT / 2, 'platformer-bg');
    }

    // platforms and ground
    this.platforms = [];
    this.buildGround();
    this.generatePlatforms();

    // player
    this.createPlayer();

    // bullets array
    this.bullets = [];

    // camera
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, VIEW_HEIGHT);

    // input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // shooting on left click
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !this.levelComplete) {
        this.shoot(pointer);
      }
    });
  }

  update(time: number, delta: number) {
    if (this.levelComplete) return;

    this.handleMovement(delta);
    this.updateBullets(delta);
    this.updateCamera();

    // Check level completion
    if (this.checkLevelComplete()) {
      this.showLevelComplete();
      return;
    }

    // fell off the map -> game over
    if (this.player.y > VIEW_HEIGHT + 100) {
      this.showGameOver();
    }
  }

  // -- player --

  private createPlayer() {
    this.player = {
      x: 100,
      y: GROUND_Y - PLAYER_SIZE - 10,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      vx: 0,
      vy: 0,
      gravity: PLAYER_GRAVITY,
      onGround: false,
    };

    // Create visual sprite (red square)
    this.playerSprite = this.add.rectangle(
      this.player.x + PLAYER_SIZE / 2,
      this.player.y + PLAYER_SIZE / 2,
      PLAYER_SIZE,
      PLAYER_SIZE,
      0xff3333
    );
  }

  private handleMovement(delta: number) {
    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.vx = -PLAYER_SPEED;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.vx = PLAYER_SPEED;
    } else {
      this.player.vx = 0;
    }

    // Jumping
    if (this.player.onGround && (this.cursors.up.isDown || this.wasd.W.isDown || this.cursors.space?.isDown)) {
      this.player.vy = PLAYER_JUMP_VELOCITY;
      this.player.onGround = false;
    }

    // Update physics
    updateBody(this.player, delta, this.platforms);
    checkWorldBounds(this.player, LEVEL_WIDTH, VIEW_HEIGHT + 200);

    // Sync sprite position
    this.playerSprite.x = this.player.x + PLAYER_SIZE / 2;
    this.playerSprite.y = this.player.y + PLAYER_SIZE / 2;
  }

  // -- shooting --

  private shoot(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const playerCenterX = this.player.x + PLAYER_SIZE / 2;
    const playerCenterY = this.player.y + PLAYER_SIZE / 2;

    const angle = Phaser.Math.Angle.Between(playerCenterX, playerCenterY, worldPoint.x, worldPoint.y);
    const vx = Math.cos(angle) * BULLET_SPEED;
    const vy = Math.sin(angle) * BULLET_SPEED;

    // Create bullet visual
    const bulletSprite = this.add.rectangle(
      playerCenterX,
      playerCenterY,
      BULLET_SIZE,
      BULLET_SIZE,
      0xffff00
    );

    const bullet: Bullet = {
      x: playerCenterX,
      y: playerCenterY,
      vx,
      vy,
      sprite: bulletSprite,
      life: BULLET_LIFETIME_MS,
    };

    this.bullets.push(bullet);
  }

  private updateBullets(delta: number) {
    const dt = delta / 1000;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Update position
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= delta;

      // Update sprite
      bullet.sprite.x = bullet.x;
      bullet.sprite.y = bullet.y;

      // Check platform collision
      let hitPlatform = false;
      for (const plat of this.platforms) {
        if (
          bullet.x >= plat.x &&
          bullet.x <= plat.x + plat.width &&
          bullet.y >= plat.y &&
          bullet.y <= plat.y + plat.height
        ) {
          hitPlatform = true;
          break;
        }
      }

      // Remove if hit platform or expired
      if (hitPlatform || bullet.life <= 0) {
        bullet.sprite.destroy();
        this.bullets.splice(i, 1);
        continue;
      }

      // Check if bullet reached finish zone
      if (bullet.x >= LEVEL_WIDTH - 40) {
        bullet.sprite.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }

  private updateCamera() {
    // Camera follows player
    this.cameras.main.scrollX = Phaser.Math.Clamp(
      this.player.x - this.cameras.main.width / 2,
      0,
      LEVEL_WIDTH - this.cameras.main.width
    );
  }

  // -- ground with holes --

  private buildGround() {
    // build list of holes first, then fill ground around them
    const holes: { x: number; w: number }[] = [];
    let cursor = 600; // safe zone at start
    while (cursor < LEVEL_WIDTH - 600) {
      if (Math.random() < HOLE_CHANCE) {
        const holeW = Phaser.Math.Between(HOLE_MIN_W, HOLE_MAX_W);
        holes.push({ x: cursor, w: holeW });
        cursor += holeW;
      }
      cursor += Phaser.Math.Between(300, 600);
    }

    // place ground segments between holes
    let segStart = 0;
    for (const hole of holes) {
      if (hole.x > segStart) {
        this.placeGroundSegment(segStart, hole.x - segStart);
      }
      // add bridge platforms over big holes
      if (hole.w >= 350) {
        const midX = hole.x + hole.w / 2;
        this.placePlatform(midX - HOLE_BRIDGE_PLAT_W / 2, GROUND_Y - 80, HOLE_BRIDGE_PLAT_W);
      }
      segStart = hole.x + hole.w;
    }
    // final segment to end
    if (segStart < LEVEL_WIDTH) {
      this.placeGroundSegment(segStart, LEVEL_WIDTH - segStart);
    }
  }

  private placeGroundSegment(x: number, width: number) {
    // Create visual ground segment
    const gfx = this.add.graphics();
    gfx.fillStyle(0x444466);
    gfx.fillRect(x, GROUND_Y, width, GROUND_THICKNESS);

    // Add to physics platforms
    this.platforms.push({
      x,
      y: GROUND_Y,
      width,
      height: GROUND_THICKNESS,
    });
  }

  // -- floating platforms --

  private generatePlatforms() {
    this.placePlatform(60, GROUND_Y - 120, 200);

    let cursorX = 300;
    let prevY = GROUND_Y - 120;

    while (cursorX < LEVEL_WIDTH - 200) {
      const gapX = Phaser.Math.Between(PLAT_MIN_GAP_X, PLAT_MAX_GAP_X);
      cursorX += gapX;
      if (cursorX >= LEVEL_WIDTH - 100) break;

      const platWidth = Phaser.Math.Between(PLAT_MIN_W, PLAT_MAX_W);
      const minY = Math.max(PLAT_MIN_Y, prevY - PLAT_MAX_Y_JUMP);
      const maxY = Math.min(PLAT_MAX_Y, prevY + PLAT_MAX_Y_JUMP);
      const platY = Phaser.Math.Between(minY, maxY);

      this.placePlatform(cursorX, platY, platWidth);
      cursorX += platWidth;
      prevY = platY;
    }
  }

  private placePlatform(x: number, y: number, width: number) {
    // Create visual platform
    const gfx = this.add.graphics();
    gfx.fillStyle(0x555588);
    gfx.fillRect(x, y, width, PLATFORM_HEIGHT);

    // Add to physics platforms
    this.platforms.push({
      x,
      y,
      width,
      height: PLATFORM_HEIGHT,
    });
  }

  // -- level complete --

  private checkLevelComplete(): boolean {
    // Check if player reached finish zone at right edge
    return this.player.x >= LEVEL_WIDTH - 40 - PLAYER_SIZE;
  }

  private showLevelComplete() {
    this.levelComplete = true;

    const centerX = this.cameras.main.scrollX + this.cameras.main.width / 2;
    const centerY = this.cameras.main.scrollY + this.cameras.main.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(centerX - 600, centerY - 375, 1200, 750);

    const nextLevel = this.levelCount + 1;

    this.add.text(centerX, centerY - 80, 'Level Complete!', {
      fontSize: '48px',
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 20, `Level ${nextLevel} cleared`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const continueBtn = this.add.text(centerX, centerY + 60, 'Continue', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => continueBtn.setColor('#00ff88'))
      .on('pointerout', () => continueBtn.setColor('#ffffff'))
      .on('pointerdown', () => {
        if (nextLevel % PLATFORMER_LEVELS_PER_DUEL === 0) {
          // every 3 platformer levels -> duel
          this.scene.start('DuelScene', { levelCount: nextLevel });
        } else {
          // next platformer level (regenerated)
          this.scene.start('PlatformerScene', { levelCount: nextLevel });
        }
      });
  }

  // -- game over --

  private showGameOver() {
    this.levelComplete = true;

    const centerX = this.cameras.main.scrollX + this.cameras.main.width / 2;
    const centerY = this.cameras.main.scrollY + this.cameras.main.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(centerX - 600, centerY - 375, 1200, 750);

    this.add.text(centerX, centerY - 80, 'Game Over', {
      fontSize: '48px',
      color: '#ff4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 20, `Reached Level ${this.levelCount + 1}`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const restartBtn = this.add.text(centerX, centerY + 60, 'Play Again', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBtn.setColor('#00ff88'))
      .on('pointerout', () => restartBtn.setColor('#ffffff'))
      .on('pointerdown', () => this.scene.start('PlatformerScene', { levelCount: 0 }));

    const menuBtn = this.add.text(centerX, centerY + 120, 'Menu', {
      fontSize: '24px',
      color: '#888888'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#ffffff'))
      .on('pointerout', () => menuBtn.setColor('#888888'))
      .on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
