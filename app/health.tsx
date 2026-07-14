import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import HealthListItem, {
  HEALTH_LIST_CARD_HEIGHT,
  HEALTH_LIST_DESIGN_WIDTH,
  HEALTH_LIST_ITEM_GAP,
} from '@/components/health/HealthListItem';
import Snackbar from '@/components/ui/Snackbar';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { listRecords, deleteRecord, enrichRecordsWithLatestNoteReminders } from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import type { MedicalRecord } from '@/types/api';

const TABS = ['Active', 'Resolved'] as const;
type TabName = (typeof TABS)[number];

const EMPTY_LISTS: Record<TabName, MedicalRecord[]> = {
  Active: [],
  Resolved: [],
};

export default function HealthScreen() {
  const router = useRouter();
  const { activePetId } = useActivePet();
  const { deletedNote } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<TabName>('Active');
  const [listsByTab, setListsByTab] = useState<Record<TabName, MedicalRecord[]>>(EMPTY_LISTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(t('health.deleted'));
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const { width: screenWidth } = useWindowDimensions();

  const listScale = screenWidth / HEALTH_LIST_DESIGN_WIDTH;
  const cardHeight = HEALTH_LIST_CARD_HEIGHT * listScale;
  const itemGap = HEALTH_LIST_ITEM_GAP * listScale;
  const fadeZone = cardHeight * 0.89;

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
      setSnackbarMessage(t('health.deleted'));
      setSnackbarVisible(true);
    }
  }, [deletedNote]);

  const fetchData = useCallback(async () => {
    if (!activePetId) {
      setListsByTab(EMPTY_LISTS);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const [active, resolved] = await Promise.all([
        listRecords(activePetId, 'active'),
        listRecords(activePetId, 'resolved'),
      ]);
      const [enrichedActive, enrichedResolved] = await Promise.all([
        enrichRecordsWithLatestNoteReminders(activePetId, active),
        enrichRecordsWithLatestNoteReminders(activePetId, resolved),
      ]);
      setListsByTab({ Active: enrichedActive, Resolved: enrichedResolved });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activePetId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleDeleteRecord = (id: string) => {
    if (!activePetId) return;
    setDeleteTargetId(id);
  };

  const confirmDeleteRecord = async () => {
    if (!activePetId || !deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await deleteRecord(activePetId, id);
      setSnackbarMessage(t('health.record_deleted'));
      setSnackbarVisible(true);
      fetchData();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  const addRecordAction = {
    actionTitle: t('health.add_first'),
    onAction: () => router.push('/health/add-note' as never),
  };

  const renderEmptyState = () => {
    if (!hasAnyRecords) {
      return (
        <EmptyState
          title={t('health.empty_all_title')}
          subtitle={t('health.empty_all_subtitle')}
          {...addRecordAction}
        />
      );
    }

    if (activeTab === 'Active') {
      return (
        <EmptyState
          title={t('health.empty_active_only_title')}
          subtitle={t('health.empty_active_only_subtitle')}
        />
      );
    }

    if (tabPresence.active) {
      return (
        <EmptyState
          title={t('health.empty_resolved_with_active_title')}
          subtitle={t('health.empty_resolved_with_active_subtitle')}
        />
      );
    }

    return (
      <EmptyState
        title={t('health.empty_resolved_title')}
        subtitle={t('health.empty_resolved_subtitle')}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('health.title')} />

      <SegmentedControl
        tabs={[...TABS]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabName)}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryText} />
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
                subtitle={item.latest_note_preview ?? t('health.no_notes_preview')}
                reminderDate={item.linked_reminder_date}
                reminderTime={item.linked_reminder_time}
                fadeIntensity={getItemFadeIntensity(index)}
                onPress={() => router.push(`/health/${item.id}` as never)}
                onLongPress={() => handleDeleteRecord(item.id)}
                onReminderPress={
                  item.latest_note_id
                    ? () =>
                        router.push({
                          pathname: '/health/edit-note',
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

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/health/add-note' as never)}
      >
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        onHide={() => setSnackbarVisible(false)}
      />

      <ConfirmModal
        visible={deleteTargetId != null}
        title={t('health.delete_record_confirm_title')}
        message={t('health.delete_record_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={confirmDeleteRecord}
        onCancel={() => setDeleteTargetId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
});
