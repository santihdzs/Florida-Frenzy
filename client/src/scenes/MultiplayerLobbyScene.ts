import Phaser from 'phaser';
import titleBackground from '../assets/title-background.webp';
import type { Socket } from 'socket.io-client';
import { getSocket, initInviteNotifications } from '../utils/socket.js';
import { getFriends, getPlayer } from '../utils/auth.js';
import { transitionTo } from '../utils/sceneTransition.js';

interface LobbyPlayer {
  playerId: number;
  username: string;
  ready: boolean;
  skin: string;
  alive: boolean;
}

interface LobbyState {
  code: string;
  hostId: number;
  players: LobbyPlayer[];
  state: string;
}

type Friend = { id: number; username: string };

const BASE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Impact, Arial black, sans-serif',
  stroke: '#000000',
  strokeThickness: 2,
};

export class MultiplayerLobbyScene extends Phaser.Scene {
  private myPlayerId = 0;
  private lobbyState: LobbyState | null = null;
  private friends: Friend[] = [];
  private uiGroup: Phaser.GameObjects.GameObject[] = [];
  private codeInput: HTMLInputElement | null = null;
  private socket!: Socket; // captured once in create(); reused everywhere

  constructor() {
    super({ key: 'MultiplayerLobbyScene' });
  }

  preload() {
    this.load.image('title-background', titleBackground);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.myPlayerId = Number(getPlayer()?.id ?? 0);

    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'title-background');

    // Capture the socket once — all buttons use this.socket so getSocket() is
    // never called again in click handlers (avoids the reconnect-on-click bug).
    this.socket = getSocket();

    this.setupSocketListeners();

    // Render the UI immediately — don't wait for getFriends() to resolve first.
    this.renderPreLobbyUI();

    // Load friends in the background; if the user is already in the lobby by
    // the time this resolves, the friends panel will be populated on next render.
    void getFriends()
      .then(data => { this.friends = data as Friend[]; })
      .catch(() => { /* offline — friends panel stays empty */ });

