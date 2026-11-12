import React, { useMemo } from 'react';
import { Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { HEADER_LAYOUT } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import { estimateTextWidth, wrapTextAtWords } from '@/utils/textWidth';

/** Kept for callers — titles are always left + full size. */
export type HeaderTitleFit = 'oneLine' | 'wrap';

interface HeaderTitleProps {
  children: string;
  fit?: HeaderTitleFit;
  /** When true, a real trailing control is present (⋮). Otherwise title uses full width. */
  hasTrailing?: boolean;
}

const TITLE_MAX = 24;
const TITLE_LINE = 28;
/** Gap from the back/close chip to the title — fixed cross-app. */
export const TITLE_FROM_ARROW = 16;

export type HeaderTitleLayout = {
  display: string;
  align: 'left';
  fontSize: number;
  lineHeight: number;
  singleWord: boolean;
  lines: 1 | 2;
};

export function titleBoxWidth(windowWidth: number, hasTrailing = false): number {
  return Math.max(
    0,
    windowWidth -
      HEADER_LAYOUT.paddingHorizontal * 2 -
      HEADER_ICON_BTN.size -
      TITLE_FROM_ARROW -
      (hasTrailing ? HEADER_ICON_BTN.size : 0),
  );
}

export function headerTitleNeedsTwoLines(
  title: string,
  windowWidth: number,
  _fit: HeaderTitleFit = 'wrap',
  hasTrailing = false,
): boolean {
  return layoutHeaderTitle(title, titleBoxWidth(windowWidth, hasTrailing)).lines === 2;
}

/**
 * Cross-app header title:
 * - Always left-aligned
 * - 16px from the back arrow (via parent gap)
 * - Full 24px — never shrinks for short titles
 * - Uses the full line; wraps at a space only when needed so no word is cut
 */
export default function HeaderTitle({
  children,
  fit: _fit = 'wrap',
  hasTrailing = false,
}: HeaderTitleProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { width: windowWidth } = useWindowDimensions();
  const title = useMemo(() => children.replace(/\s+/g, ' ').trim(), [children]);
  const boxWidth = useMemo(
    () => titleBoxWidth(windowWidth, hasTrailing),
    [windowWidth, hasTrailing],
  );
  const layout = useMemo(
    () => layoutHeaderTitle(title, boxWidth),
    [title, boxWidth],
  );
  const rows = useMemo(
    () => layout.display.split('\n').map((row) => row.trim()).filter(Boolean),
    [layout.display],
  );

  return (
    <View
      style={[
        styles.box,
        { minHeight: TITLE_LINE * Math.max(1, rows.length) },
      ]}
    >
      {rows.map((row, index) => (
        <Text
          key={`${index}-${row}`}
          style={[
            styles.title,
            {
              color: colors.primaryText,
              fontSize: TITLE_MAX,
              height: TITLE_LINE,
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
          {row}
        </Text>
      ))}
    </View>
  );
}

export function layoutHeaderTitle(
  title: string,
  boxWidth: number,
  _fit: HeaderTitleFit = 'wrap',
): HeaderTitleLayout {
  const trimmed = title.replace(/\s+/g, ' ').trim();
  const words = trimmed.split(' ').filter(Boolean);
  const singleWord = words.length <= 1;

  if (!trimmed) {
    return {
      display: '',
      align: 'left',
      fontSize: TITLE_MAX,
      lineHeight: TITLE_LINE,
      singleWord: true,
      lines: 1,
    };
  }

  // One token: always one full-size left line (never center).
  if (singleWord || boxWidth <= 0) {
    return {
      display: trimmed,
      align: 'left',
      fontSize: TITLE_MAX,
      lineHeight: TITLE_LINE,
      singleWord,
      lines: 1,
    };
  }

  // Fits on one line → one line. Otherwise wrap at a space so every word shows.
  if (estimateTextWidth(trimmed, TITLE_MAX) <= boxWidth) {
    return {
      display: trimmed,
      align: 'left',
      fontSize: TITLE_MAX,
      lineHeight: TITLE_LINE,
      singleWord: false,
      lines: 1,
    };
  }

  const wrapped =
    wrapTextAtWords(trimmed, boxWidth, TITLE_MAX) ??
    `${words[0]}\n${words.slice(1).join(' ')}`;

  return {
    display: wrapped,
    align: 'left',
    fontSize: TITLE_MAX,
    lineHeight: TITLE_LINE,
    singleWord: false,
    lines: 2,
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
      // Top-align so line 1 sits with the back arrow; line 2 grows downward.
      justifyContent: 'flex-start',
      overflow: 'visible',
    },
    title: {
      width: '100%',
      fontFamily: 'Rubik-Regular',
      textAlign: 'left',
      includeFontPadding: false,
    },
  });
