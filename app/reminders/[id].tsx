import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import ScrollFadeBand from '@/components/ui/ScrollFadeBand';
import {
  FOOTER_FADE_BAND,
  FOOTER_FADE_CONTENT_INSET,
} from '@/constants/layout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useFocusEffect,
  useNavigation,
  usePreventRemove,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ReminderFormBody from '@/components/reminders/ReminderFormBody';
import ReminderFireHistoryList from '@/components/reminders/ReminderFireHistoryList';
import SavingOverlay from '@/components/ui/SavingOverlay';
import {
  clampAlertForSchedule,
  clampReminderTimeForDate,
  isRecentOccurrence,
  type ReminderSheet,
} from '@/components/reminders/reminderFormShared';
import { categoryLabel } from '@/components/pickers/CategoryPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import {
  getReminder,
  updateReminder,
  deleteReminder,
  listReminderHistory,
  parseAlert,
  type AlertOption,
  type RepeatOption,
} from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import {
  resolveReminderCategory,
  REMINDER_CATEGORIES,
  type ReminderCategory,
} from '@/utils/reminderCategory';
import type { Reminder } from '@/types/api';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useKeyboardOpen } from '@/components/ui/keyboardUtils';
import { todayIsoDate } from '@/utils/calendar';

type PendingLeave = Parameters<Parameters<typeof usePreventRemove>[1]>[0]['data']['action'];

