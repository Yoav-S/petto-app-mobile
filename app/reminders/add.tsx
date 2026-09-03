import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
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
import { createReminder, DEFAULT_REMINDER_TIME, type AlertOption, type RepeatOption } from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import { guardAddReminder, presentPremiumLimitFromError } from '@/services/subscription';
import { registerForPushNotifications } from '@/services/notifications';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import {
  resolveReminderCategory,
  type ReminderCategory,
} from '@/utils/reminderCategory';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { DiscardChangesModal } from '@/components/ui/ConfirmModal';
import { tomorrowIsoDate, todayIsoDate } from '@/utils/calendar';

export default function AddReminderScreen() {
  const toast = useToast();
  const router = useRouter();
  const { activePetId } = useActivePet();
  const petsQuery = usePetsQuery();
  const pets = petsQuery.data ?? [];
  const { contentWidth } = useResponsiveLayout();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('general');
  const [categoryManual, setCategoryManual] = useState(false);
  const [date, setDate] = useState<string | null>(() => tomorrowIsoDate());
  const [endDate, setEndDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(DEFAULT_REMINDER_TIME);
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [alert, setAlert] = useState<AlertOption>('off');
  const [note, setNote] = useState('');
  const [noteFocused, setNoteFocused] = useState(false);
  const [sheet, setSheet] = useState<ReminderSheet>(null);
  const [submitting, setSubmitting] = useState(false);
  const originalRef = useRef({
    title: '',
    category: 'general' as ReminderCategory,
    date: tomorrowIsoDate() as string | null,
    endDate: null as string | null,
    time: DEFAULT_REMINDER_TIME as string | null,
    repeat: 'off' as RepeatOption,
    alert: 'off' as AlertOption,
    note: '',
  });

  const layout = useMemo(
    () => ({
      formTop: 0,
      formGap: 22,
      cardWidth: contentWidth,
      cardRadius: 12,
      cardPadH: 16,
      cardPadV: 14,
      nameHeight: 52,
      categoryHeight: 52,
      scheduleHeight: 120,
      noteHeight: 78,
      innerGap: 0,
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
  const isDirty =
    title !== originalRef.current.title ||
    category !== originalRef.current.category ||
    date !== originalRef.current.date ||
    endDate !== originalRef.current.endDate ||
    time !== originalRef.current.time ||
    repeat !== originalRef.current.repeat ||
    alert !== originalRef.current.alert ||
    note !== originalRef.current.note;
  const { discardVisible, onDiscard, onStay, skipPrompt } = useUnsavedChangesGuard(
    isDirty,
    submitting,
  );

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
    if (endDate && endDate <= date) {
      toast.showError(t('reminders.end_before_start'));
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
        end_date: endDate,
        alert,
        note: note.trim() || undefined,
        category,
      });
      skipPrompt(() => router.back());
    } catch (err) {
      if (!presentPremiumLimitFromError(err)) {
        toast.showError(getErrorMessage(err));
      }
      setSubmitting(false);
    }
  };

  const handleDateConfirm = (iso: string) => {
    const nextDate = iso.slice(0, 10);
    if (warnPastDate(nextDate)) return;
    setDate(nextDate);
    setTime(clampReminderTimeForDate(nextDate, time) ?? DEFAULT_REMINDER_TIME);
    if (endDate && endDate <= nextDate) setEndDate(null);
    setSheet(null);
  };

  const handleEndDateConfirm = (iso: string) => {
    const nextEnd = iso.slice(0, 10);
    if (date && nextEnd <= date) {
      toast.showError(t('reminders.end_before_start'));
      return;
    }
    setEndDate(nextEnd);
    setSheet(null);
  };

  const handleTimeConfirm = (value: string) => {
    if (!date) return;
    setTime(clampReminderTimeForDate(date, value) ?? value);
    setSheet(null);
  };

  return (
    <>
    <HeaderScrollLayout
      header={<VaccineScreenHeader title={t('reminders.add_title')} icon="close" />}
      edges={['left', 'right']}
      topFade
      bottomFade
    >
      {({ paddingTop }) => (
        <ReminderFormBody
          scrollInsetTop={paddingTop}
          layout={layout}
        title={title}
        onTitleChange={handleTitleChange}
        category={category}
        onCategorySelect={handleCategorySelect}
        date={date}
        endDate={endDate}
        time={time}
        repeat={repeat}
        alert={alert}
        note={note}
        onNoteChange={setNote}
        noteFocused={noteFocused}
        onNoteFocus={() => setNoteFocused(true)}
        onNoteBlur={() => setNoteFocused(false)}
        sheet={sheet}
        onSheetChange={setSheet}
        onDateConfirm={handleDateConfirm}
        onEndDateConfirm={handleEndDateConfirm}
        onEndDateClear={() => {
          setEndDate(null);
          setSheet(null);
        }}
        onTimeConfirm={handleTimeConfirm}
        onRepeatSelect={setRepeat}
        onAlertConfirm={setAlert}
        autoFocus
        saveFooter={{
          label: t('common.save'),
          disabled: !canSave,
          loading: submitting,
          onPress: handleSave,
        }}
        />
      )}
    </HeaderScrollLayout>
    <DiscardChangesModal
      visible={discardVisible}
      onDiscard={onDiscard}
      onStay={onStay}
    />
    </>
  );
}
