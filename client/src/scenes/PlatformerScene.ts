import Phaser from 'phaser';

// -- Configuration constants --

/** Total level width in pixels. Adjust this to change level length. */
const LEVEL_WIDTH = 4800;

/** Viewport / canvas height (should match GameConfig). */
const VIEW_HEIGHT = 750;

/** Player tunables */
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 300;
const PLAYER_JUMP_VELOCITY = -500;
const PLAYER_GRAVITY = 800;

/** Platform tunables */
const PLATFORM_MIN_WIDTH = 120;
const PLATFORM_MAX_WIDTH = 280;
const PLATFORM_HEIGHT = 20;

/** Generation rules */
const PLATFORM_MIN_GAP_X = 100;  // min horizontal gap between platforms
const PLATFORM_MAX_GAP_X = 260;  // max horizontal gap
const PLATFORM_MIN_Y = 200;      // highest a platform can spawn (pixels from top)
const PLATFORM_MAX_Y = 620;      // lowest a platform can spawn
const PLATFORM_MAX_Y_JUMP = 160; // max vertical distance player can jump to reach next platform
const GROUND_Y = VIEW_HEIGHT - 20; // y-position of ground platform

export class PlatformerScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  constructor() {
    super({ key: 'PlatformerScene' });
  }

  // ------------------------------------------------------------------ //
  //  Lifecycle
  // ------------------------------------------------------------------ //

  create() {
    // World bounds
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, VIEW_HEIGHT);

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.createGround();
    this.generatePlatforms();

    // Player
    this.createPlayer();

    // Collisions
    this.physics.add.collider(this.player, this.platforms);

    // Camera
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, VIEW_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Simple background colour gradient (dark at top, slightly lighter at bottom)
    this.cameras.main.setBackgroundColor('#1a1a2e');
  }

  update() {
    this.handleMovement();
  }

  // ------------------------------------------------------------------ //
  //  Player
  // ------------------------------------------------------------------ //

  private createPlayer() {
    // Draw a red square texture at runtime so we don't need an asset
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xff3333);
    gfx.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
    gfx.generateTexture('player-cube', PLAYER_SIZE, PLAYER_SIZE);
    gfx.destroy();

    // Spawn slightly above ground, near the left side
    this.player = this.physics.add.sprite(100, GROUND_Y - PLAYER_SIZE - 10, 'player-cube');
    this.player.setOrigin(0.5, 1);
    this.player.setBounce(0);
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(PLAYER_GRAVITY);

    // Tighten the physics body to match the square
    this.player.body.setSize(PLAYER_SIZE, PLAYER_SIZE);
    this.player.body.setOffset(0, 0);
  }

  private handleMovement() {
    const onGround = this.player.body.blocked.down;

    // Horizontal
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump (only when on ground)
    if (onGround && (this.cursors.up.isDown || this.wasd.W.isDown || this.cursors.space?.isDown)) {
      this.player.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }

  // ------------------------------------------------------------------ //
  //  Platform generation
  // ------------------------------------------------------------------ //

  /** Full-width ground at the bottom of the level. */
  private createGround() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x444466);
    gfx.fillRect(0, 0, LEVEL_WIDTH, PLATFORM_HEIGHT * 2);
    gfx.generateTexture('ground', LEVEL_WIDTH, PLATFORM_HEIGHT * 2);
    gfx.destroy();

    const ground = this.platforms.create(LEVEL_WIDTH / 2, GROUND_Y + PLATFORM_HEIGHT, 'ground') as Phaser.Physics.Arcade.Sprite;
    ground.refreshBody();
  }

  /**
   * Procedurally generate platforms across the level.
   *
   * Rules:
   *  - Platforms are placed left-to-right with a random horizontal gap.
   *  - Each platform's Y is constrained so the player can reach it from
   *    the previous one (max vertical jump distance).
   *  - Platforms stay within PLATFORM_MIN_Y .. PLATFORM_MAX_Y so nothing
   *    spawns unreachably high or clips the ground.
   *  - A starting platform is always placed near the spawn point.
   */
  private generatePlatforms() {
    // Starting platform near spawn so the player has something to stand on
    this.placePlatform(60, GROUND_Y - 120, 200);

    let cursorX = 300; // start generating after the spawn area
    let prevY = GROUND_Y - 120; // track last platform Y for reachability

    while (cursorX < LEVEL_WIDTH - 200) {
      // Random horizontal gap
      const gapX = Phaser.Math.Between(PLATFORM_MIN_GAP_X, PLATFORM_MAX_GAP_X);
      cursorX += gapX;

      if (cursorX >= LEVEL_WIDTH - 100) break;

      // Random platform width
      const platWidth = Phaser.Math.Between(PLATFORM_MIN_WIDTH, PLATFORM_MAX_WIDTH);

      // Random Y, but constrained to be reachable from the previous platform
      const minY = Math.max(PLATFORM_MIN_Y, prevY - PLATFORM_MAX_Y_JUMP);
      const maxY = Math.min(PLATFORM_MAX_Y, prevY + PLATFORM_MAX_Y_JUMP);
      const platY = Phaser.Math.Between(minY, maxY);

      this.placePlatform(cursorX, platY, platWidth);

      // Advance cursor past this platform
      cursorX += platWidth;
      prevY = platY;
    }
  }

  /** Place a single platform at (x, y) with given width. x is left edge. */
  private placePlatform(x: number, y: number, width: number) {
    const textureKey = `plat-${width}`;

    // Create texture if it doesn't exist yet
    if (!this.textures.exists(textureKey)) {
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0x555588);
      gfx.fillRect(0, 0, width, PLATFORM_HEIGHT);
      gfx.generateTexture(textureKey, width, PLATFORM_HEIGHT);
      gfx.destroy();
    }

    const plat = this.platforms.create(
      x + width / 2,  // Phaser positions from center
      y,
      textureKey
    ) as Phaser.Physics.Arcade.Sprite;
    plat.refreshBody();
  }
}
