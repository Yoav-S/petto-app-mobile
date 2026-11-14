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
  t as translateKey,
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

/**
 * In-app UI language only (Done button, copy, etc.).
 * Soft keyboard stays on the system/IME language — no native locale, no reload.
 */
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
      } catch {
        // Keep device/default locale.
      }
    })();
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState((prev) => {
      if (prev === next) return prev;
      AsyncStorage.setItem(LOCALE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  // Keep module-level `t()` in sync whenever React locale state changes.
  useEffect(() => {
    setActiveLocale(locale);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);

/**
 * Translate with a live locale subscription so copy updates immediately
 * (React Compiler will not freeze strings across language changes).
 */
export function useT() {
  const { locale } = useLocale();
  return useCallback((key: string) => translateKey(key, locale), [locale]);
}
