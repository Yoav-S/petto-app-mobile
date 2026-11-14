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
  TITLE_FROM_ARROW,
  type HeaderTitleFit,
} from '@/components/ui/HeaderTitle';

interface ScreenHeaderProps {
  title: string;
  /** Back chevron (default) or close X. */
  icon?: 'back' | 'close';
  onBack?: () => void;
  /** Optional trailing control (e.g. ⋮ menu). */
  right?: React.ReactNode;
  /** Kept for callers — titles always left-align and wrap only when needed. */
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
  const hasTrailing = right != null;
  const twoLines = useMemo(
    () => headerTitleNeedsTwoLines(title, width, fit, hasTrailing),
    [title, width, fit, hasTrailing],
  );
  const rowMinHeight = twoLines
    ? TITLE_LINE * 2 + HEADER_LAYOUT.paddingVertical * 2
    : layout.height;

  return (
    <View style={[styles.wrap, { paddingTop: layout.paddingTop }]}>
      <View
        style={[
          styles.container,
          {
            minHeight: rowMinHeight,
            paddingHorizontal: layout.paddingHorizontal,
            paddingVertical: layout.paddingVertical,
            gap: TITLE_FROM_ARROW,
            // Two-line titles: pin the first line to the arrow, don't center the block.
            alignItems: twoLines ? 'flex-start' : 'center',
          },
        ]}
      >
        <HeaderIconButton plain onPress={onBack ?? (() => router.back())}>
          <Ionicons
            name={icon === 'close' ? 'close' : 'chevron-back'}
            size={HEADER_ICON_BTN.iconSize}
            color={colors.primaryText}
          />
        </HeaderIconButton>

        <View
          style={[
            styles.titleSlot,
            twoLines ? { paddingTop: (HEADER_ICON_BTN.size - TITLE_LINE) / 2 } : null,
          ]}
        >
          <HeaderTitle fit={fit} hasTrailing={hasTrailing}>
            {title}
          </HeaderTitle>
        </View>

        {right}
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
      overflow: 'visible',
    },
    titleSlot: {
      flex: 1,
      minWidth: 0,
    },
  });
