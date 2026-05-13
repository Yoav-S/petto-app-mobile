import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SettingRow from '@/components/ui/SettingRow';
import InlineDatePicker from '@/components/ui/InlineDatePicker';
import InlineTimePicker from '@/components/ui/InlineTimePicker';
import InlineRepeatPicker from '@/components/ui/InlineRepeatPicker';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function ReminderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [isDatePickerExpanded, setIsDatePickerExpanded] = useState(false);
  const [isTimePickerExpanded, setIsTimePickerExpanded] = useState(false);
  const [isRepeatPickerExpanded, setIsRepeatPickerExpanded] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleDelete = () => {
    setIsModalVisible(true);
  };

  const confirmDelete = () => {
    setIsModalVisible(false);
    // Passing a query param back to trigger the snackbar in the list view
    router.push({ pathname: '/reminders', params: { deletedId: id } } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Reminders" />
      
      <View style={styles.content}>
        <View style={styles.topCard}>
          <Text style={styles.title}>Give medication</Text>
          <Text style={styles.subtitle}>Take after food</Text>
        </View>
        
        <View style={styles.settingsCard}>
          <SettingRow 
            icon="calendar-outline" 
            label="Date" 
            value="02.04.26" 
            onPress={() => setIsDatePickerExpanded(!isDatePickerExpanded)}
            isExpanded={isDatePickerExpanded}
          >
            <InlineDatePicker />
          </SettingRow>
          
          <SettingRow 
            icon="time-outline" 
            label="Time" 
            value="8:00" 
            onPress={() => setIsTimePickerExpanded(!isTimePickerExpanded)}
            isExpanded={isTimePickerExpanded}
          >
            <InlineTimePicker />
          </SettingRow>
          
          <SettingRow 
            icon="repeat-outline" 
            label="Repeat" 
            value="Off" 
            hideDivider
            onPress={() => setIsRepeatPickerExpanded(!isRepeatPickerExpanded)}
            isExpanded={isRepeatPickerExpanded}
          >
            <InlineRepeatPicker />
          </SettingRow>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteText}>Delete reminder</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal 
        visible={isModalVisible}
        title="Delete reminder?"
        message="This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setIsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  topCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: Colors.primaryText,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.xl, // Space before delete button
  },
  deleteButton: {
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
  deleteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.error,
  },
});
