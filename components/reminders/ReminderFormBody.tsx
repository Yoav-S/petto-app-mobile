import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import ReminderCalendarPickerSheet from '@/components/reminders/ReminderCalendarPickerSheet';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet from '@/components/pickers/RepeatPickerSheet';
import CategoryPickerSheet, {
  categoryLabel,
} from '@/components/pickers/CategoryPickerSheet';
import {
  HealthKeyboardAvoidingView,
} from '@/components/health/HealthKeyboardFooter';
import { t } from '@/i18n';
import type { RepeatOption } from '@/services/reminders';
import {
  CARD_SHADOW,
  formatTimeDisplay,
  repeatToggleLabel,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import { formatDisplayDate } from '@/utils/calendar';
import { centeredInputText } from '@/constants/textField';
import {
  reminderCategoryIconFor,
  type ReminderCategory,
} from '@/utils/reminderCategory';

interface ReminderFormLayout {
  formTop: number;
  formGap: number;
  cardWidth: number;
  cardRadius: number;
  cardPadH: number;
  cardPadV: number;
  nameHeight: number;
  categoryHeight: number;
  scheduleHeight: number;
  noteHeight: number;
  innerGap: number;
  rowHeight: number;
  footerHeight: number;
}

interface ReminderFormBodyProps {
  layout: ReminderFormLayout;
  title: string;
  onTitleChange: (value: string) => void;
  category: ReminderCategory;
  onCategorySelect: (value: ReminderCategory) => void;
  date: string | null;
  time: string | null;
  repeat: RepeatOption;
  note: string;
  onNoteChange: (value: string) => void;
  noteFocused: boolean;
  onNoteFocus: () => void;
  onNoteBlur: () => void;
  sheet: ReminderSheet;
  onSheetChange: (sheet: ReminderSheet) => void;
  onDateConfirm: (iso: string) => void;
  onTimeConfirm: (value: string) => void;
  onRepeatSelect: (value: RepeatOption) => void;
  autoFocus?: boolean;
  /** Inline content at the end of the scroll (e.g. delete / autosave). */
  footer?: React.ReactNode;
  /** Sticky bottom save bar (outside the scroll), like add-note. */
  stickyFooter?: React.ReactNode;
  /** Extra scroll padding when a sticky footer is present. */
  scrollPaddingBottom?: number;
  /** Pin footer (delete) to the bottom; only scroll on short screens. */
  pinFooterToBottom?: boolean;
  footerBottomInset?: number;
}

export default function ReminderFormBody({
  layout,
  title,
  onTitleChange,
  category,
  onCategorySelect,
  date,
  time,
  repeat,
  note,
  onNoteChange,
  onNoteFocus,
  onNoteBlur,
  sheet,
  onSheetChange,
  onDateConfirm,
  onTimeConfirm,
  onRepeatSelect,
  autoFocus = false,
  footer,
  stickyFooter,
  scrollPaddingBottom = 32,
  pinFooterToBottom = false,
  footerBottomInset = 32,
}: ReminderFormBodyProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const needsScroll = !pinFooterToBottom || contentH > viewportH + 1;

  return (
    <>
      <HealthKeyboardAvoidingView>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.formTop,
              paddingBottom: pinFooterToBottom ? footerBottomInset : scrollPaddingBottom,
              gap: layout.formGap,
              alignItems: 'center',
              flexGrow: 1,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={needsScroll}
          bounces={needsScroll}
          onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setContentH(h)}
        >
          <View
            style={[
              styles.card,
              CARD_SHADOW,
              {
                width: layout.cardWidth,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                paddingVertical: layout.cardPadV,
                minHeight: layout.nameHeight,
                justifyContent: 'center',
              },
            ]}
          >
            <TextInput
              style={styles.nameInput}
              value={title}
              onChangeText={onTitleChange}
              placeholder={t('reminders.field_name_placeholder')}
              placeholderTextColor={colors.secondaryText}
              autoFocus={autoFocus}
              returnKeyType="next"
              textAlignVertical="center"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.card,
              styles.categoryRow,
              CARD_SHADOW,
              {
                width: layout.cardWidth,
                height: layout.categoryHeight,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                gap: 10,
              },
            ]}
            onPress={() => onSheetChange('category')}
            activeOpacity={0.6}
          >
            <Image
              source={reminderCategoryIconFor(category)}
              style={styles.categoryIcon}
              resizeMode="contain"
            />
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {categoryLabel(category)}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.secondaryText} />
          </TouchableOpacity>

          <View
            style={[
              styles.card,
              CARD_SHADOW,
              {
                width: layout.cardWidth,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                paddingVertical: layout.cardPadV,
                minHeight: layout.scheduleHeight,
                gap: layout.innerGap,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.scheduleRow, { minHeight: layout.rowHeight }]}
              onPress={() => onSheetChange('date')}
              activeOpacity={0.6}
            >
              <View style={styles.scheduleLeft}>
                <Ionicons name="calendar-outline" size={20} color={colors.primaryText} />
                <Text style={styles.scheduleLabel}>{t('reminders.field_date')}</Text>
              </View>
              <Text style={[styles.scheduleValue, !date && styles.placeholder]}>
                {date ? formatDisplayDate(date) : t('reminders.field_date_placeholder')}
              </Text>
            </TouchableOpacity>

            <View style={styles.scheduleDivider} />

            <TouchableOpacity
              style={[styles.scheduleRow, { minHeight: layout.rowHeight }]}
              onPress={() => onSheetChange('time')}
              activeOpacity={0.6}
            >
              <View style={styles.scheduleLeft}>
                <Ionicons name="time-outline" size={20} color={colors.primaryText} />
                <Text style={styles.scheduleLabel}>{t('reminders.field_time')}</Text>
              </View>
              <Text style={[styles.scheduleValue, !time && styles.placeholder]}>
                {time ? formatTimeDisplay(time) : t('reminders.field_time_placeholder')}
              </Text>
            </TouchableOpacity>

            <View style={styles.scheduleDivider} />

            <TouchableOpacity
              style={[styles.scheduleRow, { minHeight: layout.rowHeight }]}
              onPress={() => onSheetChange('repeat')}
              activeOpacity={0.6}
            >
              <View style={styles.scheduleLeft}>
                <Ionicons name="repeat-outline" size={20} color={colors.primaryText} />
                <Text style={styles.scheduleLabel}>{t('reminders.field_repeat')}</Text>
              </View>
              <Text style={styles.scheduleValue}>{repeatToggleLabel(repeat)}</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.card,
              CARD_SHADOW,
              {
                width: layout.cardWidth,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                paddingVertical: layout.cardPadV,
                minHeight: layout.noteHeight,
                gap: 10,
              },
            ]}
          >
            <View style={[styles.noteInner, { minHeight: 50, gap: 6 }]}>
              <Text style={styles.noteLabel}>{t('reminders.field_description')}</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={onNoteChange}
                onFocus={onNoteFocus}
                onBlur={onNoteBlur}
                placeholder={t('reminders.field_note_placeholder')}
                placeholderTextColor={colors.secondaryText}
                multiline
                textAlignVertical="top"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>

          {pinFooterToBottom ? <View style={styles.footerSpacer} /> : null}
          {footer}
        </ScrollView>
        {stickyFooter}
      </HealthKeyboardAvoidingView>

      <ReminderCalendarPickerSheet
        visible={sheet === 'date'}
        value={date}
        onClose={() => onSheetChange(null)}
        onConfirm={onDateConfirm}
      />
      <TimePickerSheet
        visible={sheet === 'time'}
        value={time}
        onClose={() => onSheetChange(null)}
        onConfirm={onTimeConfirm}
      />
      <RepeatPickerSheet
        visible={sheet === 'repeat'}
        value={repeat}
        onClose={() => onSheetChange(null)}
        onSelect={(value) => {
          onRepeatSelect(value);
          onSheetChange(null);
        }}
      />
      <CategoryPickerSheet
        visible={sheet === 'category'}
        value={category}
        onClose={() => onSheetChange(null)}
        onSelect={(value) => {
          onCategorySelect(value);
          onSheetChange(null);
        }}
      />
    </>
  );
}

