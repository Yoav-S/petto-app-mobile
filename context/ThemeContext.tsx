import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors } from '@/constants/theme';

const THEME_MODE_KEY = 'petto_theme_mode';

/** User-facing choice. `system` follows the OS appearance. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Concrete palette actually applied (never `system`). */
export type ThemeScheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  scheme: ThemeScheme;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  scheme: 'light',
  colors: lightColors,
  isDark: false,
  setMode: () => {},
});

function resolveScheme(mode: ThemeMode, system: ColorSchemeName): ThemeScheme {
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  // Restore the saved choice once on mount.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch {
        // Ignore — fall back to system default.
      }
    })();
  }, []);

  // Track OS appearance so `system` mode stays live.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemScheme(colorScheme),
    );
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_MODE_KEY, next).catch(() => {});
  }, []);

  const scheme = resolveScheme(mode, systemScheme);
  const isDark = scheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: isDark ? darkColors : lightColors,
      isDark,
      setMode,
    }),
    [mode, scheme, isDark, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Convenience — returns the active palette. */
export const useColors = (): ThemeColors => useContext(ThemeContext).colors;

/**
 * Build theme-aware styles at render time. Pass a factory that receives the
 * active palette and returns a StyleSheet; it's memoized per palette.
 *
 *   const makeStyles = (c: ThemeColors) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const colors = useColors();
  return useMemo(() => factory(colors), [colors, factory]);
}
