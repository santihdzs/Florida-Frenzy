import Phaser from 'phaser';
import titleBackground from '../assets/title-background.png';
import {
  getFriends,
  getFriendRequests,
  searchPlayers,
  sendFriendRequest,
  acceptFriend,
  rejectFriend,
  removeFriend,
  isLoggedIn,
} from '../utils/auth.js';

const SECTION_W = 640;
const PAD = 16;

export class FriendsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FriendsScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);
  }

  create() {
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;

    this.add.image(cx, H / 2, 'title-background').setScrollFactor(0);

    const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Impact, Arial black, sans-serif',
      color: '#c2baba',
      stroke: '#000000',
      strokeThickness: 2,
    };

    this.add.text(cx, 32, 'FRIENDS', {
      ...baseStyle,
      fontSize: '52px',
      color: '#ffd700',
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    this.add.text(cx, H - 36, 'BACK', {
      ...baseStyle,
      fontSize: '36px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#226d1b'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c2baba'); })
      .on('pointerdown', () => {
        this.time.delayedCall(100, () => { this.scene.start('MenuScene'); });
      });

    if (!isLoggedIn()) {
      this.add.text(cx, H / 2, 'Log in to manage friends', {
        ...baseStyle,
        fontSize: '28px',
      }).setOrigin(0.5);
      return;
    }

    void this.buildContent(cx, W, H, baseStyle);

    this.events.on('shutdown', () => {
      const kb = (this.game as any).input.keyboard;
      if (kb) kb.enabled = true;
    });
    this.events.on('destroy', () => {
      const kb = (this.game as any).input.keyboard;
      if (kb) kb.enabled = true;
    });
  }

  private async buildContent(
    cx: number,
    W: number,
    H: number,
    baseStyle: Phaser.Types.GameObjects.Text.TextStyle,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let friends: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requests: any[] = [];
    try {
      [friends, requests] = await Promise.all([getFriends(), getFriendRequests()]);
    } catch { /* offline */ }

    const sectionX = cx - SECTION_W / 2;
    let curY = 80;

    // ── Section 1: Find Players ──────────────────────────────────────────────

    const SEARCH_RESULT_ROWS = 5;
    // height: PAD + title(34) + inputRow(44) + results(5×44) + PAD
    const SEARCH_H = PAD + 34 + 44 + SEARCH_RESULT_ROWS * 44 + PAD;
    const searchSectionY = curY;

    const searchBg = this.add.graphics();
    searchBg.fillStyle(0x000000, 0.5);
    searchBg.fillRoundedRect(sectionX, searchSectionY, SECTION_W, SEARCH_H, 12);

    this.add.text(cx, searchSectionY + PAD + 10, 'Find Players', {
      ...baseStyle,
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const inputRowY   = searchSectionY + PAD + 34 + 22;   // vertical center of input/button row
    const resultsBaseY = searchSectionY + PAD + 34 + 44;  // top of result rows

    this.add.dom(cx - 100, inputRowY).createFromHTML(
      `<input type="text" id="friend-search" placeholder="Search username…"
        style="width:240px;padding:8px 10px;font-size:16px;border:2px solid #999797;
               background:#222;color:white;font-family:Impact,sans-serif;
               outline:none;border-radius:4px;">`
    );

    // Track result objects so we can clear them on each new search
    const resultObjs: Phaser.GameObjects.GameObject[] = [];

    const doSearch = async () => {
      const inputEl = document.getElementById('friend-search') as HTMLInputElement | null;
      const q = inputEl?.value.trim() ?? '';
      if (!q) return;

      resultObjs.forEach(o => { o.destroy(); });
      resultObjs.length = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let results: any[] = [];
      try {
        results = await searchPlayers(q);
      } catch {
        const t = this.add.text(cx, resultsBaseY + 22, 'Search failed', {
          ...baseStyle, fontSize: '16px', color: '#ff4444',
        }).setOrigin(0.5);
        resultObjs.push(t);
        return;
      }

      if (results.length === 0) {
        const t = this.add.text(cx, resultsBaseY + 22, 'No players found', {
          ...baseStyle, fontSize: '16px', color: '#888888',
        }).setOrigin(0.5);
        resultObjs.push(t);
        return;
      }

      results.slice(0, SEARCH_RESULT_ROWS).forEach((p, i) => {
        const ry = resultsBaseY + i * 44 + 22;

        const nameT = this.add.text(sectionX + PAD + 10, ry, String(p.username), {
          ...baseStyle, fontSize: '18px',
        }).setOrigin(0, 0.5);

        const xpT = this.add.text(sectionX + PAD + 200, ry, `XP: ${String(p.maxXp ?? 0)}`, {
          ...baseStyle, fontSize: '15px', color: '#888888',
        }).setOrigin(0, 0.5);

        const errT = this.add.text(cx + 80, ry, '', {
          ...baseStyle, fontSize: '14px', color: '#ff4444',
        }).setOrigin(0, 0.5);

        const { label: addLbl, zone: addZone, gfx: addGfx } =
          this.makeBtn(cx + 262, ry, 90, 32, 'ADD', async () => {
            try {
              await sendFriendRequest(p.id as number);
              addLbl.setText('Sent!');
              addLbl.setColor('#44cc66');
              addZone.disableInteractive();
            } catch (e: unknown) {
              errT.setText(e instanceof Error ? e.message : 'Failed');
            }
          });

        resultObjs.push(nameT, xpT, errT, addLbl, addZone, addGfx);
      });
    };

    this.makeBtn(cx + 190, inputRowY, 110, 36, 'SEARCH', () => { void doSearch(); });

    curY = searchSectionY + SEARCH_H + 14;

    // ── Section 2: Friend Requests ───────────────────────────────────────────

    const REQ_ROW_H = 50;
    const reqCount   = requests.length;
    const reqContentH = reqCount === 0 ? 38 : reqCount * REQ_ROW_H + 10;
    const REQ_H = PAD + 34 + reqContentH + PAD;
    const reqSectionY = curY;

    const reqBg = this.add.graphics();
    reqBg.fillStyle(0x000000, 0.5);
    reqBg.fillRoundedRect(sectionX, reqSectionY, SECTION_W, REQ_H, 12);

    const badge = reqCount > 0 ? ` (${reqCount})` : '';
    this.add.text(cx, reqSectionY + PAD + 10, `Requests${badge}`, {
      ...baseStyle, fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5);

    const reqContentStartY = reqSectionY + PAD + 34;

    if (reqCount === 0) {
      this.add.text(cx, reqContentStartY + 16, 'No pending requests', {
        ...baseStyle, fontSize: '16px', color: '#888888',
      }).setOrigin(0.5);
    } else {
      requests.forEach((req, i) => {
        const ry = reqContentStartY + i * REQ_ROW_H + 24;
        this.add.text(sectionX + PAD + 10, ry, String(req.sender?.username ?? '?'), {
          ...baseStyle, fontSize: '18px',
        }).setOrigin(0, 0.5);
        this.makeBtn(cx + 100, ry, 110, 34, 'ACCEPT', async () => {
          try { await acceptFriend(req.id as number); this.scene.restart(); } catch { /* ignore */ }
        });
        this.makeBtn(cx + 220, ry, 110, 34, 'DENY', async () => {
          try { await rejectFriend(req.id as number); this.scene.restart(); } catch { /* ignore */ }
        });
      });
    }

    curY = reqSectionY + REQ_H + 14;

    // ── Section 3: Friends List ──────────────────────────────────────────────

    const FRIEND_ROW_H = 50;
    const fCount       = friends.length;
    const friendContentH = fCount === 0 ? 38 : fCount * FRIEND_ROW_H + 10;
    const FRIENDS_H = PAD + 34 + friendContentH + PAD;
    const friendsSectionY = curY;

    const friendsBg = this.add.graphics();
    friendsBg.fillStyle(0x000000, 0.5);
    friendsBg.fillRoundedRect(sectionX, friendsSectionY, SECTION_W, FRIENDS_H, 12);

    this.add.text(cx, friendsSectionY + PAD + 10, 'Friends', {
      ...baseStyle, fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5);

    const friendContentStartY = friendsSectionY + PAD + 34;

    if (fCount === 0) {
      this.add.text(cx, friendContentStartY + 16, 'No friends yet', {
        ...baseStyle, fontSize: '16px', color: '#888888',
      }).setOrigin(0.5);
    } else {
      friends.forEach((f, i) => {
        const fy = friendContentStartY + i * FRIEND_ROW_H + 24;
        this.add.text(sectionX + PAD + 10, fy, String(f.username), {
          ...baseStyle, fontSize: '18px',
        }).setOrigin(0, 0.5);
        this.add.text(sectionX + PAD + 240, fy, `XP: ${String(f.maxXp ?? 0)}`, {
          ...baseStyle, fontSize: '15px', color: '#888888',
        }).setOrigin(0, 0.5);
        this.makeBtn(cx + 262, fy, 110, 34, 'REMOVE', async () => {
          try {
            await removeFriend((f.friendshipId as number) ?? (f.id as number));
            this.scene.restart();
          } catch { /* ignore */ }
        });
      });
    }

    curY = friendsSectionY + FRIENDS_H + 14;

    // ── Scroll if content overflows ──────────────────────────────────────────

    const contentHeight = curY + 60;
    if (contentHeight > H) {
      this.cameras.main.setBounds(0, 0, W, contentHeight);
      this.input.on('wheel', (_ptr: unknown, _objs: unknown[], _dx: number, deltaY: number) => {
        this.cameras.main.scrollY = Phaser.Math.Clamp(
          this.cameras.main.scrollY + deltaY * 0.5,
          0,
          contentHeight - H,
        );
      });
      this.add.text(cx, H - 16, '▼ scroll for more', {
        fontFamily: 'Impact, Arial black, sans-serif',
        fontSize: '14px',
        color: '#888888',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
    }
  }

  private makeBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    cb: () => void | Promise<void>,
  ): { label: Phaser.GameObjects.Text; zone: Phaser.GameObjects.Zone; gfx: Phaser.GameObjects.Graphics } {
    const g = this.add.graphics();
    const draw = (pressed: boolean) => {
      g.clear();
      g.fillStyle(0x000000, 0.4);
      g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w, h, 6);
      g.fillStyle(pressed ? 0x222222 : 0x444444, 1);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 4);
      g.fillStyle(pressed ? 0x333333 : 0x999999, 1);
      g.fillRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, h / 2 - 4);
      g.fillStyle(pressed ? 0x111111 : 0x666666, 1);
      g.fillRect(x - w / 2 + 4, y, w - 8, h / 2 - 4);
    };
    draw(false);

    const txt = this.add.text(x, y, label, {
      fontFamily: 'Impact', fontSize: '18px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { draw(true);  txt.setY(y + 2); });
    zone.on('pointerup',   () => { draw(false); txt.setY(y); void cb(); });
    zone.on('pointerout',  () => { draw(false); txt.setY(y); });

    return { label: txt, zone, gfx: g };
  }
}
