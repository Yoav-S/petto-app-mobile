import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import ReminderCalendarPickerSheet from '@/components/reminders/ReminderCalendarPickerSheet';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet from '@/components/pickers/RepeatPickerSheet';
import { t } from '@/i18n';
import type { RepeatOption } from '@/services/reminders';
import {
  CARD_SHADOW,
  formatTimeDisplay,
  repeatToggleLabel,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import { formatDisplayDate } from '@/utils/calendar';

interface ReminderFormLayout {
  formTop: number;
  formGap: number;
  cardWidth: number;
  cardRadius: number;
  cardPadH: number;
  cardPadV: number;
  nameHeight: number;
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
  footer?: React.ReactNode;
}

export default function ReminderFormBody({
  layout,
  title,
  onTitleChange,
  date,
  time,
  repeat,
  note,
  onNoteChange,
  noteFocused,
  onNoteFocus,
  onNoteBlur,
  sheet,
  onSheetChange,
  onDateConfirm,
  onTimeConfirm,
  onRepeatSelect,
  autoFocus = false,
  footer,
}: ReminderFormBodyProps) {
  const showNoteLabel = noteFocused || note.trim().length > 0;

  return (
    <>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.formTop,
              paddingBottom: 32,
              gap: layout.formGap,
              alignItems: 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
              placeholderTextColor={Colors.secondaryText}
              autoFocus={autoFocus}
              returnKeyType="next"
            />
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
                <Ionicons name="calendar-outline" size={18} color={Colors.primaryText} />
                <Text style={styles.scheduleLabel}>{t('reminders.field_date')}</Text>
              </View>
              <Text style={[styles.scheduleValue, !date && styles.placeholder]}>
                {date ? formatDisplayDate(date) : t('reminders.field_date_placeholder')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scheduleRow, { minHeight: layout.rowHeight }]}
              onPress={() => onSheetChange('time')}
              activeOpacity={0.6}
            >
              <View style={styles.scheduleLeft}>
                <Ionicons name="time-outline" size={18} color={Colors.primaryText} />
                <Text style={styles.scheduleLabel}>{t('reminders.field_time')}</Text>
              </View>
              <Text style={[styles.scheduleValue, !time && styles.placeholder]}>
                {time ? formatTimeDisplay(time) : t('reminders.field_time_placeholder')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scheduleRow, { minHeight: layout.rowHeight }]}
              onPress={() => onSheetChange('repeat')}
              activeOpacity={0.6}
            >
              <View style={styles.scheduleLeft}>
                <Ionicons name="repeat-outline" size={18} color={Colors.primaryText} />
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
              {showNoteLabel ? (
                <Text style={styles.noteLabel}>{t('reminders.field_description')}</Text>
              ) : null}
              <TextInput
                style={[styles.noteInput, !showNoteLabel && styles.noteInputCentered]}
                value={note}
                onChangeText={onNoteChange}
                onFocus={onNoteFocus}
                onBlur={onNoteBlur}
                placeholder={
                  showNoteLabel ? undefined : t('reminders.field_description_placeholder')
                }
                placeholderTextColor={Colors.secondaryText}
                multiline
                textAlignVertical={showNoteLabel ? 'top' : 'center'}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>

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
      onPress={onPress}
      disabled={!canSave}
      activeOpacity={0.85}
    >
      {saving ? (
        <ActivityIndicator color={Colors.surface} />
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
      {state === 'saving' ? <ActivityIndicator size="small" color={Colors.secondaryText} /> : null}
      <Text style={styles.autosaveText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 0 },
  card: { backgroundColor: Colors.surface },
  nameInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    padding: 0,
    margin: 0,
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
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  scheduleValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  placeholder: { color: Colors.secondaryText },
  noteInner: { width: '100%' },
  noteLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.secondaryText,
  },
  noteInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.primaryText,
    padding: 0,
    margin: 0,
    minHeight: 24,
  },
  noteInputCentered: {
    minHeight: 50,
    textAlignVertical: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: Colors.button.disabledBg },
  saveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
  saveTextDisabled: { color: Colors.button.disabledText },
  autosaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
  },
  autosaveText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
});