export function ReminderSaveButton({
  layout,
  canSave,
  saving,
  onPress,
}: {
  layout: ReminderFormLayout;
  canSave: boolean;
  saving: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[
        styles.saveButton,
        {
          width: layout.cardWidth,
          height: layout.footerHeight,
          borderRadius: layout.cardRadius,
        },
        !canSave && styles.saveButtonDisabled,
      ]}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      disabled={!canSave}
      activeOpacity={0.85}
    >
      {saving ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
          {t('common.save')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function ReminderAutosaveStatus({
  layout,
  state,
}: {
  layout: ReminderFormLayout;
  state: 'idle' | 'saving' | 'saved' | 'error';
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  if (state === 'idle') return null;
  const label =
    state === 'saving'
      ? t('reminders.saving')
      : state === 'saved'
        ? t('reminders.saved')
        : t('reminders.save_failed');

  return (
    <View
      style={[
        styles.autosaveRow,
        { width: layout.cardWidth, height: layout.footerHeight, borderRadius: layout.cardRadius },
      ]}
    >
      {state === 'saving' ? <ActivityIndicator size="small" color={colors.secondaryText} /> : null}
      <Text style={styles.autosaveText}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 0 },
  card: { backgroundColor: c.surface },
  nameInput: {
    ...centeredInputText({
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    }),
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  categoryIcon: {
    width: 24,
    height: 24,
  },
  categoryLabel: {
    flex: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.primaryText,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    lineHeight: 24,
    color: c.primaryText,
  },
  scheduleValue: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    lineHeight: 24,
    color: c.primaryText,
  },
  scheduleDivider: {
    height: 1,
    width: '100%',
    backgroundColor: c.border,
  },
  placeholder: { color: c.secondaryText },
  noteInner: { width: '100%' },
  noteLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
  },
  noteInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: c.primaryText,
    padding: 0,
    margin: 0,
    minHeight: 24,
    includeFontPadding: false,
  },
  saveButton: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: c.button.disabledBg },
  saveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.button.primaryText,
  },
  saveTextDisabled: { color: c.button.disabledText },
  autosaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.surface,
  },
  autosaveText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.secondaryText,
  },
  footerSpacer: {
    flexGrow: 1,
    minHeight: 24,
    width: '100%',
  },
});
