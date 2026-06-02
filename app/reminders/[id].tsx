import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function ReminderDetailsScreen() {
  const router = useRouter();
  const [hasReminder] = useState(false);

  if (!hasReminder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Reminders" />
        <View style={styles.emptyWrapper}>
          <EmptyState
            title="Reminder not found"
            subtitle="This reminder may have been deleted"
            actionTitle="Back to reminders"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Reminders" />
      <View style={styles.content}>
        <Text style={styles.placeholder}>Reminder details</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  placeholder: {
    fontFamily: 'Rubik-Regular',
    color: Colors.secondaryText,
  },
});
