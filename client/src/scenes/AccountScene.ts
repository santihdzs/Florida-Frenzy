// Santiago Hernandez - A01787550
// heavily used phaser docs for DOM overlay (https://newdocs.phaser.io/docs/3.87.0)
// also used AI assistance on some parts (labeled)

import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';

// import utils for auth, api calls, bool session check
import {
  isLoggedIn,
  getPlayer, // devuelve player object de localStorage
  changeUsername,
  changeEmail,
  changePassword,
  deleteMyAccount,
} from '../utils/auth.js';

import { transitionTo } from '../utils/sceneTransition.js';
import { translations } from '../utils/translations.ts';

export class AccountScene extends Phaser.Scene {
  private fromPause   = false; // check whether scene was started form pause, to know where back button should return
  private returnScene = 'MenuScene';
  private confirmDom?: Phaser.GameObjects.DOMElement; // stored in class to call shutdown() for clearing scene
  private t: Record<string, any> = {}; // translation table, 'any' since some entries are dynamic (like acc_current_user(name)) 

  constructor() {
    super({ key: 'AccountScene' });
  }

  // pass previous scene data
  init(data: { fromPause?: boolean; returnScene?: string }) {
    this.fromPause   = data.fromPause   ?? false;
    this.returnScene = data.returnScene ?? 'MenuScene';
  }

  // image preload if not already cached
  preload() {
    if (!this.textures.exists('title-background')) {
      this.load.image('title-background', titleBackground);
    }
  }

  // builds enture acc scene
  create() {
    //fade, cache canvas dimensions for layout
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // get current language for translations, fallback to eng if no lang in phaser registry
    const langKey = this.registry.get('language') || 'en';
    this.t = translations[langKey];

    // render bg and overlay for ui
    this.add.image(cx, cy, 'title-background');
    this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0);

    // text style for all labels
    const base = {
      fontFamily: 'Impact, Arial black, sans-serif',
      stroke: '#000000',
      strokeThickness: 2,
    };

    //title
    this.add.text(cx, 46, this.t.acc_title, {
      ...base, fontSize: '36px', color: '#c2baba',
    }).setOrigin(0.5);

