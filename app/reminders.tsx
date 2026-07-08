import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import ReminderListItem from '@/components/reminders/ReminderListItem';
import ReminderActionSheet from '@/components/reminders/ReminderActionSheet';
import Snackbar from '@/components/ui/Snackbar';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import {
  listReminders,
  updateReminderStatus,
} from '@/services/reminders';
import { repeatLabel } from '@/components/pickers/RepeatPickerSheet';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
import type { Reminder } from '@/types/api';
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

export default function RemindersScreen() {
  const router = useRouter();
  const { activePetId } = useActivePet();
  const { deletedId } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<TabName>('Today');
  const [listsByTab, setListsByTab] = useState<Record<TabName, Reminder[]>>(EMPTY_LISTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  const items = listsByTab[activeTab];

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
    if (deletedId) setSnackbarVisible(true);
  }, [deletedId]);

  const fetchData = useCallback(async () => {
    if (!activePetId) {
      setListsByTab(EMPTY_LISTS);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const [today, upcoming, recent] = await Promise.all([
        listReminders(activePetId, 'today'),
        listReminders(activePetId, 'upcoming'),
        listReminders(activePetId, 'recent'),
      ]);
      setListsByTab({ Today: today, Upcoming: upcoming, Recent: recent });
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

  const handleStatus = async (status: 'completed' | 'missed') => {
    if (!activePetId || !selectedReminder) return;
    setActionSheetVisible(false);
    try {
      await updateReminderStatus(activePetId, selectedReminder.id, status);
      fetchData();
    } catch {
      /* keep list as-is; a transient error shouldn't block the UI */
    }
  };

  const addReminderAction = {
    actionTitle: t('reminders.add'),
    onAction: () => router.push('/reminders/add' as never),
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
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('reminders.title')} />

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
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReminderListItem
              title={item.title}
              subtitle={reminderSubtitle(item)}
              timeOrDate={reminderTimeOrDate(item, activeTab)}
              categoryAccent={Colors.category.reminders}
              onPress={() => {
                setSelectedReminder(item);
                setActionSheetVisible(true);
              }}
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
        onPress={() => router.push('/reminders/add' as never)}
      >
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>

      <Snackbar
        visible={snackbarVisible}
        message={t('reminders.deleted')}
        onHide={() => setSnackbarVisible(false)}
      />

      <ReminderActionSheet
        visible={actionSheetVisible}
        title={selectedReminder?.title}
        subtitle={selectedReminder ? reminderSubtitle(selectedReminder) : undefined}
        time={selectedReminder?.time}
        context={activeTab}
        onClose={() => setActionSheetVisible(false)}
        onDetailsPress={() => {
          setActionSheetVisible(false);
          if (selectedReminder) router.push(`/reminders/${selectedReminder.id}` as never);
        }}
        onDone={() => handleStatus('completed')}
        onMissed={() => handleStatus('missed')}
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
