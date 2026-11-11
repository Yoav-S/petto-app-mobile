import React, { useMemo } from 'react';
import { Text, View, StyleSheet, type TextStyle } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { LABEL_LINE_HEIGHT, LABEL_SOURCE_SIZE } from '@/components/ui/FitLabel';

/** Inner text box inside the 126-wide card (12px padding each side). */
export const CATEGORY_LABEL_WIDTH = 102;
const LABEL_SLOT_HEIGHT = LABEL_LINE_HEIGHT * 2;

function Line({
  text,
  style,
}: {
  text: string;
  style?: TextStyle;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Text
      style={[styles.line, style]}
      numberOfLines={1}
      ellipsizeMode="clip"
      allowFontScaling={false}
      textBreakStrategy="simple"
      android_hyphenationFrequency="none"
    >
      {text}
    </Text>
  );
}

/**
 * Category tiles at full 16px — never shrinks.
 * One word → bottom row.
 * Two+ words → first word on line 1, the rest on line 2 (always both visible).
 */
export default function CategoryLabel({
  children,
  style,
}: {
  children: string;
  style?: TextStyle;
}) {
  const styles = useThemedStyles(makeStyles);
  const label = useMemo(
    () => children.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim(),
    [children],
  );
  const words = useMemo(() => label.split(' ').filter(Boolean), [label]);
  const line1 = words[0] ?? '';
  const line2 = words.length > 1 ? words.slice(1).join(' ') : '';

  if (!line2) {
    return (
      <View style={[styles.slot, styles.slotOneLine]}>
        <Line text={line1} style={style} />
      </View>
    );
  }

  return (
    <View style={styles.slot}>
      <Line text={line1} style={style} />
      <Line text={line2} style={style} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    slot: {
      width: '100%',
      height: LABEL_SLOT_HEIGHT,
      flexShrink: 0,
      justifyContent: 'flex-start',
    },
    slotOneLine: {
      justifyContent: 'flex-end',
    },
    line: {
      width: '100%',
      height: LABEL_LINE_HEIGHT,
      fontFamily: 'Rubik-Medium',
      fontSize: LABEL_SOURCE_SIZE,
      lineHeight: LABEL_LINE_HEIGHT,
      color: c.primaryText,
      includeFontPadding: false,
      textAlign: 'left',
    },
  });
