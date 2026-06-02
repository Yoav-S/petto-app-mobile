import auth from './firebaseAuth';

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const API_PREFIX = '/api/v1';

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${API_PREFIX}${normalizedPath}`;
}

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function handleResponse<T>(res: Response, method: string, path: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${method} ${path} failed: ${res.status}${body ? ` — ${body}` : ''}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(buildUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<T>(res, 'GET', path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res, 'POST', path);
}
