import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SpeedDialFab from '@/components/ui/SpeedDialFab';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import ReminderListItem from '@/components/reminders/ReminderListItem';
import ReminderActionSheet from '@/components/reminders/ReminderActionSheet';
import { needsStatusPrompt } from '@/components/reminders/reminderFormShared';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import {
  listReminders,
  updateReminderStatus,
} from '@/services/reminders';
import { repeatLabel } from '@/components/pickers/RepeatPickerSheet';
import { getErrorMessage } from '@/services/errors';
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
} from '@/utils/calendar';
import { guardAddReminder } from '@/services/subscription';
import { apiGet } from '@/services/api';
import type { Pet, Reminder } from '@/types/api';
import type { RepeatOption } from '@/services/reminders';

const TABS = ['Today', 'Upcoming', 'Recent'] as const;
type TabName = (typeof TABS)[number];

const EMPTY_LISTS: Record<TabName, Reminder[]> = {
  Today: [],
  Upcoming: [],
  Recent: [],
};

function reminderSubtitle(item: Reminder): string {
  if (item.note) return item.note;
  if (item.repeat && item.repeat !== 'off') return repeatLabel(item.repeat as RepeatOption);
  return '';
}

function reminderTimeOrDate(item: Reminder, tab: TabName): string {
  if (tab === 'Today') return item.time;
  if (tab === 'Recent') {
    const status = t(`status.${item.status}`);
    return `${status === `status.${item.status}` ? item.status : status}\n${formatDisplayDate(item.date)}`;
  }
  return `${formatDisplayDate(item.date)}\n${item.time}`;
}

function reminderDateLabel(date: string): string {
  const today = todayIsoDate();
  if (date === today) return t('common.today');
  if (date === addDaysToIsoDate(today, -1)) return t('common.yesterday');
  return formatDisplayDate(date);
}

function sortPromptQueue(items: Reminder[], focusId?: string | null): Reminder[] {
  const unique = new Map<string, Reminder>();
  for (const item of items) {
    if (needsStatusPrompt(item)) unique.set(item.id, item);
  }
  const list = Array.from(unique.values()).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
  if (!focusId) return list;
  const idx = list.findIndex((r) => r.id === focusId);
  if (idx <= 0) return list;
  const [focused] = list.splice(idx, 1);
  return [focused, ...list];
}

