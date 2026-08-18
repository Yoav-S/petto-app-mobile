import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  placeholder?: string;
  autoFocus?: boolean;
}

export default function HealthNoteEditorCard({
  noteText,
  onChangeNoteText,
  photoUri,
  onPickImage,
  reminderValue,
  onReminderPress,
  placeholder,
  autoFocus = false,
}: HealthNoteEditorCardProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const layout = useHealthNoteCardLayout();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(photoUri) && !imageFailed;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUri]);

  useEffect(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, [autoFocus]);

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
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPickImage}
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
          </TouchableOpacity>
        ) : null}

        <TextInput
          ref={inputRef}
          style={styles.noteInput}
          value={noteText}
          onChangeText={onChangeNoteText}
          multiline
          autoFocus={autoFocus}
          placeholder={placeholder ?? t('topics.note_placeholder')}
          placeholderTextColor={colors.secondaryText}
          textAlignVertical="top"
        />

        {reminderValue ? (
          <TouchableOpacity
            style={styles.reminderRow}
            activeOpacity={0.8}
            onPress={onReminderPress}
          >
            <Text style={styles.reminderLabel}>{t('topics.reminder_label')}</Text>
            <Text style={styles.reminderValue} numberOfLines={1}>
              {reminderValue}
            </Text>
          </TouchableOpacity>
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
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  reminderRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
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
    flexShrink: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
