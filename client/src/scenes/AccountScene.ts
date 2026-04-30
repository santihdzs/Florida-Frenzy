// Santiago Hernandez - A01787550

import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import {
  isLoggedIn,
  getPlayer,
  changeUsername,
  changeEmail,
  changePassword,
  deleteMyAccount,
} from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';

export class AccountScene extends Phaser.Scene {
  private fromPause   = false;
  private returnScene = 'MenuScene';
  private confirmDom?: Phaser.GameObjects.DOMElement;

  constructor() {
    super({ key: 'AccountScene' });
  }

  init(data: { fromPause?: boolean; returnScene?: string }) {
    this.fromPause   = data.fromPause   ?? false;
    this.returnScene = data.returnScene ?? 'MenuScene';
  }

  preload() {
    if (!this.textures.exists('title-background')) {
      this.load.image('title-background', titleBackground);
    }
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    this.add.image(cx, cy, 'title-background');
    this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0);

    const base = {
      fontFamily: 'Impact, Arial black, sans-serif',
      stroke: '#000000',
      strokeThickness: 2,
    };

    this.add.text(cx, 46, 'ACCOUNT SETTINGS', {
      ...base, fontSize: '36px', color: '#c2baba',
    }).setOrigin(0.5);

    this.add.text(80, 60, '< BACK', {
      ...base, fontSize: '22px', color: '#888888',
    }).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#888888'); })
      .on('pointerdown', () => {
        transitionTo(this, 'SettingsScene', { fromPause: this.fromPause, returnScene: this.returnScene });
      });

    if (!isLoggedIn()) {
      this.add.text(cx, cy, 'Log in to manage your account.', {
        ...base, fontSize: '22px', color: '#888888',
      }).setOrigin(0.5);
      return;
    }

    const player = getPlayer();
    const currentUsername = String(player?.username ?? '');

    const inp   = 'width:100%;box-sizing:border-box;padding:7px 10px;font-size:14px;background:#1a1a2e;color:#e0e0e0;border:1px solid #555;border-radius:4px;font-family:Arial,sans-serif;margin-bottom:5px;';
    const fbDiv = 'font-size:12px;min-height:15px;margin-top:3px;font-family:Arial,sans-serif;';
    const greenBtn = 'padding:6px 16px;border-radius:4px;font-family:Impact,sans-serif;font-size:14px;cursor:pointer;background:#1a3a1a;color:#88ff88;border:1px solid #4a7a4a;';
    const redBtn   = 'padding:6px 16px;border-radius:4px;font-family:Impact,sans-serif;font-size:14px;cursor:pointer;background:#3a1a1a;color:#ff8888;border:1px solid #7a3a3a;';
    const greyBtn  = 'padding:6px 16px;border-radius:4px;font-family:Impact,sans-serif;font-size:14px;cursor:pointer;background:#2a2a2a;color:#aaaaaa;border:1px solid #555;';
    const panel    = 'background:rgba(0,0,0,0.45);border:1px solid #333;border-radius:8px;padding:12px 14px;margin-bottom:12px;';
    const hdr      = 'font-family:Impact,sans-serif;font-size:16px;color:#c2baba;letter-spacing:1px;margin-bottom:7px;';

