/**
 * purchases.ts — RevenueCat SDK wrapper.
 *
 * Requires EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY and a native
 * development build (IAP does not work in Expo Go).
 * Test Store keys (test_…) are for development only.
 * Preview/production must use goog_ / appl_ keys (Expo env already maps this).
 */
import { LogBox, NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
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

// Test Store keys log ConfigurationError — Expo turns that into a red crash screen.
LogBox.ignoreLogs([
  'RevenueCat',
  'Test Store',
  'test_',
  'Offerings',
  'PurchasesError',
  'ConfigurationError',
  'InvalidSubscriberAttributes',
  'subscriber attributes',
  'firebaseAppInstanceId',
  '[Subscription]',
]);

let configured = false;

/** Expo Go has no custom native modules (RNFB / full StoreKit). */
function isExpoGo(): boolean {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient'
  );
}

function hasNativeFirebaseApp(): boolean {
  return Boolean((NativeModules as { RNFBAppModule?: unknown }).RNFBAppModule);
}

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
      `${LOG} keys missing — set EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY in Expo env`,
    );
    return false;
  }

  try {
    // Never console.warn/error from RC — Expo LogBox treats those as red screens.
    await Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.setLogHandler((_level, message) => {
      console.log(`${LOG} ${message}`);
    });

    const apiKey = Platform.OS === 'ios' ? iosKey() : androidKey();
    Purchases.configure({ apiKey });
    configured = true;
    console.log(
      `${LOG} SDK configured (${Platform.OS}, keyPrefix=${apiKey.slice(0, 8)}…)`,
    );
    return true;
  } catch (error) {
    console.log(
      `${LOG} configure failed (need a native/dev build, not Expo Go):`,
      error instanceof Error ? error.message : error,
    );
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
    } else if (isExpoGo()) {
      console.log(
        `${LOG} offerings empty in Expo Go (Browser Mode) — expected. Test purchases on a dev build.`,
      );
    } else {
      console.log(`${LOG} NOT READY — fix RevenueCat offering: default → Monthly → ${PREMIUM_PRODUCT_ID}`);
    }
  } catch (error) {
    console.log(
      `${LOG} readiness check skipped (configure Test Store products in RevenueCat):`,
      error instanceof Error ? error.message : error,
    );
  }
}

/** Identify the Firebase UID so webhooks match Mongo users. */
export async function loginPurchases(firebaseUid: string): Promise<void> {
  if (!(await configurePurchases())) return;
  try {
    await Purchases.logIn(firebaseUid);
    console.log(`${LOG} logged in appUserId=${firebaseUid}`);
    // GA attribute sync races on Test Store and can red-box; only needed in release.
    if (!__DEV__) {
      await syncFirebaseAnalyticsInstanceId();
    }
    await logSubscriptionReadiness(firebaseUid);
  } catch (error) {
    console.log(`${LOG} logIn failed:`, error instanceof Error ? error.message : error);
  }
}

/**
 * Links this device to GA4 so RevenueCat can send purchase events to Firebase Analytics.
 * No-op in Expo Go — never import @react-native-firebase there (crashes without native binary).
 */
async function syncFirebaseAnalyticsInstanceId(): Promise<void> {
  if (isExpoGo() || !hasNativeFirebaseApp()) {
    console.log(
      `${LOG} skipped Firebase Analytics instance id (use a dev/production build, not Expo Go)`,
    );
    return;
  }

  try {
    const analyticsModule = await import('@react-native-firebase/analytics');
    const analyticsFactory =
      typeof analyticsModule.default === 'function'
        ? analyticsModule.default
        : (analyticsModule as { default?: unknown }).default;

    if (typeof analyticsFactory !== 'function') {
      console.log(`${LOG} skipped Firebase Analytics (unexpected module shape)`);
      return;
    }

    const instanceId = await analyticsFactory().getAppInstanceId();
    if (!instanceId) {
      console.log(`${LOG} Firebase Analytics appInstanceId is null`);
      return;
    }
    await Purchases.setFirebaseAppInstanceID(instanceId);
    console.log(`${LOG} set Firebase Analytics appInstanceId for RC → GA`);
  } catch (error) {
    console.log(
      `${LOG} skipped Firebase Analytics instance id:`,
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
    console.log(`${LOG} logOut failed:`, error instanceof Error ? error.message : error);
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
    if (__DEV__) {
      console.log(
        `${LOG} getOfferings unavailable — add Test Store products to your RevenueCat offering.`,
      );
    }
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
