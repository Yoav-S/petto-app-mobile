import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t, isRTL } from '@/i18n';

const DESIGN_WIDTH = 375;

export function useHealthNoteCardLayout() {
  const { width } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;

  return useMemo(
    () => ({
      cardWidth: 335 * sx,
      cardRadius: 12 * sx,
      cardPadTop: 14 * sx,
      cardPadH: 16 * sx,
      cardPadBottom: 20 * sx,
      innerGap: 12 * sx,
      imageHeight: 160 * sx,
      imageRadius: 12 * sx,
      iconRowHeight: 24 * sx,
      iconRowGap: 16 * sx,
    }),
    [sx],
  );
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
          <Image
            source={{ uri: photoUri! }}
            style={{
              width: '100%',
              height: layout.imageHeight,
              borderRadius: layout.imageRadius,
            }}
            contentFit="cover"
            onError={() => setImageFailed(true)}
          />
        ) : null}

        <TextInput
          style={styles.noteInput}
          value={noteText}
          onChangeText={onChangeNoteText}
          multiline
          placeholder={placeholder ?? t('health.note_placeholder')}
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
              <Text style={styles.reminderLabel}>{t('health.reminder_label')}</Text>
              <Text style={styles.reminderValue} numberOfLines={1}>
                {reminderValue}
              </Text>
            </TouchableOpacity>
            {onRemoveReminder ? (
              <TouchableOpacity
                onPress={onRemoveReminder}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('health.remove_reminder')}
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
            accessibilityLabel={t('health.add_reminder')}
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
