import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import ReminderCalendarPickerSheet from '@/components/reminders/ReminderCalendarPickerSheet';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet from '@/components/pickers/RepeatPickerSheet';
import AlertPickerSheet from '@/components/pickers/AlertPickerSheet';
import CategoryPickerSheet, {
  categoryLabel,
} from '@/components/pickers/CategoryPickerSheet';
import {
  HealthFormSaveScroll,
  HealthFormScroll,
  HealthKeyboardAvoidingView,
  type HealthKeyboardFooterProps,
} from '@/components/health/HealthKeyboardFooter';
import { t } from '@/i18n';
import type { AlertOption, RepeatOption } from '@/services/reminders';
import {
  CARD_SHADOW,
  alertFieldLabel,
  formatTimeDisplay,
  repeatToggleLabel,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import {
  addDaysToIsoDate,
  formatDisplayDate,
  isIsoDateToday,
  minReminderDateIso,
  soonestValidReminderTime,
  todayIsoDate,
} from '@/utils/calendar';
import { centeredInputText, NAME_FIELD_TEXT } from '@/constants/textField';
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
  /** Autosave screens flush the pending write when the field loses focus. */
  onTitleBlur?: () => void;
  category: ReminderCategory;
  onCategorySelect: (value: ReminderCategory) => void;
  date: string | null;
  endDate: string | null;
  time: string | null;
  repeat: RepeatOption;
  alert: AlertOption;
  note: string;
  onNoteChange: (value: string) => void;
  noteFocused: boolean;
  onNoteFocus: () => void;
  onNoteBlur: () => void;
  sheet: ReminderSheet;
  onSheetChange: (sheet: ReminderSheet) => void;
  onDateConfirm: (iso: string) => void;
  onEndDateConfirm: (iso: string) => void;
  onEndDateClear: () => void;
  onTimeConfirm: (value: string) => void;
  onRepeatSelect: (value: RepeatOption) => void;
  onAlertConfirm: (value: AlertOption) => void;
  autoFocus?: boolean;
  /** Disable all field edits (view completed/missed reminder). */
  readOnly?: boolean;
  /** Inline content at the end of the scroll (e.g. delete / autosave). */
  footer?: React.ReactNode;
  /** Save at bottom of scroll — scroll into view when keyboard open. */
  saveFooter?: HealthKeyboardFooterProps;
  /** Extra scroll padding when a sticky footer is present. */
  scrollPaddingBottom?: number;
  /** Pin footer (delete) to the bottom; only scroll on short screens. */
  pinFooterToBottom?: boolean;
  footerBottomInset?: number;
  /** Extra top inset when the header floats above scroll content. */
  scrollInsetTop?: number;
}

