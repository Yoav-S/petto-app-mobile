import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpeedDialFab from '@/components/ui/SpeedDialFab';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import HealthListItem, {
  HEALTH_LIST_CARD_HEIGHT,
  HEALTH_LIST_ITEM_GAP,
  healthRecordSubtitle,
} from '@/components/health/HealthListItem';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { deleteRecord } from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import type { MedicalRecord } from '@/types/api';
import { useRecordsQuery } from '@/hooks/useCachedQueries';
import { queryClient, invalidateRecords } from '@/services/queryClient';
import { queryKeys } from '@/services/queryKeys';

const TABS = ['Active', 'Resolved'] as const;
type TabName = (typeof TABS)[number];

const EMPTY_LISTS: Record<TabName, MedicalRecord[]> = {
  Active: [],
  Resolved: [],
};

export default function HealthScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const toast = useToast();
  const { activePetId } = useActivePet();
  const { deletedNote } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<TabName>('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const cardHeight = HEALTH_LIST_CARD_HEIGHT;
  const itemGap = HEALTH_LIST_ITEM_GAP;
  const fadeZone = cardHeight * 0.89;

  const activeQuery = useRecordsQuery(activePetId, 'active', { enrichReminders: true });
  const resolvedQuery = useRecordsQuery(activePetId, 'resolved', { enrichReminders: true });

  const listsByTab = useMemo(
    () => ({
      Active: activeQuery.data ?? EMPTY_LISTS.Active,
      Resolved: resolvedQuery.data ?? EMPTY_LISTS.Resolved,
    }),
    [activeQuery.data, resolvedQuery.data],
  );

  const loading =
    (activeQuery.isLoading && !activeQuery.data) ||
    (resolvedQuery.isLoading && !resolvedQuery.data);
  const error = activeQuery.error
    ? getErrorMessage(activeQuery.error)
    : resolvedQuery.error
      ? getErrorMessage(resolvedQuery.error)
      : null;

  const getItemFadeIntensity = useCallback(
    (index: number) => {
      if (listHeight <= 0) return 0;
      const listPaddingTop = 8;
      const itemBottom =
        listPaddingTop + (index + 1) * cardHeight + index * itemGap - scrollY;
      if (itemBottom <= listHeight) return 0;
      return Math.min(1, (itemBottom - listHeight) / fadeZone);
    },
    [cardHeight, fadeZone, itemGap, listHeight, scrollY],
  );

  const items = listsByTab[activeTab];

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
    await Promise.all([activeQuery.refetch(), resolvedQuery.refetch()]);
  }, [activeQuery.refetch, resolvedQuery.refetch]);

  useFocusEffect(
    useCallback(() => {
      void refetchAll();
    }, [refetchAll]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll]);

  const handleDeleteRecord = (id: string) => {
    if (!activePetId) return;
    setDeleteTargetId(id);
  };

  const confirmDeleteRecord = () => {
    if (!activePetId || !deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);

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
    const statusKey = restoreTab === 'Active' ? 'active' : 'resolved';
    const cacheKey = [...queryKeys.records.status(activePetId, statusKey), 'enriched'] as const;

    queryClient.setQueryData<MedicalRecord[]>(cacheKey, (prev) =>
      (prev ?? []).filter((r) => r.id !== id),
    );

    toast.showUndo({
      message: t('topics.record_deleted'),
      aboveFab: true,
      onUndo: () => {
        queryClient.setQueryData<MedicalRecord[]>(cacheKey, (prev) => {
          const list = [...(prev ?? [])];
          const insertAt = Math.min(restoreIndex, list.length);
          list.splice(insertAt, 0, restore);
          return list;
        });
      },
      onCommit: async () => {
        try {
          await deleteRecord(activePetId, id);
        } catch (err) {
          queryClient.setQueryData<MedicalRecord[]>(cacheKey, (prev) => {
            const list = [...(prev ?? [])];
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
    if (!hasAnyRecords) {
      return (
        <EmptyState
          title={t('topics.empty_all_title')}
          subtitle={t('topics.empty_all_subtitle')}
          actionTitle={t('topics.add_note')}
          actionCompact
          contentGap={20}
          onAction={() => router.push('/topics/add' as never)}
        />
      );
    }

    if (activeTab === 'Active') {
      return (
        <EmptyState
          title={t('topics.empty_active_only_title')}
          subtitle={t('topics.empty_active_only_subtitle')}
          contentGap={8}
        />
      );
    }

    if (tabPresence.active) {
      return (
        <EmptyState
          title={t('topics.empty_resolved_with_active_title')}
          subtitle={t('topics.empty_resolved_with_active_subtitle')}
          contentGap={8}
        />
      );
    }

    return (
      <EmptyState
        title={t('topics.empty_resolved_title')}
        subtitle={t('topics.empty_resolved_subtitle')}
        contentGap={8}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScreenHeader title={t('topics.title')} />

      <SegmentedControl
        tabs={[...TABS]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabName)}
        getLabel={(tab) => t(`topics.tab_${tab.toLowerCase()}`)}
        width={220}
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
        <View
          style={styles.listWrap}
          onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        >
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            scrollEventThrottle={16}
            onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            renderItem={({ item, index }) => (
              <HealthListItem
                title={item.title}
                subtitle={healthRecordSubtitle(item.description)}
                createdAt={item.created_at}
                hasReminder={Boolean(item.linked_reminder_date || item.linked_reminder_time)}
                fadeIntensity={getItemFadeIntensity(index)}
                onPress={() => router.push(`/topics/${item.id}` as never)}
                onLongPress={() => handleDeleteRecord(item.id)}
                onReminderPress={
                  item.latest_note_id
                    ? () =>
                        router.push({
                          pathname: '/topics/edit-note',
                          params: {
                            recordId: item.id,
                            noteId: item.latest_note_id!,
                            open: 'reminder',
                          },
                        } as never)
                    : undefined
                }
              />
            )}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </View>
      )}

      {hasAnyRecords ? (
        <SpeedDialFab
          items={[
            {
              key: 'add-health',
              label: t('topics.add_health'),
              icon: HOME_CATEGORY_ICONS.health,
              onPress: () => router.push('/topics/add' as never),
            },
          ]}
          accessibilityLabel={t('topics.add_health')}
        />
      ) : null}

      <ConfirmModal
        visible={deleteTargetId != null}
        title={t('topics.delete_record_confirm_title')}
        message={t('topics.delete_record_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={confirmDeleteRecord}
        onCancel={() => setDeleteTargetId(null)}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
    flexGrow: 1,
  },
});
