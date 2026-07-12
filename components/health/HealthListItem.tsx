import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

interface HealthListItemProps {
  title: string;
  subtitle: string;
  dateOrTime: string;
  photoUrl?: string | null;
  reminderDate?: string | null;
  reminderTime?: string | null;
  noteId?: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
  onPhotoPress?: () => void;
  onReminderPress?: () => void;
}

function reminderDisplayValue(date?: string | null, time?: string | null): string | null {
  const parts = [date, time].filter(Boolean);
  return parts.length > 0 ? parts.join(' • ') : null;
}

export default function HealthListItem({
  title,
  subtitle,
  dateOrTime,
  photoUrl,
  reminderDate,
  reminderTime,
  noteId,
  onPress,
  onLongPress,
  onPhotoPress,
  onReminderPress,
}: HealthListItemProps) {
  const reminderValue = reminderDisplayValue(reminderDate, reminderTime);
  const rtl = I18nManager.isRTL;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>

        {reminderValue ? (
          <View style={[styles.reminderRow, rtl && styles.reminderRowRtl]}>
            <Text style={styles.reminderLabel}>{t('health.reminder_label')}</Text>
            <Text style={[styles.reminderValue, rtl && styles.reminderValueRtl]} numberOfLines={1}>
              {reminderValue}
            </Text>
          </View>
        ) : null}

        <View style={[styles.bottomRow, rtl && styles.bottomRowRtl]}>
          <Text style={styles.dateOrTime}>{dateOrTime}</Text>
          {noteId ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onPhotoPress}
                hitSlop={8}
                activeOpacity={0.7}
                disabled={!onPhotoPress}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photoThumb} contentFit="cover" />
                ) : (
                  <Ionicons name="image-outline" size={22} color={Colors.secondaryText} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onReminderPress}
                hitSlop={8}
                activeOpacity={0.7}
                disabled={!onReminderPress}
              >
                <Ionicons name="notifications-outline" size={22} color={Colors.secondaryText} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: 6,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: Colors.primaryText,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryText,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reminderRowRtl: {
    flexDirection: 'row-reverse',
  },
  reminderLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryText,
    flexShrink: 0,
  },
  reminderValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryText,
    flex: 1,
    textAlign: 'right',
  },
  reminderValueRtl: {
    textAlign: 'left',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bottomRowRtl: {
    flexDirection: 'row-reverse',
  },
  dateOrTime: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.secondaryText,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    height: 24,
  },
  photoThumb: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
});
