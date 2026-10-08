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
import { useKeyboardAwareScroll } from '@/hooks/useKeyboardAwareScroll';
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
  /** Content under the description card (fire history on recent occurrences). */
  afterFields?: React.ReactNode;
  /** `afterFields` takes the leftover screen height (recent list). */
  fillAfterFields?: boolean;
  /** Recent occurrences show the schedule only — no category / alert rows. */
  showCategoryField?: boolean;
  showAlertField?: boolean;
  /** Edit screen: full-width cards with 4px between them. Add keeps the inset form. */
  fullBleed?: boolean;
  /** Height of the field stack, so a bottom sheet can rest just under it. */
  onFieldsLayout?: (height: number) => void;
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
  scrollPaddingBottom = 0,
  pinFooterToBottom = false,
  footerBottomInset = 32,
  scrollInsetTop = 0,
  afterFields,
  fillAfterFields = false,
  showCategoryField = true,
  showAlertField = true,
  fullBleed = false,
  onFieldsLayout,
}: ReminderFormBodyProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { scrollRef, keyboardOffset, onScroll, onInputFocus } = useKeyboardAwareScroll(
    scrollPaddingBottom,
  );

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
      paddingBottom: saveFooter
        ? scrollPaddingBottom
        : scrollPaddingBottom + (fullBleed && keyboardOffset > 0 ? keyboardOffset : 0),
      gap: layout.formGap,
      alignItems: 'center' as const,
    },
  ];

  const formFields = (
    <View
      onLayout={
        onFieldsLayout
          ? (event) => onFieldsLayout(event.nativeEvent.layout.height)
          : undefined
      }
      style={[
        {
          gap: readOnly || fullBleed ? 0 : layout.formGap,
          alignItems: 'center',
          width: '100%',
        },
        fillAfterFields ? styles.fieldsFill : null,
      ]}
    >
          {readOnly || fullBleed ? (
            <View style={styles.recentTitle}>
              {readOnly ? (
                <Text style={styles.recentTitleText} numberOfLines={1}>
                  {title}
                </Text>
              ) : (
                <TextInput
                  style={styles.recentTitleInput}
                  value={title}
                  onChangeText={onTitleChange}
                  onBlur={onTitleBlur}
                  onFocus={onInputFocus}
                  placeholder={t('reminders.field_name_placeholder')}
                  placeholderTextColor={colors.secondaryText}
                  autoFocus={autoFocus}
                  returnKeyType="next"
                  textAlignVertical="center"
                />
              )}
            </View>
          ) : (
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
              onFocus={onInputFocus}
              returnKeyType="next"
              textAlignVertical="center"
            />
          </View>
          )}

          {showCategoryField ? (
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
          ) : null}

          <View style={{ width: '100%', gap: readOnly || fullBleed ? 0 : 20, alignItems: 'center' }}>
            {readOnly || fullBleed ? (
              <View style={styles.recentSchedule}>
                <View style={styles.recentProps}>
                  <ScheduleSlot
                    readOnly={readOnly}
                    style={styles.recentProp}
                    onPress={() => openSheet('start')}
                  >
                    <View style={styles.scheduleRow}>
                      <Text style={styles.scheduleLabel}>{t('reminders.field_start')}</Text>
                      <Text style={[styles.scheduleValue, !date && styles.placeholder]} numberOfLines={1}>
                        {date ? formatDisplayDate(date) : t('reminders.field_date_placeholder')}
                      </Text>
                    </View>
                  </ScheduleSlot>
                  <ScheduleSlot
                    readOnly={readOnly}
                    style={styles.recentProp}
                    onPress={() => openSheet('end')}
                  >
                    <View style={styles.scheduleRow}>
                      <Text style={styles.scheduleLabel}>{t('reminders.field_end')}</Text>
                      <Text
                        style={endDate ? styles.scheduleValue : styles.scheduleRepeatValue}
                        numberOfLines={1}
                      >
                        {endDate ? formatDisplayDate(endDate) : t('reminders.field_end_off')}
                      </Text>
                    </View>
                  </ScheduleSlot>
                  <ScheduleSlot
                    readOnly={readOnly}
                    style={styles.recentProp}
                    onPress={() => openSheet('time')}
                  >
                    <View style={styles.scheduleRow}>
                      <Text style={styles.scheduleLabel}>{t('reminders.field_time')}</Text>
                      <Text style={[styles.scheduleValue, !time && styles.placeholder]} numberOfLines={1}>
                        {time ? formatTimeDisplay(time) : t('reminders.field_time_placeholder')}
                      </Text>
                    </View>
                  </ScheduleSlot>
                  <ScheduleSlot
                    readOnly={readOnly}
                    style={styles.recentProp}
                    onPress={() => openSheet('repeat')}
                  >
                    <View style={styles.scheduleRow}>
                      <Text style={styles.scheduleLabel}>{t('reminders.field_repeat')}</Text>
                      <Text style={styles.scheduleRepeatValue} numberOfLines={1}>
                        {repeatToggleLabel(repeat)}
                      </Text>
                    </View>
                  </ScheduleSlot>
                  {showAlertField ? (
                    <ScheduleSlot
                      readOnly={readOnly}
                      style={styles.recentProp}
                      onPress={() => openSheet('alert')}
                    >
                      <View style={styles.scheduleRow}>
                        <Text style={styles.scheduleLabel}>{t('reminders.field_alert')}</Text>
                        <Text
                          style={alert === 'off' ? styles.scheduleRepeatValue : styles.scheduleValue}
                          numberOfLines={1}
                        >
                          {alertFieldLabel(alert)}
                        </Text>
                      </View>
                    </ScheduleSlot>
                  ) : null}
                </View>
              </View>
            ) : (
            <View
              style={[
                styles.card,
                styles.addSchedule,
                CARD_SHADOW,
                { width: layout.cardWidth },
              ]}
            >
              <View style={styles.addScheduleRows}>
                <ScheduleSlot readOnly={readOnly} style={styles.addScheduleRow} onPress={() => openSheet('start')}>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>{t('reminders.field_start')}</Text>
                    <Text style={[styles.scheduleValue, !date && styles.placeholder]} numberOfLines={1}>
                      {date ? formatDisplayDate(date) : t('reminders.field_date_placeholder')}
                    </Text>
                  </View>
                </ScheduleSlot>
                <ScheduleSlot readOnly={readOnly} style={styles.addScheduleRow} onPress={() => openSheet('end')}>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>{t('reminders.field_end')}</Text>
                    <Text style={endDate ? styles.scheduleValue : styles.scheduleRepeatValue} numberOfLines={1}>
                      {endDate ? formatDisplayDate(endDate) : t('reminders.field_end_off')}
                    </Text>
                  </View>
                </ScheduleSlot>
                <ScheduleSlot readOnly={readOnly} style={styles.addScheduleRow} onPress={() => openSheet('time')}>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>{t('reminders.field_time')}</Text>
                    <Text style={[styles.scheduleValue, !time && styles.placeholder]} numberOfLines={1}>
                      {time ? formatTimeDisplay(time) : t('reminders.field_time_placeholder')}
                    </Text>
                  </View>
                </ScheduleSlot>
                <ScheduleSlot readOnly={readOnly} style={styles.addScheduleRow} onPress={() => openSheet('repeat')}>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>{t('reminders.field_repeat')}</Text>
                    <Text style={styles.scheduleRepeatValue} numberOfLines={1}>
                      {repeatToggleLabel(repeat)}
                    </Text>
                  </View>
                </ScheduleSlot>
                {showAlertField ? (
                  <ScheduleSlot readOnly={readOnly} style={styles.addScheduleRow} onPress={() => openSheet('alert')}>
                    <View style={styles.scheduleRow}>
                      <Text style={styles.scheduleLabel}>{t('reminders.field_alert')}</Text>
                      <Text
                        style={alert === 'off' ? styles.scheduleRepeatValue : styles.scheduleValue}
                        numberOfLines={1}
                      >
                        {alertFieldLabel(alert)}
                      </Text>
                    </View>
                  </ScheduleSlot>
                ) : null}
              </View>
            </View>
            )}
          </View>

          <View
            style={[
              styles.card,
              fullBleed ? null : CARD_SHADOW,
              {
                width: readOnly || fullBleed ? '100%' : layout.cardWidth,
                borderRadius: fullBleed ? 24 : layout.cardRadius,
                paddingTop: fullBleed ? 22 : layout.cardPadV,
                paddingBottom: fullBleed ? 22 : layout.cardPadV,
                paddingLeft: fullBleed ? 20 : layout.cardPadH,
                paddingRight: fullBleed ? 20 : layout.cardPadH,
                minHeight: layout.noteHeight,
                gap: 10,
                marginTop: readOnly || fullBleed ? 4 : 0,
                marginBottom: readOnly || fullBleed ? 4 : 0,
              },
            ]}
          >
            <View style={[styles.noteInner, { minHeight: 50, gap: 6 }]}>
              <Text style={styles.noteLabel}>{t('reminders.field_description')}</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={onNoteChange}
                onFocus={(event) => {
                  onNoteFocus();
                  if (!readOnly) onInputFocus(event);
                }}
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

          {afterFields && fillAfterFields ? (
            <View style={styles.afterFieldsFill}>{afterFields}</View>
          ) : (
            afterFields
          )}
    </View>
  );

  return (
    <>
      <HealthKeyboardAvoidingView>
        {saveFooter ? (
          <HealthFormSaveScroll
            footer={saveFooter}
            fieldsStyle={formFieldsStyle}
            scrollRef={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
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
            scrollRef={fullBleed ? scrollRef : undefined}
            onScroll={fullBleed ? onScroll : undefined}
            scrollEventThrottle={fullBleed ? 16 : undefined}
            contentContainerStyle={[
              ...formFieldsStyle,
              pinFooterToBottom || fillAfterFields ? styles.scrollWithSave : null,
            ]}
            nestedScrollEnabled
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
            scheduledDate={date}
            scheduledTime={time}
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

function ScheduleSlot({
  readOnly,
  style,
  onPress,
  children,
}: {
  readOnly: boolean;
  style: object;
  onPress: () => void;
  children: React.ReactNode;
}) {
  if (readOnly) return <View style={style}>{children}</View>;
  return (
    <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.6}>
      {children}
    </TouchableOpacity>
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
  nameInputReadOnly: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 20,
    height: 20,
    textAlign: 'left',
  },
  recentTitle: {
    width: '100%',
    height: 68,
    boxSizing: 'border-box',
    borderRadius: 24,
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 10,
    justifyContent: 'center',
    backgroundColor: c.surface,
    marginTop: 4,
    marginBottom: 4,
  },
  recentTitleText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    lineHeight: 24,
    color: c.primaryText,
  },
  recentTitleInput: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    lineHeight: 24,
    height: 24,
    padding: 0,
    margin: 0,
    color: c.primaryText,
    includeFontPadding: false,
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
  recentSchedule: {
    width: '100%',
    borderRadius: 24,
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 10,
    backgroundColor: c.surface,
  },
  recentProps: {
    width: '100%',
    gap: 6,
  },
  recentProp: {
    width: '100%',
    height: 52,
    boxSizing: 'border-box',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    justifyContent: 'center',
    backgroundColor: c.background,
  },
  addSchedule: {
    borderRadius: 12,
    paddingTop: 14,
    paddingRight: 16,
    paddingBottom: 14,
    paddingLeft: 16,
    gap: 10,
  },
  addScheduleRows: {
    width: '100%',
    gap: 4,
  },
  addScheduleRow: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    justifyContent: 'center',
    backgroundColor: c.background,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 20,
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
  /** Grows into leftover height, never shrinks below the cards it holds. */
  fieldsFill: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  afterFieldsFill: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
    /** Without this the list hugs the left edge instead of the card column. */
    alignItems: 'center',
  },
});
