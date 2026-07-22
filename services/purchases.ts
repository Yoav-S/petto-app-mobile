/**
 * purchases.ts — RevenueCat SDK wrapper.
 *
 * Requires EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY and a native
 * development build (IAP does not work in Expo Go).
 * Test Store keys (test_…) are fine until App Store / Play products are live.
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
export const PREMIUM_PRODUCT_ID = 'sub_premium';

const LOG = '[Subscription]';

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
  if (!isPurchasesConfigured()) {
    console.log(
      `${LOG} keys missing — set EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY in client/.env`,
    );
    return false;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    const apiKey = Platform.OS === 'ios' ? iosKey() : androidKey();
    Purchases.configure({ apiKey });
    configured = true;
    console.log(
      `${LOG} SDK configured (${Platform.OS}, keyPrefix=${apiKey.slice(0, 8)}…)`,
    );
    return true;
  } catch (error) {
    console.warn(`${LOG} configure failed (need a native/dev build, not Expo Go):`, error);
    return false;
  }
}

/**
 * After logIn: verify offering + entitlement wiring and print a ready / not-ready summary.
 * Safe to call without purchasing; does not require App Store / Play if using Test Store.
 */
export async function logSubscriptionReadiness(firebaseUid: string): Promise<void> {
  if (!(await configurePurchases())) return;

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    const pkg =
      current?.monthly ??
      current?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ??
      current?.availablePackages[0] ??
      null;

    const info = await Purchases.getCustomerInfo();
    const hasEntitlement = Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]);

    const offeringId = current?.identifier ?? '(none)';
    const productId = pkg?.product.identifier ?? '(none)';
    const price = pkg?.product.priceString ?? '(none)';

    const offeringOk = Boolean(current);
    const packageOk = Boolean(pkg);
    const productOk = productId === PREMIUM_PRODUCT_ID || productId !== '(none)';

    console.log(`${LOG} readiness check`, {
      appUserId: firebaseUid,
      offering: offeringId,
      package: pkg?.identifier ?? '(none)',
      product: productId,
      price,
      entitlementId: PREMIUM_ENTITLEMENT,
      entitlementActive: hasEntitlement,
    });

    if (offeringOk && packageOk && productOk) {
      console.log(
        `${LOG} READY — offering/package wired. Purchase works on a native build with Test Store / sandbox.`,
      );
    } else {
      console.warn(`${LOG} NOT READY — fix RevenueCat offering: default → Monthly → ${PREMIUM_PRODUCT_ID}`);
    }
  } catch (error) {
    console.warn(`${LOG} readiness check failed:`, error);
  }
}

/** Identify the Firebase UID so webhooks match Mongo users. */
export async function loginPurchases(firebaseUid: string): Promise<void> {
  if (!(await configurePurchases())) return;
  try {
    await Purchases.logIn(firebaseUid);
    console.log(`${LOG} logged in appUserId=${firebaseUid}`);
    await syncFirebaseAnalyticsInstanceId();
    await logSubscriptionReadiness(firebaseUid);
  } catch (error) {
    console.warn(`${LOG} logIn failed:`, error);
  }
}

/**
 * Links this device to GA4 so RevenueCat can send purchase events to Firebase Analytics.
 * Requires a native build with @react-native-firebase/analytics (no-op in Expo Go).
 */
async function syncFirebaseAnalyticsInstanceId(): Promise<void> {
  try {
    // Dynamic import so Expo Go / web don't crash if native module is missing.
    const analyticsModule = await import('@react-native-firebase/analytics');
    const analytics = analyticsModule.default;
    const instanceId = await analytics().getAppInstanceId();
    if (!instanceId) {
      console.warn(`${LOG} Firebase Analytics appInstanceId is null`);
      return;
    }
    await Purchases.setFirebaseAppInstanceID(instanceId);
    console.log(`${LOG} set Firebase Analytics appInstanceId for RC → GA`);
  } catch (error) {
    console.log(
      `${LOG} skipped Firebase Analytics instance id (need native/dev build):`,
      error instanceof Error ? error.message : error,
    );
  }
}

export async function logoutPurchases(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
    console.log(`${LOG} logged out`);
  } catch (error) {
    console.warn(`${LOG} logOut failed:`, error);
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
    console.warn(`${LOG} getOfferings failed:`, error);
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
