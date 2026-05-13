import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, SectionList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import HealthLogCard from '@/components/health/HealthLogCard';

// Real app would fetch this based on the ID
const MOCK_LOGS: any[] = [
  {
    title: 'Today',
    data: [
      {
        id: '1',
        text: 'Applied ointment to affected area. Seems less irritated than this morning.',
        reminder: 'Apr 21, 20:00',
      },
      {
        id: '2',
        text: 'Less itching today',
        reminder: 'Apr 21, 20:00',
        imageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=600&auto=format&fit=crop', // Stock dog snout
      }
    ]
  },
  {
    title: 'Yesterday',
    data: [
      {
        id: '3',
        text: 'Applied ointment to affected area. Seems less irritated than this morning.',
      }
    ]
  }
];

export default function HealthDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Allergy" />
      
      <SectionList
        sections={MOCK_LOGS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/health/edit-note' as any)}>
            <HealthLogCard 
              text={item.text}
              reminder={item.reminder}
              imageUrl={item.imageUrl}
            />
          </TouchableOpacity>
        )}
      />

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.addNoteButton} 
          activeOpacity={0.8}
          onPress={() => router.push('/health/add-note' as any)}
        >
          <Text style={styles.addNoteText}>Add note</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resolvedButton} activeOpacity={0.8}>
          <Text style={styles.resolvedText}>Resolved</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // Leave room for bottom bar
  },
  sectionHeader: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl, // Extended bottom padding for safe area logic
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addNoteButton: {
    flex: 2,
    backgroundColor: Colors.primaryText,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  addNoteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  resolvedButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resolvedText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
});