    const html = `
      <div style="width:380px;max-height:560px;overflow-y:auto;">
        <div style="${panel}">
          <div style="${hdr}">CHANGE USERNAME</div>
          <div style="font-size:11px;color:#777;margin-bottom:5px;font-family:Arial,sans-serif;">Current: ${currentUsername}</div>
          <input type="text" id="acc-username" placeholder="New username (min 3 chars)" minlength="3" maxlength="30" style="${inp}">
          <button id="btn-username" style="${greenBtn}">Save</button>
          <div id="fb-username" style="${fbDiv}"></div>
        </div>
        <div style="${panel}">
          <div style="${hdr}">CHANGE EMAIL</div>
          <input type="email" id="acc-email" placeholder="New email address" style="${inp}">
          <button id="btn-email" style="${greenBtn}">Save</button>
          <div id="fb-email" style="${fbDiv}"></div>
        </div>
        <div style="${panel}">
          <div style="${hdr}">CHANGE PASSWORD</div>
          <input type="password" id="acc-cur-pw" placeholder="Current password" style="${inp}">
          <input type="password" id="acc-new-pw" placeholder="New password (min 6 chars)" style="${inp}">
          <button id="btn-pw" style="${greenBtn}">Save</button>
          <div id="fb-pw" style="${fbDiv}"></div>
        </div>
        <div style="${panel}border-color:#5a1a1a;background:rgba(60,0,0,0.35);">
          <div style="${hdr}color:#ff8888;">DANGER ZONE</div>
          <input type="password" id="acc-del-pw" placeholder="Enter password to continue" style="${inp}display:none;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <button id="btn-delete"      style="${redBtn}">Delete Account</button>
            <button id="btn-del-confirm" style="${redBtn}display:none;">Confirm Delete</button>
            <button id="btn-del-cancel"  style="${greyBtn}display:none;">Cancel</button>
          </div>
          <div id="fb-delete" style="${fbDiv}"></div>
        </div>
      </div>`;

    const domEl = this.add.dom(cx, Math.round(cy + 35)).createFromHTML(html);

    domEl.addListener('click');
    domEl.on('click', (e: Event) => {
      const id = (e.target as HTMLElement).id;
      if (id === 'btn-username')    void this.doUsernameChange();
      if (id === 'btn-email')       void this.doEmailChange();
      if (id === 'btn-pw')          void this.doPasswordChange();
      if (id === 'btn-delete')      this.showDeleteEntry();
      if (id === 'btn-del-cancel')  this.hideDeleteEntry();
      if (id === 'btn-del-confirm') this.showDeleteConfirm();
    });

