import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';
import { useTheme, useThemedStyles, type ThemeMode } from '@/context/ThemeContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';

const OPTIONS: ThemeMode[] = ['light', 'dark', 'system'];

export default function ThemeSettingsScreen() {
  const { mode, setMode, colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <HeaderScrollScreen
      header={<SettingsHeader title={t('settings.theme')} rounded />}
      contentGap={4}
      chromePaddingBottom={0}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        {OPTIONS.map((option) => {
          const selected = mode === option;
          return (
            <Pressable
              key={option}
              style={styles.row}
              onPress={() => setMode(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={styles.rowLabel}>{t(`settings.theme_${option}`)}</Text>
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
