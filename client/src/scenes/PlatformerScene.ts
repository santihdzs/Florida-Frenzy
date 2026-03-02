import Phaser from 'phaser';
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

export class PlatformerScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private bullets!: Phaser.Physics.Arcade.Group;
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
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, VIEW_HEIGHT + 200);

    // background tiled across the level
    for (let x = 0; x < LEVEL_WIDTH; x += 1200) {
      this.add.image(x + 600, VIEW_HEIGHT / 2, 'platformer-bg');
    }

    // platforms and ground
    this.platforms = this.physics.add.staticGroup();
    this.buildGround();
    this.generatePlatforms();

    // player
    this.createPlayer();
    this.physics.add.collider(this.player, this.platforms);

    // bullets
    this.bullets = this.physics.add.group({ defaultKey: 'bullet' });
    this.physics.add.collider(this.bullets, this.platforms, (_bullet) => {
      (_bullet as Phaser.Physics.Arcade.Sprite).destroy();
    });

    // camera
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, VIEW_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

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

    // finish zone at right edge
    const finishZone = this.add.zone(LEVEL_WIDTH - 40, VIEW_HEIGHT / 2, 80, VIEW_HEIGHT);
    this.physics.add.existing(finishZone, true);
    this.physics.add.overlap(this.player, finishZone, () => {
      if (!this.levelComplete) this.showLevelComplete();
    });
  }

  update() {
    if (this.levelComplete) return;
    this.handleMovement();

    // fell off the map -> respawn at start
    if (this.player.y > VIEW_HEIGHT + 100) {
      this.player.setPosition(100, GROUND_Y - PLAYER_SIZE - 10);
      this.player.setVelocity(0, 0);
    }
  }

  // -- player --

  private createPlayer() {
    if (!this.textures.exists('player-cube')) {
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0xff3333);
      gfx.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
      gfx.generateTexture('player-cube', PLAYER_SIZE, PLAYER_SIZE);
      gfx.destroy();
    }

    this.player = this.physics.add.sprite(100, GROUND_Y - PLAYER_SIZE - 10, 'player-cube');
    this.player.setOrigin(0.5, 1);
    this.player.setBounce(0);
    this.player.setCollideWorldBounds(false);
    this.player.body.setGravityY(PLAYER_GRAVITY);
    this.player.body.setSize(PLAYER_SIZE, PLAYER_SIZE);
    this.player.body.setOffset(0, 0);
  }

  private handleMovement() {
    const onGround = this.player.body.blocked.down;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
    } else {
      this.player.setVelocityX(0);
    }

    if (onGround && (this.cursors.up.isDown || this.wasd.W.isDown || this.cursors.space?.isDown)) {
      this.player.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }

  // -- shooting --

  private shoot(pointer: Phaser.Input.Pointer) {
    if (!this.textures.exists('bullet')) {
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0xffff00);
      gfx.fillRect(0, 0, BULLET_SIZE, BULLET_SIZE);
      gfx.generateTexture('bullet', BULLET_SIZE, BULLET_SIZE);
      gfx.destroy();
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const playerX = this.player.x;
    const playerY = this.player.y - PLAYER_SIZE / 2;

    const angle = Phaser.Math.Angle.Between(playerX, playerY, worldPoint.x, worldPoint.y);
    const vx = Math.cos(angle) * BULLET_SPEED;
    const vy = Math.sin(angle) * BULLET_SPEED;

    const bullet = this.bullets.create(playerX, playerY, 'bullet') as Phaser.Physics.Arcade.Sprite;
    bullet.setVelocity(vx, vy);
    bullet.body.setAllowGravity(false);

    // auto-destroy after lifetime
    this.time.delayedCall(BULLET_LIFETIME_MS, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  // -- ground with holes --

  private buildGround() {
    if (!this.textures.exists('ground-seg')) {
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0x444466);
      gfx.fillRect(0, 0, 1, GROUND_THICKNESS);
      gfx.generateTexture('ground-seg', 1, GROUND_THICKNESS);
      gfx.destroy();
    }

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
    const textureKey = `ground-${Math.round(width)}`;
    if (!this.textures.exists(textureKey)) {
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0x444466);
      gfx.fillRect(0, 0, width, GROUND_THICKNESS);
      gfx.generateTexture(textureKey, width, GROUND_THICKNESS);
      gfx.destroy();
    }
    const seg = this.platforms.create(
      x + width / 2,
      GROUND_Y + GROUND_THICKNESS / 2,
      textureKey
    ) as Phaser.Physics.Arcade.Sprite;
    seg.refreshBody();
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
    const textureKey = `plat-${width}`;
    if (!this.textures.exists(textureKey)) {
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0x555588);
      gfx.fillRect(0, 0, width, PLATFORM_HEIGHT);
      gfx.generateTexture(textureKey, width, PLATFORM_HEIGHT);
      gfx.destroy();
    }
    const plat = this.platforms.create(
      x + width / 2,
      y,
      textureKey
    ) as Phaser.Physics.Arcade.Sprite;
    plat.refreshBody();
  }

  // -- level complete --

  private showLevelComplete() {
    this.levelComplete = true;
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);

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
}
