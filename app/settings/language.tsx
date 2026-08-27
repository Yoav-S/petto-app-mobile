import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { t, type AppLocale } from '@/i18n';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

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
      header={<SettingsHeader title={t('settings.language')} />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <View style={styles.inner}>
          {OPTIONS.map((option, index) => {
            const selected = locale === option.code;
            return (
              <React.Fragment key={option.code}>
                <Pressable
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
                {index < OPTIONS.length - 1 ? <View style={styles.divider} /> : null}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </HeaderScrollScreen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 2,
    },
    inner: {
      gap: 22,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 24,
    },
    rowLabel: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    checkboxChecked: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
    },
  });
