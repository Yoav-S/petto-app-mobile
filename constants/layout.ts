/** Figma reference frame (logical points, not physical pixels). */
export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;

/** Welcome collage was drawn in a 360-wide Figma strip inside the 375 frame. */
export const WELCOME_DESIGN_WIDTH = 360;

/** Smallest supported logical width — stress-test target. */
export const MIN_SUPPORTED_WIDTH = 360;

/**
 * Standard horizontal inset for page content and cards.
 * Figma 375 frame → 335 content ⇒ 20pt each side.
 */
export const PAGE_HORIZONTAL_PADDING = 20;

/**
 * Soft max for phone content. Phones (360–430) use the full fluid width.
 * Only very wide surfaces (tablets) get a cap.
 */
export const PHONE_CONTENT_MAX_WIDTH = 430;

/** Named breakpoints for adaptive layout (width in logical points). */
export const LayoutBreakpoint = {
  compact: MIN_SUPPORTED_WIDTH,
  base: DESIGN_WIDTH,
  large: 390,
  xl: 430,
} as const;

/** Opaque buffer inside the header chrome below the title row. */
export const HEADER_SCROLL_GAP = 10;

/** Extra space between header chrome and the first content row. */
export const HEADER_CONTENT_GAP = 12;

/** Gap between segmented tabs and the scrollable list below. */
export const LIST_TABS_CONTENT_GAP = 12;

/** Rounded bottom corners on the floating header chrome. */
export const HEADER_CHROME_BOTTOM_RADIUS = 16;

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
export const DESIGN_HOME_HALF_CARD_HEIGHT = 198;
export const DESIGN_HOME_HEALTH_CARD_HEIGHT = 112;

/** Gap below safe-area inset when inset is taller than the Figma status band. */
export const HEADER_BELOW_SAFE_AREA = 12;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Bounded scale for structural chrome (cover, card heights, FAB).
 * Never apply this to typography, icon glyphs, or control text.
 * At 375×812 → 1. On ~430×932 → ~1.15 (matches pre-migration cover/FAB).
 */
export function structuralScale(width: number, height: number): number {
  return clamp(Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT), 1, 1.15);
}

/** Cover-fit scale so a design-sized layer fills the viewport (object-fit: cover). */
export function coverScale(
  width: number,
  height: number,
  designWidth = DESIGN_WIDTH,
  designHeight = DESIGN_HEIGHT,
): number {
  return Math.max(width / designWidth, height / designHeight);
}
