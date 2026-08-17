import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';

export type SystemBarContentStyle = 'light' | 'dark';

type SystemBarsContextValue = {
  setStatusBarOverride: (style: SystemBarContentStyle | null) => void;
};

const SystemBarsContext = createContext<SystemBarsContextValue>({
  setStatusBarOverride: () => {},
});

/**
 * Theme-aware system bars. Screens whose top edge has different contrast
 * (for example a pet cover photo) can temporarily override the status bar.
 */
export function SystemBarsProvider({
  isDark,
  children,
}: {
  isDark: boolean;
  children: React.ReactNode;
}) {
  const [statusBarOverride, setStatusBarOverride] =
    useState<SystemBarContentStyle | null>(null);
  const themeStyle: SystemBarContentStyle = isDark ? 'light' : 'dark';

  useEffect(() => {
    // Android navigation bar sits over the themed bottom screen surface.
    void NavigationBar.setButtonStyleAsync(themeStyle).catch(() => {});
  }, [themeStyle]);

  const value = useMemo(
    () => ({ setStatusBarOverride }),
    [],
  );

  return (
    <SystemBarsContext.Provider value={value}>
      {children}
      <StatusBar style={statusBarOverride ?? themeStyle} />
    </SystemBarsContext.Provider>
  );
}

/** Apply a screen-specific status bar style and restore the theme on unmount. */
export function useStatusBarOverride(style: SystemBarContentStyle | null) {
  const { setStatusBarOverride } = useContext(SystemBarsContext);

  useEffect(() => {
    setStatusBarOverride(style);
    return () => setStatusBarOverride(null);
  }, [setStatusBarOverride, style]);
}
