import { Platform } from 'react-native';
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

export function parseReminderPushData(data: unknown): ReminderPushData | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  const reminderId = typeof raw.reminderId === 'string' ? raw.reminderId : undefined;
  const petId = typeof raw.petId === 'string' ? raw.petId : undefined;
  if (!reminderId && !petId) return null;
  return { type: 'reminder', reminderId, petId };
}

async function ensureNotificationHandler(): Promise<typeof import('expo-notifications') | null> {
  if (isExpoGo) return null;
  const Notifications = await import('expo-notifications');
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
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
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
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
    } catch (err) {
      if (__DEV__) console.log('[push] token unavailable:', err);
    }
  }

  try {
    await apiPost('/notifications/register', {
      token,
      platform: Platform.OS,
      timezone,
    });
  } catch (err) {
    if (__DEV__) console.log('[push] register failed:', err);
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

  const deliver = (data: unknown) => {
    const parsed = parseReminderPushData(data);
    if (!parsed) return;
    onOpen(parsed);
  };

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    deliver(response.notification.request.content.data);
  });

  try {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) {
      const id = last.notification.request.identifier;
      if (handledColdStartResponseId !== id) {
        handledColdStartResponseId = id;
        deliver(last.notification.request.content.data);
      }
    }
  } catch (err) {
    if (__DEV__) console.log('[push] last response unavailable:', err);
  }

  return () => {
    sub.remove();
  };
}
