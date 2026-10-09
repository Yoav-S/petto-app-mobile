import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet from '@/components/pickers/RepeatPickerSheet';
import AlertPickerSheet from '@/components/pickers/AlertPickerSheet';
import ReminderCalendarPickerSheet from '@/components/reminders/ReminderCalendarPickerSheet';
import {
  CARD_SHADOW,
  alertFieldLabel,
  clampAlertForSchedule,
  clampReminderTimeForDate,
  formatTimeDisplay,
  isReminderScheduleInPast,
  minReminderTimeForDate,
  repeatToggleLabel,
} from '@/components/reminders/reminderFormShared';
import { t } from '@/i18n';
import { parseAlert, type AlertOption, type RepeatOption } from '@/services/reminders';
import type { HealthReminderDraft } from '@/services/healthReminder';
import {
  addDaysToIsoDate,
  formatDisplayDate,
  isIsoDateBefore,
  minReminderDateIso,
  todayIsoDate,
} from '@/utils/calendar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface ReminderPickerSheetProps {
  visible: boolean;
  initialDate?: string | null;
  initialEndDate?: string | null;
  initialTime?: string | null;
  initialRepeat?: RepeatOption;
  initialAlert?: AlertOption;
  onClose: () => void;
  onConfirm: (draft: HealthReminderDraft) => void;
  /** Shown under Alert when this note already has a reminder. */
  onRemove?: () => void;
}

type SubSheet = 'start' | 'end' | 'time' | 'repeat' | 'alert' | null;

function resolveInitialDate(preferred?: string | null): string {
  const min = minReminderDateIso();
  if (!preferred || isIsoDateBefore(preferred, min)) return min;
  return preferred.slice(0, 10);
}

