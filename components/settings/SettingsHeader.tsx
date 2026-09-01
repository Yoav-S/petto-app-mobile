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
}

/**
 * Settings-style header. Owns top inset like ScreenHeader so it matches
 * Add Health title height. Parent must NOT pad the top safe area.
 */
export default function SettingsHeader({ title }: SettingsHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const paddingTop = useHeaderTopPadding();

  return (
    <View style={[styles.wrap, { paddingTop }]}>
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
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
      backgroundColor: c.background,
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
  });
