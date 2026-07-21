/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/**
 * The app has two palettes with identical shape (see `ThemeColors`). Every
 * "purpose" (background, text, brand, category tints, …) has a light and a dark
 * value so a single `colors` object can be swapped at runtime by the theme
 * provider. The dark values below are a first pass ("temp") and can be tuned by
 * design later without touching any component.
 */
export const lightColors = {
  background: '#F7F5F0',
  surface: '#FFFFFF',
  /** Home bottom sheet / panel behind the cards — slightly off from `surface`. */
  panel: '#F6F7F9',
  /** Peto brand green — primary actions, FAB, focused inputs */
  brand: '#004741',
  primaryText: '#1F2937',
  secondaryText: '#6B7280',
  border: '#E5E7EB',
  error: '#C96A6A',
  /** Neutral track for off-state switches / inactive controls */
  track: '#E5E7EB',
  /** Dimmed overlay behind modals */
  overlay: 'rgba(0, 0, 0, 0.4)',
  button: {
    primaryBg: '#004741',
    primaryText: '#FFFFFF',
    disabledBg: '#C7C9CC',
    disabledText: '#FFFFFF',
  },
  category: {
    vaccines: '#4A6FA5',
    vaccinesBg: '#EBF0F8',
    medical: '#8499B1',
    medicalBg: '#F0F3F7',
    notes: '#E9A16D',
    notesBg: '#FDF3EA',
    reminders: '#426A5A',
    remindersBg: '#EAF2EE',
  },
};

export const darkColors: ThemeColors = {
  background: '#111315',
  surface: '#1C1F22',
  // A hair darker than `surface` so the cards still lift off the panel.
  panel: '#16181B',
  brand: '#2E9E90',
  primaryText: '#F2F4F5',
  secondaryText: '#9BA1A6',
  border: '#2C3033',
  error: '#E5847F',
  track: '#3A3F43',
  overlay: 'rgba(0, 0, 0, 0.6)',
  button: {
    primaryBg: '#2E9E90',
    primaryText: '#FFFFFF',
    disabledBg: '#3A3F43',
    disabledText: '#8A9096',
  },
  category: {
    vaccines: '#7FA8DC',
    vaccinesBg: '#1A2230',
    medical: '#9FB2C6',
    medicalBg: '#1E252C',
    notes: '#E8AE7A',
    notesBg: '#2A2015',
    reminders: '#6DB39A',
    remindersBg: '#16241F',
  },
};

/** Shape shared by both palettes — use this type for theme-aware style factories. */
export type ThemeColors = typeof lightColors;

/**
 * Backwards-compatible default export: points at the light palette.
 * Screens that have not yet migrated to `useColors()` keep working (they simply
 * render with light values). New/updated code should read colors via the theme
 * hook so they react to the user's selection.
 */
export const Colors = lightColors;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const FontSize = {
  h1: 36,
  h2: 24,
  h3: 20,
  h4: 16,
  h5: 14,
  body: 16,
  body2: 14,
  caption: 12,
};

export const LineHeight = {
  h1: 44,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 20,
  body: 24,
  body2: 20,
  caption: 16,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
