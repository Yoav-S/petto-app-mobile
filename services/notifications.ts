import { AppState, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { apiPost, apiGet, apiPatch } from './api';

/** Per-user notification switches. `all` is the master gate. */
export interface NotificationPrefs {
  all: boolean;
  reminders: boolean;
  vaccine_updates: boolean;
  health_reminders: boolean;
  email_updates: boolean;
}

export interface ReminderPushData {
  type: 'reminder';
  reminderId?: string;
  petId?: string;
  kind?: 'alert' | 'main';
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  return apiGet<NotificationPrefs>('/notifications/preferences');
}

export async function updateNotificationPrefs(
  patch: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  return apiPatch<NotificationPrefs>('/notifications/preferences', patch);
}

// Expo Go (SDK 53+) removed remote push support. Importing expo-notifications
// there triggers a red LogBox error from its auto-registration side-effect, so
// we must NOT import it eagerly — only lazily, and only outside Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let handlerConfigured = false;
let handledColdStartResponseId: string | null = null;

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function getProjectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as any)?.eas?.projectId ??
    (Constants as any).easConfig?.projectId ??
    undefined
  );
}

function asDataString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

function coercePushRecord(data: unknown): Record<string, unknown> | null {
  if (typeof data === 'string') {
    try {
      return coercePushRecord(JSON.parse(data));
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  let merged: Record<string, unknown> = { ...raw };
  if (typeof raw.body === 'string' && raw.body.startsWith('{')) {
    try {
      merged = { ...merged, ...(JSON.parse(raw.body) as Record<string, unknown>) };
    } catch {
      /* body is plain text */
    }
  } else if (raw.body && typeof raw.body === 'object') {
    merged = { ...merged, ...(raw.body as Record<string, unknown>) };
  }
  if (raw.data && typeof raw.data === 'object') {
    merged = { ...merged, ...(raw.data as Record<string, unknown>) };
  } else if (typeof raw.data === 'string' && raw.data.startsWith('{')) {
    try {
      merged = { ...merged, ...(JSON.parse(raw.data) as Record<string, unknown>) };
    } catch {
      /* ignore */
    }
  }
  return merged;
}

export function parseReminderPushData(
  data: unknown,
  title?: string,
): ReminderPushData | null {
  const raw = coercePushRecord(data);
  if (!raw) return null;
  const reminderId = asDataString(raw.reminderId) ?? asDataString(raw.reminder_id);
  const petId = asDataString(raw.petId) ?? asDataString(raw.pet_id);
  const kindRaw = asDataString(raw.kind);
  let kind = kindRaw === 'alert' || kindRaw === 'main' ? kindRaw : undefined;
  const normalizedTitle = (title ?? asDataString(raw.title) ?? '').trim();
  if (!kind && normalizedTitle === 'Alert') kind = 'alert';
  if (!kind && normalizedTitle === 'Reminder') kind = 'main';
  if (!reminderId && !petId) return null;
  return { type: 'reminder', reminderId, petId, kind };
}

async function ensureNotificationHandler(): Promise<typeof import('expo-notifications') | null> {
  if (isExpoGo) return null;
  const Notifications = await import('expo-notifications');
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Always show both OS pushes (alert + main). The sheet is opened
        // separately, and only for the main reminder.
        return {
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });
    handlerConfigured = true;
  }
  return Notifications;
}

async function resolvePushToken(): Promise<string | null> {
  const Notifications = await ensureNotificationHandler();
  if (!Notifications) return null;
  const Device = await import('expo-device');

  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alert',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#004741',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#004741',
    });
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#004741',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  if (status !== 'granted') return null;

  const projectId = getProjectId();
  const result = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return result.data;
}

/**
 * Register this device for push notifications and sync the timezone.
 *
 * Safe to call on every login. In Expo Go a push token cannot be generated —
 * that's expected; we still send the timezone so reminders are scheduled
 * correctly, and real push delivery starts working automatically once the app
 * runs as a development / production build.
 */
export async function registerForPushNotifications(): Promise<void> {
  const timezone = getDeviceTimezone();
  let token: string | null = null;

  if (!isExpoGo) {
    try {
      token = await resolvePushToken();
      if (__DEV__) {
        console.log('[push] token=' + (token ? token.slice(0, 28) + '…' : 'null') + ' tz=' + timezone);
      }
    } catch (err) {
      console.warn('[push] token unavailable:', err);
    }
  } else if (__DEV__) {
    console.log('[push] Expo Go — skipping remote push token, tz=' + timezone);
  }

  try {
    await apiPost('/notifications/register', {
      token,
      platform: Platform.OS,
      timezone,
    });
    if (__DEV__) console.log('[push] register ok token_saved=' + Boolean(token));
  } catch (err) {
    console.warn('[push] register failed:', err);
  }
}

/**
 * Subscribe to notification taps (and consume a cold-start tap once).
 * Returns an unsubscribe function.
 */
export async function subscribeToReminderNotificationResponses(
  onOpen: (data: ReminderPushData) => void,
): Promise<() => void> {
  const Notifications = await ensureNotificationHandler();
  if (!Notifications) return () => {};

  const deliver = (data: unknown, title?: string) => {
    const parsed = parseReminderPushData(data, title);
    if (!parsed) return;
    onOpen(parsed);
  };

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    deliver(
      response.notification.request.content.data,
      response.notification.request.content.title,
    );
  });

  try {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) {
      const id = last.notification.request.identifier;
      if (handledColdStartResponseId !== id) {
        handledColdStartResponseId = id;
        deliver(last.notification.request.content.data, last.notification.request.content.title);
      }
    }
  } catch (err) {
    if (__DEV__) console.log('[push] last response unavailable:', err);
  }

  return () => {
    sub.remove();
  };
}

/**
 * Foreground delivery (app already open). Alert banners are ignored here so
 * only the main reminder fire opens the Done/Missed queue.
 */
export async function subscribeToForegroundReminderNotifications(
  onReceive: (data: ReminderPushData) => void,
): Promise<() => void> {
  const Notifications = await ensureNotificationHandler();
  if (!Notifications) return () => {};

  const sub = Notifications.addNotificationReceivedListener((notification) => {
    if (AppState.currentState !== 'active') return;
    const parsed = parseReminderPushData(
      notification.request.content.data,
      notification.request.content.title,
    );
    if (!parsed) return;
    if (parsed.kind === 'alert') return;
    onReceive(parsed);
  });

  return () => {
    sub.remove();
  };
}
