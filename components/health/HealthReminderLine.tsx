import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { t, currentLocale } from '@/i18n';
import { formatHealthReminderValue } from '@/utils/calendar';

interface HealthReminderLineProps {
  date?: string | null;
  time?: string | null;
  style?: TextStyle;
  numberOfLines?: number;
}

export default function HealthReminderLine({
  date,
  time,
  style,
  numberOfLines = 1,
}: HealthReminderLineProps) {
  const value = formatHealthReminderValue(date, time, {
    today: t('common.today'),
    tomorrow: t('health.reminder_tomorrow'),
    sentSuccessfully: t('health.reminder_sent_successfully'),
  }, currentLocale);

  if (!value) return null;

  return (
    <Text style={[styles.row, style]} numberOfLines={numberOfLines} ellipsizeMode="tail">
      <Text style={styles.label}>{t('health.reminder_label')} </Text>
      <Text style={styles.value}>{value}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexShrink: 1,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryText,
  },
  value: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryText,
  },
});
