import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import ReminderFormBody, { ReminderAutosaveStatus } from '@/components/reminders/ReminderFormBody';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  hasDuplicateInList,
  isBeforeMinReminderDate,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import {
  getReminder,
  listReminders,
  updateReminder,
  type RepeatOption,
} from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import type { Reminder } from '@/types/api';

type AutosaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_MS = 700;

export default function EditReminderScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activePetId } = useActivePet();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [note, setNote] = useState('');
  const [noteFocused, setNoteFocused] = useState(false);
  const [sheet, setSheet] = useState<ReminderSheet>(null);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>('idle');
  const [existingReminders, setExistingReminders] = useState<Reminder[]>([]);

  const hydratedRef = useRef(false);
  const snapshotRef = useRef('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const buildSnapshot = useCallback(
    () =>
      JSON.stringify({
        title: title.trim(),
        date,
        time,
        repeat,
        note: note.trim(),
      }),
    [title, date, time, repeat, note],
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

  const fetchData = useCallback(async () => {
    if (!activePetId || !id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const [reminder] = await Promise.all([
        getReminder(activePetId, id),
        loadExistingReminders(),
      ]);

      if (reminder.status !== 'scheduled') {
        setNotFound(true);
        setError(t('reminders.edit_not_allowed'));
        setLoading(false);
        return;
      }

      setTitle(reminder.title);
      setDate(reminder.date);
      setTime(reminder.time);
      setRepeat((reminder.repeat as RepeatOption) ?? 'off');
      setNote(reminder.note ?? '');
      snapshotRef.current = JSON.stringify({
        title: reminder.title.trim(),
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
  }, [activePetId, id, loadExistingReminders]);

  useFocusEffect(
    useCallback(() => {
      hydratedRef.current = false;
      setLoading(true);
      fetchData();
    }, [fetchData]),
  );

  const warnDuplicate = useCallback(
    (nextDate: string, nextTime: string, list = existingReminders) => {
      if (!hasDuplicateInList(list, nextDate, nextTime, id)) return false;
      Alert.alert(t('common.error'), t('reminders.duplicate_datetime'));
      return true;
    },
    [existingReminders, id],
  );

  const warnBeforeMinDate = useCallback((nextDate: string) => {
    if (!isBeforeMinReminderDate(nextDate)) return false;
    Alert.alert(t('common.error'), t('reminders.past_datetime'));
    return true;
  }, []);

  const persist = useCallback(async () => {
    if (!activePetId || !id || !hydratedRef.current) return;
    if (!title.trim() || !date || !time) return;

    const latest = await loadExistingReminders();
    if (warnDuplicate(date, time, latest)) {
      setAutosaveState('error');
      return;
    }
    if (warnBeforeMinDate(date)) {
      setAutosaveState('error');
      return;
    }

    try {
      setAutosaveState('saving');
      await updateReminder(activePetId, id, {
        title: title.trim(),
        date,
        time,
        repeat,
        note: note.trim() || undefined,
      });
      snapshotRef.current = buildSnapshot();
      setAutosaveState('saved');
    } catch (err) {
      setAutosaveState('error');
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  }, [
    activePetId,
    id,
    title,
    date,
    time,
    repeat,
    note,
    loadExistingReminders,
    warnDuplicate,
    warnBeforeMinDate,
    buildSnapshot,
  ]);

  useEffect(() => {
    if (!hydratedRef.current) return;
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
  }, [title, date, time, repeat, note, buildSnapshot, persist]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <VaccineScreenHeader title={t('reminders.edit_title')} icon="close" extraTopOffset={44 * sy} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <VaccineScreenHeader title={t('reminders.edit_title')} icon="close" extraTopOffset={44 * sy} />
        <View style={styles.centered}>
          <EmptyState
            title={t('reminders.not_found_title')}
            subtitle={error ?? t('reminders.not_found_subtitle')}
            actionTitle={t('reminders.back')}
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <VaccineScreenHeader
        title={t('reminders.edit_title')}
        icon="close"
        extraTopOffset={44 * sy}
      />
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
        footer={<ReminderAutosaveStatus layout={layout} state={autosaveState} />}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  centered: {
    flex: 1,
  },
});
