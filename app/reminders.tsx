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
import { categoryLabel } from '@/components/pickers/CategoryPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { updateReminderStatus } from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
} from '@/utils/calendar';
import { guardAddReminder } from '@/services/subscription';
import { listPets } from '@/services/pets';
import type { Reminder } from '@/types/api';
import { listReminders } from '@/services/reminders';
import {
  resolveReminderCategory,
  type ReminderCategory,
} from '@/utils/reminderCategory';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import ListLoadMoreFooter from '@/components/ui/ListLoadMoreFooter';
import ListFetchBlocker from '@/components/ui/ListFetchBlocker';
import { LIST_FAB_SCROLL_PADDING, LIST_PAGE_SIZE } from '@/constants/pagination';

const TABS = ['Today', 'Upcoming', 'Recent'] as const;
type TabName = (typeof TABS)[number];

function reminderCategory(item: Reminder): ReminderCategory {
  return (item.category as ReminderCategory | undefined) ?? resolveReminderCategory(item.title);
}

function reminderRelativeDate(date: string): string {
  const today = todayIsoDate();
  if (date === today) return t('common.today');
  if (date === addDaysToIsoDate(today, -1)) return t('common.yesterday');
  if (date === addDaysToIsoDate(today, 1)) return t('common.tomorrow');
  return formatDisplayDate(date);
}

function reminderDateLabel(date: string): string {
  return reminderRelativeDate(date);
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
  const [refreshing, setRefreshing] = useState(false);

  const [promptQueue, setPromptQueue] = useState<Reminder[]>([]);
  const [promptTotal, setPromptTotal] = useState(0);
  const sessionSkipRef = useRef(false);
  const autoPromptCheckedRef = useRef(false);

  const todayPagination = useCursorPagination<Reminder>({
    fetchPage: useCallback(
      (params) => (activePetId ? listReminders(activePetId, 'today', params) : Promise.resolve([])),
      [activePetId],
    ),
    enabled: Boolean(activePetId),
    resetKey: activePetId,
  });
  const upcomingPagination = useCursorPagination<Reminder>({
    fetchPage: useCallback(
      (params) => (activePetId ? listReminders(activePetId, 'upcoming', params) : Promise.resolve([])),
      [activePetId],
    ),
    enabled: Boolean(activePetId),
    resetKey: activePetId,
  });
  const recentPagination = useCursorPagination<Reminder>({
    fetchPage: useCallback(
      (params) => (activePetId ? listReminders(activePetId, 'recent', params) : Promise.resolve([])),
      [activePetId],
    ),
    enabled: Boolean(activePetId),
    resetKey: activePetId,
  });

  const paginationByTab = {
    Today: todayPagination,
    Upcoming: upcomingPagination,
    Recent: recentPagination,
  } as const;

  const currentPagination = paginationByTab[activeTab];
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  } = currentPagination;

  const listsByTab = useMemo(
    () => ({
      Today: todayPagination.items,
      Upcoming: upcomingPagination.items,
      Recent: recentPagination.items,
    }),
    [todayPagination.items, upcomingPagination.items, recentPagination.items],
  );
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

  const refetchAll = useCallback(async () => {
    await Promise.all([
      todayPagination.refresh(),
      upcomingPagination.refresh(),
      recentPagination.refresh(),
    ]);
    if (!activePetId) {
      return { today: [] as Reminder[], recent: [] as Reminder[] };
    }
    const [today, recent] = await Promise.all([
      listReminders(activePetId, 'today', { limit: LIST_PAGE_SIZE }),
      listReminders(activePetId, 'recent', { limit: LIST_PAGE_SIZE }),
    ]);
    return { today, recent };
  }, [activePetId, recentPagination.refresh, todayPagination.refresh, upcomingPagination.refresh]);

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
      void refetchAll().then(({ today, recent }) => {
        maybeAutoPromptStatus(today, recent);
      });
    }, [refetchAll, maybeAutoPromptStatus]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll]);

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
      if (activeTab === 'Recent') {
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
      void refetchAll();
    } catch {
      /* keep list as-is; a transient error shouldn't block the UI */
    }
  };

  const goAddReminder = useCallback(async () => {
    try {
      const pets = await listPets();
      if (!(await guardAddReminder(router, pets))) return;
    } catch {
      // If the pre-check fails, still allow navigation — server enforces.
    }
    router.push('/reminders/add' as never);
  }, [router]);

  const renderEmptyState = () => {
    if (!hasAnyReminders) {
      return (
        <EmptyState
          title={t('reminders.empty_all_title')}
          subtitle={t('reminders.empty_all_subtitle')}
          actionTitle={t('reminders.add')}
          actionCompact
          onAction={() => {
            void goAddReminder();
          }}
        />
      );
    }

    if (activeTab === 'Today') {
      return (
        <EmptyState
          title={t('reminders.empty_today_only_title')}
          subtitle={t('reminders.empty_today_only_subtitle')}
        />
      );
    }

    if (activeTab === 'Upcoming') {
      return (
        <EmptyState
          title={t('reminders.empty_upcoming_title')}
          subtitle={t('reminders.empty_upcoming_subtitle')}
        />
      );
    }

    return (
      <EmptyState
        title={t('reminders.empty_recent_title')}
        subtitle={t('reminders.empty_recent_subtitle')}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScreenHeader title={t('reminders.title')} />

      <SegmentedControl
        tabs={[...TABS]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabName)}
        getLabel={(tab) => t(`reminders.tab_${tab.toLowerCase()}`)}
        style={{ marginTop: 20 }}
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
              void refetchAll();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const category = reminderCategory(item);
            return (
              <ReminderListItem
                category={categoryLabel(category)}
                title={item.title}
                time={item.time}
                dayLabel={
                  activeTab === 'Today' ? undefined : reminderRelativeDate(item.date)
                }
                showCheckMark={activeTab === 'Today'}
                showCompletedBar={
                  activeTab === 'Recent' && item.status === 'completed'
                }
                onCheckPress={
                  activeTab === 'Today' ? () => handleReminderPress(item) : undefined
                }
                onPress={() => handleReminderPress(item)}
              />
            );
          }}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 ? styles.listContentEmpty : null,
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            void loadMore();
          }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            <ListLoadMoreFooter loading={loadingMore} hasMore={hasMore} />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {hasAnyReminders ? (
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
      ) : null}

      <ReminderActionSheet
        visible={actionSheetVisible}
        title={selectedReminder?.title}
        subtitle={selectedReminder?.note ?? undefined}
        category={selectedReminder ? reminderCategory(selectedReminder) : undefined}
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

      <ListFetchBlocker visible={loadingMore} />
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: LIST_FAB_SCROLL_PADDING,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
  });
