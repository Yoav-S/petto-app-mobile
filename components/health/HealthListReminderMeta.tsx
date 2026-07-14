import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { t, currentLocale } from '@/i18n';
import { formatHealthReminderValue } from '@/utils/calendar';

/** Figma bell footprint ~12×13.3 inside a 16×16 tap area. */
const ICON_BOX = 16;
const ICON_SIZE = 13.33;

interface HealthListReminderMetaProps {
  date?: string | null;
  time?: string | null;
  scale?: number;
  style?: ViewStyle;
}

export default function HealthListReminderMeta({
  date,
  time,
  scale = 1,
  style,
}: HealthListReminderMetaProps) {
  const hasReminder = Boolean(date || time);
  const value = hasReminder
    ? formatHealthReminderValue(date, time, {
        today: t('common.today'),
        tomorrow: t('health.reminder_tomorrow'),
        sentSuccessfully: t('health.reminder_sent_successfully'),
      }, currentLocale)
    : t('health.no_reminder_for_note');

  const box = ICON_BOX * scale;
  const iconSize = ICON_SIZE * scale;
  const padTop = 1.33 * scale;
  const padLeft = 2 * scale;

  return (
    <View style={[styles.row, style]}>
      <View
        style={{
          width: box,
          height: box,
          paddingTop: padTop,
          paddingLeft: padLeft,
          marginRight: 4 * scale,
        }}
      >
        <Ionicons name="notifications-outline" size={iconSize} color={Colors.secondaryText} />
      </View>
      <Text
        style={[styles.value, { fontSize: 14 * scale, lineHeight: 20 * scale }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  value: {
    fontFamily: 'Rubik-Regular',
    color: Colors.secondaryText,
    flexShrink: 1,
  },
});
