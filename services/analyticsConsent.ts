import { useSyncExternalStore } from 'react';
import { NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Analytics starts disabled (client/firebase.json). It is enabled only
 * after consent where the law requires opt-in (EU/EEA, UK, Switzerland, Moldova),
 * and by default elsewhere. The user can change it in Settings.
 */
export type AnalyticsConsent = 'granted' | 'denied';

const STORAGE_KEY = 'ragly.analyticsConsent.v1';

const OPT_IN_REGIONS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH', 'MD',
]);

let stored: AnalyticsConsent | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** True where analytics may only run after the user opts in. */
export function analyticsNeedsOptIn(): boolean {
  const region = getLocales()[0]?.regionCode?.toUpperCase();
  // Unknown region: ask rather than assume.
  return !region || OPT_IN_REGIONS.has(region);
}

/** Choice in effect: the stored one, else the regional default. */
export function effectiveAnalyticsConsent(): AnalyticsConsent {
  if (stored) return stored;
  return analyticsNeedsOptIn() ? 'denied' : 'granted';
}

function nativeAnalyticsAvailable(): boolean {
  const expoGo =
    Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
  return !expoGo && Boolean((NativeModules as { RNFBAppModule?: unknown }).RNFBAppModule);
}

async function applyToFirebase(consent: AnalyticsConsent): Promise<void> {
  if (!nativeAnalyticsAvailable()) return;
  try {
    const { getAnalytics, setAnalyticsCollectionEnabled, setConsent } = await import(
      '@react-native-firebase/analytics'
    );
    const analytics = getAnalytics();
    const granted = consent === 'granted';
    await setConsent(analytics, {
      analytics_storage: granted,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false,
    });
    await setAnalyticsCollectionEnabled(analytics, granted);
  } catch (error) {
    console.log('[Analytics] consent not applied:', error instanceof Error ? error.message : error);
  }
}

/** Call once at startup. Returns true when the user should be asked. */
export async function initAnalyticsConsent(): Promise<boolean> {
  if (!loaded) {
    const value = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
    stored = value === 'granted' || value === 'denied' ? value : null;
    loaded = true;
    emit();
  }
  await applyToFirebase(effectiveAnalyticsConsent());
  return stored == null && analyticsNeedsOptIn();
}

export async function setAnalyticsConsent(consent: AnalyticsConsent): Promise<void> {
  stored = consent;
  loaded = true;
  emit();
  await AsyncStorage.setItem(STORAGE_KEY, consent).catch(() => undefined);
  await applyToFirebase(consent);
}

export function hasAnalyticsConsent(): boolean {
  return effectiveAnalyticsConsent() === 'granted';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAnalyticsConsent(): AnalyticsConsent {
  return useSyncExternalStore(subscribe, effectiveAnalyticsConsent, effectiveAnalyticsConsent);
}
