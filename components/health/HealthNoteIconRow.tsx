import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/context/ThemeContext';
import { t } from '@/i18n';

interface HealthNoteIconRowProps {
  iconSize?: number;
  gap?: number;
  onPhotoPress?: () => void;
  onReminderPress?: () => void;
}

export default function HealthNoteIconRow({
  iconSize = 24,
  gap = 16,
  onPhotoPress,
  onReminderPress,
}: HealthNoteIconRowProps) {
  const colors = useColors();
  return (
    <View style={[styles.row, { gap }]}>
      <TouchableOpacity
        onPress={onPhotoPress}
        hitSlop={8}
        activeOpacity={0.7}
        accessibilityLabel={t('health.add_photo')}
      >
        <Ionicons name="image-outline" size={iconSize} color={colors.secondaryText} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onReminderPress}
        hitSlop={8}
        activeOpacity={0.7}
        accessibilityLabel={t('health.add_reminder')}
      >
        <Ionicons name="notifications-outline" size={iconSize} color={colors.secondaryText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 12,
  },
});
