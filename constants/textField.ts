import { Platform, type TextStyle } from 'react-native';

/**
 * Name fields (topics / vaccines / reminders).
 * Figma: Rubik Medium 16 / 20. Placeholder fill is Secondary Text
 * (#6B7280 light, #C2C6CB dark) — not brand green, so it stays readable
 * in both schemes and matches the rest of the app.
 */
export const NAME_FIELD_TEXT = {
  fontFamily: 'Rubik-Medium',
  fontSize: 16,
  lineHeight: 20,
} as const;

/**
 * Standalone bordered field shell (auth email, standalone name fields).
 * Fixed height — the row must never grow once the first character lands.
 */
export const SINGLE_LINE_FIELD = {
  height: 48,
  borderRadius: 16,
  borderWidth: 1,
  paddingHorizontal: 16,
  /** Text ↔ trailing affordance (clear button). */
  innerGap: 6,
} as const;

/** Label above a field — Figma: Rubik Regular 14/20, secondary text. */
export const FIELD_LABEL_TEXT = {
  fontFamily: 'Rubik-Regular',
  fontSize: 14,
  lineHeight: 20,
} as const;

/** Label → field gap, so label + field measures 76 with a 48 tall field. */
export const FIELD_LABEL_GAP = 8;

/** Field group → primary action gap (Figma stack: 76 + 32 + 48 = 156). */
export const FIELD_TO_ACTION_GAP = 32;

/** Room over the font size so descenders (g, y, p) are never clipped. */
const DESCENDER_RATIO = 1.45;

/** Constant text-row height for a single-line input. */
export function singleLineTextHeight(fontSize: number, lineHeight?: number): number {
  return Math.max(lineHeight ?? 0, Math.round(fontSize * DESCENDER_RATIO));
}

/**
 * Single-line field text with a constant height, so the field keeps the exact
 * same size empty, focused and filled. `lineHeight` is intentionally dropped:
 * a tight line height clips Rubik descenders on Android, and the fixed height
 * already centers the text (natively on iOS, via textAlignVertical elsewhere).
 *
 * Pass a `height` to opt into a specific row height (e.g. `'100%'` to fill a
 * fixed-height shell); anything else gets the descender-safe default.
 */
export function centeredInputText(extra?: TextStyle): TextStyle {
  const { height, minHeight: _growable, lineHeight, ...rest } = extra ?? {};
  const fontSize = typeof rest.fontSize === 'number' ? rest.fontSize : 16;
  const rowHeight =
    height === undefined
      ? singleLineTextHeight(fontSize, typeof lineHeight === 'number' ? lineHeight : undefined)
      : height;
  return {
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
    ...rest,
    height: rowHeight,
    includeFontPadding: extra?.includeFontPadding ?? false,
  };
}
