import React, { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { HEADER_LAYOUT } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';

/** Kept for callers. */
export type HeaderTitleFit = 'oneLine' | 'wrap';

interface HeaderTitleProps {
  children: string;
  fit?: HeaderTitleFit;
}

const TITLE_MAX = 24;
const TITLE_LINE = 28;

export type HeaderTitleLayout = {
  display: string;
  align: 'left' | 'center';
  fontSize: number;
  lineHeight: number;
  singleWord: boolean;
  lines: 1 | 2;
};

export function titleBoxWidth(windowWidth: number, multiWord = false): number {
  // Multi-word titles drop the empty trailing spacer (~32) for more room.
  const trailing = multiWord ? 0 : HEADER_ICON_BTN.size;
  return Math.max(
    0,
    windowWidth -
      HEADER_LAYOUT.paddingHorizontal * 2 -
      HEADER_ICON_BTN.size -
      HEADER_LAYOUT.iconTitleGap -
      trailing,
  );
}

export function headerTitleNeedsTwoLines(
  _title: string,
  _windowWidth: number,
  _fit: HeaderTitleFit = 'wrap',
): boolean {
  return false;
}

/** Fixed 24 / 28 — same for Topics and Reminders. One line, never shrinks. */
export default function HeaderTitle({ children, fit: _fit = 'wrap' }: HeaderTitleProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const title = useMemo(() => children.replace(/\s+/g, ' ').trim(), [children]);
  const singleWord = title.split(' ').filter(Boolean).length <= 1;

  return (
    <View style={styles.box}>
      <Text
        style={[
          styles.title,
          {
            color: colors.primaryText,
            textAlign: singleWord ? 'center' : 'left',
            fontSize: TITLE_MAX,
            lineHeight: TITLE_LINE,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="clip"
        allowFontScaling={false}
        textBreakStrategy="simple"
        lineBreakStrategyIOS="standard"
        android_hyphenationFrequency="none"
      >
        {title}
      </Text>
    </View>
  );
}

export function layoutHeaderTitle(
  title: string,
  _boxWidth: number,
  _fit: HeaderTitleFit = 'wrap',
): HeaderTitleLayout {
  const trimmed = title.replace(/\s+/g, ' ').trim();
  const singleWord = trimmed.split(' ').filter(Boolean).length <= 1;
  return {
    display: trimmed,
    align: singleWord ? 'center' : 'left',
    fontSize: TITLE_MAX,
    lineHeight: TITLE_LINE,
    singleWord,
    lines: 1,
  };
}

/** @deprecated Prefer layoutHeaderTitle */
export function wrapHeaderTitle(title: string, boxWidth: number): string {
  return layoutHeaderTitle(title, boxWidth).display;
}

const makeStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    box: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      minHeight: TITLE_LINE,
    },
    title: {
      width: '100%',
      minHeight: TITLE_LINE,
      fontFamily: 'Rubik-Regular',
      fontSize: TITLE_MAX,
      lineHeight: TITLE_LINE,
      includeFontPadding: false,
    },
  });
