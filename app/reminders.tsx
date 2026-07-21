import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AddFabButton, { ADD_FAB_BOTTOM, ADD_FAB_RIGHT } from '@/components/ui/AddFabButton';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import ReminderListItem from '@/components/reminders/ReminderListItem';
import ReminderActionSheet from '@/components/reminders/ReminderActionSheet';
import Snackbar from '@/components/ui/Snackbar';
import {
  needsStatusPrompt,
  statusPromptKey,
} from '@/components/reminders/reminderFormShared';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import {
  listReminders,
  updateReminderStatus,
} from '@/services/reminders';
import { repeatLabel } from '@/components/pickers/RepeatPickerSheet';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
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

export default function RemindersScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
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
  const autoPromptCheckedRef = useRef(false);

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
      return today;
    } catch (err) {
      setError(getErrorMessage(err));
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activePetId]);

  const maybeAutoPromptStatus = useCallback(async (today: Reminder[]) => {
    if (autoPromptCheckedRef.current) return;
    autoPromptCheckedRef.current = true;

    for (const item of today) {
      if (!needsStatusPrompt(item)) continue;
      const key = statusPromptKey(item);
      const seen = await AsyncStorage.getItem(key);
      if (!seen) {
        setSelectedReminder(item);
        setActionSheetVisible(true);
        break;
      }
    }
  }, []);

  const markStatusPrompted = useCallback(async (reminder: Reminder | null) => {
    if (!reminder || !needsStatusPrompt(reminder)) return;
    await AsyncStorage.setItem(statusPromptKey(reminder), '1');
  }, []);

  useFocusEffect(
    useCallback(() => {
      autoPromptCheckedRef.current = false;
      setLoading(true);
      fetchData().then((today) => {
        if (today?.length) maybeAutoPromptStatus(today);
      });
    }, [fetchData, maybeAutoPromptStatus]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const closeActionSheet = useCallback(() => {
    setActionSheetVisible(false);
    setSelectedReminder(null);
  }, []);

  const handleReminderPress = useCallback(
    (item: Reminder) => {
      if (activeTab === 'Upcoming') {
        router.push(`/reminders/${item.id}` as never);
        return;
      }
      if (activeTab === 'Today') {
        setSelectedReminder(item);
        setActionSheetVisible(true);
      }
    },
    [activeTab, router],
  );

  const handleStatus = async (status: 'completed' | 'missed') => {
    if (!activePetId || !selectedReminder) return;
    const reminder = selectedReminder;
    setActionSheetVisible(false);
    setSelectedReminder(null);
    try {
      await updateReminderStatus(activePetId, reminder.id, status);
      await markStatusPrompted(reminder);
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
    <SafeAreaView style={styles.safeArea}>
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

      <AddFabButton
        style={styles.fab}
        onPress={() => {
          void goAddReminder();
        }}
        accessibilityLabel={t('reminders.add')}
      />

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
        context={activeTab === 'Today' ? t('common.today') : undefined}
        showDetailsLink={false}
        onClose={async () => {
          await markStatusPrompted(selectedReminder);
          closeActionSheet();
        }}
        onDone={() => handleStatus('completed')}
        onMissed={() => handleStatus('missed')}
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
  },
  listContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: ADD_FAB_BOTTOM,
    right: ADD_FAB_RIGHT,
    zIndex: 20,
  },
});