export default function RemindersScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const toast = useToast();
  const { activePetId } = useActivePet();
  const params = useLocalSearchParams<{
    deletedId?: string;
    prompt?: string;
    focusId?: string;
  }>();

  const [activeTab, setActiveTab] = useState<TabName>('Today');
  const [listsByTab, setListsByTab] = useState<Record<TabName, Reminder[]>>(EMPTY_LISTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [promptQueue, setPromptQueue] = useState<Reminder[]>([]);
  const [promptTotal, setPromptTotal] = useState(0);
  const sessionSkipRef = useRef(false);
  const autoPromptCheckedRef = useRef(false);

  const items = listsByTab[activeTab];
  const selectedReminder = promptQueue[0] ?? null;
  const actionSheetVisible = selectedReminder != null;
  const promptPosition =
    promptTotal > 1 ? promptTotal - promptQueue.length + 1 : undefined;

  const tabPresence = useMemo(
    () => ({
      today: listsByTab.Today.length > 0,
      upcoming: listsByTab.Upcoming.length > 0,
      recent: listsByTab.Recent.length > 0,
    }),
    [listsByTab],
  );

  const hasAnyReminders = tabPresence.today || tabPresence.upcoming || tabPresence.recent;

  React.useEffect(() => {
    if (params.deletedId) {
      toast.show({ message: t('reminders.deleted'), aboveFab: true });
    }
  }, [params.deletedId, toast]);

  const fetchData = useCallback(async () => {
    if (!activePetId) {
      setListsByTab(EMPTY_LISTS);
      setLoading(false);
      return { today: [] as Reminder[], recent: [] as Reminder[] };
    }
    try {
      setError(null);
      const [today, upcoming, recent] = await Promise.all([
        listReminders(activePetId, 'today'),
        listReminders(activePetId, 'upcoming'),
        listReminders(activePetId, 'recent'),
      ]);
      setListsByTab({ Today: today, Upcoming: upcoming, Recent: recent });
      return { today, recent };
    } catch (err) {
      setError(getErrorMessage(err));
      return { today: [] as Reminder[], recent: [] as Reminder[] };
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activePetId]);

  const openPromptQueue = useCallback(
    (today: Reminder[], recent: Reminder[], focusId?: string | null, force = false) => {
      if (force) sessionSkipRef.current = false;
      if (sessionSkipRef.current && !force) return;
      const queue = sortPromptQueue([...today, ...recent], focusId);
      setPromptQueue(queue);
      setPromptTotal(queue.length);
      if (queue.length) setActiveTab('Today');
    },
    [],
  );

  const maybeAutoPromptStatus = useCallback(
    (today: Reminder[], recent: Reminder[]) => {
      const force = params.prompt === '1' || Boolean(params.focusId);
      if (!force) {
        if (autoPromptCheckedRef.current) return;
        autoPromptCheckedRef.current = true;
      }
      openPromptQueue(today, recent, params.focusId, force);
    },
    [openPromptQueue, params.focusId, params.prompt],
  );

  useFocusEffect(
    useCallback(() => {
      autoPromptCheckedRef.current = false;
      setLoading(true);
      fetchData().then(({ today, recent }) => {
        maybeAutoPromptStatus(today, recent);
      });
    }, [fetchData, maybeAutoPromptStatus]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const closeActionSheet = useCallback(() => {
    // X dismisses the rest of the queue for this session; next cold open / force
    // (notification tap) will show unanswered items again.
    sessionSkipRef.current = true;
    setPromptQueue([]);
    setPromptTotal(0);
    if (params.prompt || params.focusId) {
      router.setParams({ prompt: undefined, focusId: undefined } as never);
    }
  }, [params.focusId, params.prompt, router]);

  const advanceOrCloseQueue = useCallback(() => {
    setPromptQueue((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) setPromptTotal(0);
      return next;
    });
  }, []);

  const handleReminderPress = useCallback(
    (item: Reminder) => {
      if (activeTab === 'Upcoming') {
        router.push(`/reminders/${item.id}` as never);
        return;
      }
      if (activeTab === 'Today') {
        sessionSkipRef.current = false;
        openPromptQueue([item], [], item.id, true);
      }
    },
    [activeTab, openPromptQueue, router],
  );

  const handleStatus = async (status: 'completed' | 'missed') => {
    if (!activePetId || !selectedReminder) return;
    const reminder = selectedReminder;
    try {
      await updateReminderStatus(activePetId, reminder.id, status);
      advanceOrCloseQueue();
      fetchData();
    } catch {
      /* keep list as-is; a transient error shouldn't block the UI */
    }
  };

  const goAddReminder = useCallback(async () => {
    try {
      const pets = await apiGet<Pet[]>('/pets');
      if (!(await guardAddReminder(router, pets))) return;
    } catch {
      // If the pre-check fails, still allow navigation — server enforces.
    }
    router.push('/reminders/add' as never);
  }, [router]);

  const addReminderAction = {
    actionTitle: t('reminders.add'),
    onAction: () => {
      void goAddReminder();
    },
  };

  const renderEmptyState = () => {
    if (!hasAnyReminders) {
      return (
        <EmptyState
          title={t('reminders.empty_all_title')}
          subtitle={t('reminders.empty_all_subtitle')}
          {...addReminderAction}
        />
      );
    }

    if (activeTab === 'Today') {
      let subtitle = t('reminders.empty_today_only_subtitle');
      if (tabPresence.upcoming) {
        subtitle = t('reminders.empty_today_only_subtitle_upcoming');
      } else if (tabPresence.recent) {
        subtitle = t('reminders.empty_today_only_subtitle_recent');
      }
      return (
        <EmptyState title={t('reminders.empty_today_only_title')} subtitle={subtitle} />
      );
    }

    if (activeTab === 'Upcoming') {
      const subtitle = tabPresence.today
        ? t('reminders.empty_upcoming_with_today_subtitle')
        : t('reminders.empty_upcoming_subtitle');
      return <EmptyState title={t('reminders.empty_upcoming_title')} subtitle={subtitle} />;
    }

    const subtitle =
      tabPresence.today || tabPresence.upcoming
        ? t('reminders.empty_recent_with_scheduled_subtitle')
        : t('reminders.empty_recent_subtitle');
    return <EmptyState title={t('reminders.empty_recent_title')} subtitle={subtitle} />;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScreenHeader title={t('reminders.title')} />

      <SegmentedControl
        tabs={[...TABS]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabName)}
        getLabel={(tab) => t(`reminders.tab_${tab.toLowerCase()}`)}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryText} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <EmptyState
            title={t('common.error')}
            subtitle={error}
            actionTitle={t('common.retry')}
            onAction={() => {
              setLoading(true);
              fetchData();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReminderListItem
              title={item.title}
              subtitle={reminderSubtitle(item)}
              timeOrDate={reminderTimeOrDate(item, activeTab)}
              categoryAccent={colors.category.reminders}
              onPress={
                activeTab === 'Recent' ? undefined : () => handleReminderPress(item)
              }
            />
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <SpeedDialFab
        items={[
          {
            key: 'add',
            label: t('reminders.add'),
            icon: HOME_CATEGORY_ICONS.reminders,
            onPress: () => {
              void goAddReminder();
            },
          },
        ]}
        accessibilityLabel={t('reminders.add')}
      />

      <ReminderActionSheet
        visible={actionSheetVisible}
        title={selectedReminder?.title}
        subtitle={selectedReminder ? reminderSubtitle(selectedReminder) : undefined}
        time={selectedReminder?.time}
        dateLabel={selectedReminder ? reminderDateLabel(selectedReminder.date) : undefined}
        currentIndex={promptPosition}
        totalCount={promptTotal > 1 ? promptTotal : undefined}
        onClose={closeActionSheet}
        onDone={() => {
          void handleStatus('completed');
        }}
        onMissed={() => {
          void handleStatus('missed');
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    centered: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 120,
      flexGrow: 1,
    },
  });
