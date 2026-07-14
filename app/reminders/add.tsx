import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import ReminderCalendarPickerSheet from '@/components/reminders/ReminderCalendarPickerSheet';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet from '@/components/pickers/RepeatPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createReminder, listReminders, type RepeatOption } from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate, isIsoDateBefore, isReminderDateTimeInPast, todayIsoDate } from '@/utils/calendar';
import type { Reminder } from '@/types/api';

type Sheet = 'date' | 'time' | 'repeat' | null;

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

function normalizeTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTimeDisplay(time: string): string {
  return normalizeTime(time);
}

function isActiveReminderStatus(status: string): boolean {
  return status === 'today' || status === 'scheduled';
}

function repeatToggleLabel(repeat: RepeatOption): string {
  return repeat === 'off' ? t('reminders.repeat_toggle_off') : t('reminders.repeat_toggle_on');
}

export default function AddReminderScreen() {
  const router = useRouter();
  const { activePetId } = useActivePet();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [note, setNote] = useState('');
  const [noteFocused, setNoteFocused] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingReminders, setExistingReminders] = useState<Reminder[]>([]);

  const layout = useMemo(
    () => ({
      formTop: 16 * sy,
      formGap: 22 * sy,
      cardWidth: 335 * sx,
      cardRadius: 12 * sx,
      cardPadH: 16 * sx,
      cardPadV: 14 * sy,
      nameHeight: 48 * sy,
      scheduleHeight: 120 * sy,
      noteHeight: 78 * sy,
      innerGap: 8 * sy,
      rowHeight: 20 * sy,
      saveHeight: 48 * sy,
    }),
    [sx, sy],
  );

  const loadExistingReminders = useCallback(async (): Promise<Reminder[]> => {
    if (!activePetId) return [];
    try {
      const [today, upcoming] = await Promise.all([
        listReminders(activePetId, 'today'),
        listReminders(activePetId, 'upcoming'),
      ]);
      const merged = [...today, ...upcoming];
      setExistingReminders(merged);
      return merged;
    } catch {
      setExistingReminders([]);
      return [];
    }
  }, [activePetId]);

  useEffect(() => {
    loadExistingReminders();
  }, [loadExistingReminders]);

  const hasDuplicateInList = useCallback(
    (list: Reminder[], nextDate: string, nextTime: string) =>
      list.some(
        (r) =>
          isActiveReminderStatus(r.status) &&
          r.date === nextDate &&
          normalizeTime(r.time) === normalizeTime(nextTime),
      ),
    [],
  );

  const warnDuplicate = useCallback(
    (nextDate: string, nextTime: string, list = existingReminders) => {
      if (!hasDuplicateInList(list, nextDate, nextTime)) return false;
      Alert.alert(t('common.error'), t('reminders.duplicate_datetime'));
      return true;
    },
    [existingReminders, hasDuplicateInList],
  );

  const warnPastDateTime = useCallback((nextDate: string, nextTime: string) => {
    if (!isReminderDateTimeInPast(nextDate, nextTime)) return false;
    Alert.alert(t('common.error'), t('reminders.past_datetime'));
    return true;
  }, []);

  const canSave =
    title.trim().length > 0 &&
    !!date &&
    !!time &&
    !submitting &&
    !isReminderDateTimeInPast(date ?? '', time ?? '');
  const showNoteLabel = noteFocused || note.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || !activePetId || !date || !time) return;
    const latest = await loadExistingReminders();
    if (warnDuplicate(date, time, latest)) return;
    if (warnPastDateTime(date, time)) return;

    try {
      setSubmitting(true);
      await createReminder(activePetId, {
        title: title.trim(),
        date,
        time,
        repeat,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const handleDateConfirm = (iso: string) => {
    if (isIsoDateBefore(iso, todayIsoDate())) {
      Alert.alert(t('common.error'), t('reminders.past_datetime'));
      return;
    }
    if (time && warnDuplicate(iso, time)) return;
    if (time && warnPastDateTime(iso, time)) {
      setTime(null);
    }
    setDate(iso);
    setSheet(null);
  };

  const handleTimeConfirm = (value: string) => {
    if (!date) return;
    if (warnPastDateTime(date, value)) return;
    if (warnDuplicate(date, value)) return;
    setTime(value);
    setSheet(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <VaccineScreenHeader
        title={t('reminders.add_title')}
        icon="close"
        extraTopOffset={44 * sy}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.formTop,
              paddingBottom: 32 * sy,
              gap: layout.formGap,
              alignItems: 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Reminder name */}
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
              onChangeText={setTitle}
              placeholder={t('reminders.field_name_placeholder')}
              placeholderTextColor={Colors.secondaryText}
              autoFocus
              returnKeyType="next"
            />
          </View>

          {/* Date / time / repeat */}
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
              onPress={() => setSheet('date')}
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
              onPress={() => setSheet('time')}
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
              onPress={() => setSheet('repeat')}
              activeOpacity={0.6}
            >
              <View style={styles.scheduleLeft}>
                <Ionicons name="repeat-outline" size={18} color={Colors.primaryText} />
                <Text style={styles.scheduleLabel}>{t('reminders.field_repeat')}</Text>
              </View>
              <Text style={styles.scheduleValue}>{repeatToggleLabel(repeat)}</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
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
                gap: 10 * sy,
              },
            ]}
          >
            <View style={[styles.noteInner, { minHeight: 50 * sy, gap: 6 * sy }]}>
              {showNoteLabel ? (
                <Text style={styles.noteLabel}>{t('reminders.field_description')}</Text>
              ) : null}
              <TextInput
                style={[
                  styles.noteInput,
                  !showNoteLabel && styles.noteInputCentered,
                ]}
                value={note}
                onChangeText={setNote}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
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

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                width: layout.cardWidth,
                height: layout.saveHeight,
                borderRadius: layout.cardRadius,
              },
              !canSave && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
                {t('common.save')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ReminderCalendarPickerSheet
        visible={sheet === 'date'}
        value={date}
        onClose={() => setSheet(null)}
        onConfirm={handleDateConfirm}
      />
      <TimePickerSheet
        visible={sheet === 'time'}
        value={time}
        onClose={() => setSheet(null)}
        onConfirm={handleTimeConfirm}
      />
      <RepeatPickerSheet
        visible={sheet === 'repeat'}
        value={repeat}
        onClose={() => setSheet(null)}
        onSelect={(value) => {
          setRepeat(value);
          setSheet(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: Colors.surface,
  },
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
  placeholder: {
    color: Colors.secondaryText,
  },
  noteInner: {
    width: '100%',
  },
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
  saveButtonDisabled: {
    backgroundColor: Colors.button.disabledBg,
  },
  saveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
  saveTextDisabled: {
    color: Colors.button.disabledText,
  },
});
