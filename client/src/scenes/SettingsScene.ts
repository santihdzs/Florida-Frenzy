import Phaser from 'phaser';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    const { width } = this.cameras.main;
    const centerX = width / 2;

    this.cameras.main.setBackgroundColor('#1a1a1a');

    //text styles
    const titleStyle = {
      fontFamily: 'Impact, sans-serif',
      fontSize: '48px',
      color: '#c2baba',
      stroke: '#000',
      strokeThickness: 4
    };

    const labelStyle = {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
      color: '#e0e0e0'
    };

    // Title
    this.add.text(centerX, 80, 'SETTINGS', titleStyle).setOrigin(0.5);

    // Volume Section
    // Aun no se puede cambiar el volumen globalmente
    let currentVolume = parseFloat(localStorage.getItem('gameVolume') || '1');
    this.sound.volume = currentVolume;

    this.add.text(centerX, 180, 'AUDIO VOLUME', labelStyle).setOrigin(0.5);
    const volDisplay = this.add.text(centerX, 230, `${Math.round(currentVolume * 100)}%`, labelStyle).setOrigin(0.5);

    // Buttons for volume control
    this.createMetalBtn(centerX - 80, 230, 60, 50, '-', () => {
      currentVolume = Math.max(0, currentVolume - 0.1);
      this.updateVolume(currentVolume, volDisplay);
    });

    this.createMetalBtn(centerX + 80, 230, 60, 50, '+', () => {
      currentVolume = Math.min(1, currentVolume + 0.1);
      this.updateVolume(currentVolume, volDisplay);
    });

    //resolution section
    const resolutions = [
      { label: 'Pequeña 1024x640', width: 1024, height: 640 },
      { label: 'Normal 1200x750', width: 1200, height: 750 },
      { label: 'Grande 1440x900', width: 1440, height: 900 }
    ];
    
    let currentResIndex = parseInt(localStorage.getItem('gameResolution') || '1'); // Default to 1200x750

    this.add.text(centerX, 300, 'SCREEN RESOLUTION', labelStyle).setOrigin(0.5);
    
    //buttons for resolution control
    this.createMetalBtn(centerX, 360, 300, 60, resolutions[currentResIndex].label, () => {
      this.input.enabled = false;

      // visual effect
      this.cameras.main.fadeOut(500, 0, 0, 0);

      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          currentResIndex = (currentResIndex + 1) % resolutions.length;
          const target = resolutions[currentResIndex];

          localStorage.setItem('gameResolution', currentResIndex.toString());
          
          this.scale.setGameSize(target.width, target.height);
          this.scene.restart();
      });
    });

    //full screen toggle
    this.add.text(centerX, 440, 'DISPLAY MODE', labelStyle).setOrigin(0.5);

    const initialfslabel = this.scale.isFullscreen ? 'EXIT FULLSCREEN' : 'WINDOWED / FULLSCREEN'; // Set initial label based on current fullscreen state

    // Fullscreen toggle button
    const fullScreenBtn = this.createMetalBtn(centerX, 500, 300, 60, initialfslabel, () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        (fullScreenBtn.getAt(1) as Phaser.GameObjects.Text).setText('WINDOWED / FULLSCREEN'); // Update label when exiting fullscreen
      } else {
        document.getElementById('game-container')?.requestFullscreen();
        (fullScreenBtn.getAt(1) as Phaser.GameObjects.Text).setText('EXIT FULLSCREEN'); // Update label when entering fullscreen
      }
    });

    // Back button
    this.createMetalBtn(centerX, 590, 180, 60, 'BACK', () => {
      this.scene.start('MenuScene');
    });
  }

  updateVolume(val: number, textObj: Phaser.GameObjects.Text) {
    textObj.setText(`${Math.round(val * 100)}%`);
    localStorage.setItem('gameVolume', val.toString());
    // Update the global volume immediately
    this.sound.volume = val;
  }

  // metal button
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
      fontFamily: 'Impact', fontSize: '22px', color: '#fff',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    container.add([graphics, text]);
    container.setSize(w, h).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { draw(true); text.y = 2; })
      .on('pointerup', () => { draw(false); text.y = 0; callback(); })
      .on('pointerout', () => { draw(false); text.y = 0; });

    return container;
  }
}