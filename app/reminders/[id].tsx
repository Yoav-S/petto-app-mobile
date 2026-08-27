import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ReminderFormBody, { ReminderAutosaveStatus } from '@/components/reminders/ReminderFormBody';
import {
  clampReminderTimeForDate,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import { categoryLabel } from '@/components/pickers/CategoryPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import {
  getReminder,
  updateReminder,
  deleteReminder,
  type RepeatOption,
} from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import {
  resolveReminderCategory,
  REMINDER_CATEGORIES,
  type ReminderCategory,
} from '@/utils/reminderCategory';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { todayIsoDate } from '@/utils/calendar';

type AutosaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_MS = 700;
const DELETE_BOTTOM_GAP = 16;

function parseCategory(value: string | null | undefined, title: string): ReminderCategory {
  if (value && (REMINDER_CATEGORIES as string[]).includes(value)) {
    return value as ReminderCategory;
  }
  return resolveReminderCategory(title);
}

export default function EditReminderScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activePetId } = useActivePet();
  const { contentWidth } = useResponsiveLayout();
  const deleteBottomPad = DELETE_BOTTOM_GAP;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('general');
  const [categoryManual, setCategoryManual] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [note, setNote] = useState('');
  const [noteFocused, setNoteFocused] = useState(false);
  const [sheet, setSheet] = useState<ReminderSheet>(null);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>('idle');
  const [deleteVisible, setDeleteVisible] = useState(false);

  const hydratedRef = useRef(false);
  const snapshotRef = useRef('');
  const originalDateRef = useRef<string | null>(null);
  const originalTimeRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const buildSnapshot = useCallback(
    () =>
      JSON.stringify({
        title: title.trim(),
        category,
        date,
        time,
        repeat,
        note: note.trim(),
      }),
    [title, category, date, time, repeat, note],
  );

  const fetchData = useCallback(async () => {
    if (!activePetId || !id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const reminder = await getReminder(activePetId, id);
      const editable = reminder.status === 'scheduled' || reminder.status === 'today';
      setReadOnly(!editable);

      setTitle(reminder.title);
      setCategory(parseCategory(reminder.category, reminder.title));
      setCategoryManual(Boolean(reminder.category));
      setDate(reminder.date);
      setTime(reminder.time);
      setRepeat((reminder.repeat as RepeatOption) ?? 'off');
      setNote(reminder.note ?? '');
      originalDateRef.current = reminder.date;
      originalTimeRef.current = reminder.time;
      snapshotRef.current = JSON.stringify({
        title: reminder.title.trim(),
        category: parseCategory(reminder.category, reminder.title),
        date: reminder.date,
        time: reminder.time,
        repeat: reminder.repeat,
        note: (reminder.note ?? '').trim(),
      });
      hydratedRef.current = true;
      setAutosaveState('idle');
    } catch (err) {
      setError(getErrorMessage(err));
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [activePetId, id]);

  useFocusEffect(
    useCallback(() => {
      hydratedRef.current = false;
      setLoading(true);
      fetchData();
    }, [fetchData]),
  );

  const warnPastDate = useCallback((nextDate: string) => {
    const sameOriginal = originalDateRef.current === nextDate;
    if (sameOriginal) return false;
    if (nextDate >= todayIsoDate()) return false;
    toast.showError(t('reminders.past_datetime'));
    return true;
  }, [toast]);

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

  const persist = useCallback(async () => {
    if (!activePetId || !id || !hydratedRef.current || readOnly) return;
    if (!title.trim() || !date || !time) return;

    if (warnPastDate(date)) {
      setAutosaveState('error');
      return;
    }

    try {
      setAutosaveState('saving');
      const saveTime = clampReminderTimeForDate(date.slice(0, 10), time);
      if (!saveTime) {
        setAutosaveState('error');
        return;
      }
      await updateReminder(activePetId, id, {
        title: title.trim(),
        date: date.slice(0, 10),
        time: saveTime,
        repeat,
        note: note.trim() || undefined,
        category,
      });
      snapshotRef.current = buildSnapshot();
      setAutosaveState('saved');
    } catch (err) {
      setAutosaveState('error');
      toast.showError(getErrorMessage(err));
    }
  }, [
    activePetId,
    id,
    readOnly,
    title,
    date,
    time,
    repeat,
    note,
    category,
    warnPastDate,
    buildSnapshot,
    toast,
  ]);

  useEffect(() => {
    if (!hydratedRef.current || readOnly) return;
    const nextSnapshot = buildSnapshot();
    if (nextSnapshot === snapshotRef.current) return;
    if (!title.trim() || !date || !time) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persist();
    }, AUTOSAVE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, date, time, repeat, note, category, buildSnapshot, persist, readOnly]);

  const handleDateConfirm = (iso: string) => {
    if (warnPastDate(iso)) return;
    const nextTime = clampReminderTimeForDate(iso, time);
    setDate(iso);
    setTime(nextTime);
    setSheet(null);
  };

  const handleTimeConfirm = (value: string) => {
    if (!date) return;
    setTime(clampReminderTimeForDate(date, value) ?? value);
    setSheet(null);
  };

  const handleDelete = () => {
    if (!activePetId || !id) return;
    setDeleteVisible(false);
    toast.showUndo({
      message: t('reminders.deleted'),
      onUndo: () => {},
      onCommit: async () => {
        try {
          await deleteReminder(activePetId, id);
          router.replace('/reminders' as never);
        } catch (err) {
          toast.showError(getErrorMessage(err));
        }
      },
    });
  };

  const headerTitle = readOnly ? t('reminders.detail_title') : t('reminders.edit_title');
  const header = <VaccineScreenHeader title={headerTitle} icon="close" />;

  if (loading) {
    return (
      <HeaderScrollLayout header={header} edges={['left', 'right', 'bottom']}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <ActivityIndicator color={colors.primaryText} />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  if (notFound) {
    return (
      <HeaderScrollLayout header={header} edges={['left', 'right', 'bottom']}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <EmptyState
              title={t('reminders.not_found_title')}
              subtitle={error ?? t('reminders.not_found_subtitle')}
              actionTitle={t('reminders.back')}
              onAction={() => router.back()}
            />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  return (
    <>
      <HeaderScrollLayout header={header} edges={['left', 'right', 'bottom']}>
        {({ paddingTop }) => (
          <ReminderFormBody
            scrollInsetTop={paddingTop}
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
        readOnly={readOnly}
        pinFooterToBottom
        footerBottomInset={deleteBottomPad}
        footer={
          readOnly ? undefined : (
            <View>
              <ReminderAutosaveStatus layout={layout} state={autosaveState} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setSheet(null);
                  setDeleteVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteText}>{t('reminders.delete')}</Text>
              </TouchableOpacity>
            </View>
          )
        }
          />
        )}
      </HeaderScrollLayout>

      <ConfirmModal
        visible={deleteVisible}
        title={t('reminders.delete_confirm_title')}
        message={t('reminders.delete_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 18,
    color: c.error,
  },
});
