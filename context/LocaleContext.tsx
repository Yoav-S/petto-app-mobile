import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Keyboard, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { setNativeAppLocale } from '@/modules/app-locales/src';
import {
  SUPPORTED_LOCALES,
  currentLocale,
  setActiveLocale,
  type AppLocale,
} from '@/i18n';

const LOCALE_KEY = 'petto_locale';

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: currentLocale,
  setLocale: () => {},
});

function isSupported(value: string | null): value is AppLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

async function applyNativeLocale(locale: AppLocale, reloadIos: boolean): Promise<void> {
  Keyboard.dismiss();
  const synced = await setNativeAppLocale(locale);
  // iOS: AppleLanguages needs a process reload to affect the soft keyboard.
  if (synced && reloadIos && Platform.OS === 'ios') {
    try {
      await Updates.reloadAsync();
    } catch {
      // Dev client without updates — UI locale already switched.
    }
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(currentLocale);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_KEY);
        const next = isSupported(saved) ? saved : currentLocale;
        if (next !== currentLocale) {
          setActiveLocale(next);
          setLocaleState(next);
        }
        // Sync OS locales on launch (no iOS reload — already starting).
        await setNativeAppLocale(next);
      } catch {
        // Keep device/default locale.
      }
    })();
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState((prev) => {
      if (prev === next) return prev;
      setActiveLocale(next);
      AsyncStorage.setItem(LOCALE_KEY, next).catch(() => {});
      void applyNativeLocale(next, true);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
