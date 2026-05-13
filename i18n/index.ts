import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import { getLocales } from 'expo-localization';

type Translations = typeof import('../locales/en.json');

const locales: Record<string, Translations> = {
  en: require('../locales/en.json'),
  he: require('../locales/he.json'),
};

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
export const currentLocale = locales[deviceLocale] ? deviceLocale : 'en';

// Enable RTL for Hebrew/Arabic
const isRTL = ['he', 'ar'].includes(currentLocale);
I18nManager.forceRTL(isRTL);

export function t(key: string): string {
  const keys = key.split('.');
  let result: any = locales[currentLocale];
  for (const k of keys) {
    result = result?.[k];
  }
  return result ?? key;
}

export { isRTL };
