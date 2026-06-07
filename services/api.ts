import { Platform } from 'react-native';
import Constants from 'expo-constants';
import auth from './firebaseAuth';

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const API_PREFIX = '/api/v1';

function getExpoHostFromDevRuntime(): string | null {
  const expoHostUri =
    (Constants as any).expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    null;
  if (!expoHostUri || typeof expoHostUri !== 'string') return null;
  return expoHostUri.split(':')[0] ?? null;
}

function getResolvedBaseUrl(): string {
  if (!RAW_BASE_URL) return '';

  // On phones, localhost points to the device itself.
  // In Expo dev, swap localhost with the machine host automatically.
  if (
    Platform.OS !== 'web' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(RAW_BASE_URL)
  ) {
    const host = getExpoHostFromDevRuntime();
    if (host) {
      return RAW_BASE_URL.replace(/\/\/(localhost|127\.0\.0\.1)/i, `//${host}`);
    }
  }
  return RAW_BASE_URL;
}

const BASE_URL = getResolvedBaseUrl();

function buildUrl(path: string): string {
  if (!BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is missing.');
  }
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
  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (BASE_URL.includes('localhost')) {
      throw new Error(
        'Network request failed. On a physical device, localhost points to the phone. Set EXPO_PUBLIC_API_BASE_URL to your computer LAN IP.',
      );
    }
    throw error;
  }
  return handleResponse<T>(res, 'GET', path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (BASE_URL.includes('localhost')) {
      throw new Error(
        'Network request failed. On a physical device, localhost points to the phone. Set EXPO_PUBLIC_API_BASE_URL to your computer LAN IP.',
      );
    }
    throw error;
  }
  return handleResponse<T>(res, 'POST', path);
}

/** Public POST — no Firebase token (register, OTP verify, resend). */
export async function apiPostPublic<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1')) {
      throw new Error(
        'Network request failed. On a physical device, localhost points to the phone. Set EXPO_PUBLIC_API_BASE_URL to your computer LAN IP.',
      );
    }
    throw error;
  }
  return handleResponse<T>(res, 'POST', path);
}
