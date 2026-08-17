import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t, isRTL } from '@/i18n';

export function useHealthNoteCardLayout() {
  return useMemo(() => ({
    cardWidth: '100%' as const,
    cardRadius: 12,
    cardPadTop: 14,
    cardPadH: 16,
    cardPadBottom: 20,
    innerGap: 12,
    imageHeight: 160,
    imageRadius: 12,
    iconRowHeight: 24,
    iconRowGap: 16,
  }), []);
}

interface HealthNoteEditorCardProps {
  noteText: string;
  onChangeNoteText: (text: string) => void;
  photoUri: string | null;
  onPickImage: () => void;
  reminderValue?: string | null;
  onReminderPress: () => void;
  onRemoveReminder?: () => void;
  placeholder?: string;
}

export default function HealthNoteEditorCard({
  noteText,
  onChangeNoteText,
  photoUri,
  onPickImage,
  reminderValue,
  onReminderPress,
  onRemoveReminder,
  placeholder,
}: HealthNoteEditorCardProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const layout = useHealthNoteCardLayout();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(photoUri) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [photoUri]);

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.cardRadius,
          paddingTop: layout.cardPadTop,
          paddingHorizontal: layout.cardPadH,
          paddingBottom: layout.cardPadBottom,
        },
      ]}
    >
      <View style={[styles.inner, { gap: layout.innerGap }]}>
        {showImage ? (
          <View
            style={{
              width: '100%',
              height: layout.imageHeight,
              borderRadius: layout.imageRadius,
              overflow: 'hidden',
              backgroundColor: colors.background,
            }}
          >
            <Image
              source={{ uri: photoUri! }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
              onError={() => setImageFailed(true)}
            />
          </View>
        ) : null}

        <TextInput
          style={styles.noteInput}
          value={noteText}
          onChangeText={onChangeNoteText}
          multiline
          placeholder={placeholder ?? t('topics.note_placeholder')}
          placeholderTextColor={colors.secondaryText}
          textAlignVertical="top"
        />

        {reminderValue ? (
          <View style={styles.reminderRow}>
            <TouchableOpacity
              style={styles.reminderContent}
              activeOpacity={0.8}
              onPress={onReminderPress}
            >
              <Text style={styles.reminderLabel}>{t('topics.reminder_label')}</Text>
              <Text style={styles.reminderValue} numberOfLines={1}>
                {reminderValue}
              </Text>
            </TouchableOpacity>
            {onRemoveReminder ? (
              <TouchableOpacity
                onPress={onRemoveReminder}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('topics.remove_reminder')}
              >
                <Ionicons name="close-circle" size={16} color={colors.secondaryText} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View
          style={[
            styles.iconRow,
            { height: layout.iconRowHeight, gap: layout.iconRowGap },
          ]}
        >
          <TouchableOpacity onPress={onPickImage} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="image-outline" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onReminderPress}
            hitSlop={8}
            activeOpacity={0.7}
            accessibilityLabel={t('topics.add_reminder')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    width: '100%',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  inner: {
    width: '100%',
  },
  noteInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
    padding: 0,
    minHeight: 40,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderContent: {
    flex: 1,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  reminderLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
    flexShrink: 0,
  },
  reminderValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
    flex: 1,
    textAlign: isRTL ? 'left' : 'right',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
