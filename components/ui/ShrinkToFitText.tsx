import React, { useMemo } from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { estimateTextWidth, wrapTextAtWords } from '@/utils/textWidth';

type Props = {
  children: string;
  maxFontSize: number;
  minFontSize: number;
  lineHeight: number;
  style?: StyleProp<TextStyle>;
  /** `1` = always one line. `2` = wrap at a space only when one line cannot fit. */
  maxLines?: 1 | 2;
  textAlign?: TextStyle['textAlign'];
  /** When set, used to decide multi-word wraps. */
  maxWidth?: number;
};

/**
 * Always paints at maxFontSize. Never native-shrinks.
 * maxLines={2} wraps at a space when needed.
 */
export default function ShrinkToFitText({
  children,
  maxFontSize,
  minFontSize: _minFontSize,
  lineHeight,
  style,
  maxLines = 1,
  textAlign = 'left',
  maxWidth,
}: Props) {
  const text = useMemo(() => children.replace(/\s+/g, ' ').trim(), [children]);
  const words = useMemo(() => text.split(' ').filter(Boolean), [text]);
  const canWrap = words.length > 1 && maxLines > 1;

  const display = useMemo(() => {
    if (!text || !canWrap || maxWidth == null || maxWidth <= 0) return text;
    if (estimateTextWidth(text, maxFontSize) <= maxWidth - 4) return text;
    return (
      wrapTextAtWords(text, maxWidth, maxFontSize) ??
      `${words[0]}\n${words.slice(1).join(' ')}`
    );
  }, [canWrap, maxFontSize, maxWidth, text, words]);

  const lineCount = display.includes('\n') ? 2 : 1;

  return (
    <Text
      style={[
        styles.text,
        style,
        {
          fontSize: maxFontSize,
          lineHeight,
          textAlign,
          minHeight: lineHeight * lineCount,
        },
      ]}
      numberOfLines={lineCount}
      ellipsizeMode="clip"
      allowFontScaling={false}
      textBreakStrategy="simple"
      lineBreakStrategyIOS="standard"
      android_hyphenationFrequency="none"
    >
      {display}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    width: '100%',
    includeFontPadding: false,
  },
});
