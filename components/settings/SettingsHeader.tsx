import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { HEADER_LAYOUT } from '@/constants/layout';
import { useHeaderTopPadding } from '@/utils/headerLayout';
import HeaderIconButton, {
  HEADER_ICON_BTN,
} from '@/components/ui/HeaderIconButton';
import HeaderTitle, {
  headerTitleNeedsTwoLines,
  TITLE_FROM_ARROW,
} from '@/components/ui/HeaderTitle';

interface SettingsHeaderProps {
  title: string;
  backgroundColor?: string;
  /** White title card with rounded bottom corners. */
  rounded?: boolean;
  /** Bottom padding of the rounded card. Default keeps the shared header height. */
  roundedBottom?: number;
}

const TITLE_LINE = 28;

/**
 * Settings-style header. Owns top inset like ScreenHeader.
 * Titles are left-aligned, 16px from the arrow, full line width.
 */
export default function SettingsHeader({
  title,
  backgroundColor,
  rounded = false,
  roundedBottom = 22,
}: SettingsHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const paddingTop = useHeaderTopPadding();
  const { width } = useWindowDimensions();
  const twoLines = useMemo(
    () => headerTitleNeedsTwoLines(title, width, 'wrap', false),
    [title, width],
  );
  const rowMinHeight = twoLines
    ? TITLE_LINE * 2 + HEADER_LAYOUT.paddingVertical * 2
    : HEADER_LAYOUT.height;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          { paddingTop },
          backgroundColor ? { backgroundColor } : null,
          rounded ? [styles.rounded, { paddingBottom: roundedBottom }] : null,
        ]}
      >
        <View
          style={[
            styles.header,
            {
              minHeight: rowMinHeight,
              // Two-line titles: keep the first line level with the back arrow.
              alignItems: twoLines ? 'flex-start' : 'center',
            },
          ]}
        >
          <HeaderIconButton
            onPress={() => router.back()}
            accessibilityLabel={t('petOnboarding.back')}
          >
            <Ionicons name="chevron-back" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
          </HeaderIconButton>

          <View
            style={[
              styles.titleSlot,
              twoLines ? { paddingTop: (HEADER_ICON_BTN.size - TITLE_LINE) / 2 } : null,
            ]}
          >
            <HeaderTitle hasTrailing={false}>{title}</HeaderTitle>
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
      backgroundColor: c.background,
      overflow: 'visible',
    },
    header: {
      flexDirection: 'row',
      paddingHorizontal: HEADER_LAYOUT.paddingHorizontal,
      paddingVertical: HEADER_LAYOUT.paddingVertical,
      gap: TITLE_FROM_ARROW,
      overflow: 'visible',
    },
    titleSlot: {
      flex: 1,
      minWidth: 0,
    },
    rounded: {
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
  });
