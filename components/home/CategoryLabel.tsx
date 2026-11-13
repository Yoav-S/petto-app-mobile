import React, { useMemo } from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { formatPlaceCategoryText } from '@/utils/placeCategoryLabel';
import { layoutCategoryTileLabel } from '@/utils/textWidth';

/**
 * Figma category tile type:
 * - EN / HE: Rubik Medium 16 / 20
 * - RU / RO: Rubik Medium 14 / 20 (longer copy)
 *
 * Word layout (any language):
 * - 1 word → one line
 * - 2 words → one line when it fits, else split
 * - 3+ words → first word on top, remaining on bottom
 */
const CATEGORY_LINE_HEIGHT = 20;
/** Matches CategoryTile: width 126 − padLeft 12 − padRight 0. */
const DEFAULT_LABEL_WIDTH = 114;

export default function CategoryLabel({
  children,
  maxWidth = DEFAULT_LABEL_WIDTH,
  style,
}: {
  children: string;
  maxWidth?: number;
  style?: TextStyle;
}) {
  const { locale } = useLocale();
  const styles = useThemedStyles(makeStyles);
  const maxFontSize = locale === 'ru' || locale === 'ro' ? 14 : 16;
  const label = useMemo(
    () => formatPlaceCategoryText(children.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()),
    [children],
  );
  const layout = useMemo(
    () => layoutCategoryTileLabel(label, maxWidth, maxFontSize),
    [label, maxFontSize, maxWidth],
  );

  return (
    <Text
      style={[
        styles.label,
        {
          fontSize: layout.fontSize,
          minHeight: CATEGORY_LINE_HEIGHT * layout.lines,
        },
        style,
      ]}
      numberOfLines={layout.lines}
      ellipsizeMode="clip"
      allowFontScaling={false}
      maxFontSizeMultiplier={1}
      textBreakStrategy="simple"
      lineBreakStrategyIOS="standard"
      android_hyphenationFrequency="none"
    >
      {layout.display}
    </Text>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    label: {
      alignSelf: 'stretch',
      width: '100%',
      margin: 0,
      padding: 0,
      fontFamily: 'Rubik-Medium',
      lineHeight: CATEGORY_LINE_HEIGHT,
      letterSpacing: 0,
      color: c.primaryText,
      includeFontPadding: false,
      textAlign: 'left',
      textAlignVertical: 'center',
    },
  });
