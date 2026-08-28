import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';

interface SettingsPlaceholderProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Shared surface for settings sub-screens that aren't built out yet. */
export default function SettingsPlaceholder({ title, icon = 'construct-outline' }: SettingsPlaceholderProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <HeaderScrollLayout header={<SettingsHeader title={title} />}>
      {({ paddingTop }) => (
        <View style={[styles.body, { paddingTop }]}>
          <Ionicons name={icon} size={40} color={colors.secondaryText} />
          <Text style={styles.text}>{t('settings.coming_soon')}</Text>
        </View>
      )}
    </HeaderScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },
  text: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 22,
    color: c.secondaryText,
    textAlign: 'center',
  },
});
