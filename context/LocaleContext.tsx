import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(currentLocale);

  // Restore the saved language once on mount.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_KEY);
        if (isSupported(saved) && saved !== currentLocale) {
          setActiveLocale(saved);
          setLocaleState(saved);
        }
      } catch {
        // Ignore — keep the device/default locale.
      }
    })();
  }, []);

  const setLocale = useCallback(
    (next: AppLocale) => {
      setLocaleState((prev) => {
        if (prev === next) return prev;
        setActiveLocale(next);
        AsyncStorage.setItem(LOCALE_KEY, next).catch(() => {});
        return next;
      });
    },
    [],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
