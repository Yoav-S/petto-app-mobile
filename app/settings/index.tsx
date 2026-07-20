import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
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
          {ROWS.map((row, index) => (
            <TouchableOpacity
              key={row.key}
              style={[styles.row, index < ROWS.length - 1 && styles.rowSpacing]}
              onPress={() => router.push(row.route as never)}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>{t(`settings.${row.key}`)}</Text>
              <View style={styles.rowRight}>
                {row.key === 'language' ? (
                  <Text style={styles.rowValue}>{languageLabel}</Text>
                ) : null}
                <Ionicons name="chevron-forward" size={20} color={Colors.secondaryText} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.signOut}
          onPress={() => void signOut()}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          <Text style={styles.signOutText}>{t('common.sign_out')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  row: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowSpacing: {
    marginBottom: 12,
  },
  rowLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: Colors.primaryText,
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
    color: Colors.secondaryText,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 8,
  },
  signOutText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: Colors.error,
  },
});
