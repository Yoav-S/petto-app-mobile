import React, { useState } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import ReminderListItem from '@/components/reminders/ReminderListItem';
import ReminderActionSheet from '@/components/reminders/ReminderActionSheet';
import Snackbar from '@/components/ui/Snackbar';
import { Ionicons } from '@expo/vector-icons';

const MOCK_TODAY = [
  { id: '1', title: 'Give medication', subtitle: 'Apoquel tablet', timeOrDate: '8:00' },
  { id: '2', title: 'Vet visit', subtitle: 'General check-up', timeOrDate: '10:30' },
  { id: '3', title: 'Flea & tick spray', subtitle: '', timeOrDate: '13:00' },
  { id: '4', title: 'Eye drops', subtitle: 'Left eye', timeOrDate: '16:00' },
];

const MOCK_UPCOMING = [
  { id: '5', title: 'Vaccination', subtitle: 'Rabies booster', timeOrDate: '21:00\nToday', categoryAccent: '#48C072' }, // Adjusting time to mimic the screenshot's 'Today' label under upcoming, or using green for urgency
  { id: '6', title: 'Deworming', subtitle: 'Milbemax', timeOrDate: 'Yesterday' },
  { id: '7', title: 'Vet visit', subtitle: 'Dental check', timeOrDate: '11:30\n17.03.26' },
  { id: '8', title: 'Nail trimming', subtitle: '', timeOrDate: '14:00\n19.02.26' },
  { id: '9', title: 'Call to Grooming', subtitle: '', timeOrDate: '01.02.26' },
  { id: '10', title: 'Ear cleaning', subtitle: 'Left ear', timeOrDate: '9:30\n25.01.26' },
];

const MOCK_RECENT: any[] = [];

export default function RemindersScreen() {
  const router = useRouter();
  const { deletedId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Today');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);

  React.useEffect(() => {
    if (deletedId) {
      setSnackbarVisible(true);
    }
  }, [deletedId]);

  const getListData = () => {
    switch (activeTab) {
      case 'Today': return MOCK_TODAY;
      case 'Upcoming': return MOCK_UPCOMING;
      case 'Recent': return MOCK_RECENT;
      default: return [];
    }
  };

  const data = getListData();

  const renderEmptyState = () => {
    if (activeTab === 'Recent') {
      return (
        <EmptyState 
          title="No recent activity" 
          subtitle="Completed reminders\nwill appear here" 
        />
      );
    }
    if (activeTab === 'Upcoming') {
      return (
        <EmptyState 
          title="No upcoming reminders" 
          subtitle="You're all set for now" 
        />
      );
    }
    return (
      <EmptyState 
        title="No reminders yet" 
        subtitle="Start by adding your first reminder"
        actionTitle="Add reminder"
        onAction={() => {}}
      />
    );
  };

  const handleReminderPress = (item: any) => {
    setSelectedReminder(item);
    setActionSheetVisible(true);
  };

  const handleDetailsPress = () => {
    setActionSheetVisible(false);
    if (selectedReminder) {
      router.push(`/reminders/${selectedReminder.id}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Reminders" />
      
      <SegmentedControl 
        tabs={['Today', 'Upcoming', 'Recent']} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReminderListItem 
            title={item.title}
            subtitle={item.subtitle}
            timeOrDate={item.timeOrDate}
            categoryAccent={item.categoryAccent}
            onPress={() => handleReminderPress(item)}
          />
        )}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>
      
      <Snackbar 
        visible={snackbarVisible} 
        message="Reminder deleted" 
        actionText="Undo"
        onAction={() => setSnackbarVisible(false)}
        onHide={() => setSnackbarVisible(false)}
      />

      <ReminderActionSheet 
        visible={actionSheetVisible}
        title={selectedReminder?.title}
        subtitle={selectedReminder?.subtitle || 'No additional details'}
        time={selectedReminder?.timeOrDate?.split('\n')[0]}
        context={activeTab}
        onClose={() => setActionSheetVisible(false)}
        onDetailsPress={handleDetailsPress}
        onDone={() => setActionSheetVisible(false)}
        onMissed={() => setActionSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 100, // Make room for FAB
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
