import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';

interface SettingsPlaceholderProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Shared surface for settings sub-screens that aren't built out yet. */
export default function SettingsPlaceholder({ title, icon = 'construct-outline' }: SettingsPlaceholderProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SettingsHeader title={title} />
      <View style={styles.body}>
        <Ionicons name={icon} size={40} color={Colors.secondaryText} />
        <Text style={styles.text}>{t('settings.coming_soon')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  text: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});