    // Invite notification — accept joins the room directly
    initInviteNotifications((roomCode) => {
      this.socket.emit('lobby:join', { code: roomCode });
    });
  }

  private setupSocketListeners() {
    const s = this.socket;

    // Remove any stale listeners from a previous scene run
    s.off('connected');
    s.off('lobby:created');
    s.off('lobby:state');
    s.off('lobby:left');
    s.off('run:start');
    s.off('error');

    s.on('connected', (data: { playerId: number }) => {
      this.myPlayerId = data.playerId;
    });

    s.on('lobby:created', (state: LobbyState) => {
      this.lobbyState = state;
      this.renderLobbyUI();
    });

    s.on('lobby:state', (state: LobbyState) => {
      this.lobbyState = state;
      this.renderLobbyUI();
    });

    s.on('lobby:left', () => {
      this.lobbyState = null;
      this.renderPreLobbyUI();
    });

    s.on('run:start', (data: {
      grid: number[][];
      enemies: unknown[];
      players: LobbyPlayer[];
      level: number;
      mapKey: string;
    }) => {
      this.removeCodeInput();
      transitionTo(this, 'MultiplayerRunScene', {
        grid:    data.grid,
        enemies: data.enemies,
        players: data.players,
        level:   data.level,
        mapKey:  data.mapKey,
      });
    });

    s.on('error', (msg: string) => {
      this.showToast(msg, '#ff4444');
    });
  }

  private removeCodeInput() {
    this.codeInput?.remove();
    this.codeInput = null;
  }

  private clearUI() {
    this.uiGroup.forEach(o => o.destroy());
    this.uiGroup = [];
    this.removeCodeInput();
  }

  // ── Pre-lobby screen (create / join) ──────────────────────────────────────

  private renderPreLobbyUI() {
    this.clearUI();
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;

    const title = this.add.text(cx, 70, 'MULTIPLAYER', {
      ...BASE, fontSize: '52px', color: '#feec00',
    }).setOrigin(0.5);
    this.uiGroup.push(title);

    // CREATE LOBBY button
    const createBtn = this.addButton(cx, 210, 300, 64, 'CREATE LOBBY', () => {
      if (!this.socket.connected) {
        this.showToast('Connecting to server…', '#aaaaaa');
        return;
      }
      this.socket.emit('lobby:create');
    });
    this.uiGroup.push(...createBtn);

    // Divider
    const divLabel = this.add.text(cx, 305, '─── or join with code ───', {
      ...BASE, fontSize: '18px', color: '#888888',
    }).setOrigin(0.5);
    this.uiGroup.push(divLabel);

    // Code input — positioned using canvas bounding rect so it aligns with
    // the scaled/centered Phaser canvas regardless of page layout.
    const inputEl = document.createElement('input');
    this.codeInput = inputEl;
    const canvas = this.game.canvas;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = rect.width  / W;
    const scaleY = rect.height / H;
    const inputGameY = 355; // game-coordinate Y centre for the input
    Object.assign(inputEl.style, {
      position:     'fixed',
      left:         `${rect.left + cx * scaleX}px`,
      top:          `${rect.top  + inputGameY * scaleY}px`,
      transform:    'translate(-50%, -50%)',
      width:        `${160 * scaleX}px`,
      padding:      `${10 * scaleY}px ${14 * scaleX}px`,
      fontSize:     `${22 * Math.min(scaleX, scaleY)}px`,
      fontFamily:   'Impact, Arial black, sans-serif',
      background:   'rgba(0,0,0,0.75)',
      color:        '#ffffff',
      border:       '2px solid #4488ff',
      borderRadius: '8px',
      textAlign:    'center',
      letterSpacing:'6px',
      textTransform:'uppercase',
      outline:      'none',
      zIndex:       '10',
    });
    inputEl.maxLength = 5;
    inputEl.placeholder = 'XXXXX';
    document.body.appendChild(inputEl);

    const joinBtn = this.addButton(cx, 420, 200, 54, 'JOIN', () => {
      if (!this.socket.connected) {
        this.showToast('Connecting to server…', '#aaaaaa');
        return;
      }
      const code = inputEl.value.toUpperCase().trim();
      if (code.length === 5) {
        this.socket.emit('lobby:join', { code });
      } else {
        this.showToast('Enter a 5-letter room code', '#ff8800');
      }
    });
    this.uiGroup.push(...joinBtn);

    // Back button
    const backBtn = this.addButton(cx, H - 55, 200, 54, 'BACK', () => {
      this.removeCodeInput();
      transitionTo(this, 'MenuScene');
    });
    this.uiGroup.push(...backBtn);
  }

  // ── In-lobby screen ───────────────────────────────────────────────────────

  private renderLobbyUI() {
    if (!this.lobbyState) return;
    this.clearUI();
    const W     = this.cameras.main.width;
    const H     = this.cameras.main.height;
    const cx    = W / 2;
    const state = this.lobbyState;
    const isHost = state.hostId === this.myPlayerId;

    // ── Title row ─────────────────────────────────────────────────────────

    const titleT = this.add.text(cx, 38, 'LOBBY', {
      ...BASE, fontSize: '42px', color: '#feec00',
    }).setOrigin(0.5);
    this.uiGroup.push(titleT);

    const codeLabel = this.add.text(cx, 84, `Room Code: ${state.code}`, {
      ...BASE, fontSize: '26px', color: '#aaccff',
    }).setOrigin(0.5);
    this.uiGroup.push(codeLabel);

    const copyHint = this.add.text(cx, 110, '(share this code with friends)', {
      ...BASE, fontSize: '13px', color: '#666666',
    }).setOrigin(0.5);
    this.uiGroup.push(copyHint);

    // ── Two panels split evenly across the width ───────────────────────────

    const PANEL_TOP = 132;
    const PANEL_H   = H - PANEL_TOP - 100; // leave room for bottom buttons
    const GAP       = 20;
    const PW        = Math.floor((W - 60 - GAP) / 2);  // each panel half width
    const PX        = 30;                               // left panel x
    const FX        = PX + PW + GAP;                   // right panel x

    // Players panel
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.6);
    panelBg.fillRoundedRect(PX, PANEL_TOP, PW, PANEL_H, 12);
    panelBg.lineStyle(2, 0x4488ff, 0.8);
    panelBg.strokeRoundedRect(PX, PANEL_TOP, PW, PANEL_H, 12);
    this.uiGroup.push(panelBg);

    const playersTitle = this.add.text(PX + PW / 2, PANEL_TOP + 22, 'PLAYERS', {
      ...BASE, fontSize: '22px', color: '#ffd700',
    }).setOrigin(0.5);
    this.uiGroup.push(playersTitle);

    const ROW_H = Math.min(70, Math.floor((PANEL_H - 50) / 3));
    state.players.forEach((p, i) => {
      const y = PANEL_TOP + 55 + i * ROW_H;
      const isMe       = p.playerId === this.myPlayerId;
      const isRoomHost = p.playerId === state.hostId;

      const name = this.add.text(PX + 18, y, `${isRoomHost ? '♦ ' : '  '}${p.username}${isMe ? ' (you)' : ''}`, {
        ...BASE, fontSize: '20px', color: isMe ? '#88ddff' : '#c2baba',
      }).setOrigin(0, 0.5);
      this.uiGroup.push(name);

      const readyColor = p.ready ? '#44ff88' : '#ff8844';
      const readyT = this.add.text(PX + PW - 18, y, p.ready ? 'READY' : 'WAITING', {
        ...BASE, fontSize: '18px', color: readyColor,
      }).setOrigin(1, 0.5);
      this.uiGroup.push(readyT);

      if (i < state.players.length - 1) {
        const divG = this.add.graphics();
        divG.lineStyle(1, 0x333333, 0.7);
        divG.lineBetween(PX + 14, y + ROW_H / 2, PX + PW - 14, y + ROW_H / 2);
        this.uiGroup.push(divG);
      }
    });

    if (state.players.length < 3) {
      for (let i = 0; i < 3 - state.players.length; i++) {
        const y = PANEL_TOP + 55 + (state.players.length + i) * ROW_H;
        const emptyT = this.add.text(PX + PW / 2, y, '— waiting for player —', {
          ...BASE, fontSize: '16px', color: '#444444',
        }).setOrigin(0.5);
        this.uiGroup.push(emptyT);
      }
    }

    // Friends panel
    const FW = W - 30 - FX;
    const friendsBg = this.add.graphics();
    friendsBg.fillStyle(0x000000, 0.6);
    friendsBg.fillRoundedRect(FX, PANEL_TOP, FW, PANEL_H, 12);
    friendsBg.lineStyle(2, 0x224466, 0.8);
    friendsBg.strokeRoundedRect(FX, PANEL_TOP, FW, PANEL_H, 12);
    this.uiGroup.push(friendsBg);

    const friendsTitle = this.add.text(FX + FW / 2, PANEL_TOP + 22, 'INVITE FRIENDS', {
      ...BASE, fontSize: '20px', color: '#ffd700',
    }).setOrigin(0.5);
    this.uiGroup.push(friendsTitle);

    if (this.friends.length === 0) {
      const noFriends = this.add.text(FX + FW / 2, PANEL_TOP + PANEL_H / 2, 'No friends yet.\nAdd some in the Friends menu!', {
        ...BASE, fontSize: '15px', color: '#555555', align: 'center',
      }).setOrigin(0.5);
      this.uiGroup.push(noFriends);
    } else {
      const maxShow = 5;
      this.friends.slice(0, maxShow).forEach((f, i) => {
        const y = PANEL_TOP + 56 + i * 52;
        const nameT = this.add.text(FX + 14, y, f.username, {
          ...BASE, fontSize: '17px', color: '#c2baba',
        }).setOrigin(0, 0.5);
        this.uiGroup.push(nameT);

        const alreadyIn = state.players.some(p => p.playerId === f.id);
        const inviteBtns = this.addSmallButton(FX + FW - 14, y, alreadyIn ? 'IN LOBBY' : 'INVITE', alreadyIn ? '#555555' : '#226d1b', () => {
          if (!alreadyIn) {
            this.socket.emit('lobby:invite', { friendId: f.id });
            this.showToast(`Invited ${f.username}`, '#44ff88');
          }
        });
        this.uiGroup.push(...inviteBtns);
      });
    }

    // ── Bottom controls ────────────────────────────────────────────────────

    const BY = H - 52;
    const myPlayer = state.players.find(p => p.playerId === this.myPlayerId);
    const amReady = myPlayer?.ready ?? false;
    const allPlayersReady = state.players.length > 0 && state.players.every(p => p.ready);

    const leaveBtns = this.addButton(120, BY, 160, 52, 'LEAVE', () => {
      this.socket.emit('lobby:leave');
    }, '#3d1a1a');
    this.uiGroup.push(...leaveBtns);

    const readyBtns = this.addButton(cx, BY, 260, 52, amReady ? 'CANCEL READY' : 'READY UP', () => {
      this.socket.emit('lobby:ready', { ready: !amReady });
    }, amReady ? '#224422' : '#1a3d1a');
    this.uiGroup.push(...readyBtns);

    if (isHost) {
      const startColor = allPlayersReady ? '#226d1b' : '#333333';
      const startBtns = this.addButton(W - 140, BY, 220, 52, 'START', () => {
        if (!allPlayersReady) { this.showToast('All players must be ready', '#ff8800'); return; }
        this.socket.emit('lobby:start');
      }, startColor);
      this.uiGroup.push(...startBtns);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private addButton(
    cx: number, cy: number, w: number, h: number, label: string,
    onClick: () => void, bgColor = '#1a1a1a',
  ): Phaser.GameObjects.GameObject[] {
    const bg = this.add.graphics();
    const colorNum = parseInt(bgColor.replace('#', ''), 16);
    bg.fillStyle(colorNum, 1);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    bg.lineStyle(2, 0x888888, 0.6);
    bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);

    const txt = this.add.text(cx, cy, label, {
      ...BASE, fontSize: '22px', color: '#c2baba',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    txt.on('pointerover', () => txt.setColor('#ffffff'));
    txt.on('pointerout',  () => txt.setColor('#c2baba'));
    txt.on('pointerdown', () => {
      this.tweens.add({ targets: txt, scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true });
      onClick();
    });

    return [bg, txt];
  }

  private addSmallButton(
    rightX: number, cy: number, label: string, bgColor: string, onClick: () => void,
  ): Phaser.GameObjects.GameObject[] {
    const w = 84, h = 36;
    const cx = rightX - w / 2;
    const bg = this.add.graphics();
    const colorNum = parseInt(bgColor.replace('#', ''), 16);
    bg.fillStyle(colorNum, 1);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);

    const txt = this.add.text(cx, cy, label, {
      ...BASE, fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    txt.on('pointerdown', () => onClick());
    return [bg, txt];
  }

  private showToast(msg: string, color = '#ffffff') {
    const W  = this.cameras.main.width;
    const cx = W / 2;
    const toast = this.add.text(cx, this.cameras.main.height - 140, msg, {
      ...BASE, fontSize: '18px', color,
      backgroundColor: '#000000cc',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: toast, alpha: 0, y: toast.y - 30,
      delay: 1800, duration: 500,
      onComplete: () => toast.destroy(),
    });
  }

  shutdown() {
    this.clearUI();
    // Remove socket listeners so stale events don't call into a destroyed scene
    if (this.socket) {
      this.socket.off('connected');
      this.socket.off('lobby:created');
      this.socket.off('lobby:state');
      this.socket.off('lobby:left');
      this.socket.off('run:start');
      this.socket.off('error');
    }
  }
}
