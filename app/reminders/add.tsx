import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Alert, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import ReminderFormBody from '@/components/reminders/ReminderFormBody';
import {
  clampReminderTimeForDate,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import { categoryLabel } from '@/components/pickers/CategoryPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createReminder, type RepeatOption } from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import { guardAddReminder } from '@/services/subscription';
import { registerForPushNotifications } from '@/services/notifications';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import {
  resolveReminderCategory,
  type ReminderCategory,
} from '@/utils/reminderCategory';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { todayIsoDate } from '@/utils/calendar';

export default function AddReminderScreen() {
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { activePetId } = useActivePet();
  const petsQuery = usePetsQuery();
  const pets = petsQuery.data ?? [];
  const { contentWidth } = useResponsiveLayout();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('general');
  const [categoryManual, setCategoryManual] = useState(false);
  const [date, setDate] = useState<string | null>(() => todayIsoDate());
  const [time, setTime] = useState<string | null>(() =>
    clampReminderTimeForDate(todayIsoDate(), null),
  );
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [note, setNote] = useState('');
  const [noteFocused, setNoteFocused] = useState(false);
  const [sheet, setSheet] = useState<ReminderSheet>(null);
  const [submitting, setSubmitting] = useState(false);

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
      scheduleHeight: 120,
      noteHeight: 78,
      innerGap: 8,
      rowHeight: 20,
      footerHeight: 48,
    }),
    [contentWidth],
  );

  /** Only past calendar days are blocked — today (any time) is allowed. */
  const warnPastDate = useCallback((nextDate: string) => {
    if (nextDate.slice(0, 10) >= todayIsoDate()) return false;
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
    Keyboard.dismiss();
    if (!title.trim()) {
      toast.showError(t('errors.generic'));
      return;
    }
    if (!activePetId) {
      toast.showError(t('errors.generic'));
      return;
    }
    if (!date || !time) {
      toast.showError(t('reminders.past_datetime'));
      return;
    }
    if (submitting) return;
    if (!(await guardAddReminder(router, pets))) return;
    if (warnPastDate(date)) return;

    const saveTime = clampReminderTimeForDate(date.slice(0, 10), time);
    if (!saveTime) {
      toast.showError(t('reminders.past_datetime'));
      return;
    }

    try {
      setSubmitting(true);
      // Sync device timezone so server "today" matches this phone.
      await registerForPushNotifications();
      await createReminder(activePetId, {
        title: title.trim(),
        date: date.slice(0, 10),
        time: saveTime,
        repeat,
        note: note.trim() || undefined,
        category,
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
    const nextDate = iso.slice(0, 10);
    if (warnPastDate(nextDate)) return;
    setDate(nextDate);
    setTime(clampReminderTimeForDate(nextDate, time));
    setSheet(null);
  };

  const handleTimeConfirm = (value: string) => {
    if (!date) return;
    setTime(clampReminderTimeForDate(date, value) ?? value);
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
        saveFooter={{
          label: t('common.save'),
          disabled: !canSave,
          loading: submitting,
          onPress: handleSave,
        }}
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
