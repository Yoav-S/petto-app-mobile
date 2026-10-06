import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { t, type AppLocale } from '@/i18n';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';

const OPTIONS: { code: AppLocale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ro', label: 'Română' },
  { code: 'ru', label: 'Русский' },
];

export default function LanguageSettingsScreen() {
  const { locale, setLocale } = useLocale();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <HeaderScrollScreen
      header={<SettingsHeader title={t('settings.language')} rounded />}
      contentGap={4}
      chromePaddingBottom={0}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        {OPTIONS.map((option) => {
          const selected = locale === option.code;
          return (
            <Pressable
              key={option.code}
              style={styles.row}
              onPress={() => setLocale(option.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={styles.rowLabel}>{option.label}</Text>
              <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                {selected && (
                  <Ionicons name="checkmark" size={16} color={colors.button.primaryText} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </HeaderScrollScreen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingRight: 20,
      paddingBottom: 22,
      paddingLeft: 20,
      gap: 4,
    },
    row: {
      minHeight: 56,
      boxSizing: 'border-box',
      borderRadius: 16,
      padding: 16,
      backgroundColor: c.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    rowLabel: {
      flexShrink: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    checkbox: {
      width: 20,
      height: 20,
      margin: 2,
      boxSizing: 'border-box',
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    checkboxChecked: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
  });
