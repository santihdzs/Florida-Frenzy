const API_URL = 'http://localhost:3001';

// SHA-256 hash a string (returns hex string)
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Store/retrieve/clear JWT token
export function getToken(): string | null {
  return localStorage.getItem('ff_token');
}
export function setToken(token: string): void {
  localStorage.setItem('ff_token', token);
}
export function clearToken(): void {
  localStorage.removeItem('ff_token');
  localStorage.removeItem('ff_player');
}

// Store/retrieve player data
export function getPlayer(): Record<string, unknown> | null {
  const raw = localStorage.getItem('ff_player');
  return raw ? JSON.parse(raw) as Record<string, unknown> : null;
}
export function setPlayer(player: Record<string, unknown>): void {
  localStorage.setItem('ff_player', JSON.stringify(player));
}

// Check if user is logged in
export function isLoggedIn(): boolean {
  return !!getToken();
}

// Check if user has completed the tutorial before
export function hasCompletedTutorial(): boolean {
  return localStorage.getItem('ff_tutorial_complete') === 'true';
}
export function markTutorialComplete(): void {
  localStorage.setItem('ff_tutorial_complete', 'true');
}

// API: Register
export async function register(
  username: string,
  email: string,
  password: string
): Promise<{ token: string; player: Record<string, unknown> }> {
  const passwordHash = await sha256(password);
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, passwordHash }),
  });
  const data = await res.json() as { token: string; player: Record<string, unknown>; message?: string };
  if (!res.ok) throw new Error(data.message ?? 'Registration failed');
  setToken(data.token);
  setPlayer(data.player);
  return data;
}

// API: Login
export async function login(
  email: string,
  password: string
): Promise<{ token: string; player: Record<string, unknown> }> {
  const passwordHash = await sha256(password);
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passwordHash }),
  });
  const data = await res.json() as { token: string; player: Record<string, unknown>; message?: string };
  if (!res.ok) throw new Error(data.message ?? 'Login failed');
  setToken(data.token);
  setPlayer(data.player);
  return data;
}

// API: Logout (client-side only)
export function logout(): void {
  clearToken();
  window.location.reload();
}
