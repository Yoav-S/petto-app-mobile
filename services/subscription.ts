import { Alert } from 'react-native';
import { Router } from 'expo-router';
import { apiGet, apiPost, ApiError } from '@/services/api';
import { listReminders } from '@/services/reminders';
import { waitForBottomSheetsToSettle } from '@/components/ui/BottomSheetModal';
import { t } from '@/i18n';
import { invalidateProfile } from '@/services/queryClient';
import { presentUpgradeLimit, type UpgradeKind } from '@/services/upgradeLimit';
import type { Pet, UserProfile, UserSubscription } from '@/types/api';
import {
  isTestStorePurchases,
  openSubscriptionManagement,
} from '@/services/purchases';

export const FREE_MAX_PETS = 1;
export const FREE_MAX_ACTIVE_REMINDERS = 50;

export async function getMyProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>('/users/me');
}

/** Push store-observed auto-renew into Mongo. Does not grant or revoke premium. */
export async function syncSubscriptionFromStore(payload: {
  will_renew: boolean;
  expires_at?: string | null;
  product_id?: string | null;
}): Promise<void> {
  await apiPost('/subscriptions/sync', payload);
  invalidateProfile();
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

export function isPetLocked(pet: Pet | null | undefined): boolean {
  return Boolean(pet?.locked);
}

export function firstIncludedPet(pets: Pet[]): Pet | null {
  return pets.find((p) => !p.locked) ?? pets[0] ?? null;
}

/** Count today + upcoming reminders. Pass only included pets on the free plan. */
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
  _router: Router,
  kind: UpgradeKind,
  options?: { onBeforeNavigate?: () => void },
): void {
  presentUpgradeLimit(kind, options);
}

/** True when the error was shown as an upgrade modal. */
export function presentPremiumLimitFromError(err: unknown): boolean {
  if (!(err instanceof ApiError) || !err.code) return false;
  if (err.code === 'premium_required_reminder') {
    presentUpgradeLimit('reminder');
    return true;
  }
  if (err.code === 'premium_required_pet') {
    presentUpgradeLimit('pet');
    return true;
  }
  if (err.code === 'premium_required_pet_access') {
    presentUpgradeLimit('pet_switch');
    return true;
  }
  return false;
}

export async function openManageSubscriptions(productId?: string | null): Promise<void> {
  try {
    await openSubscriptionManagement(productId);
  } catch {
    Alert.alert(t('common.error'), t('errors.generic'));
  }
}

export function isTestStoreEnvironment(): boolean {
  return isTestStorePurchases();
}

/**
 * Returns false if the user is at the free pet limit (and shows upgrade modal).
 * Premium / under limit → true.
 *
 * Call after closing any parent bottom sheet so Upgrade navigation does not
 * leave a half-dismissed modal underneath.
 */
export async function guardAddPet(
  router: Router,
  petCount: number,
  options?: { onBeforeNavigate?: () => void },
): Promise<boolean> {
  if (petCount < FREE_MAX_PETS) return true;
  if (await fetchIsPremium()) return true;
  await waitForBottomSheetsToSettle();
  showUpgradeAlert(router, 'pet', options);
  return false;
}

/**
 * Returns false if the user is at the free reminder limit.
 */
export async function guardAddReminder(
  router: Router,
  pets: Pet[],
  options?: { onBeforeNavigate?: () => void },
): Promise<boolean> {
  if (await fetchIsPremium()) return true;
  const countable = pets.filter((p) => !p.locked);
  const active = await countActiveReminders(countable.length ? countable : pets);
  if (active < FREE_MAX_ACTIVE_REMINDERS) return true;
  await waitForBottomSheetsToSettle();
  showUpgradeAlert(router, 'reminder', options);
  return false;
}

/** Returns false if this pet is locked on the free plan. */
export async function guardSelectPet(
  router: Router,
  pet: Pet | null | undefined,
  options?: { onBeforeNavigate?: () => void },
): Promise<boolean> {
  if (!isPetLocked(pet)) return true;
  if (await fetchIsPremium()) return true;
  await waitForBottomSheetsToSettle();
  showUpgradeAlert(router, 'pet_switch', options);
  return false;
}