export default function ReminderFormBody({
  layout,
  title,
  onTitleChange,
  onTitleBlur,
  category,
  onCategorySelect,
  date,
  endDate,
  time,
  repeat,
  alert,
  note,
  onNoteChange,
  onNoteFocus,
  onNoteBlur,
  sheet,
  onSheetChange,
  onDateConfirm,
  onEndDateConfirm,
  onEndDateClear,
  onTimeConfirm,
  onRepeatSelect,
  onAlertConfirm,
  autoFocus = false,
  readOnly = false,
  footer,
  saveFooter,
  scrollPaddingBottom = 32,
  pinFooterToBottom = false,
  footerBottomInset = 32,
  scrollInsetTop = 0,
}: ReminderFormBodyProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  const openSheet = (next: ReminderSheet) => {
    if (readOnly) return;
    onSheetChange(next);
  };

  const minTime =
    date && isIsoDateToday(date) ? soonestValidReminderTime(date) : null;

  const formFieldsStyle = [
    styles.content,
    {
      paddingTop: scrollInsetTop + layout.formTop,
      gap: layout.formGap,
      alignItems: 'center' as const,
    },
  ];

  const formFields = (
    <View style={{ gap: layout.formGap, alignItems: 'center', width: '100%' }}>
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
              onBlur={onTitleBlur}
              placeholder={t('reminders.field_name_placeholder')}
              placeholderTextColor={colors.secondaryText}
              autoFocus={autoFocus && !readOnly}
              editable={!readOnly}
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
            onPress={() => openSheet('category')}
            activeOpacity={0.6}
            disabled={readOnly}
          >
            <Image
              source={reminderCategoryIconFor(category)}
              style={styles.categoryIcon}
              resizeMode="contain"
            />
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {categoryLabel(category)}
            </Text>
            {!readOnly ? (
              <Ionicons name="chevron-down" size={18} color={colors.secondaryText} />
            ) : null}
          </TouchableOpacity>

          <View style={{ width: layout.cardWidth, gap: 20 }}>
            <View
              style={[
                styles.card,
                CARD_SHADOW,
                {
                  width: layout.cardWidth,
                  borderRadius: layout.cardRadius,
                  paddingHorizontal: layout.cardPadH,
                  paddingVertical: 0,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.scheduleRow, { paddingVertical: layout.cardPadV }]}
                onPress={() => openSheet('start')}
                activeOpacity={0.6}
                disabled={readOnly}
              >
                <Text style={styles.scheduleLabel}>{t('reminders.field_start')}</Text>
                <Text style={[styles.scheduleValue, !date && styles.placeholder]}>
                  {date ? formatDisplayDate(date) : t('reminders.field_date_placeholder')}
                </Text>
              </TouchableOpacity>

              <View style={styles.scheduleDivider} />

              <TouchableOpacity
                style={[styles.scheduleRow, { paddingVertical: layout.cardPadV }]}
                onPress={() => openSheet('end')}
                activeOpacity={0.6}
                disabled={readOnly}
              >
                <Text style={styles.scheduleLabel}>{t('reminders.field_end')}</Text>
                <Text style={endDate ? styles.scheduleValue : styles.scheduleRepeatValue}>
                  {endDate ? formatDisplayDate(endDate) : t('reminders.field_end_off')}
                </Text>
              </TouchableOpacity>

              <View style={styles.scheduleDivider} />

              <TouchableOpacity
                style={[styles.scheduleRow, { paddingVertical: layout.cardPadV }]}
                onPress={() => openSheet('time')}
                activeOpacity={0.6}
                disabled={readOnly}
              >
                <Text style={styles.scheduleLabel}>{t('reminders.field_time')}</Text>
                <Text style={[styles.scheduleValue, !time && styles.placeholder]}>
                  {time ? formatTimeDisplay(time) : t('reminders.field_time_placeholder')}
                </Text>
              </TouchableOpacity>

              <View style={styles.scheduleDivider} />

              <TouchableOpacity
                style={[styles.scheduleRow, { paddingVertical: layout.cardPadV }]}
                onPress={() => openSheet('repeat')}
                activeOpacity={0.6}
                disabled={readOnly}
              >
                <Text style={styles.scheduleLabel}>{t('reminders.field_repeat')}</Text>
                <Text style={styles.scheduleRepeatValue}>{repeatToggleLabel(repeat)}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.card,
                styles.scheduleRow,
                CARD_SHADOW,
                {
                  width: layout.cardWidth,
                  borderRadius: layout.cardRadius,
                  paddingHorizontal: layout.cardPadH,
                  paddingVertical: layout.cardPadV,
                },
              ]}
              onPress={() => openSheet('alert')}
              activeOpacity={0.6}
              disabled={readOnly}
            >
              <Text style={styles.scheduleLabel}>{t('reminders.field_alert')}</Text>
              <Text
                style={
                  alert === 'off' ? styles.scheduleRepeatValue : styles.scheduleValue
                }
              >
                {alertFieldLabel(alert)}
              </Text>
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
                placeholder={readOnly ? undefined : t('reminders.field_note_placeholder')}
                placeholderTextColor={colors.secondaryText}
                multiline
                editable={!readOnly}
                textAlignVertical="top"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>
    </View>
  );

  return (
    <>
      <HealthKeyboardAvoidingView>
        {saveFooter ? (
          <HealthFormSaveScroll
            footer={saveFooter}
            fieldsStyle={formFieldsStyle}
          >
            {formFields}
            {!pinFooterToBottom && footer ? (
              <View style={{ marginTop: layout.formGap }}>{footer}</View>
            ) : null}
            {pinFooterToBottom && footer ? (
              <>
                <View style={styles.footerSpacer} />
                {footer}
              </>
            ) : null}
          </HealthFormSaveScroll>
        ) : (
          <HealthFormScroll
            contentContainerStyle={[
              ...formFieldsStyle,
              pinFooterToBottom ? styles.scrollWithSave : null,
            ]}
          >
            {formFields}
            {!pinFooterToBottom && footer ? (
              <View style={{ marginTop: layout.formGap }}>{footer}</View>
            ) : null}
            {pinFooterToBottom && footer ? (
              <>
                <View style={styles.footerSpacer} />
                {footer}
              </>
            ) : null}
          </HealthFormScroll>
        )}
      </HealthKeyboardAvoidingView>

      {!readOnly ? (
        <>
          <ReminderCalendarPickerSheet
            visible={sheet === 'start'}
            value={date}
            title={t('reminders.field_start')}
            minDate={minReminderDateIso()}
            onClose={() => onSheetChange(null)}
            onConfirm={onDateConfirm}
          />
          <ReminderCalendarPickerSheet
            visible={sheet === 'end'}
            value={endDate}
            title={t('reminders.field_end')}
            minDate={addDaysToIsoDate(date ?? todayIsoDate(), 1)}
            allowClear
            onClear={onEndDateClear}
            onClose={() => onSheetChange(null)}
            onConfirm={onEndDateConfirm}
          />
          <TimePickerSheet
            visible={sheet === 'time'}
            value={time}
            minTime={minTime}
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
          <AlertPickerSheet
            visible={sheet === 'alert'}
            value={alert}
            onClose={() => onSheetChange(null)}
            onConfirm={onAlertConfirm}
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
      ) : null}
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
      <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
        {t('common.save')}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 0 },
  card: { backgroundColor: c.surface },
  nameInput: {
    ...centeredInputText({
      ...NAME_FIELD_TEXT,
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
  scheduleLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
  },
  scheduleValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
  },
  scheduleRepeatValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
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
    ...PRIMARY_BUTTON,
    backgroundColor: c.brand,
    flexDirection: 'row',
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
  footerSpacer: {
    flexGrow: 1,
    minHeight: 16,
    width: '100%',
  },
  scrollWithSave: {
    flexGrow: 1,
  },
});
