import Phaser from 'phaser';
import titleBackground from '../assets/title-background.png';
import { register, login } from '../utils/auth.js';

type Mode = 'login' | 'register';

export class LoginScene extends Phaser.Scene {
    private loginForm!: Phaser.GameObjects.DOMElement;
    private mode: Mode = 'login';
    private errorText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'LoginScene' });
    }

    init(data: object) {
        const d = data as { mode?: Mode };
        this.mode = d.mode ?? 'login';
    }

    preload() {
        this.load.image('title-background', titleBackground);
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const isRegister = this.mode === 'register';

        this.add.image(centerX, centerY, 'title-background');

        // Full-screen overlay — blocks clicks from passing to MenuScene below
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive();

        // Modal container
        const modal = this.add.container(centerX, centerY);

        const bgWidth = 450;
        const bgHeight = isRegister ? 500 : 430;
        const background = this.add.graphics();
        this.drawMetalPlate(background, bgWidth, bgHeight, false);

        const titleLabel = isRegister ? 'SIGN UP' : 'LOG IN';
        const title = this.add.text(0, -bgHeight / 2 + 45, titleLabel, {
            fontFamily: 'Impact, sans-serif',
            fontSize: '32px',
            color: '#c2baba',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        // DOM form — positioned in absolute scene coords (not inside modal container)
        const formHtml = isRegister
            ? `<div style="display:flex;flex-direction:column;gap:12px;width:300px;">
                <input type="text" id="username" placeholder="Username"
                    style="padding:10px;font-size:18px;border:2px solid #999797;background:#222;color:white;font-family:Impact,sans-serif;">
                <input type="email" id="email" placeholder="Email"
                    style="padding:10px;font-size:18px;border:2px solid #999797;background:#222;color:white;font-family:Impact,sans-serif;">
                <input type="password" id="password" placeholder="Password"
                    style="padding:10px;font-size:18px;border:2px solid #999797;background:#222;color:white;font-family:Impact,sans-serif;">
               </div>`
            : `<div style="display:flex;flex-direction:column;gap:12px;width:300px;">
                <input type="email" id="email" placeholder="Email"
                    style="padding:10px;font-size:18px;border:2px solid #999797;background:#222;color:white;font-family:Impact,sans-serif;">
                <input type="password" id="password" placeholder="Password"
                    style="padding:10px;font-size:18px;border:2px solid #999797;background:#222;color:white;font-family:Impact,sans-serif;">
               </div>`;

        const formY = isRegister ? centerY - 45 : centerY - 55;
        this.loginForm = this.add.dom(centerX, formY).createFromHTML(formHtml);

        // Error text (hidden until needed)
        this.errorText = this.add
            .text(centerX, centerY + (isRegister ? 80 : 55), '', {
                fontFamily: 'Impact, sans-serif',
                fontSize: '16px',
                color: '#ff4444',
                stroke: '#000000',
                strokeThickness: 1,
                wordWrap: { width: 380 },
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(200)
            .setVisible(false);

        const btnStyle = {
            fontFamily: 'Impact, sans-serif',
            fontSize: '24px',
            color: '#c2baba',
            stroke: '#000000',
            strokeThickness: 2,
        };
        const smallBtnStyle = {
            fontFamily: 'Impact, sans-serif',
            fontSize: '20px',
            color: '#c2baba',
            stroke: '#000000',
            strokeThickness: 2,
        };

        const submitY   = isRegister ? 115 : 88;
        const cancelY   = isRegister ? 210 : 180;
        const toggleAbsY = centerY + (isRegister ? 162 : 133);

        const submitBtn = this.createButton(0, submitY, 200, 50, isRegister ? 'SIGN UP' : 'LOG IN', () => {
            void this.handleSubmit();
        }, btnStyle);

        const cancelBtn = this.createButton(0, cancelY, 150, 40, 'CANCEL', () => {
            this.scene.stop('LoginScene');
        }, smallBtnStyle);

        // Toggle link — outside modal container so it sits on top and keeps its own position
        const toggleMsg = isRegister
            ? "Already have an account? Log in"
            : "Don't have an account? Sign up";
        const toggleText = this.add
            .text(centerX, toggleAbsY, toggleMsg, {
                fontFamily: 'Impact, sans-serif',
                fontSize: '16px',
                color: '#aaaaaa',
                stroke: '#000000',
                strokeThickness: 1,
            })
            .setOrigin(0.5)
            .setDepth(200)
            .setAlpha(0)
            .setInteractive({ useHandCursor: true });

        toggleText.on('pointerover', () => toggleText.setColor('#ffffff'));
        toggleText.on('pointerout',  () => toggleText.setColor('#aaaaaa'));
        toggleText.on('pointerup',   () => {
            const next: Mode = this.mode === 'login' ? 'register' : 'login';
            this.scene.restart({ mode: next });
        });

        modal.add([background, title, submitBtn, cancelBtn]);

        // Animate in
        modal.setScale(0).setAlpha(0);
        this.loginForm.setScale(0).setAlpha(0);
        this.tweens.add({
            targets: [modal, this.loginForm],
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut',
        });
        this.tweens.add({
            targets: toggleText,
            alpha: 1,
            duration: 300,
            delay: 200,
        });

        this.events.on('shutdown', () => {
            const kb = (this.game as any).input.keyboard;
            if (kb) kb.enabled = true;
        });
        this.events.on('destroy', () => {
            const kb = (this.game as any).input.keyboard;
            if (kb) kb.enabled = true;
        });
    }

    private async handleSubmit(): Promise<void> {
        const emailEl    = document.getElementById('email')    as HTMLInputElement | null;
        const passwordEl = document.getElementById('password') as HTMLInputElement | null;
        const email    = emailEl?.value.trim()    ?? '';
        const password = passwordEl?.value.trim() ?? '';

        if (!email || !password) {
            this.showError('Please fill in all fields.');
            return;
        }

        try {
            if (this.mode === 'register') {
                const usernameEl = document.getElementById('username') as HTMLInputElement | null;
                const username   = usernameEl?.value.trim() ?? '';
                if (!username) {
                    this.showError('Please enter a username.');
                    return;
                }
                await register(username, email, password);
                this.scene.stop('LoginScene');
                this.scene.start('MenuScene');
            } else {
                await login(email, password);
                this.scene.stop('LoginScene');
                this.scene.start('MenuScene');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Something went wrong.';
            this.showError(msg);
        }
    }

    private showError(message: string): void {
        this.errorText.setText(message).setVisible(true);
    }

    createButton(
        x: number, y: number,
        width: number, height: number,
        label: string,
        callback: () => void,
        style: Phaser.Types.GameObjects.Text.TextStyle
    ) {
        const container = this.add.container(x, y);
        const graphics  = this.add.graphics();
        this.drawMetalPlate(graphics, width, height, false);
        const text = this.add.text(0, 0, label, style).setOrigin(0.5);
        container.add([graphics, text]);
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                text.setColor('#226d1b');
                this.tweens.add({ targets: container, scale: 1.03, duration: 100 });
            })
            .on('pointerout', () => {
                text.setColor('#c2baba');
                this.drawMetalPlate(graphics, width, height, false);
                this.tweens.add({ targets: container, scale: 1, duration: 100 });
                text.y = 0;
            })
            .on('pointerdown', () => {
                this.drawMetalPlate(graphics, width, height, true);
                text.y = 4;
            })
            .on('pointerup', () => {
                this.drawMetalPlate(graphics, width, height, false);
                text.y = 0;
                callback();
            });
        return container;
    }

    drawMetalPlate(
        graphics: Phaser.GameObjects.Graphics,
        width: number, height: number,
        pressed: boolean
    ) {
        graphics.clear();
        const w = width; const h = height;
        const x = -w / 2; const y = -h / 2;
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRoundedRect(x + 4, y + 4, w, h, 6);
        graphics.fillStyle(pressed ? 0x222222 : 0x444444, 1);
        graphics.fillRoundedRect(x, y, w, h, 4);
        const topColor    = pressed ? 0x333333 : 0x999999;
        const bottomColor = pressed ? 0x111111 : 0x666666;
        graphics.fillStyle(topColor, 1);
        graphics.fillRect(x + 4, y + 4, w - 8, (h / 2) - 4);
        graphics.fillStyle(bottomColor, 1);
        graphics.fillRect(x + 4, y + (h / 2), w - 8, (h / 2) - 4);
        const rivetColor = pressed ? 0x000000 : 0x222222;
        const offset = 12;
        graphics.fillStyle(rivetColor, 1);
        [[x + offset, y + offset], [x + w - offset, y + offset],
         [x + offset, y + h - offset], [x + w - offset, y + h - offset]].forEach(pos => {
            graphics.fillCircle(pos[0], pos[1], 4);
        });
    }
}
