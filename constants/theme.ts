/**
 * Ragly theme — light/dark twins from the product palette.
 * Every purpose has a matching pair so `useColors()` can swap schemes.
 */

import { Platform } from 'react-native';

/**
 * Palette (light / dark):
 *   Background              #F6F7F9 / #111315
 *   Surface                 #FFFFFF / #1A1D20
 *   Primary Text            #1F2937 / #F5F6F7
 *   Secondary Text          #6B7280 / #C2C6CB
 *   Divider / Border        #E5E7EB / #373C42
 *   Primary Button / FAB    #004741 / #3FA89A
 *   Disabled Button         #8DB0AA / #739A94
 *   Vaccinations            #EFF4FD / #24364D
 *   Health                  #F6E7E8 / #4B3135
 *   Reminders               #EDF8F2 / #233A2F
 *   Disabled                #D1D5DB / #5B6168
 *   Successfully            #84CC9D / #58C78A
 *   Error / Delete          #EF4444 / #E46A6A
 *   Brand Dark              #004741 / #004741
 *   Brand Light             #F6F7F9 / #3FA89A
 */
export const lightColors = {
  /** App canvas */
  background: '#F6F7F9',
  /** Cards / sheets / elevated surfaces */
  surface: '#FFFFFF',
  /** Secondary canvas areas (lists, panels) */
  panel: '#F6F7F9',
  /** Primary actions, FAB, focused inputs (Primary Button twin) */
  brand: '#004741',
  /** Deep brand green — same in both schemes */
  brandDark: '#004741',
  /** Soft brand / accent twin of Brand Light */
  brandLight: '#F6F7F9',
  primaryText: '#1F2937',
  secondaryText: '#6B7280',
  /** Inactive segmented-control text */
  tabInactiveText: '#4F4F4F',
  border: '#E5E7EB',
  error: '#EF4444',
  /** Soft fill behind destructive dialog actions (delete / discard). */
  dangerSoft: '#FEE2E2',
  success: '#84CC9D',
  /** Neutral disabled controls (not the green disabled CTA) */
  disabled: '#D1D5DB',
  /** Switch / track off state */
  track: '#D1D5DB',
  /** Unselected profile controls */
  inactiveControl: '#F3F4F6',
  overlay: 'rgba(0, 0, 0, 0.4)',
  /** Translucent chip for controls sitting on top of a photo */
  photoChip: 'rgba(255, 255, 255, 0.9)',
  button: {
    primaryBg: '#004741',
    primaryText: '#FFFFFF',
    disabledBg: '#8DB0AA',
    disabledText: '#FFFFFF',
  },
  category: {
    /** Icon accents (readable on the tinted chip backgrounds) */
    vaccines: '#4A6FA5',
    vaccinesBg: '#EFF4FD',
    medical: '#C45B5B',
    medicalBg: '#F6E7E8',
    notes: '#C45B5B',
    notesBg: '#F6E7E8',
    reminders: '#3D7A5F',
    remindersBg: '#EDF8F2',
  },
};

export const darkColors: ThemeColors = {
  background: '#111315',
  surface: '#1A1D20',
  panel: '#111315',
  brand: '#3FA89A',
  brandDark: '#004741',
  brandLight: '#3FA89A',
  primaryText: '#F5F6F7',
  secondaryText: '#C2C6CB',
  tabInactiveText: '#C2C6CB',
  border: '#373C42',
  error: '#E46A6A',
  dangerSoft: '#4B3135',
  success: '#58C78A',
  disabled: '#5B6168',
  track: '#5B6168',
  inactiveControl: '#373C42',
  overlay: 'rgba(0, 0, 0, 0.6)',
  photoChip: 'rgba(26, 29, 32, 0.9)',
  button: {
    primaryBg: '#3FA89A',
    primaryText: '#FFFFFF',
    disabledBg: '#739A94',
    disabledText: '#FFFFFF',
  },
  category: {
    vaccines: '#7FA8DC',
    vaccinesBg: '#24364D',
    medical: '#E46A6A',
    medicalBg: '#4B3135',
    notes: '#E46A6A',
    notesBg: '#4B3135',
    reminders: '#6DB39A',
    remindersBg: '#233A2F',
  },
};

/** Shape shared by both palettes — use this type for theme-aware style factories. */
export type ThemeColors = typeof lightColors;

/**
 * Backwards-compatible default export: points at the light palette.
 * Prefer `useColors()` so UI reacts to the user's theme choice.
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
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
