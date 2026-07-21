/**
 * purchases.ts — RevenueCat SDK wrapper.
 *
 * Requires EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY and a native
 * development build (IAP does not work in Expo Go).
 */
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type PurchasesPackage,
} from 'react-native-purchases';
import { t } from '@/i18n';

export const PREMIUM_ENTITLEMENT = 'petto_premium';

let configured = false;

function iosKey(): string {
  return (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '').trim();
}

function androidKey(): string {
  return (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '').trim();
}

export function isPurchasesConfigured(): boolean {
  if (Platform.OS === 'ios') return Boolean(iosKey());
  if (Platform.OS === 'android') return Boolean(androidKey());
  return false;
}

/** Configure once per process. Safe to call repeatedly. */
export async function configurePurchases(): Promise<boolean> {
  if (configured) return true;
  if (!isPurchasesConfigured()) return false;

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    const apiKey = Platform.OS === 'ios' ? iosKey() : androidKey();
    Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch (error) {
    console.warn('RevenueCat configure failed:', error);
    return false;
  }
}

/** Identify the Firebase UID so webhooks match Mongo users. */
export async function loginPurchases(firebaseUid: string): Promise<void> {
  if (!(await configurePurchases())) return;
  try {
    await Purchases.logIn(firebaseUid);
  } catch (error) {
    console.warn('RevenueCat logIn failed:', error);
  }
}

export async function logoutPurchases(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.warn('RevenueCat logOut failed:', error);
  }
}

export async function getMonthlyPackage(): Promise<PurchasesPackage | null> {
  if (!(await configurePurchases())) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;
    return (
      current.monthly ??
      current.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ??
      current.availablePackages[0] ??
      null
    );
  } catch (error) {
    console.warn('RevenueCat getOfferings failed:', error);
    return null;
  }
}

export async function getLocalizedPriceString(): Promise<string | null> {
  const pkg = await getMonthlyPackage();
  return pkg?.product.priceString ?? null;
}

export type PurchaseResult =
  | { status: 'success'; premium: boolean }
  | { status: 'cancelled' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

export async function purchasePremium(): Promise<PurchaseResult> {
  if (!(await configurePurchases())) {
    return { status: 'unavailable', message: t('settings.purchase_unavailable') };
  }
  const pkg = await getMonthlyPackage();
  if (!pkg) {
    return { status: 'unavailable', message: t('settings.purchase_unavailable') };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const premium = Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]);
    return { status: 'success', premium };
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code: string }).code
        : null;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { status: 'cancelled' };
    }
    const message =
      error instanceof Error ? error.message : t('errors.generic');
    return { status: 'error', message };
  }
}

export async function restorePremium(): Promise<PurchaseResult> {
  if (!(await configurePurchases())) {
    return { status: 'unavailable', message: t('settings.purchase_unavailable') };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    const premium = Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]);
    return { status: 'success', premium };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : t('errors.generic');
    return { status: 'error', message };
  }
}

export async function hasActivePremiumEntitlement(): Promise<boolean> {
  if (!(await configurePurchases())) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]);
  } catch {
    return false;
  }
}
