import { Platform, type TextStyle } from 'react-native';

/**
 * Single-line field text. Keep the TextInput height equal to lineHeight and
 * let the parent card center it — that pins the placeholder instead of
 * sitting it at the top (especially on Android / tall iOS fields).
 *
 * Do not stretch a TextInput with flex:1 inside a tall card. The input stays
 * still; the native placeholder disappears only when there is text.
 */
export function centeredInputText(extra?: TextStyle): TextStyle {
  const fontSize = extra?.fontSize ?? 16;
  const lineHeight = extra?.lineHeight ?? fontSize;
  const explicitHeight = extra?.height;
  return {
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    // Prefer minHeight so descenders (g, y, p) are not clipped when lineHeight is tight.
    ...(explicitHeight === undefined
      ? { minHeight: lineHeight }
      : { height: explicitHeight }),
    textAlignVertical: 'center',
    includeFontPadding: false,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
    ...extra,
    includeFontPadding: extra?.includeFontPadding ?? false,
  };
}
