import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { apiPost } from './api';

// Expo Go (SDK 53+) removed remote push support. Importing expo-notifications
// there triggers a red LogBox error from its auto-registration side-effect, so
// we must NOT import it eagerly — only lazily, and only outside Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let handlerConfigured = false;

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

async function resolvePushToken(): Promise<string | null> {
  // Lazy import so expo-notifications never loads (and never errors) in Expo Go.
  const Notifications = await import('expo-notifications');
  const Device = await import('expo-device');

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
