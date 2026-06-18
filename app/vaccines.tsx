import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function VaccinesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Vaccines" />
      <View style={styles.emptyWrapper}>
        <EmptyState
          title="No vaccinations yet"
          subtitle="Your latest vaccines will appear on the home screen"
          actionTitle="Back to home"
          onAction={() => router.back()}
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
