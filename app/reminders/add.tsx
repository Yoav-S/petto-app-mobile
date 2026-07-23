import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import ReminderFormBody, { ReminderSaveButton } from '@/components/reminders/ReminderFormBody';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  hasDuplicateInList,
  isBeforeMinReminderDate,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createReminder, listReminders, type RepeatOption } from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import type { Reminder } from '@/types/api';

export default function AddReminderScreen() {
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
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
  const [sheet, setSheet] = useState<ReminderSheet>(null);
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
      footerHeight: 48 * sy,
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

  const warnDuplicate = useCallback(
    (nextDate: string, nextTime: string, list = existingReminders) => {
      if (!hasDuplicateInList(list, nextDate, nextTime)) return false;
      toast.showError(t('reminders.duplicate_datetime'));
      return true;
    },
    [existingReminders, toast],
  );

  const warnBeforeMinDate = useCallback((nextDate: string) => {
    if (!isBeforeMinReminderDate(nextDate)) return false;
    toast.showError(t('reminders.past_datetime'));
    return true;
  }, [toast]);

  const canSave = title.trim().length > 0 && !!date && !!time && !submitting;

  const handleSave = async () => {
    if (!canSave || !activePetId || !date || !time) return;
    const latest = await loadExistingReminders();
    if (warnDuplicate(date, time, latest)) return;
    if (warnBeforeMinDate(date)) return;

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
      const message = getErrorMessage(err);
      if (message === t('errors.premium_required_reminder')) {
        Alert.alert(t('settings.limit_reminder_title'), message, [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.upgrade'),
            onPress: () => router.push('/settings/subscription' as never),
          },
        ]);
      } else {
        toast.showError(message);
      }
      setSubmitting(false);
    }
  };

  const handleDateConfirm = (iso: string) => {
    if (warnBeforeMinDate(iso)) return;
    if (time && warnDuplicate(iso, time)) return;
    setDate(iso);
    setSheet(null);
  };

  const handleTimeConfirm = (value: string) => {
    if (!date) return;
    if (warnDuplicate(date, value)) return;
    setTime(value);
    setSheet(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <VaccineScreenHeader title={t('reminders.add_title')} icon="close" />
      <ReminderFormBody
        layout={layout}
        title={title}
        onTitleChange={setTitle}
        date={date}
        time={time}
        repeat={repeat}
        note={note}
        onNoteChange={setNote}
        noteFocused={noteFocused}
        onNoteFocus={() => setNoteFocused(true)}
        onNoteBlur={() => setNoteFocused(false)}
        sheet={sheet}
        onSheetChange={setSheet}
        onDateConfirm={handleDateConfirm}
        onTimeConfirm={handleTimeConfirm}
        onRepeatSelect={setRepeat}
        autoFocus
        footer={
          <ReminderSaveButton
            layout={layout}
            canSave={canSave}
            saving={submitting}
            onPress={handleSave}
          />
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
});
