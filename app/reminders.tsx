import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SpeedDialFab from '@/components/ui/SpeedDialFab';
import { type ThemeColors } from '@/constants/theme';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { LIST_TABS_CONTENT_GAP, PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import ReminderListItem, {
  estimateReminderListItemHeight,
  REMINDER_LIST_ITEM_GAP,
} from '@/components/reminders/ReminderListItem';
import ReminderActionSheet from '@/components/reminders/ReminderActionSheet';
import SwipeToDeleteRow from '@/components/ui/SwipeToDeleteRow';
import { needsStatusPrompt, formatSheetClockTime } from '@/components/reminders/reminderFormShared';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { deleteReminder, updateReminderStatus, listReminders } from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import { invalidateReminders } from '@/services/queryClient';
import { queryKeys } from '@/services/queryKeys';
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
} from '@/utils/calendar';
import { guardAddReminder } from '@/services/subscription';
import { listPets } from '@/services/pets';
import type { Reminder } from '@/types/api';
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
const PREVIEW_CHARS = 20;

function reminderCategory(item: Reminder): ReminderCategory {
  return (item.category as ReminderCategory | undefined) ?? resolveReminderCategory(item.title);
}

/** Truncate to first N chars with … when there is more. */
function previewText(value: string | null | undefined, max = PREVIEW_CHARS): string {
  const text = (value ?? '').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function reminderRelativeDate(date: string): string {
  const today = todayIsoDate();
  if (date === today) return t('common.today');
  if (date === addDaysToIsoDate(today, -1)) return t('common.yesterday');
  if (date === addDaysToIsoDate(today, 1)) return t('common.tomorrow');
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
  const [refreshing, setRefreshing] = useState(false);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [listHeight, setListHeight] = useState(0);

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
    cacheKey: [...queryKeys.reminders.tab(activePetId ?? '', 'today'), 'page1'],
  });
  const upcomingPagination = useCursorPagination<Reminder>({
    fetchPage: useCallback(
      (params) => (activePetId ? listReminders(activePetId, 'upcoming', params) : Promise.resolve([])),
      [activePetId],
    ),
    enabled: Boolean(activePetId),
    resetKey: activePetId,
    cacheKey: [...queryKeys.reminders.tab(activePetId ?? '', 'upcoming'), 'page1'],
  });
  const recentPagination = useCursorPagination<Reminder>({
    fetchPage: useCallback(
      (params) => (activePetId ? listReminders(activePetId, 'recent', params) : Promise.resolve([])),
      [activePetId],
    ),
    enabled: Boolean(activePetId),
    resetKey: activePetId,
    cacheKey: [...queryKeys.reminders.tab(activePetId ?? '', 'recent'), 'page1'],
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

  /** Empty-state copy depends on every tab, so wait for all three to resolve once. */
  const allTabsLoaded =
    todayPagination.loaded && upcomingPagination.loaded && recentPagination.loaded;
  const showSpinner = loading && items.length === 0 && !allTabsLoaded;

  const rowHeightFor = useCallback(
    (item: Reminder | undefined) =>
      estimateReminderListItemHeight({
        description: item?.note,
        dayLabel: activeTab === 'Today' ? null : 'day',
      }),
    [activeTab],
  );

  const getItemFadeIntensity = useCallback(
    (index: number) => {
      if (listHeight <= 0) return 0;
      let itemBottom = 0;
      for (let i = 0; i <= index; i += 1) {
        itemBottom += rowHeightFor(items[i]);
        if (i < index) itemBottom += REMINDER_LIST_ITEM_GAP;
      }
      itemBottom -= scrollY;
      if (itemBottom <= listHeight) return 0;
      const fadeZone = rowHeightFor(items[index]) * 0.89;
      return Math.min(1, (itemBottom - listHeight) / fadeZone);
    },
    [items, listHeight, rowHeightFor, scrollY],
  );

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
    if (loadingMore) return;
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadingMore, refetchAll]);

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

  const handleDeleteReminder = useCallback(
    (id: string) => {
      if (!activePetId) return;
      setSwipeOpenId(null);

      let removed: Reminder | null = null;
      let fromTab: TabName = 'Today';
      let fromIndex = -1;
      for (const tab of TABS) {
        const idx = listsByTab[tab].findIndex((r) => r.id === id);
        if (idx >= 0) {
          removed = listsByTab[tab][idx];
          fromTab = tab;
          fromIndex = idx;
          break;
        }
      }
      if (!removed) return;

      const restore = removed;
      const restoreTab = fromTab;
      const restoreIndex = fromIndex;
      const setTabItems = (tab: TabName, updater: (prev: Reminder[]) => Reminder[]) => {
        if (tab === 'Today') todayPagination.setItems(updater);
        else if (tab === 'Upcoming') upcomingPagination.setItems(updater);
        else recentPagination.setItems(updater);
      };

      setTabItems(fromTab, (prev) => prev.filter((r) => r.id !== id));

      toast.showUndo({
        message: t('reminders.deleted'),
        aboveFab: true,
        onUndo: () => {
          setTabItems(restoreTab, (prev) => {
            const list = [...prev];
            list.splice(Math.min(restoreIndex, list.length), 0, restore);
            return list;
          });
        },
        onCommit: async () => {
          try {
            await deleteReminder(activePetId, id);
          } catch (err) {
            setTabItems(restoreTab, (prev) => {
              const list = [...prev];
              list.splice(Math.min(restoreIndex, list.length), 0, restore);
              return list;
            });
            invalidateReminders(activePetId);
            toast.showError(getErrorMessage(err), { aboveFab: true });
          }
        },
      });
    },
    [
      activePetId,
      listsByTab,
      todayPagination.setItems,
      upcomingPagination.setItems,
      recentPagination.setItems,
      toast,
    ],
  );

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
    // Avoid flashing the "no reminders at all" copy before the other tabs resolve.
    if (!allTabsLoaded) return null;

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

  const listHeader = <ScreenHeader title={t('reminders.title')} />;

  return (
    <>
      <HeaderScrollLayout header={listHeader} edges={['left', 'right', 'bottom']} bottomFade>
        {({ paddingTop, scrollMetricsProps }) => (
          <View style={[styles.screenBody, { paddingTop }]}>
            <SegmentedControl
              tabs={[...TABS]}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as TabName)}
              getLabel={(tab) => t(`reminders.tab_${tab.toLowerCase()}`)}
              style={styles.tabs}
            />
            {showSpinner ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.primaryText} />
              </View>
            ) : error && items.length === 0 ? (
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
              <View
                style={styles.listWrap}
                onLayout={(e) => {
                  setListHeight(e.nativeEvent.layout.height);
                  scrollMetricsProps.onLayout(e);
                }}
              >
                <FlatList
                  style={styles.list}
                  data={items}
                  keyExtractor={(item) => item.id}
                  scrollEventThrottle={16}
                  onContentSizeChange={scrollMetricsProps.onContentSizeChange}
                  onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
                  renderItem={({ item, index }) => {
                    return (
                      <SwipeToDeleteRow
                        open={swipeOpenId === item.id}
                        onOpenChange={(open) => setSwipeOpenId(open ? item.id : null)}
                        onDelete={() => handleDeleteReminder(item.id)}
                      >
                        <ReminderListItem
                          title={previewText(item.title)}
                          description={previewText(item.note) || undefined}
                          time={formatSheetClockTime(item.time)}
                          dayLabel={
                            activeTab === 'Today' ? undefined : reminderRelativeDate(item.date)
                          }
                          showCompletedBar={
                            activeTab === 'Recent' && item.status === 'completed'
                          }
                          fadeIntensity={getItemFadeIntensity(index)}
                          onPress={() => {
                            setSwipeOpenId(null);
                            handleReminderPress(item);
                          }}
                        />
                      </SwipeToDeleteRow>
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
              </View>
            )}
          </View>
        )}
      </HeaderScrollLayout>

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
        dateLabel={selectedReminder ? reminderRelativeDate(selectedReminder.date) : undefined}
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
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screenBody: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    tabs: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      marginBottom: LIST_TABS_CONTENT_GAP,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listWrap: {
      flex: 1,
      overflow: 'hidden',
    },
    listContent: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingBottom: LIST_FAB_SCROLL_PADDING,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
  });
