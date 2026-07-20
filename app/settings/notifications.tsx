import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from '@/services/notifications';
import { getErrorMessage } from '@/services/errors';
import SettingsHeader from '@/components/settings/SettingsHeader';
import Toggle from '@/components/settings/Toggle';

type PrefKey = keyof NotificationPrefs;

const CATEGORY_KEYS: PrefKey[] = [
  'reminders',
  'vaccine_updates',
  'health_reminders',
  'email_updates',
];

export default function NotificationsSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setPrefs(await getNotificationPrefs());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (key: PrefKey, next: boolean) => {
      setPrefs((prev) => (prev ? { ...prev, [key]: next } : prev));
      try {
        await updateNotificationPrefs({ [key]: next });
      } catch (err) {
        // Revert on failure so the UI never lies about the saved state.
        setPrefs((prev) => (prev ? { ...prev, [key]: !next } : prev));
        Alert.alert(t('common.error'), getErrorMessage(err));
      }
    },
    [],
  );

  const renderRow = (key: PrefKey, disabled: boolean) => (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{t(`settings.notif_${key}`)}</Text>
      <Toggle
        value={!!prefs?.[key]}
        onValueChange={(next) => toggle(key, next)}
        disabled={disabled}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SettingsHeader title={t('settings.notifications')} />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={Colors.brand} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : prefs ? (
          <View style={styles.card}>
            <View style={styles.inner}>
              <View style={styles.masterSection}>
                <View style={styles.masterHeader}>
                  <Text style={styles.rowTitle}>{t('settings.notif_all')}</Text>
                  <Toggle value={prefs.all} onValueChange={(next) => toggle('all', next)} />
                </View>
                <Text style={styles.subtitle}>{t('settings.notif_all_subtitle')}</Text>
              </View>

              {CATEGORY_KEYS.map((key) => (
                <React.Fragment key={key}>
                  <View style={styles.divider} />
                  {renderRow(key, !prefs.all)}
                </React.Fragment>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  loader: {
    marginTop: 40,
  },
  error: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
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
  inner: {
    gap: 22,
  },
  masterSection: {
    gap: 6,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  rowTitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.primaryText,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.secondaryText,
    maxWidth: 210,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
