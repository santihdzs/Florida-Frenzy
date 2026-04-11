import Phaser from 'phaser';

import titleBackground from '../assets/title-background.png'; 

export class LoginScene extends Phaser.Scene {
    private loginForm: Phaser.GameObjects.DOMElement;

    constructor() {
        super({ key: 'LoginScene' });
    }

    preload() {
        this.load.image('title-background', titleBackground);
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        this.add.image(centerX, centerY, 'title-background');

        const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive();
        
        // modal container
        const modal = this.add.container(centerX, centerY);

        //modal background
        const bgWidth = 450;
        const bgHeight = 400;
        const background = this.add.graphics();
        this.drawMetalPlate(background, bgWidth, bgHeight, false);

        //title
        const title = this.add.text(0, -150, 'LOGIN', {
            fontFamily: 'Impact, sans-serif', fontSize: '32px', color: '#c2baba',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        //login form based on DOM element
        this.loginForm = this.add.dom(centerX, centerY - 20).createFromHTML(`
            <div id="login-form-container" style="display: flex; flex-direction: column; gap: 15px; width: 300px;">
                <input type="text" id="username" placeholder="Username" 
                    style="padding: 10px; font-size: 18px; border: 2px solid #999797; background: #222; color: white; font-family: Impact, sans-serif;">
                <input type="text" id="email" placeholder="Email (optional)"
                    style="padding: 10px; font-size: 18px; border: 2px solid #999797; background: #222; color: white; font-family: Impact, sans-serif;">
                <input type="password" id="password" placeholder="Password" 
                    style="padding: 10px; font-size: 18px; border: 2px solid #999797; background: #222; color: white; font-family: Impact, sans-serif;">
            </div>
        `);

        //buttons
        const textStyleBtn = {
            fontFamily: 'Impact, sans-serif', fontSize: '24px', color: '#c2baba',
            stroke: '#000000', strokeThickness: 2
        };

        const loginBtn = this.createButton(0, 100, 200, 50, 'LOGIN', () => {
            const user = (document.getElementById('username') as HTMLInputElement).value;
            if (user.length > 0) {
                this.scene.stop('MenuScene');
                this.scene.start('EvergladesScene', { level: 0, step: 0 });
            } else {
                this.alertLogin();
            }
        }, textStyleBtn);

        const cancelBtn = this.createButton(0, 165, 150, 40, 'CANCEL', () => {
            this.scene.stop('LoginScene');
            this.scene.start('MenuScene');
        }, textStyleBtn);

        // Add all elements to modal container and animate
        modal.add([background, title, loginBtn, cancelBtn]);
        modal.setScale(0).setAlpha(0);
        this.loginForm.setScale(0).setAlpha(0);
        this.tweens.add({
            targets: [modal, this.loginForm],
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    alertLogin() {
        // Hide the login form while showing the alert
        this.loginForm.setVisible(false);

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const alertBox = this.add.container(0, 0);
        alertBox.setDepth(2000); // Ensure it appears above all other elements

        const blocker = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.3)
            .setOrigin(0)
            .setInteractive();

        const content = this.add.container(centerX, centerY);

        const bg = this.add.graphics();
        this.drawMetalPlate(bg, 400, 180, false);
        
        const text = this.add.text(0, -30, 'ERROR: Please enter\na username to continue.', {
            fontFamily: 'Impact, sans-serif', fontSize: '22px', color: '#ff4444',
            stroke: '#000000', strokeThickness: 2, align: 'center'
        }).setOrigin(0.5);

        const okBtn = this.createButton(0, 50, 120, 50, 'OK', () => {
            alertBox.destroy();
            this.loginForm.setVisible(true);
        }, { fontFamily: 'Impact', fontSize: '20px', color: '#c2baba', stroke: '#000000', strokeThickness: 2 });

        content.add([bg, text, okBtn]);
        alertBox.add([blocker, content]);
        
        content.setScale(0).setAlpha(0);
        this.tweens.add({ targets: content, scale: 1, alpha: 1, duration: 250, ease: 'Back.easeOut' });
    }

    //viual button effects and styling
    createButton(x, y, width, height, label, callback, style) {
        const container = this.add.container(x, y);
        const graphics = this.add.graphics();
        this.drawMetalPlate(graphics, width, height, false);
        const text = this.add.text(0, 0, label, style).setOrigin(0.5);
        container.add([graphics, text]);
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => { text.setColor('#226d1b'); this.tweens.add({ targets: container, scale: 1.03, duration: 100 }); })
            .on('pointerout', () => { text.setColor('#c2baba'); this.drawMetalPlate(graphics, width, height, false); this.tweens.add({ targets: container, scale: 1, duration: 100 }); text.y = 0; })
            .on('pointerdown', () => { this.drawMetalPlate(graphics, width, height, true); text.y = 4; })
            .on('pointerup', () => { this.drawMetalPlate(graphics, width, height, false); text.y = 0; callback(); });
        return container;
    }

    drawMetalPlate(graphics, width, height, pressed) {
        graphics.clear();
        const w = width; const h = height; const x = -w / 2; const y = -h / 2;
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRoundedRect(x + 4, y + 4, w, h, 6);
        graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
        graphics.fillRoundedRect(x, y, w, h, 4);
        const topColor = pressed ? 0x333333 : 0x999999;
        const bottomColor = pressed ? 0x111111 : 0x666666;
        graphics.fillStyle(topColor, 1); graphics.fillRect(x + 4, y + 4, w - 8, (h / 2) - 4);
        graphics.fillStyle(bottomColor, 1); graphics.fillRect(x + 4, y + (h / 2), w - 8, (h / 2) - 4);
        const rivetColor = pressed ? 0x000000 : 0x222222;
        const offset = 12;
        [[x+offset, y+offset], [x+w-offset, y+offset], [x+offset, y+h-offset], [x+w-offset, y+h-offset]].forEach(pos => {
            graphics.fillCircle(pos[0], pos[1], 4);
        });
    }
}