import { Alert, Linking, Platform } from 'react-native';
import { Router } from 'expo-router';
import { apiGet } from '@/services/api';
import { listReminders } from '@/services/reminders';
import { t } from '@/i18n';
import type { Pet, UserProfile, UserSubscription } from '@/types/api';

export const FREE_MAX_PETS = 1;
export const FREE_MAX_ACTIVE_REMINDERS = 10;

export async function getMyProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>('/users/me');
}

export function isPremiumPlan(sub?: UserSubscription | null): boolean {
  if (!sub || sub.plan !== 'premium') return false;
  if (!sub.expires_at) return true;
  const expires = new Date(sub.expires_at).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

export async function fetchIsPremium(): Promise<boolean> {
  try {
    const profile = await getMyProfile();
    return isPremiumPlan(profile.subscription);
  } catch {
    return false;
  }
}

/** Count today + upcoming reminders across all owned pets. */
export async function countActiveReminders(pets: Pet[]): Promise<number> {
  let total = 0;
  await Promise.all(
    pets.map(async (pet) => {
      try {
        const [today, upcoming] = await Promise.all([
          listReminders(pet.id, 'today'),
          listReminders(pet.id, 'upcoming'),
        ]);
        total += today.length + upcoming.length;
      } catch {
        // Ignore per-pet failures; server still enforces.
      }
    }),
  );
  return total;
}

export function showUpgradeAlert(
  router: Router,
  kind: 'pet' | 'reminder',
): void {
  const title =
    kind === 'pet' ? t('settings.limit_pet_title') : t('settings.limit_reminder_title');
  const body =
    kind === 'pet' ? t('settings.limit_pet_body') : t('settings.limit_reminder_body');

  Alert.alert(title, body, [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('settings.upgrade'),
      onPress: () => router.push('/settings/subscription' as never),
    },
  ]);
}

export async function openManageSubscriptions(): Promise<void> {
  const url =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(t('common.error'), t('errors.generic'));
  }
}

/**
 * Returns false if the user is at the free pet limit (and shows upgrade alert).
 * Premium / under limit → true.
 */
export async function guardAddPet(router: Router, petCount: number): Promise<boolean> {
  if (petCount < FREE_MAX_PETS) return true;
  if (await fetchIsPremium()) return true;
  showUpgradeAlert(router, 'pet');
  return false;
}

/**
 * Returns false if the user is at the free reminder limit.
 */
export async function guardAddReminder(router: Router, pets: Pet[]): Promise<boolean> {
  if (await fetchIsPremium()) return true;
  const active = await countActiveReminders(pets);
  if (active < FREE_MAX_ACTIVE_REMINDERS) return true;
  showUpgradeAlert(router, 'reminder');
  return false;
}
