import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import HealthListItem from '@/components/health/HealthListItem';
import Snackbar from '@/components/ui/Snackbar';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { listRecords, deleteRecord, type RecordStatus } from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
import type { MedicalRecord } from '@/types/api';

const TABS = ['Active', 'Resolved'];
const TAB_TO_STATUS: Record<string, RecordStatus> = {
  Active: 'active',
  Resolved: 'resolved',
};

export default function HealthScreen() {
  const router = useRouter();
  const { activePetId } = useActivePet();
  const { deletedNote } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState('Active');
  const [items, setItems] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(t('health.deleted'));

  React.useEffect(() => {
    if (deletedNote) {
      setSnackbarMessage(t('health.deleted'));
      setSnackbarVisible(true);
    }
  }, [deletedNote]);

  const fetchData = useCallback(async () => {
    if (!activePetId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const list = await listRecords(activePetId, TAB_TO_STATUS[activeTab]);
      setItems(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activePetId, activeTab]);

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
    Alert.alert(t('health.delete_record_confirm_title'), t('health.delete_record_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord(activePetId, id);
            setSnackbarMessage(t('health.record_deleted'));
            setSnackbarVisible(true);
            fetchData();
          } catch (err) {
            Alert.alert(t('common.error'), getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const renderEmptyState = () => {
    if (activeTab === 'Active') {
      return (
        <EmptyState
          title={t('health.empty_active_title')}
          subtitle={t('health.empty_active_subtitle')}
          actionTitle={t('health.add_first')}
          onAction={() => router.push('/health/add-note' as never)}
        />
      );
    }
    return (
      <EmptyState title={t('health.empty_resolved_title')} subtitle={t('health.empty_resolved_subtitle')} />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('health.title')} />

      <SegmentedControl tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

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
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HealthListItem
              title={item.title}
              subtitle={item.latest_note_preview ?? t('health.no_notes_preview')}
              dateOrTime={formatDisplayDate(item.created_at)}
              onPress={() => router.push(`/health/${item.id}` as never)}
              onLongPress={() => handleDeleteRecord(item.id)}
            />
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
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
  listContent: {
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