    this.events.on('shutdown', () => {
      this.confirmDom?.destroy();
      this.confirmDom = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kb = (this.game as any).input?.keyboard;
      if (kb) kb.enabled = true;
    });
  }

  private fb(id: string, msg: string, ok: boolean): void {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    (el as HTMLElement).style.color = ok ? '#88ff88' : '#ff6666';
  }

  private async doUsernameChange(): Promise<void> {
    const input = document.getElementById('acc-username') as HTMLInputElement | null;
    const val = input?.value.trim() ?? '';
    if (val.length < 3) { this.fb('fb-username', 'Username must be at least 3 characters.', false); return; }
    try {
      await changeUsername(val);
      this.fb('fb-username', 'Username updated!', true);
      if (input) input.value = '';
    } catch (err) {
      this.fb('fb-username', err instanceof Error ? err.message : 'Update failed.', false);
    }
  }

  private async doEmailChange(): Promise<void> {
    const input = document.getElementById('acc-email') as HTMLInputElement | null;
    const val = input?.value.trim() ?? '';
    if (!val.includes('@') || val.length < 5) { this.fb('fb-email', 'Enter a valid email address.', false); return; }
    try {
      await changeEmail(val);
      this.fb('fb-email', 'Email updated!', true);
      if (input) input.value = '';
    } catch (err) {
      this.fb('fb-email', err instanceof Error ? err.message : 'Update failed.', false);
    }
  }

  private async doPasswordChange(): Promise<void> {
    const cur = (document.getElementById('acc-cur-pw') as HTMLInputElement | null)?.value ?? '';
    const nw  = (document.getElementById('acc-new-pw') as HTMLInputElement | null)?.value ?? '';
    if (!cur) { this.fb('fb-pw', 'Enter your current password.', false); return; }
    if (nw.length < 6) { this.fb('fb-pw', 'New password must be at least 6 characters.', false); return; }
    try {
      await changePassword(cur, nw);
      this.fb('fb-pw', 'Password updated!', true);
      const curEl = document.getElementById('acc-cur-pw') as HTMLInputElement | null;
      const newEl = document.getElementById('acc-new-pw') as HTMLInputElement | null;
      if (curEl) curEl.value = '';
      if (newEl) newEl.value = '';
    } catch (err) {
      this.fb('fb-pw', err instanceof Error ? err.message : 'Update failed.', false);
    }
  }

  private showDeleteEntry(): void {
    const pwEl      = document.getElementById('acc-del-pw')      as HTMLElement | null;
    const btnDel    = document.getElementById('btn-delete')       as HTMLElement | null;
    const btnConf   = document.getElementById('btn-del-confirm')  as HTMLElement | null;
    const btnCancel = document.getElementById('btn-del-cancel')   as HTMLElement | null;
    if (pwEl)      { pwEl.style.display = 'block'; (pwEl as HTMLInputElement).value = ''; }
    if (btnConf)   btnConf.style.display   = 'inline-block';
    if (btnCancel) btnCancel.style.display = 'inline-block';
    if (btnDel)    btnDel.style.display    = 'none';
    this.fb('fb-delete', '', true);
  }

  private hideDeleteEntry(): void {
    const pwEl      = document.getElementById('acc-del-pw')     as HTMLElement | null;
    const btnDel    = document.getElementById('btn-delete')      as HTMLElement | null;
    const btnConf   = document.getElementById('btn-del-confirm') as HTMLElement | null;
    const btnCancel = document.getElementById('btn-del-cancel')  as HTMLElement | null;
    if (pwEl)      pwEl.style.display      = 'none';
    if (btnConf)   btnConf.style.display   = 'none';
    if (btnCancel) btnCancel.style.display = 'none';
    if (btnDel)    btnDel.style.display    = 'inline-block';
    this.fb('fb-delete', '', true);
  }

  private showDeleteConfirm(): void {
    const pw = (document.getElementById('acc-del-pw') as HTMLInputElement | null)?.value ?? '';
    if (!pw) { this.fb('fb-delete', 'Enter your password first.', false); return; }

    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // Phaser centers DOM elements at (x, y) in scene coords — same as LoginScene's form.
    // A W×H div centered at (cx, cy) exactly covers the canvas, with no position:fixed needed.
    const html = `
      <div style="
        width:${W}px;height:${H}px;
        background:rgba(0,0,0,0.82);
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="
          background:#1a1010;
          border:1px solid #8b0000;
          border-radius:12px;
          padding:32px 40px;
          text-align:center;
          max-width:420px;
          box-shadow:0 0 40px rgba(139,0,0,0.4);
        ">
          <div style="font-family:Impact,sans-serif;font-size:26px;color:#ff6666;margin-bottom:14px;">
            Delete Account
          </div>
          <div style="font-family:Arial,sans-serif;font-size:16px;color:#cccccc;margin-bottom:26px;line-height:1.6;">
            This action is permanent and cannot<br>be undone. Are you sure?
          </div>
          <div style="display:flex;gap:16px;justify-content:center;">
            <button id="dlg-yes" style="
              padding:10px 28px;background:#8b0000;color:#fff;
              border:1px solid #cc0000;border-radius:4px;
              font-family:Impact,sans-serif;font-size:18px;cursor:pointer;
            ">DELETE</button>
            <button id="dlg-no" style="
              padding:10px 28px;background:#1a3a1a;color:#fff;
              border:1px solid #4a7a4a;border-radius:4px;
              font-family:Impact,sans-serif;font-size:18px;cursor:pointer;
            ">CANCEL</button>
          </div>
        </div>
      </div>`;

    this.confirmDom = this.add.dom(cx, cy).createFromHTML(html);
    this.confirmDom.addListener('click');
    this.confirmDom.on('click', (e: Event) => {
      const id = (e.target as HTMLElement).id;
      if (id === 'dlg-yes') {
        this.confirmDom?.destroy();
        this.confirmDom = undefined;
        void this.doDeleteAccount(pw);
      }
      if (id === 'dlg-no') {
        this.confirmDom?.destroy();
        this.confirmDom = undefined;
        this.hideDeleteEntry();
      }
    });
  }

  private async doDeleteAccount(password: string): Promise<void> {
    try {
      await deleteMyAccount(password);
      this.fb('fb-delete', 'Account deleted.', true);
      this.time.delayedCall(1200, () => { transitionTo(this, 'MenuScene'); });
    } catch (err) {
      this.fb('fb-delete', err instanceof Error ? err.message : 'Delete failed.', false);
      this.hideDeleteEntry();
    }
  }
}
