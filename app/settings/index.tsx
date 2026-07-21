import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t, currentLocale } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import SettingsHeader from '@/components/settings/SettingsHeader';

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
  { key: 'help', route: '/settings/help' },
  { key: 'privacy', route: '/settings/privacy' },
  { key: 'terms', route: '/settings/terms' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  const languageLabel = t(`settings.language_${currentLocale}`);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SettingsHeader title={t('settings.title')} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
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
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.signOutText}>{t('common.sign_out')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
    color: '#EF4444',
  },
});
