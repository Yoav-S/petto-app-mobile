import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';

import en from '../locales/en.json';
import he from '../locales/he.json';
import ro from '../locales/ro.json';
import ru from '../locales/ru.json';

type Translations = typeof en;

/** Order shown in the Language settings screen. */
export const SUPPORTED_LOCALES = ['en', 'ro', 'ru', 'he'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

const locales: Record<string, Translations> = {
  en,
  ro: ro as Translations,
  ru: ru as Translations,
  he: he as Translations,
};

const RTL_LOCALES = ['he', 'ar'];

function resolveInitialLocale(): AppLocale {
  const device = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED_LOCALES as readonly string[]).includes(device)
    ? (device as AppLocale)
    : 'en';
}

// `currentLocale` / `isRTL` are live bindings — reassigned by `setActiveLocale`.
// Because these are `let` exports, consumers importing them read the latest
// value (the app re-renders via the LocaleProvider on change).
export let currentLocale: AppLocale = resolveInitialLocale();
export let isRTL = RTL_LOCALES.includes(currentLocale);

I18nManager.allowRTL(true);
I18nManager.forceRTL(isRTL);

/**
 * Switch the active language used by `t()`. The LocaleProvider persists the
 * choice and re-renders the tree so every `t()` call re-evaluates.
 * Note: flipping to/from an RTL language sets the native direction, but full
 * layout mirroring for existing native views only completes on the next app
 * launch (React Native limitation without a native reload).
 */
export function setActiveLocale(locale: AppLocale): void {
  if (!locales[locale]) return;
  currentLocale = locale;
  isRTL = RTL_LOCALES.includes(locale);
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRTL);
}

function lookup(source: Translations | undefined, keys: string[]): unknown {
  let result: any = source;
  for (const k of keys) {
    result = result?.[k];
  }
  return result;
}

export function t(key: string): string {
  const keys = key.split('.');
  const value = lookup(locales[currentLocale], keys);
  if (value != null) return value as string;
  // Fall back to English for any key missing in the active locale.
  const fallback = lookup(locales.en, keys);
  return (fallback as string) ?? key;
}
