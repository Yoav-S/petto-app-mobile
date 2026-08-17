import { Spacing } from '@/constants/theme';

/** Figma reference frame (logical points, not physical pixels). */
export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;

/** Smallest supported logical width — stress-test target. */
export const MIN_SUPPORTED_WIDTH = 360;

/** Standard horizontal inset for page content and cards. */
export const PAGE_HORIZONTAL_PADDING = Spacing.lg; // 16

/** Named breakpoints for adaptive layout (width in logical points). */
export const LayoutBreakpoint = {
  compact: MIN_SUPPORTED_WIDTH,
  base: DESIGN_WIDTH,
  large: 390,
  xl: 430,
} as const;

/** Figma header band: row starts 56pt from screen top; row height 44pt. */
export const HEADER_LAYOUT = {
  topFromScreen: 56,
  height: 44,
  paddingHorizontal: 20,
  paddingVertical: 6,
} as const;

/** Home cover + bottom panel (375×812 reference). */
export const DESIGN_COVER_HEIGHT = 352;
export const DESIGN_PANEL_TOP = 328;
export const DESIGN_PANEL_HEIGHT = 484;
export const DESIGN_PANEL_RADIUS = 24;

/** Gap below safe-area inset when inset is taller than the Figma status band. */
export const HEADER_BELOW_SAFE_AREA = 12;
