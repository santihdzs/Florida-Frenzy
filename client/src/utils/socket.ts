import { io, type Socket } from 'socket.io-client';
import { getToken } from './auth.js';

const API_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ?? 'http://localhost:3001';

let _socket: Socket | null = null;

export function getSocket(): Socket {
  // Return the existing socket whether it is connected, connecting, or reconnecting.
  // Never disconnect and recreate mid-session — that would orphan all existing listeners.
  if (_socket) return _socket;

  _socket = io(API_URL, {
    auth: { token: getToken() ?? '' },
    transports: ['websocket'],
    autoConnect: true,
  });
  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

// ── Invite notification overlay ─────────────────────────────────────────────

let _inviteContainer: HTMLDivElement | null = null;
let _inviteDismissTimer: ReturnType<typeof setTimeout> | null = null;

export function initInviteNotifications(
  onAccept: (roomCode: string) => void,
): void {
  const socket = getSocket();

  socket.on('lobby:invite_received', (data: {
    roomCode: string;
    fromUsername: string;
  }) => {
    showInviteNotification(data.fromUsername, data.roomCode, onAccept);
  });
}

function showInviteNotification(
  fromUsername: string,
  roomCode: string,
  onAccept: (code: string) => void,
): void {
  dismissInvite();

  const container = document.createElement('div');
  _inviteContainer = container;
  Object.assign(container.style, {
    position:       'absolute',
    top:            '10px',
    right:          '10px',
    zIndex:         '9999',
    background:     'rgba(0,0,0,0.88)',
    border:         '2px solid #4488ff',
    borderRadius:   '10px',
    padding:        '14px 18px',
    color:          '#ffffff',
    fontFamily:     'Impact, Arial black, sans-serif',
    fontSize:       '16px',
    minWidth:       '260px',
    boxShadow:      '0 4px 18px rgba(0,0,0,0.7)',
    transition:     'opacity 0.3s ease',
    opacity:        '0',
    pointerEvents:  'auto',
  });

  container.innerHTML = `
    <div style="margin-bottom:10px;font-size:14px;color:#aac8ff;">MULTIPLAYER INVITE</div>
    <div style="margin-bottom:12px;"><strong>${escapeHtml(fromUsername)}</strong> invited you to join room <strong>${escapeHtml(roomCode)}</strong></div>
    <div style="display:flex;gap:10px;">
      <button id="ff-invite-accept" style="flex:1;padding:8px;background:#226d1b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:inherit;font-size:15px;font-weight:bold;">JOIN</button>
      <button id="ff-invite-decline" style="flex:1;padding:8px;background:#444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:inherit;font-size:15px;">DECLINE</button>
    </div>
    <div style="margin-top:8px;font-size:11px;color:#666;text-align:right;">Auto-dismisses in 10s</div>
  `;

  // Attach to game container so it scales with the game
  const gameContainer = document.getElementById('game-container') ?? document.body;
  gameContainer.style.position = 'relative';
  gameContainer.appendChild(container);

  requestAnimationFrame(() => { container.style.opacity = '1'; });

  container.querySelector('#ff-invite-accept')?.addEventListener('click', () => {
    dismissInvite();
    onAccept(roomCode);
  });
  container.querySelector('#ff-invite-decline')?.addEventListener('click', () => {
    dismissInvite();
  });

  _inviteDismissTimer = setTimeout(() => dismissInvite(), 10_000);
}

function dismissInvite(): void {
  if (_inviteDismissTimer) { clearTimeout(_inviteDismissTimer); _inviteDismissTimer = null; }
  if (_inviteContainer) {
    _inviteContainer.style.opacity = '0';
    setTimeout(() => { _inviteContainer?.remove(); _inviteContainer = null; }, 300);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
