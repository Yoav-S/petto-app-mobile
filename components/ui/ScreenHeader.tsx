import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useHeaderLayout } from '@/utils/headerLayout';
import HeaderIconButton, {
  HEADER_ICON_BTN,
} from '@/components/ui/HeaderIconButton';

interface ScreenHeaderProps {
  title: string;
  /** Back chevron (default) or close X. */
  icon?: 'back' | 'close';
  onBack?: () => void;
  /** Optional trailing control (e.g. ⋮ menu). Replaces the layout spacer. */
  right?: React.ReactNode;
}

/**
 * App-wide title row. Owns top safe-area + Figma gap so every screen matches
 * Add Health (header row at top: 56). Parent must NOT pad the top safe area.
 */
export default function ScreenHeader({ title, icon = 'back', onBack, right }: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const layout = useHeaderLayout();

  return (
    <View style={[styles.wrap, { paddingTop: layout.paddingTop, backgroundColor: colors.background }]}>
      <View
        style={[
          styles.container,
          {
            height: layout.height,
            paddingHorizontal: layout.paddingHorizontal,
            paddingVertical: layout.paddingVertical,
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

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {right ?? <View style={styles.spacer} />}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    spacer: {
      width: HEADER_ICON_BTN.size,
      height: HEADER_ICON_BTN.size,
    },
    title: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      color: c.primaryText,
      textAlign: 'center',
    },
  });
