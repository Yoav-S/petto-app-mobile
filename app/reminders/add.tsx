import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import ReminderFormBody from '@/components/reminders/ReminderFormBody';
import HealthKeyboardFooter, {
  healthKeyboardScrollPadding,
} from '@/components/health/HealthKeyboardFooter';
import {
  hasDuplicateInList,
  isReminderScheduleInPast,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import { categoryLabel } from '@/components/pickers/CategoryPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createReminder, listReminders, type RepeatOption } from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import type { Reminder } from '@/types/api';
import {
  resolveReminderCategory,
  type ReminderCategory,
} from '@/utils/reminderCategory';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export default function AddReminderScreen() {
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { activePetId } = useActivePet();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsiveLayout();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('general');
  const [categoryManual, setCategoryManual] = useState(false);
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
      formTop: 16,
      formGap: 22,
      cardWidth: contentWidth,
      cardRadius: 12,
      cardPadH: 16,
      cardPadV: 14,
      nameHeight: 52,
      categoryHeight: 52,
      scheduleHeight: 140,
      noteHeight: 78,
      innerGap: 8,
      rowHeight: 24,
      footerHeight: 48,
    }),
    [contentWidth],
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

  const warnPastSchedule = useCallback((nextDate: string, nextTime?: string | null) => {
    if (!isReminderScheduleInPast(nextDate, nextTime)) return false;
    toast.showError(t('reminders.past_datetime'));
    return true;
  }, [toast]);

  const canSave = title.trim().length > 0 && !!date && !!time && !submitting;

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!categoryManual) {
      setCategory(resolveReminderCategory(value));
      return;
    }
    if (!value.trim()) {
      setCategoryManual(false);
      setCategory('general');
    }
  };

  const handleCategorySelect = (value: ReminderCategory) => {
    setCategory(value);
    setCategoryManual(true);
    if (!title.trim()) {
      setTitle(categoryLabel(value));
    }
  };

  const handleSave = async () => {
    if (!canSave || !activePetId || !date || !time) return;
    const latest = await loadExistingReminders();
    if (warnDuplicate(date, time, latest)) return;
    if (warnPastSchedule(date, time)) return;

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
    if (warnPastSchedule(iso, null)) return;
    if (time && warnDuplicate(iso, time)) return;
    if (time && isReminderScheduleInPast(iso, time)) {
      toast.showError(t('reminders.past_datetime'));
      setDate(iso);
      setTime(null);
      setSheet(null);
      return;
    }
    setDate(iso);
    setSheet(null);
  };

  const handleTimeConfirm = (value: string) => {
    if (!date) return;
    if (warnPastSchedule(date, value)) return;
    if (warnDuplicate(date, value)) return;
    setTime(value);
    setSheet(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <VaccineScreenHeader title={t('reminders.add_title')} icon="close" />
      <ReminderFormBody
        layout={layout}
        title={title}
        onTitleChange={handleTitleChange}
        category={category}
        onCategorySelect={handleCategorySelect}
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
        scrollPaddingBottom={healthKeyboardScrollPadding(1, insets.bottom)}
        stickyFooter={
          <HealthKeyboardFooter
            label={t('common.save')}
            disabled={!canSave}
            loading={submitting}
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
