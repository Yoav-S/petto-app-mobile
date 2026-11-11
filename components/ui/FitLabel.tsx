import React, { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

/** Figma source for pet and category labels. */
export const LABEL_SOURCE_SIZE = 16;
/** Longer copy (e.g. Russian «Ветеринария») stays on one line at this size. */
export const LABEL_COMPACT_SIZE = 14;
export const LABEL_LINE_HEIGHT = 20;

const COMPACT_SCALE = LABEL_COMPACT_SIZE / LABEL_SOURCE_SIZE;

function ellipsisTrim(value: string): string {
  return value.replace(/[.\u2026]+$/u, '');
}

/**
 * Source size is 16/20. If this one string is wider than the Figma text box,
 * this label only drops to 14/20. The tile width never changes.
 * Never breaks mid-word — stays on one line and shrinks instead.
 */
export default function FitLabel({
  children,
  maxWidth,
  style,
}: {
  children: string;
  maxWidth: number;
  style?: StyleProp<TextStyle>;
}) {
  const [fontSize, setFontSize] = useState(LABEL_SOURCE_SIZE);

  useEffect(() => {
    setFontSize(LABEL_SOURCE_SIZE);
  }, [children, maxWidth]);

  return (
    <Text
      numberOfLines={1}
      allowFontScaling={false}
      adjustsFontSizeToFit
      minimumFontScale={COMPACT_SCALE}
      textBreakStrategy="simple"
      lineBreakStrategyIOS="standard"
      onTextLayout={(event) => {
        if (fontSize <= LABEL_COMPACT_SIZE) return;
        const line = event.nativeEvent.lines[0];
        if (!line) return;
        const shown = ellipsisTrim(line.text);
        const truncated = shown.length < children.length;
        // Only treat real overflow as a shrink; ~4px of free space must stay intact.
        const overflowed = Math.ceil(line.width) > maxWidth;
        if (truncated || overflowed) setFontSize(LABEL_COMPACT_SIZE);
      }}
      style={[
        style,
        {
          width: maxWidth,
          height: LABEL_LINE_HEIGHT,
          fontFamily: 'Rubik-Medium',
          fontSize,
          lineHeight: LABEL_LINE_HEIGHT,
          includeFontPadding: false,
        },
      ]}
    >
      {children}
    </Text>
  );
}
