import React, { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

/** Figma source for pet and category labels. */
export const LABEL_SOURCE_SIZE = 16;
/** Longer copy (e.g. Russian «Ветеринария») stays on one line at this size. */
export const LABEL_COMPACT_SIZE = 14;
export const LABEL_LINE_HEIGHT = 20;

/**
 * Source size is 16/20. If this one string is wider than the tile,
 * this label only drops to 14/20. The tile width never changes.
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
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    setCompact(false);
  }, [children, maxWidth]);

  return (
    <>
      <Text
        pointerEvents="none"
        onLayout={(event) => {
          setCompact(Math.ceil(event.nativeEvent.layout.width) > maxWidth);
        }}
        style={{
          position: 'absolute',
          left: -9999,
          opacity: 0,
          fontFamily: 'Rubik-Medium',
          fontSize: LABEL_SOURCE_SIZE,
          lineHeight: LABEL_LINE_HEIGHT,
          includeFontPadding: false,
        }}
      >
        {children}
      </Text>
      <Text
        numberOfLines={1}
        style={[
          style,
          {
            width: maxWidth,
            overflow: 'hidden',
            fontFamily: 'Rubik-Medium',
            fontSize: compact ? LABEL_COMPACT_SIZE : LABEL_SOURCE_SIZE,
            lineHeight: LABEL_LINE_HEIGHT,
            includeFontPadding: false,
          },
        ]}
      >
        {children}
      </Text>
    </>
  );
}
