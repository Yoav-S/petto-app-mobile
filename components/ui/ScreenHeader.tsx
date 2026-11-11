import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { HEADER_LAYOUT } from '@/constants/layout';
import { useHeaderLayout } from '@/utils/headerLayout';
import HeaderIconButton, {
  HEADER_ICON_BTN,
} from '@/components/ui/HeaderIconButton';
import HeaderTitle, {
  headerTitleNeedsTwoLines,
  type HeaderTitleFit,
} from '@/components/ui/HeaderTitle';

interface ScreenHeaderProps {
  title: string;
  /** Back chevron (default) or close X. */
  icon?: 'back' | 'close';
  onBack?: () => void;
  /** Optional trailing control (e.g. ⋮ menu). Replaces the layout spacer. */
  right?: React.ReactNode;
  /**
   * oneLine — Reminders: keep multi-word titles on one line.
   * wrap — Topics: wrap at a space so both words show.
   */
  fit?: HeaderTitleFit;
}

const TITLE_LINE = 28;

export default function ScreenHeader({
  title,
  icon = 'back',
  onBack,
  right,
  fit = 'wrap',
}: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const layout = useHeaderLayout();
  const { width } = useWindowDimensions();
  const twoLines = useMemo(
    () => headerTitleNeedsTwoLines(title, width, fit),
    [title, width, fit],
  );
  const rowMinHeight = twoLines
    ? TITLE_LINE * 2 + HEADER_LAYOUT.paddingVertical * 2
    : layout.height;
  // Empty right spacer only balances single-word titles. Two-word titles are
  // left-aligned — drop it so they can use that ~32pt of free space.
  const multiWord = title.trim().split(/\s+/).filter(Boolean).length > 1;
  const trailing = right ?? (multiWord ? null : <View style={styles.spacer} />);

  return (
    <View style={[styles.wrap, { paddingTop: layout.paddingTop }]}>
      <View
        style={[
          styles.container,
          {
            minHeight: rowMinHeight,
            paddingHorizontal: layout.paddingHorizontal,
            paddingVertical: layout.paddingVertical,
            gap: HEADER_LAYOUT.iconTitleGap,
          },
        ]}
      >
        <HeaderIconButton onPress={onBack ?? (() => router.back())}>
          <Ionicons
            name={icon === 'close' ? 'close' : 'chevron-back'}
            size={HEADER_ICON_BTN.iconSize}
            color={colors.primaryText}
          />
        </HeaderIconButton>

        <HeaderTitle fit={fit}>{title}</HeaderTitle>

        {trailing}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
      paddingBottom: 22,
      backgroundColor: c.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0x14 / 255,
      shadowRadius: 20,
      boxShadow: '0px 4px 20px rgba(45, 45, 42, 0.078)',
      elevation: 4,
      overflow: 'visible',
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'visible',
    },
    spacer: {
      width: HEADER_ICON_BTN.size,
      height: HEADER_ICON_BTN.size,
    },
  });
