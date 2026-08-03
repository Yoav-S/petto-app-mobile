import { lightColors } from '@/constants/theme';

/** Figma frame 375×812 — cold-start / auth-bootstrap splash */
export const SPLASH_DESIGN_WIDTH = 375;
export const SPLASH_DESIGN_HEIGHT = 812;

export const SPLASH_LOGO = {
  left: 86,
  top: 354,
  width: 202,
  height: 72,
  /** Brand Dark — same in light and dark. */
  color: lightColors.brandDark,
  /** Fits the 72px Figma text frame (same family as welcome logo). */
  fontSize: 58,
  lineHeight: 72,
} as const;

/** Splash stays on the light surface (Brand Light / Surface twin). */
export const SPLASH_BACKGROUND = lightColors.surface;
