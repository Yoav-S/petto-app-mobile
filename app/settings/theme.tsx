import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';
import { useTheme, useThemedStyles, type ThemeMode } from '@/context/ThemeContext';
import SettingsHeader from '@/components/settings/SettingsHeader';

const OPTIONS: ThemeMode[] = ['light', 'dark', 'system'];

export default function ThemeSettingsScreen() {
  const { mode, setMode, colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SettingsHeader title={t('settings.theme')} />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.inner}>
            {OPTIONS.map((option, index) => {
              const selected = mode === option;
              return (
                <React.Fragment key={option}>
                  <Pressable
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
                  {index < OPTIONS.length - 1 ? <View style={styles.divider} /> : null}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 22,
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
