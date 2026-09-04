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
export const HEADER_CONTENT_GAP = 20;

/** Gap between title/back row and segmented tabs on list screens. */
export const LIST_HEADER_TABS_GAP = 16;

/** Gap between header chrome and scroll content (vaccines, legal docs). */
export const LIST_HEADER_CONTENT_GAP = 20;

/** Gap between segmented tabs and the scrollable list below (solid chrome strip). */
export const LIST_TABS_CONTENT_GAP = 8;

/** Extra offset on list rows so the first row sits clear of the top fade band. */
export const LIST_CONTENT_TOP_NUDGE = 4;

/** Documents start a little lower so the first line is clear of the deeper top fade. */
export const DOCUMENT_CONTENT_TOP_NUDGE = 20;

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

/** Scroll content stops this far above the physical bottom (home-indicator zone). */
export const SCROLL_END_ABOVE_HOME = 20;

/** Top fade gradient height — overlaps the bottom edge of the header chrome. */
export const SCROLL_TOP_FADE_GRADIENT = 44;

/** Bottom fade gradient height — starts this far above the screen bottom. */
export const SCROLL_BOTTOM_FADE_GRADIENT = 50;

/**
 * List screen fade bands (reminders / topics — tabs to list, list bottom).
 * The top band stays opaque across the margin below the tabs, then dissolves over
 * the first row's top edge, so the row stays readable while rows scrolling up melt away.
 */
export const SCROLL_LIST_TOP_FADE_GRADIENT =
  LIST_TABS_CONTENT_GAP + LIST_CONTENT_TOP_NUDGE + 24;
export const SCROLL_LIST_BOTTOM_FADE_GRADIENT = SCROLL_BOTTOM_FADE_GRADIENT + 36;

/**
 * Long, soft fades for legal / document scroll screens (terms, privacy).
 * Document content starts below the top band, so text only dissolves once scrolled.
 */
export const SCROLL_DOCUMENT_TOP_FADE_GRADIENT = SCROLL_TOP_FADE_GRADIENT + 44;
export const SCROLL_DOCUMENT_BOTTOM_FADE_GRADIENT = SCROLL_BOTTOM_FADE_GRADIENT + 44;

/** Top gradient stays opaque through this fraction (seamless under header). */
export const SCROLL_TOP_FADE_SOLID_AT = 0.32;

/** Bottom gradient reaches full opacity through this fraction. */
export const SCROLL_BOTTOM_FADE_SOLID_AT = 0.55;

/**
 * Full-bleed legal header (auth Terms / Privacy): status cover, then the back
 * chip, then the tab row sitting directly on the page. `radius` follows the
 * device's top screen corners.
 */
export const LEGAL_TAB_BAR = {
  statusCover: 20,
  /** Between the back chip and the tab row. */
  backRowGap: 8,
  rowHeight: 40,
  radius: 24,
} as const;

/**
 * Legal tabs fade: opaque for this many points below the bar, then dissolves.
 * Content starts at the band's end, so nothing is dimmed on mount.
 */
export const LEGAL_TABS_FADE_SOLID_STRIP = 12;
export const LEGAL_TABS_TOP_FADE_GRADIENT = Math.round(
  LEGAL_TABS_FADE_SOLID_STRIP / SCROLL_TOP_FADE_SOLID_AT,
);

/** @deprecated Use SCROLL_BOTTOM_FADE_GRADIENT */
export const SCROLL_FADE_BAND = SCROLL_BOTTOM_FADE_GRADIENT;

/** @deprecated No longer added to scroll padding */
export const SCROLL_FADE_BELOW_TITLE = 0;

/** @deprecated */
export const SCROLL_FADE_LINE_OFFSET = 0;

/** @deprecated */
export const SCROLL_FADE_SOLID_AT = 0.8913;

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
