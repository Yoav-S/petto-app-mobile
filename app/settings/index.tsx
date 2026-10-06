import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t, currentLocale } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';
import { SignOutModal } from '@/components/ui/ConfirmModal';

interface SettingsRow {
  key: string;
  route: string;
}

const ROWS: SettingsRow[] = [
  { key: 'notifications', route: '/settings/notifications' },
  { key: 'theme', route: '/settings/theme' },
  { key: 'language', route: '/settings/language' },
  { key: 'help', route: '/settings/help' },
  { key: 'privacy', route: '/settings/privacy' },
  { key: 'terms', route: '/settings/terms' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const languageLabel = t(`settings.language_${currentLocale}`);

  return (
    <>
    <HeaderScrollScreen
      header={<SettingsHeader title={t('settings.title')} rounded />}
      contentGap={4}
      chromePaddingBottom={0}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        {ROWS.map((row) => (
          <TouchableOpacity
            key={row.key}
            style={styles.row}
            onPress={() => router.push(row.route as never)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.rowLabel} numberOfLines={1}>
              {t(`settings.${row.key}`)}
            </Text>
            <View style={styles.rowEnd}>
              {row.key === 'language' ? (
                <Text style={styles.rowValue}>{languageLabel}</Text>
              ) : null}
              <Ionicons name="chevron-forward" size={24} color={colors.primaryText} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.signOut}
        onPress={() => setSignOutVisible(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Feather name="log-out" size={24} color={colors.error} />
        <Text style={styles.signOutText}>{t('common.sign_out')}</Text>
      </TouchableOpacity>
    </HeaderScrollScreen>
    <SignOutModal
      visible={signOutVisible}
      onCancel={() => setSignOutVisible(false)}
      onConfirm={() => {
        setSignOutVisible(false);
        void signOut();
      }}
    />
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
    height: 56,
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
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
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
    paddingHorizontal: 20,
  },
  signOutText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.error,
  },
});
