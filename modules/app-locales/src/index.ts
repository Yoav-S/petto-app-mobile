import { NativeModules, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type AppLocalesNative = {
  setAppLocale: (languageTag: string) => Promise<boolean>;
};

/** BCP-47 tags soft keyboards expect. */
const LANGUAGE_TAGS: Record<string, string> = {
  en: 'en-US',
  ro: 'ro-RO',
  ru: 'ru-RU',
  he: 'he-IL',
};

export function languageTagForLocale(locale: string): string {
  return LANGUAGE_TAGS[locale] ?? locale;
}

function resolveNative(): AppLocalesNative | null {
  const bridge = NativeModules.AppLocales as
    | { setAppLocale?: (languageTag: string) => Promise<boolean> }
    | undefined;
  if (typeof bridge?.setAppLocale === 'function') {
    return { setAppLocale: (tag) => Promise.resolve(bridge.setAppLocale!(tag)) };
  }
  const expo = requireOptionalNativeModule<AppLocalesNative>('AppLocales');
  if (expo && typeof expo.setAppLocale === 'function') return expo;
  return null;
}

/**
 * Tell the OS the preferred app language so soft keyboards can follow it.
 * Must be called from a binary that includes AppLocales (native rebuild).
 */
export async function setNativeAppLocale(localeOrTag: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const native = resolveNative();
  if (!native) {
    if (__DEV__) {
      console.warn(
        '[AppLocales] Native module missing — rebuild the app (npx expo run:android / run:ios).',
      );
    }
    return false;
  }
  const tag = languageTagForLocale(localeOrTag);
  try {
    const result = await native.setAppLocale(tag);
    return result !== false;
  } catch (error) {
    if (__DEV__) {
      console.warn('[AppLocales] setAppLocale failed', error);
    }
    return false;
  }
}

export function isNativeAppLocaleAvailable(): boolean {
  return Platform.OS !== 'web' && resolveNative() != null;
}
