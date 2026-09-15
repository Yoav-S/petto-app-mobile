import React, { useCallback, useMemo, useState } from 'react';
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
import ListScrollLayout from '@/components/ui/ListScrollLayout';
import { rowFadeIntensity } from '@/components/ui/listItemFade';
import { PAGE_HORIZONTAL_PADDING, LIST_HEADER_TABS_GAP } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import ReminderListItem, {
  estimateReminderListItemHeight,
  REMINDER_LIST_ITEM_GAP,
} from '@/components/reminders/ReminderListItem';
import SwipeToDeleteRow from '@/components/ui/SwipeToDeleteRow';
import {
  needsStatusPrompt,
  shouldPromptFromPush,
  formatSheetClockTime,
} from '@/components/reminders/reminderFormShared';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { deleteReminder, listReminders } from '@/services/reminders';
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
import { useCursorPagination } from '@/hooks/useCursorPagination';
import { useReminderPrompt } from '@/context/ReminderPromptContext';
import ListLoadMoreFooter from '@/components/ui/ListLoadMoreFooter';
import ListFetchBlocker from '@/components/ui/ListFetchBlocker';
import { LIST_PAGE_SIZE } from '@/constants/pagination';

const TABS = ['Today', 'Upcoming', 'Recent'] as const;
type TabName = (typeof TABS)[number];
const PREVIEW_CHARS = 20;

/** Survive push to edit/add so back returns to Upcoming/Today, not Recent. */
let lastRemindersTab: TabName = 'Today';

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

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function RemindersScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const toast = useToast();
  const { activePetId } = useActivePet();
  const { present, visible: promptVisible } = useReminderPrompt();
  const params = useLocalSearchParams<{
    deletedId?: string;
    prompt?: string;
    focusId?: string;
    petId?: string;
    n?: string;
    tab?: string | string[];
  }>();

  const [activeTab, setActiveTabState] = useState<TabName>(lastRemindersTab);

  const setActiveTab = useCallback((tab: TabName) => {
    lastRemindersTab = tab;
    setActiveTabState(tab);
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [listHeight, setListHeight] = useState(0);

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
      (params) =>
        activePetId
          ? listReminders(activePetId, 'recent', { ...params, collapse: true })
          : Promise.resolve([]),
      [activePetId],
    ),
    enabled: Boolean(activePetId),
    resetKey: activePetId,
    cacheKey: [...queryKeys.reminders.tab(activePetId ?? '', 'recent'), 'page1', 'collapsed'],
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
    (index: number, contentTop: number, bottomFadeInset: number) => {
      let rowBottom = 0;
      for (let i = 0; i <= index; i += 1) {
        rowBottom += rowHeightFor(items[i]);
        if (i < index) rowBottom += REMINDER_LIST_ITEM_GAP;
      }
      return rowFadeIntensity({
        rowBottom,
        contentTop,
        scrollY,
        fadeLine: listHeight - bottomFadeInset,
        fadeZone: rowHeightFor(items[index]) * 0.89,
      });
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
      return { today: [] as Reminder[], upcoming: [] as Reminder[], recent: [] as Reminder[] };
    }
    const scanLimit = Math.max(LIST_PAGE_SIZE, 50);
    const [today, upcoming, recent] = await Promise.all([
      listReminders(activePetId, 'today', { limit: scanLimit }),
      listReminders(activePetId, 'upcoming', { limit: scanLimit }),
      listReminders(activePetId, 'recent', { limit: scanLimit, collapse: false }),
    ]);
    return { today, upcoming, recent };
  }, [activePetId, recentPagination.refresh, todayPagination.refresh, upcomingPagination.refresh]);

  const openPromptQueue = useCallback(
    (items: Reminder[], focusId?: string | null) => {
      present(items, focusId);
    },
    [present],
  );

  useFocusEffect(
    useCallback(() => {
      void refetchAll();
      // Drop leftover notification query params so back from edit keeps Upcoming/Today.
      if (
        firstParam(params.prompt) ||
        firstParam(params.tab) ||
        firstParam(params.focusId) ||
        firstParam(params.n)
      ) {
        router.setParams({
          prompt: '',
          tab: '',
          focusId: '',
          petId: '',
          n: '',
        } as never);
      }
    }, [
      params.focusId,
      params.n,
      params.petId,
      params.prompt,
      params.tab,
      refetchAll,
      router,
    ]),
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

  React.useEffect(() => {
    if (!promptVisible) void refetchAll();
  }, [promptVisible, refetchAll]);

  const handleReminderPress = useCallback(
    (item: Reminder) => {
      if (needsStatusPrompt(item) || shouldPromptFromPush(item)) {
        openPromptQueue([item], item.id);
        return;
      }
      router.push(`/reminders/${item.id}` as never);
    },
    [openPromptQueue, router],
  );

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
          actionTitle={t('common.add')}
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
    <>
      <ListScrollLayout
        fadeKey={`reminders:${activeTab}`}
        fabOverlay={hasAnyReminders}
        chrome={
          <>
            <ScreenHeader title={t('reminders.title')} />
            <SegmentedControl
              tabs={[...TABS]}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as TabName)}
              getLabel={(tab) => t(`reminders.tab_${tab.toLowerCase()}`)}
              style={styles.tabs}
            />
          </>
        }
      >
        {({ paddingTop, paddingBottom, bottomFadeInset, scrollMetricsProps }) => (
          <>
            {showSpinner ? (
              <View
                style={[styles.centered, { paddingTop }]}
                onLayout={(e) => {
                  scrollMetricsProps.onLayout(e);
                  scrollMetricsProps.markNonScrollable({ transient: true });
                }}
              >
                <ActivityIndicator color={colors.primaryText} />
              </View>
            ) : error && items.length === 0 ? (
              <View
                style={[styles.centered, { paddingTop }]}
                onLayout={(e) => {
                  scrollMetricsProps.onLayout(e);
                  scrollMetricsProps.markNonScrollable();
                }}
              >
                <EmptyState
                  title={t('common.error')}
                  subtitle={error}
                  actionTitle={t('common.retry')}
                  onAction={() => {
                    void refetchAll();
                  }}
                />
              </View>
            ) : items.length === 0 ? (
              <View
                style={[styles.centered, { paddingTop }]}
                onLayout={(e) => {
                  scrollMetricsProps.onLayout(e);
                  scrollMetricsProps.markNonScrollable();
                }}
              >
                {renderEmptyState()}
              </View>
            ) : (
              <View
                style={styles.listWrap}
                onLayout={(e) => {
                  setListHeight(e.nativeEvent.layout.height);
                  scrollMetricsProps.onLayout(e);
                  scrollMetricsProps.markScrollable();
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
                          fadeIntensity={getItemFadeIntensity(
                            index,
                            paddingTop,
                            bottomFadeInset,
                          )}
                          onPress={() => {
                            setSwipeOpenId(null);
                            handleReminderPress(item);
                          }}
                        />
                      </SwipeToDeleteRow>
                    );
                  }}
                  contentContainerStyle={[
                    styles.listContent,
                    { paddingTop, paddingBottom },
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
          </>
        )}
      </ListScrollLayout>

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
      marginTop: LIST_HEADER_TABS_GAP,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listWrap: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
  });
