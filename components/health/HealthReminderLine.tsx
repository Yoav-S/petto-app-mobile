import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t, currentLocale } from '@/i18n';
import { formatHealthReminderValue } from '@/utils/calendar';

interface HealthReminderLineProps {
  date?: string | null;
  time?: string | null;
  style?: TextStyle;
  numberOfLines?: number;
  showLabel?: boolean;
  compact?: boolean;
}

export default function HealthReminderLine({
  date,
  time,
  style,
  numberOfLines = 1,
  showLabel = true,
  compact = false,
}: HealthReminderLineProps) {
  const styles = useThemedStyles(makeStyles);
  const value = formatHealthReminderValue(date, time, {
    today: t('common.today'),
    tomorrow: t('topics.reminder_tomorrow'),
    sentSuccessfully: t('topics.reminder_sent_successfully'),
  }, currentLocale);

  if (!value) return null;

  return (
    <Text style={[styles.row, style]} numberOfLines={numberOfLines} ellipsizeMode="tail">
      {showLabel ? <Text style={styles.label}>{t('topics.reminder_label')} </Text> : null}
      <Text style={[styles.value, compact && styles.compactValue]}>{value}</Text>
    </Text>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  row: {
    flexShrink: 1,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
  },
  value: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
  },
  compactValue: {
    fontSize: 12,
    lineHeight: 16,
    color: c.secondaryText,
  },
});
