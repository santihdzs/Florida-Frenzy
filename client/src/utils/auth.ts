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

// API: Create a new run — returns the run id, or null if offline/not logged in
export async function createRun(): Promise<number | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/api/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  const data = await res.json() as { id?: number };
  console.log('createRun result:', data);
  if (!res.ok) return null;
  return data.id ?? null;
}

// API: Complete a run — saves coins, XP, and max level reached to the server
export async function completeRun(
  runId: number,
  coinsEarned: number,
  xpEarned: number,
  maxLevel: number
): Promise<Record<string, unknown> | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/api/runs/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ runId, coinsEarned, xpEarned, maxLevel }),
  });
  const data = await res.json() as { run?: unknown; player?: Record<string, unknown>; message?: string };
  console.log('completeRun response:', data);
  if (!res.ok) throw new Error(data.message ?? 'Failed to complete run');
  if (data.player) setPlayer(data.player);
  return data as Record<string, unknown>;
}

// API: Upgrade player max HP — server determines tier and cost
export async function upgradeHp(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/api/shop/upgrade-hp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  const data = await res.json() as { player?: Record<string, unknown>; message?: string };
  if (!res.ok) throw new Error(data.message ?? 'Upgrade failed');
  if (data.player) setPlayer(data.player);
  return data as Record<string, unknown>;
}

// API: Fetch all runs for the logged-in player
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchMyRuns(): Promise<any[]> {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${API_URL}/api/runs`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any[];
  if (!res.ok) return [];
  return data;
}

// API: Logout (client-side only)
export function logout(): void {
  clearToken();
  window.location.reload();
}
