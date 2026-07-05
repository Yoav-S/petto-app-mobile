import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiPost } from './api';

// How notifications behave while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

/**
 * Register this device for push notifications and sync the timezone.
 *
 * Safe to call on every login. In Expo Go (SDK 54) a push token cannot be
 * generated — that's expected; we still send the timezone so reminders are
 * scheduled correctly, and real push delivery starts working automatically
 * once the app runs as a development / production build.
 */
export async function registerForPushNotifications(): Promise<void> {
  const timezone = getDeviceTimezone();
  let token: string | null = null;

  try {
    if (Device.isDevice) {
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

      if (status === 'granted') {
        const projectId = getProjectId();
        const result = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        token = result.data;
      }
    }
  } catch (err) {
    // Expected in Expo Go — remote push tokens aren't available there.
    if (__DEV__) console.log('[push] token unavailable (likely Expo Go):', err);
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
