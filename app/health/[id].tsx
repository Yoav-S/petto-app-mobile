import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function HealthDetailsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Health" />

      <View style={styles.emptyWrapper}>
        <EmptyState
          title="No notes yet"
          subtitle="Add your first note to start tracking"
          actionTitle="Add note"
          onAction={() => router.push('/health/add-note' as any)}
        />
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
});
