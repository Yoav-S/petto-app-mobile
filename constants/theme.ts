/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#F7F5F0',
  surface: '#FFFFFF',
  primaryText: '#1F2937',
  secondaryText: '#6B7280',
  border: '#E5E7EB',
  error: '#C96A6A',
  button: {
    primaryBg: '#1F2937',
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
