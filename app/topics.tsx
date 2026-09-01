import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import SpeedDialFab from '@/components/ui/SpeedDialFab';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { type ThemeColors } from '@/constants/theme';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { LIST_TABS_CONTENT_GAP, PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { TOPICS_FAB_ICON } from '@/components/home/categoryIcons';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import HealthListItem, {
  estimateHealthListItemHeight,
  HEALTH_LIST_ITEM_GAP,
  healthRecordSubtitle,
} from '@/components/health/HealthListItem';
import SwipeToDeleteRow from '@/components/ui/SwipeToDeleteRow';
import ListLoadMoreFooter from '@/components/ui/ListLoadMoreFooter';
import ListFetchBlocker from '@/components/ui/ListFetchBlocker';
import { LIST_FAB_SCROLL_PADDING } from '@/constants/pagination';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { deleteRecord, listRecords } from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import type { MedicalRecord } from '@/types/api';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import { invalidateRecords } from '@/services/queryClient';
import { queryKeys } from '@/services/queryKeys';

const TABS = ['Active', 'Resolved'] as const;
type TabName = (typeof TABS)[number];

export default function HealthScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const toast = useToast();
  const { activePetId } = useActivePet();
  const { deletedNote } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<TabName>('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const itemGap = HEALTH_LIST_ITEM_GAP;
  const fadeZone = estimateHealthListItemHeight('placeholder') * 0.89;

  const fetchActivePage = useCallback(
    async (params: { limit: number; cursor?: string }) => {
      if (!activePetId) return [];
      return listRecords(activePetId, 'active', params);
    },
    [activePetId],
  );

  const fetchResolvedPage = useCallback(
    async (params: { limit: number; cursor?: string }) => {
      if (!activePetId) return [];
      return listRecords(activePetId, 'resolved', params);
    },
    [activePetId],
  );

  const activePagination = useCursorPagination<MedicalRecord>({
    fetchPage: fetchActivePage,
    enabled: Boolean(activePetId),
    resetKey: activePetId,
    cacheKey: [...queryKeys.records.status(activePetId ?? '', 'active'), 'page1'],
  });

  // Both tabs stay mounted and cached so switching never refetches from scratch.
  const resolvedPagination = useCursorPagination<MedicalRecord>({
    fetchPage: fetchResolvedPage,
    enabled: Boolean(activePetId),
    resetKey: activePetId,
    cacheKey: [...queryKeys.records.status(activePetId ?? '', 'resolved'), 'page1'],
  });

  const currentPagination = activeTab === 'Active' ? activePagination : resolvedPagination;
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    setItems,
  } = currentPagination;

  /** Empty-state copy depends on both tabs, so wait for both to resolve once. */
  const bothTabsLoaded = activePagination.loaded && resolvedPagination.loaded;
  const showSpinner = loading && items.length === 0 && !bothTabsLoaded;

  const listsByTab = useMemo(
    () => ({
      Active: activePagination.items,
      Resolved: resolvedPagination.items,
    }),
    [activePagination.items, resolvedPagination.items],
  );

  const getItemFadeIntensity = useCallback(
    (index: number) => {
      if (listHeight <= 0) return 0;
      const listPaddingTop = LIST_TABS_CONTENT_GAP;
      let itemBottom = listPaddingTop;
      for (let i = 0; i <= index; i += 1) {
        itemBottom += estimateHealthListItemHeight(items[i]?.description);
        if (i < index) itemBottom += itemGap;
      }
      itemBottom -= scrollY;
      if (itemBottom <= listHeight) return 0;
      return Math.min(1, (itemBottom - listHeight) / fadeZone);
    },
    [fadeZone, itemGap, items, listHeight, scrollY],
  );

  const tabPresence = useMemo(
    () => ({
      active: listsByTab.Active.length > 0,
      resolved: listsByTab.Resolved.length > 0,
    }),
    [listsByTab],
  );

  const hasAnyRecords = tabPresence.active || tabPresence.resolved;

  React.useEffect(() => {
    if (deletedNote) {
      toast.show({ message: t('topics.deleted'), aboveFab: true });
    }
  }, [deletedNote, toast]);

  const refetchAll = useCallback(async () => {
    await Promise.all([activePagination.refresh(), resolvedPagination.refresh()]);
  }, [activePagination.refresh, resolvedPagination.refresh]);

  useFocusEffect(
    useCallback(() => {
      void refetchAll();
    }, [refetchAll]),
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

  const setTabItems = useCallback(
    (tab: TabName, updater: (prev: MedicalRecord[]) => MedicalRecord[]) => {
      if (tab === 'Active') {
        activePagination.setItems(updater);
      } else {
        resolvedPagination.setItems(updater);
      }
    },
    [activePagination.setItems, resolvedPagination.setItems],
  );

  const handleDeleteRecord = (id: string) => {
    if (!activePetId) return;
    setSwipeOpenId(null);

    let removed: MedicalRecord | null = null;
    let fromTab: TabName = 'Active';
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

    setTabItems(fromTab, (prev) => prev.filter((r) => r.id !== id));

    toast.showUndo({
      message: t('topics.record_deleted'),
      aboveFab: true,
      onUndo: () => {
        setTabItems(restoreTab, (prev) => {
          const list = [...prev];
          const insertAt = Math.min(restoreIndex, list.length);
          list.splice(insertAt, 0, restore);
          return list;
        });
      },
      onCommit: async () => {
        try {
          await deleteRecord(activePetId, id);
        } catch (err) {
          setTabItems(restoreTab, (prev) => {
            const list = [...prev];
            const insertAt = Math.min(restoreIndex, list.length);
            list.splice(insertAt, 0, restore);
            return list;
          });
          invalidateRecords(activePetId);
          toast.showError(getErrorMessage(err), { aboveFab: true });
        }
      },
    });
  };

  const renderEmptyState = () => {
    // Avoid flashing the "no topics at all" copy before the other tab resolves.
    if (!bothTabsLoaded) return null;

    if (!hasAnyRecords) {
      return (
        <EmptyState
          title={t('topics.empty_all_title')}
          subtitle={t('topics.empty_all_subtitle')}
          actionTitle={t('topics.add_note')}
          actionCompact
          onAction={() => router.push('/topics/add' as never)}
        />
      );
    }

    if (activeTab === 'Active') {
      return (
        <EmptyState
          title={t('topics.empty_active_only_title')}
          subtitle={t('topics.empty_active_only_subtitle')}
        />
      );
    }

    if (tabPresence.active) {
      return (
        <EmptyState
          title={t('topics.empty_resolved_with_active_title')}
          subtitle={t('topics.empty_resolved_with_active_subtitle')}
        />
      );
    }

    return (
      <EmptyState
        title={t('topics.empty_resolved_title')}
        subtitle={t('topics.empty_resolved_subtitle')}
      />
    );
  };

  const listHeader = <ScreenHeader title={t('topics.title')} />;

  return (
    <>
      <HeaderScrollLayout header={listHeader} edges={['left', 'right', 'bottom']} bottomFade>
        {({ paddingTop, scrollMetricsProps }) => (
          <View style={[styles.screenBody, { paddingTop }]}>
            <SegmentedControl
              tabs={[...TABS]}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as TabName)}
              getLabel={(tab) => t(`topics.tab_${tab.toLowerCase()}`)}
              width={220}
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
                  renderItem={({ item, index }) => (
                    <SwipeToDeleteRow
                      open={swipeOpenId === item.id}
                      onOpenChange={(open) => setSwipeOpenId(open ? item.id : null)}
                      onDelete={() => handleDeleteRecord(item.id)}
                    >
                      <HealthListItem
                        title={item.title}
                        subtitle={healthRecordSubtitle(item.description)}
                        metaAt={
                          activeTab === 'Resolved'
                            ? item.resolved_at ?? item.updated_at ?? item.created_at
                            : item.created_at
                        }
                        metaKind={activeTab === 'Resolved' ? 'resolved' : 'created'}
                        hasReminder={Boolean(item.linked_reminder_date || item.linked_reminder_time)}
                        fadeIntensity={getItemFadeIntensity(index)}
                        onPress={() => {
                          setSwipeOpenId(null);
                          router.push(`/topics/${item.id}` as never);
                        }}
                        onReminderPress={
                          item.latest_note_id
                            ? () => {
                                setSwipeOpenId(null);
                                router.push({
                                  pathname: '/topics/edit-note',
                                  params: {
                                    recordId: item.id,
                                    noteId: item.latest_note_id!,
                                    open: 'reminder',
                                  },
                                } as never);
                              }
                            : undefined
                        }
                      />
                    </SwipeToDeleteRow>
                  )}
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

      {hasAnyRecords ? (
        <SpeedDialFab
          items={[
            {
              key: 'add-health',
              label: t('topics.add_health'),
              icon: TOPICS_FAB_ICON,
              onPress: () => router.push('/topics/add' as never),
            },
          ]}
          accessibilityLabel={t('topics.add_health')}
        />
      ) : null}

      <ListFetchBlocker visible={loadingMore} />
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screenBody: {
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    paddingBottom: LIST_FAB_SCROLL_PADDING,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
});
