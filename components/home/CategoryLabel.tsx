import React, { useEffect, useState } from 'react';
import { Platform, Text, View, StyleSheet, type TextStyle } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import FitLabel, {
  LABEL_COMPACT_SIZE,
  LABEL_LINE_HEIGHT,
  LABEL_SOURCE_SIZE,
} from '@/components/ui/FitLabel';

/** Inner text box inside the 126-wide card (12px padding each side). */
export const CATEGORY_LABEL_WIDTH = 102;
const LABEL_SLOT_HEIGHT = LABEL_LINE_HEIGHT * 2;

function hasWordBreak(value: string): boolean {
  return /[\s\n]/.test(value.trim());
}

/**
 * Two-line category title. One-word labels sit on the bottom line so they
 * share the baseline with two-line titles. Words never split mid-token —
 * single words shrink instead; multi-word copy wraps only at spaces.
 */
export default function CategoryLabel({
  children,
  style,
}: {
  children: string;
  style?: TextStyle;
}) {
  const styles = useThemedStyles(makeStyles);
  const label = children.replace(/\u00a0/g, ' ').trim();
  const multiWord = hasWordBreak(label);
  const [fontSize, setFontSize] = useState(LABEL_SOURCE_SIZE);

  useEffect(() => {
    setFontSize(LABEL_SOURCE_SIZE);
  }, [label]);

  if (!multiWord) {
    return (
      <View style={styles.slot}>
        <FitLabel maxWidth={CATEGORY_LABEL_WIDTH} style={[styles.single, style]}>
          {label}
        </FitLabel>
      </View>
    );
  }

  return (
    <View style={styles.slot}>
      <Text
        style={[styles.multi, style, { fontSize }]}
        numberOfLines={2}
        allowFontScaling={false}
        textBreakStrategy="simple"
        lineBreakStrategyIOS="standard"
        onTextLayout={(event) => {
          if (fontSize <= LABEL_COMPACT_SIZE) return;
          const lines = event.nativeEvent.lines;
          if (!lines.length) return;
          const brokeWord = lines.some((line, index) => {
            if (index === lines.length - 1) return false;
            const next = lines[index + 1]?.text?.trimStart() ?? '';
            if (!next) return false;
            // Real wraps end on a space/newline. Anything else is a mid-word split.
            return !(/\s$/u.test(line.text) || line.text.endsWith('\n'));
          });
          if (brokeWord) setFontSize(LABEL_COMPACT_SIZE);
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    slot: {
      width: '100%',
      height: LABEL_SLOT_HEIGHT,
      justifyContent: 'flex-end',
    },
    single: {
      textAlign: 'left',
      color: c.primaryText,
      ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
    },
    multi: {
      width: '100%',
      fontFamily: 'Rubik-Medium',
      lineHeight: LABEL_LINE_HEIGHT,
      color: c.primaryText,
      includeFontPadding: false,
    },
  });