    // back button in upper left corner
    this.add.text(80, 60, '< ' + this.t.back, {
      ...base, fontSize: '22px', color: '#888888',
    }).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true }) // show pointer on hover
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#888888'); })
      .on('pointerdown', () => {
        transitionTo(this, 'SettingsScene', { fromPause: this.fromPause, returnScene: this.returnScene });
      });

      // guard, if player isn't logged in, show message, end before creating other panels
    if (!isLoggedIn()) {
      this.add.text(cx, cy, this.t.acc_not_logged, {
        ...base, fontSize: '22px', color: '#888888',
      }).setOrigin(0.5);
      return;
    }

    // get cached player data and display existing username
    const player = getPlayer();
    const currentUsername = String(player?.username ?? '');

    // inline css (used AI for form design and build below) - santi
    const inp   = 'width:100%;box-sizing:border-box;padding:7px 10px;font-size:14px;background:#1a1a2e;color:#e0e0e0;border:1px solid #555;border-radius:4px;font-family:Arial,sans-serif;margin-bottom:5px;';
    const fbDiv = 'font-size:12px;min-height:15px;margin-top:3px;font-family:Arial,sans-serif;';
    const greenBtn = 'padding:6px 16px;border-radius:4px;font-family:Impact,sans-serif;font-size:14px;cursor:pointer;background:#1a3a1a;color:#88ff88;border:1px solid #4a7a4a;';
    const redBtn   = 'padding:6px 16px;border-radius:4px;font-family:Impact,sans-serif;font-size:14px;cursor:pointer;background:#3a1a1a;color:#ff8888;border:1px solid #7a3a3a;';
    const greyBtn  = 'padding:6px 16px;border-radius:4px;font-family:Impact,sans-serif;font-size:14px;cursor:pointer;background:#2a2a2a;color:#aaaaaa;border:1px solid #555;';
    const panel    = 'background:rgba(0,0,0,0.45);border:1px solid #333;border-radius:8px;padding:12px 14px;margin-bottom:12px;';
    const hdr      = 'font-family:Impact,sans-serif;font-size:16px;color:#c2baba;letter-spacing:1px;margin-bottom:7px;';

    // build HTML struct for form panels, outer div limits width and enables scrolling
    const html = `
      <div style="width:380px;max-height:560px;overflow-y:auto;">
        <div style="${panel}">
          <div style="${hdr}">${this.t.acc_hdr_username}</div>
          <div style="font-size:11px;color:#777;margin-bottom:5px;font-family:Arial,sans-serif;">${this.t.acc_current_user(currentUsername)}</div>
          <input type="text" id="acc-username" placeholder="${this.t.acc_ph_username}" minlength="3" maxlength="30" style="${inp}">
          <button id="btn-username" style="${greenBtn}">${this.t.acc_btn_save}</button>
          <div id="fb-username" style="${fbDiv}"></div>
        </div>
        <div style="${panel}">
          <div style="${hdr}">${this.t.acc_hdr_email}</div>
          <input type="email" id="acc-email" placeholder="${this.t.acc_ph_email}" style="${inp}">
          <button id="btn-email" style="${greenBtn}">${this.t.acc_btn_save}</button>
          <div id="fb-email" style="${fbDiv}"></div>
        </div>
        <div style="${panel}">
          <div style="${hdr}">${this.t.acc_hdr_password}</div>
          <input type="password" id="acc-cur-pw" placeholder="${this.t.acc_ph_cur_pw}" style="${inp}">
          <input type="password" id="acc-new-pw" placeholder="${this.t.acc_ph_new_pw}" style="${inp}">
          <button id="btn-pw" style="${greenBtn}">${this.t.acc_btn_save}</button>
          <div id="fb-pw" style="${fbDiv}"></div>
        </div>
        <div style="${panel}border-color:#5a1a1a;background:rgba(60,0,0,0.35);">
          <div style="${hdr}color:#ff8888;">${this.t.acc_hdr_danger}</div>
          <input type="password" id="acc-del-pw" placeholder="${this.t.acc_ph_del_pw}" style="${inp}display:none;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <button id="btn-delete"      style="${redBtn}">${this.t.acc_btn_delete}</button>
            <button id="btn-del-confirm" style="${redBtn}display:none;">${this.t.acc_btn_confirm}</button>
            <button id="btn-del-cancel"  style="${greyBtn}display:none;">${this.t.acc_btn_cancel}</button>
          </div>
          <div id="fb-delete" style="${fbDiv}"></div>
        </div>
      </div>`;

      //mounting HTML as a phaser DOM element
    const domEl = this.add.dom(cx, Math.round(cy + 35)).createFromHTML(html);

    // click listener, all button clicks pile up here and are dispatched by element id
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

    // cleanup, phaser fires shutdwon when the scene is stopped / replaced
    this.events.on('shutdown', () => {
      this.confirmDom?.destroy();
      this.confirmDom = undefined;
      // re enable phaser keyboard plugin, since DOM inputs can disable it
      const kb = (this.game as any).input?.keyboard;
      if (kb) kb.enabled = true;
    });
  }

  // wrapper so async function handlers can give user instant feedback 
  private fb(id: string, msg: string, ok: boolean): void {
    // look up feedback div, bail if not mounted
    const el = document.getElementById(id);
    if (!el) return;

    // set message, color indicates success
    el.textContent = msg;
    (el as HTMLElement).style.color = ok ? '#88ff88' : '#ff6666';
  }

  // read and validate username input, call changeUsername
  private async doUsernameChange(): Promise<void> {
    // read and trim username input
    const input = document.getElementById('acc-username') as HTMLInputElement | null;
    const val = input?.value.trim() ?? '';
    // client side validation, username must be at least 3 chars long
    if (val.length < 3) { this.fb('fb-username', this.t.acc_err_user_short, false); return; }
    //try-catch to attempt api call, catches server validation or network errors (AI helped here)
    try {
      await changeUsername(val);
      this.fb('fb-username', this.t.acc_msg_user_ok, true); // show success and reset input field
      if (input) input.value = '';
    } catch (err) {
      // try to use server error messaage, fallback to string
      this.fb('fb-username', err instanceof Error ? err.message : this.t.acc_msg_fail, false);
    }
  }

  // reads and validates email input, calls changeEmail api
  private async doEmailChange(): Promise<void> {
    // read and trim val
    const input = document.getElementById('acc-email') as HTMLInputElement | null;
    const val = input?.value.trim() ?? '';
    // validate email, needs to hve @ and be at least 5 chars long
    if (!val.includes('@') || val.length < 5) { this.fb('fb-email', this.t.acc_err_email_invalid, false); return; }
    // try-catch just like the username one (AI helped)
    try {
      await changeEmail(val);
      this.fb('fb-email', this.t.acc_msg_email_ok, true);
      if (input) input.value = '';
    } catch (err) {
      this.fb('fb-email', err instanceof Error ? err.message : this.t.acc_msg_fail, false);
    }
  }

  // read both pswd inputs, validates, calls changePassword
  private async doPasswordChange(): Promise<void> {
    // read both password fields
    const cur = (document.getElementById('acc-cur-pw') as HTMLInputElement | null)?.value ?? '';
    const nw  = (document.getElementById('acc-new-pw') as HTMLInputElement | null)?.value ?? '';
    // current cant be empty
    if (!cur) { this.fb('fb-pw', this.t.acc_err_pw_current, false); return; }
    // new pwd has min lenght of 6 chars
    if (nw.length < 6) { this.fb('fb-pw', this.t.acc_err_pw_short, false); return; }

    // another try catch, AI helped here
    try {
      // pass both pwds, server verifies current one
      await changePassword(cur, nw);
      this.fb('fb-pw', this.t.acc_msg_pw_ok, true);
      // clear fields
      const curEl = document.getElementById('acc-cur-pw') as HTMLInputElement | null;
      const newEl = document.getElementById('acc-new-pw') as HTMLInputElement | null;
      if (curEl) curEl.value = '';
      if (newEl) newEl.value = '';
    } catch (err) {
      this.fb('fb-pw', err instanceof Error ? err.message : this.t.acc_msg_fail, false);
    }
  }

  // reveals fields and buttons for the acc deletion flow
  private showDeleteEntry(): void {
    // locate interactive elements inside the panel
    const pwEl      = document.getElementById('acc-del-pw')      as HTMLElement | null;
    const btnDel    = document.getElementById('btn-delete')       as HTMLElement | null;
    const btnConf   = document.getElementById('btn-del-confirm')  as HTMLElement | null;
    const btnCancel = document.getElementById('btn-del-cancel')   as HTMLElement | null;

    // show pwd input and clear any stale vals
    if (pwEl)      { pwEl.style.display = 'block'; (pwEl as HTMLInputElement).value = ''; }

    // swap butttons, hides delete, shows confirm and cancel
    if (btnConf)   btnConf.style.display   = 'inline-block';
    if (btnCancel) btnCancel.style.display = 'inline-block';
    if (btnDel)    btnDel.style.display    = 'none';

    // clear any previous feedback msg
    this.fb('fb-delete', '', true);
  }

  // hides pwd field and restores original delte button
  // mirrors showDeleteEntry() in reverse
  private hideDeleteEntry(): void {
    const pwEl      = document.getElementById('acc-del-pw')     as HTMLElement | null;
    const btnDel    = document.getElementById('btn-delete')      as HTMLElement | null;
    const btnConf   = document.getElementById('btn-del-confirm') as HTMLElement | null;
    const btnCancel = document.getElementById('btn-del-cancel')  as HTMLElement | null;

    // hide pwd input and secondary btns
    if (pwEl)      pwEl.style.display      = 'none';
    if (btnConf)   btnConf.style.display   = 'none';
    if (btnCancel) btnCancel.style.display = 'none';
    // restore delte acc button
    if (btnDel)    btnDel.style.display    = 'inline-block';
    // clear any leftover msg
    this.fb('fb-delete', '', true);
  }

  // show full-screen DOM asking user to confirm deletion
  // AI did this overlay part entirely
  private showDeleteConfirm(): void {
    // read pwd
    const pw = (document.getElementById('acc-del-pw') as HTMLInputElement | null)?.value ?? '';
    // doesnt show DOM modal if pwd field is empty
    if (!pw) { this.fb('fb-delete', this.t.acc_err_pw_current, false); return; }

    // cache dimensions to calculate overlay
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
            ${this.t.acc_modal_title}
          </div>
          <div style="font-family:Arial,sans-serif;font-size:16px;color:#cccccc;margin-bottom:26px;line-height:1.6;">
            ${this.t.acc_modal_body}
          </div>
          <div style="display:flex;gap:16px;justify-content:center;">
            <button id="dlg-yes" style="
              padding:10px 28px;background:#8b0000;color:#fff;
              border:1px solid #cc0000;border-radius:4px;
              font-family:Impact,sans-serif;font-size:18px;cursor:pointer;
            ">${this.t.acc_btn_delete_big}</button>
            <button id="dlg-no" style="
              padding:10px 28px;background:#1a3a1a;color:#fff;
              border:1px solid #4a7a4a;border-radius:4px;
              font-family:Impact,sans-serif;font-size:18px;cursor:pointer;
            ">${this.t.acc_btn_cancel}</button>
          </div>
        </div>
      </div>`;

      // mount modal as phaser DOM element, centered
    this.confirmDom = this.add.dom(cx, cy).createFromHTML(html);

    // wire click listener from event delegation on outer div
    this.confirmDom.addListener('click');
    this.confirmDom.on('click', (e: Event) => {
      const id = (e.target as HTMLElement).id;

      // user confirms deletion
      if (id === 'dlg-yes') {
        this.confirmDom?.destroy(); // remove modal before call to prevent double clicks
        this.confirmDom = undefined;
        void this.doDeleteAccount(pw); // actual acc deletion api call
      }

      // user cancels, dismiss modal, reset panel
      if (id === 'dlg-no') {
        this.confirmDom?.destroy();
        this.confirmDom = undefined;
        this.hideDeleteEntry();
      }
    });
  }

  // call deleteMyAccount with pwd, show confirmation message, after wait (1.2s) nav to main menu
  private async doDeleteAccount(password: string): Promise<void> {
    // based on previous server catches, we did this one ourselves
    try {
      // attempt deletion, server validates pwd
      await deleteMyAccount(password);
      // tell user acc was deleted 
      this.fb('fb-delete', this.t.acc_msg_del_ok, true);
      // nav back to menu after pause so user can see message
      this.time.delayedCall(1200, () => { transitionTo(this, 'MenuScene'); });
    } catch (err) {
      // display error
      this.fb('fb-delete', err instanceof Error ? err.message : this.t.acc_msg_fail, false);
      this.hideDeleteEntry(); // reset panel
    }
  }
}
