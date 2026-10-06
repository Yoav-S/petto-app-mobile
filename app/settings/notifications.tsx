import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { t } from '@/i18n';
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from '@/services/notifications';
import { getErrorMessage } from '@/services/errors';
import SettingsHeader from '@/components/settings/SettingsHeader';
import Toggle from '@/components/settings/Toggle';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';

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
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();

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
      // Turning the master switch ON enables every category too (UI + server).
      const patch: Partial<NotificationPrefs> =
        key === 'all' && next
          ? {
              all: true,
              reminders: true,
              vaccine_updates: true,
              health_reminders: true,
              email_updates: true,
            }
          : { [key]: next };

      const previous = prefs;
      setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
      try {
        const saved = await updateNotificationPrefs(patch);
        setPrefs(saved);
      } catch (err) {
        setPrefs(previous);
        toast.showError(getErrorMessage(err));
      }
    },
    [prefs, toast],
  );

  const renderRow = (key: PrefKey, disabled: boolean) => (
    <View key={key} style={styles.row}>
      <Text style={styles.rowTitle}>{t(`settings.notif_${key}`)}</Text>
      <Toggle
        value={!!prefs?.[key]}
        onValueChange={(next) => toggle(key, next)}
        disabled={disabled}
      />
    </View>
  );

  return (
    <HeaderScrollLayout
      header={<SettingsHeader title={t('settings.notifications')} rounded />}
      contentGap={4}
      chromePaddingBottom={0}
    >
      {({ paddingTop, paddingBottom, scrollMetricsProps }) => (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            { paddingTop, paddingBottom: paddingBottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          onLayout={scrollMetricsProps.onLayout}
          onContentSizeChange={scrollMetricsProps.onContentSizeChange}
        >
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : error ? (
            <View style={styles.loader}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : prefs ? (
            <View style={styles.card}>
              <View style={styles.master}>
                <View style={styles.masterHeader}>
                  <Text style={styles.rowTitle}>{t('settings.notif_all')}</Text>
                  <Toggle value={prefs.all} onValueChange={(next) => toggle('all', next)} />
                </View>
                <Text style={styles.subtitle}>{t('settings.notif_all_subtitle')}</Text>
              </View>
              {CATEGORY_KEYS.map((key) => renderRow(key, !prefs.all))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </HeaderScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  loader: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    textAlign: 'center',
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.secondaryText,
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
  master: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
    backgroundColor: c.background,
  },
  masterHeader: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  row: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderRadius: 16,
    padding: 16,
    backgroundColor: c.background,
  },
  rowTitle: {
    flexShrink: 1,
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: c.secondaryText,
  },
});
