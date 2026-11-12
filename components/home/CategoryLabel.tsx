import React, { useMemo } from 'react';
import { Text, View, StyleSheet, type TextStyle } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { LABEL_LINE_HEIGHT, LABEL_SOURCE_SIZE } from '@/components/ui/FitLabel';
import { formatPlaceCategoryText } from '@/utils/placeCategoryLabel';
import { estimateTextWidth, wrapTextAtWords } from '@/utils/textWidth';

/** Inner text box: 126 card − 12px left − 12px right. */
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
 * Full 16px. One line when it fits.
 * Only wraps at a space when the phrase is wider than the tile — never mid-word,
 * never forced two-line splits for short labels.
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
    () => formatPlaceCategoryText(children.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()),
    [children],
  );

  const rows = useMemo(() => {
    if (!label) return [] as string[];
    const words = label.split(' ').filter(Boolean);
    if (words.length <= 1) return [label];
    if (estimateTextWidth(label, LABEL_SOURCE_SIZE) <= CATEGORY_LABEL_WIDTH) {
      return [label];
    }
    const wrapped =
      wrapTextAtWords(label, CATEGORY_LABEL_WIDTH, LABEL_SOURCE_SIZE) ??
      `${words[0]}\n${words.slice(1).join(' ')}`;
    return wrapped.split('\n').map((row) => row.trim()).filter(Boolean);
  }, [label]);

  const oneLine = rows.length <= 1;

  return (
    <View style={[styles.slot, oneLine ? styles.slotOneLine : null]}>
      {rows.map((row, index) => (
        <Line key={`${index}-${row}`} text={row} style={style} />
      ))}
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
