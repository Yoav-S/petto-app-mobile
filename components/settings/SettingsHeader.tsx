import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { useHeaderTopPadding } from '@/utils/headerLayout';
import HeaderIconButton, {
  HEADER_ICON_BTN,
} from '@/components/ui/HeaderIconButton';

interface SettingsHeaderProps {
  title: string;
  backgroundColor?: string;
  /** White title card with rounded bottom corners. */
  rounded?: boolean;
  /** Bottom padding of the rounded card. Default keeps the shared header height. */
  roundedBottom?: number;
}

/**
 * Settings-style header. Owns top inset like ScreenHeader so it matches
 * Add Health title height. Parent must NOT pad the top safe area.
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

  return (
    <View style={styles.wrap}>
      <View
        style={[
          { paddingTop },
          backgroundColor ? { backgroundColor } : null,
          rounded ? [styles.rounded, { paddingBottom: roundedBottom }] : null,
        ]}
      >
        <View style={styles.header}>
          <HeaderIconButton
            onPress={() => router.back()}
            accessibilityLabel={t('petOnboarding.back')}
          >
            <Ionicons name="chevron-back" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
          </HeaderIconButton>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.rightSpacer} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
      backgroundColor: 'transparent',
    },
    header: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 6,
    },
    title: {
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      color: c.primaryText,
      textAlign: 'center',
    },
    rightSpacer: {
      width: HEADER_ICON_BTN.size,
      height: HEADER_ICON_BTN.size,
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
    },
  });
