import { darkColors, lightColors } from '@/constants/theme';

/** Figma frame 375×812 — cold-start / auth-bootstrap splash */
export const SPLASH_DESIGN_WIDTH = 375;
export const SPLASH_DESIGN_HEIGHT = 812;

export const SPLASH_LOGO = {
  left: 86,
  top: 354,
  width: 202,
  height: 72,
  /** Fits the 72px Figma text frame (same family as welcome logo). */
  fontSize: 58,
  lineHeight: 72,
} as const;

/** Light splash: white surface + Brand Dark wordmark. */
export const SPLASH_LIGHT = {
  background: lightColors.surface,
  logo: lightColors.brandDark,
} as const;

/** Dark splash: dark surface + Brand Light wordmark for contrast. */
export const SPLASH_DARK = {
  background: darkColors.surface,
  logo: darkColors.brandLight,
} as const;

/** @deprecated Prefer SPLASH_LIGHT / scheme-aware colors. */
export const SPLASH_BACKGROUND = SPLASH_LIGHT.background;
