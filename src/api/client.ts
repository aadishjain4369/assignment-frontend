const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export type ApiUser = { id: string; email: string };

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function registerRequest(
  email: string,
  password: string
): Promise<{ token: string; user: ApiUser }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<{ token?: string; user?: ApiUser; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? `Register failed (${res.status})`);
  }
  if (!data.token || !data.user) {
    throw new Error('Invalid register response');
  }
  return { token: data.token, user: data.user };
}

export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string; user: ApiUser }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<{ token?: string; user?: ApiUser; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? `Login failed (${res.status})`);
  }
  if (!data.token || !data.user) {
    throw new Error('Invalid login response');
  }
  return { token: data.token, user: data.user };
}

export async function apiFetch(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
