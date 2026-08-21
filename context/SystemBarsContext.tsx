import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import {
  statusBarStyleForHex,
  statusBarStyleForSurface,
  statusBarStyleForTheme,
} from '@/utils/statusBarContrast';

export type SystemBarContentStyle = 'light' | 'dark';

type Claim = {
  id: symbol;
  style: SystemBarContentStyle;
};

type SystemBarsContextValue = {
  themeStyle: SystemBarContentStyle;
  /** Register/update a claim. Returns the claim id. */
  upsertClaim: (id: symbol, style: SystemBarContentStyle) => void;
  /** Remove a claim (blur / unmount). */
  removeClaim: (id: symbol) => void;
};

const SystemBarsContext = createContext<SystemBarsContextValue>({
  themeStyle: 'dark',
  upsertClaim: () => {},
  removeClaim: () => {},
});

/**
 * Theme-aware system bars. Focused screens push a claim; the topmost claim
 * wins. When the stack is empty, theme contrast is used.
 */
export function SystemBarsProvider({
  isDark,
  children,
}: {
  isDark: boolean;
  children: React.ReactNode;
}) {
  const claimsRef = useRef<Claim[]>([]);
  const [activeStyle, setActiveStyle] = useState<SystemBarContentStyle | null>(null);
  const themeStyle = statusBarStyleForTheme(isDark);

  const publish = useCallback(() => {
    const top = claimsRef.current[claimsRef.current.length - 1];
    setActiveStyle(top?.style ?? null);
  }, []);

  const upsertClaim = useCallback(
    (id: symbol, style: SystemBarContentStyle) => {
      const list = claimsRef.current;
      const idx = list.findIndex((c) => c.id === id);
      if (idx >= 0) {
        list[idx] = { id, style };
        // Move to top so the focused screen wins.
        if (idx !== list.length - 1) {
          const [claim] = list.splice(idx, 1);
          list.push(claim);
        }
      } else {
        list.push({ id, style });
      }
      publish();
    },
    [publish],
  );

  const removeClaim = useCallback(
    (id: symbol) => {
      claimsRef.current = claimsRef.current.filter((c) => c.id !== id);
      publish();
    },
    [publish],
  );

  useEffect(() => {
    void NavigationBar.setButtonStyleAsync(themeStyle).catch(() => {});
  }, [themeStyle]);

  const value = useMemo(
    () => ({ themeStyle, upsertClaim, removeClaim }),
    [themeStyle, upsertClaim, removeClaim],
  );

  return (
    <SystemBarsContext.Provider value={value}>
      {children}
      <StatusBar style={activeStyle ?? themeStyle} />
    </SystemBarsContext.Provider>
  );
}

/**
 * Apply a screen-specific status bar style while this screen is focused.
 * Uses a claim stack so blur order cannot wipe a newly focused screen.
 */
export function useStatusBarOverride(style: SystemBarContentStyle | null) {
  const { upsertClaim, removeClaim } = useContext(SystemBarsContext);
  const idRef = useRef(Symbol('status-bar-claim'));

  useFocusEffect(
    useCallback(() => {
      if (style == null) {
        removeClaim(idRef.current);
        return () => removeClaim(idRef.current);
      }
      upsertClaim(idRef.current, style);
      return () => removeClaim(idRef.current);
    }, [style, upsertClaim, removeClaim]),
  );
}

/**
 * Theme-matched status bar while focused (dark icons on light theme, etc.).
 * Use on screens whose top chrome matches the app background (settings, lists).
 */
export function useThemedStatusBar() {
  const { themeStyle } = useContext(SystemBarsContext);
  useStatusBarOverride(themeStyle);
}

/** Explicit surface: light bg → dark icons; dark bg → light icons. */
export function useStatusBarForSurface(surface: 'light' | 'dark') {
  useStatusBarOverride(statusBarStyleForSurface(surface));
}

export { statusBarStyleForHex, statusBarStyleForSurface, statusBarStyleForTheme };