const AUTOSAVE_MS = 700;
/** Delete sits on the solid tail of the fade band, clear of the home indicator. */
const DELETE_FOOTER_MIN_BOTTOM = 10;

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
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { id, recent } = useLocalSearchParams<{ id: string; recent?: string }>();
  const { activePetId } = useActivePet();
  const { contentWidth } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();

  /** Recent rows announce themselves in the route, so the title never flips. */
  const openedFromRecent = (Array.isArray(recent) ? recent[0] : recent) === '1';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [readOnly, setReadOnly] = useState(openedFromRecent);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('general');
  const [categoryManual, setCategoryManual] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [alert, setAlert] = useState<AlertOption>('off');
  const [note, setNote] = useState('');
  const [noteFocused, setNoteFocused] = useState(false);
  const [sheet, setSheet] = useState<ReminderSheet>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  /** Only set while a pending write is being flushed on the way out. */
  const [flushing, setFlushing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<PendingLeave | null>(null);
  const [fireHistory, setFireHistory] = useState<Reminder[]>([]);

  const hydratedRef = useRef(false);
  const snapshotRef = useRef('');
  const originalDateRef = useRef<string | null>(null);
  const originalTimeRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

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

  const buildSnapshot = useCallback(
    () =>
      JSON.stringify({
        title: title.trim(),
        category,
        date,
        endDate,
        time,
        repeat,
        alert,
        note: note.trim(),
      }),
    [title, category, date, endDate, time, repeat, alert, note],
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
      /** Only live Today / Upcoming heads are editable — never a fired occurrence. */
      const editable =
        (reminder.status === 'scheduled' || reminder.status === 'today') &&
        !isRecentOccurrence(reminder);
      setReadOnly(!editable);

      let history: Reminder[] = [];
      if (isRecentOccurrence(reminder)) {
        try {
          history = await listReminderHistory(activePetId, id);
        } catch {
          history = [reminder];
        }
        if (history.length === 0) history = [reminder];
      }
      setFireHistory(history);

      setTitle(reminder.title);
      setCategory(parseCategory(reminder.category, reminder.title));
      setCategoryManual(Boolean(reminder.category));
      setDate(reminder.date);
      setEndDate(reminder.end_date?.slice(0, 10) || null);
      setTime(reminder.time);
      setRepeat((reminder.repeat as RepeatOption) ?? 'off');
      setAlert(parseAlert(reminder.alert));
      setNote(reminder.note ?? '');
      originalDateRef.current = reminder.date;
      originalTimeRef.current = reminder.time;
      snapshotRef.current = JSON.stringify({
        title: reminder.title.trim(),
        category: parseCategory(reminder.category, reminder.title),
        date: reminder.date,
        endDate: reminder.end_date?.slice(0, 10) || null,
        time: reminder.time,
        repeat: reminder.repeat,
        alert: parseAlert(reminder.alert),
        note: (reminder.note ?? '').trim(),
      });
      hydratedRef.current = true;
      dirtyRef.current = false;
      setDirty(false);
    } catch (err) {
      setError(getErrorMessage(err));
      setNotFound(true);
      setFireHistory([]);
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

    if (warnPastDate(date)) return;

    if (endDate && date && endDate <= date) {
      toast.showError(t('reminders.end_before_start'));
      return;
    }

    const saveTime = clampReminderTimeForDate(date.slice(0, 10), time);
    if (!saveTime) return;
    const saveAlert = clampAlertForSchedule(alert, date.slice(0, 10), saveTime);
    if (saveAlert !== alert) setAlert(saveAlert);

    /** Cleared up front so a blur or exit does not re-send the same write. */
    const sentSnapshot = JSON.stringify({
      title: title.trim(),
      category,
      date,
      endDate,
      time: saveTime,
      repeat,
      alert: saveAlert,
      note: note.trim(),
    });
    dirtyRef.current = false;
    setDirty(false);

    try {
      await updateReminder(activePetId, id, {
        title: title.trim(),
        date: date.slice(0, 10),
        time: saveTime,
        repeat,
        end_date: endDate,
        alert: saveAlert,
        note: note.trim() || undefined,
        category,
      });
      snapshotRef.current = sentSnapshot;
    } catch (err) {
      dirtyRef.current = true;
      setDirty(true);
      toast.showError(getErrorMessage(err));
    }
  }, [
    activePetId,
    id,
    readOnly,
    title,
    date,
    endDate,
    time,
    repeat,
    alert,
    note,
    category,
    warnPastDate,
    buildSnapshot,
    toast,
  ]);

  /** Keeps the flush helpers off the render-identity treadmill of `persist`. */
  const persistRef = useRef(persist);
  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  useEffect(() => {
    if (!hydratedRef.current || readOnly) return;
    const nextSnapshot = buildSnapshot();
    if (nextSnapshot === snapshotRef.current) return;
    if (!title.trim() || !date || !time) return;

    dirtyRef.current = true;
    setDirty(true);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void persistRef.current();
    }, AUTOSAVE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, date, endDate, time, repeat, alert, note, category, buildSnapshot, readOnly]);

  /** Writes the pending edit now instead of waiting out the debounce. */
  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!dirtyRef.current) return;
    await persistRef.current();
  }, []);

  const handleFieldBlur = useCallback(() => {
    void flushSave();
  }, [flushSave]);

  /** Leaving stores first: the veil blocks the screen only for that write. */
  usePreventRemove(dirty && !readOnly && pendingLeave == null, ({ data }) => {
    void (async () => {
      setFlushing(true);
      try {
        await flushSave();
      } finally {
        setFlushing(false);
      }
      setPendingLeave(data.action);
    })();
  });

  useEffect(() => {
    if (!pendingLeave) return;
    navigation.dispatch(pendingLeave);
  }, [navigation, pendingLeave]);

  const handleDateConfirm = (iso: string) => {
    if (warnPastDate(iso)) return;
    const nextDate = iso.slice(0, 10);
    const nextTime = clampReminderTimeForDate(nextDate, time);
    setDate(nextDate);
    setTime(nextTime);
    setAlert(clampAlertForSchedule(alert, nextDate, nextTime));
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
    const nextTime = clampReminderTimeForDate(date, value) ?? value;
    setTime(nextTime);
    setAlert(clampAlertForSchedule(alert, date, nextTime));
    setSheet(null);
  };

  const handleDelete = () => {
    if (!activePetId || !id) return;
    setDeleteVisible(false);
    /** Pending edits die with the reminder — never flush them on the way out. */
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    dirtyRef.current = false;
    setDirty(false);
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

  const headerTitle = readOnly ? t('reminders.recent_title') : t('reminders.edit_title');
  const header = <VaccineScreenHeader title={headerTitle} icon="close" />;
  const showHistory = readOnly && fireHistory.length > 0;

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
      <View style={styles.screen}>
        <HeaderScrollLayout
          header={header}
          edges={['left', 'right']}
          topFade
        >
          {({ paddingTop }) => (
            <ReminderFormBody
              scrollInsetTop={paddingTop}
              /** The recent list runs under the fade band; its own scroll clears it. */
              scrollPaddingBottom={showHistory ? 0 : FOOTER_FADE_CONTENT_INSET}
              layout={layout}
              title={title}
              onTitleChange={handleTitleChange}
              onTitleBlur={handleFieldBlur}
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
              onNoteBlur={() => {
                setNoteFocused(false);
                handleFieldBlur();
              }}
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
              readOnly={readOnly}
              showCategoryField={!readOnly}
              showAlertField={!readOnly}
              fillAfterFields={showHistory}
              afterFields={
                showHistory ? (
                  <ReminderFireHistoryList
                    items={fireHistory}
                    width={layout.cardWidth}
                    fill
                    bottomFade={false}
                  />
                ) : null
              }
            />
          )}
        </HeaderScrollLayout>

        <View
          style={[
            styles.deleteFooter,
            {
              height: FOOTER_FADE_BAND,
              paddingBottom: Math.max(insets.bottom, DELETE_FOOTER_MIN_BOTTOM),
            },
            /** Never let delete ride up on the keyboard while a field is open. */
            keyboardOpen ? styles.hidden : null,
          ]}
          pointerEvents={keyboardOpen ? 'none' : 'box-none'}
        >
          <ScrollFadeBand edge="bottom" height={FOOTER_FADE_BAND} />
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
      </View>

      <ConfirmModal
        visible={deleteVisible}
        title={t('reminders.delete_confirm_title')}
        message={t('reminders.delete_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />

      <SavingOverlay visible={flushing} />
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Sits on the fade band so the list above dissolves into the button. */
  deleteFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  hidden: {
    opacity: 0,
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