export default function ReminderPickerSheet({
  visible,
  initialDate,
  initialEndDate,
  initialTime,
  initialRepeat = 'off',
  initialAlert = 'off',
  onClose,
  onConfirm,
  onRemove,
}: ReminderPickerSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsiveLayout();

  const [date, setDate] = useState(minReminderDateIso);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [time, setTime] = useState('09:00');
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [alert, setAlert] = useState<AlertOption>('off');
  const [subSheet, setSubSheet] = useState<SubSheet>(null);

  useEffect(() => {
    if (!visible) {
      setSubSheet(null);
      return;
    }
    const nextDate = resolveInitialDate(initialDate);
    const nextTime = clampReminderTimeForDate(nextDate, initialTime ?? '09:00') ?? '09:00';
    const nextEnd = initialEndDate?.slice(0, 10) ?? null;
    const minEnd = addDaysToIsoDate(nextDate, 1);
    setDate(nextDate);
    setTime(nextTime);
    setEndDate(nextEnd && !isIsoDateBefore(nextEnd, minEnd) ? nextEnd : null);
    setRepeat(initialRepeat);
    setAlert(clampAlertForSchedule(parseAlert(initialAlert), nextDate, nextTime));
    setSubSheet(null);
  }, [visible, initialDate, initialEndDate, initialTime, initialRepeat, initialAlert]);

  const canSave = Boolean(date && time) && !isReminderScheduleInPast(date, time);
  const parentVisible = visible && subSheet === null;

  const handleStartConfirm = (iso: string) => {
    const nextDate = resolveInitialDate(iso);
    const nextTime = clampReminderTimeForDate(nextDate, time) ?? time;
    const minEnd = addDaysToIsoDate(nextDate, 1);
    setDate(nextDate);
    setTime(nextTime);
    setAlert((current) => clampAlertForSchedule(current, nextDate, nextTime));
    setEndDate((current) => (current && !isIsoDateBefore(current, minEnd) ? current : null));
    setSubSheet(null);
  };

  const handleDone = () => {
    if (!canSave) return;
    onConfirm({ date, endDate, time, repeat, alert });
    onClose();
  };

  return (
    <>
      <BottomSheetModal visible={parentVisible} onClose={onClose}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.closeSpacer} />
            <Text style={styles.title} numberOfLines={1}>
              {t('topics.set_reminder')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={18} color={colors.primaryText} />
            </TouchableOpacity>
          </View>

          <View style={[styles.schedule, CARD_SHADOW, { width: contentWidth }]}>
            <View style={styles.rows}>
              <TouchableOpacity style={styles.row} onPress={() => setSubSheet('start')} activeOpacity={0.6}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowLabel}>{t('reminders.field_start')}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {formatDisplayDate(date)}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={() => setSubSheet('end')} activeOpacity={0.6}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowLabel}>{t('reminders.field_end')}</Text>
                  <Text style={endDate ? styles.rowValue : styles.rowMuted} numberOfLines={1}>
                    {endDate ? formatDisplayDate(endDate) : t('reminders.field_end_off')}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={() => setSubSheet('time')} activeOpacity={0.6}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowLabel}>{t('reminders.field_time')}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {formatTimeDisplay(time)}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={() => setSubSheet('repeat')} activeOpacity={0.6}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowLabel}>{t('reminders.field_repeat')}</Text>
                  <Text style={styles.rowMuted} numberOfLines={1}>
                    {repeatToggleLabel(repeat)}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={() => setSubSheet('alert')} activeOpacity={0.6}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowLabel}>{t('reminders.field_alert')}</Text>
                  <Text style={alert === 'off' ? styles.rowMuted : styles.rowValue} numberOfLines={1}>
                    {alertFieldLabel(alert)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            {onRemove ? (
              <TouchableOpacity
                onPress={onRemove}
                activeOpacity={0.7}
                style={styles.removeButton}
                accessibilityRole="button"
              >
                <Text style={styles.removeText}>{t('topics.remove_reminder')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { width: contentWidth }, !canSave && styles.saveButtonDisabled]}
            onPress={handleDone}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      <ReminderCalendarPickerSheet
        visible={visible && subSheet === 'start'}
        value={date}
        title={t('reminders.field_start')}
        minDate={minReminderDateIso()}
        onClose={() => setSubSheet(null)}
        onConfirm={handleStartConfirm}
      />
      <ReminderCalendarPickerSheet
        visible={visible && subSheet === 'end'}
        value={endDate}
        title={t('reminders.field_end')}
        minDate={addDaysToIsoDate(date || todayIsoDate(), 1)}
        allowClear
        onClear={() => {
          setEndDate(null);
          setSubSheet(null);
        }}
        onClose={() => setSubSheet(null)}
        onConfirm={(iso) => {
          setEndDate(iso.slice(0, 10));
          setSubSheet(null);
        }}
      />
      <TimePickerSheet
        visible={visible && subSheet === 'time'}
        value={time}
        minTime={minReminderTimeForDate(date)}
        onClose={() => setSubSheet(null)}
        onConfirm={(value) => {
          const next = clampReminderTimeForDate(date, value) ?? value;
          setTime(next);
          setAlert((current) => clampAlertForSchedule(current, date, next));
          setSubSheet(null);
        }}
      />
      <RepeatPickerSheet
        visible={visible && subSheet === 'repeat'}
        value={repeat}
        onClose={() => setSubSheet(null)}
        onSelect={(value) => {
          setRepeat(value);
          setSubSheet(null);
        }}
      />
      <AlertPickerSheet
        visible={visible && subSheet === 'alert'}
        value={alert}
        scheduledDate={date}
        scheduledTime={time}
        onClose={() => setSubSheet(null)}
        onConfirm={(value) => {
          setAlert(value);
          setSubSheet(null);
        }}
      />
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 32,
      paddingHorizontal: 20,
      alignItems: 'center',
      gap: 22,
    },
    header: {
      width: '100%',
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    closeSpacer: {
      width: 32,
      height: 32,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    schedule: {
      borderRadius: 12,
      paddingTop: 14,
      paddingRight: 16,
      paddingBottom: 14,
      paddingLeft: 16,
      gap: 10,
      backgroundColor: c.surface,
    },
    removeButton: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      color: c.error,
    },
    rows: {
      width: '100%',
      gap: 4,
    },
    row: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      padding: 16,
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    rowLine: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    rowValue: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      flexShrink: 1,
      textAlign: 'right',
    },
    rowMuted: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      flexShrink: 1,
      textAlign: 'right',
    },
    saveButton: {
      ...PRIMARY_BUTTON,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: c.button.disabledBg,
    },
    saveText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.button.primaryText,
    },
    saveTextDisabled: {
      color: c.button.disabledText,
    },
  });
