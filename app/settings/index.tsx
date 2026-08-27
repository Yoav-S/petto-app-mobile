import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t, currentLocale } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

interface SettingsRow {
  key: string;
  route: string;
  value?: string;
}

const ROWS: SettingsRow[] = [
  { key: 'account', route: '/settings/account' },
  { key: 'notifications', route: '/settings/notifications' },
  { key: 'theme', route: '/settings/theme' },
  { key: 'language', route: '/settings/language' },
  { key: 'subscription', route: '/settings/subscription' },
  { key: 'privacy', route: '/settings/privacy' },
  { key: 'terms', route: '/settings/terms' },
  { key: 'help', route: '/settings/help' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  const languageLabel = t(`settings.language_${currentLocale}`);

  return (
    <HeaderScrollScreen
      header={<SettingsHeader title={t('settings.title')} />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <View style={styles.inner}>
          {ROWS.map((row, index) => (
            <React.Fragment key={row.key}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(row.route as never)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.rowLabel}>{t(`settings.${row.key}`)}</Text>
                <View style={styles.rowRight}>
                  {row.key === 'language' ? (
                    <Text style={styles.rowValue}>{languageLabel}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
                </View>
              </TouchableOpacity>
              {index < ROWS.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.signOut}
        onPress={() => void signOut()}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Feather name="log-out" size={24} color={colors.error} />
        <Text style={styles.signOutText}>{t('common.sign_out')}</Text>
      </TouchableOpacity>
    </HeaderScrollScreen>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  content: {
    flexGrow: 1,
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
    gap: 12,
  },
  row: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
  },
  rowLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    color: c.primaryText,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: c.secondaryText,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingVertical: 8,
  },
  signOutText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.error,
  },
});
