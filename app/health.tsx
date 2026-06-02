import React, { useState } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import HealthListItem from '@/components/health/HealthListItem';
import Snackbar from '@/components/ui/Snackbar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function HealthScreen() {
  const router = useRouter();
  const { deletedNote } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Active');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  React.useEffect(() => {
    if (deletedNote) {
      setSnackbarVisible(true);
    }
  }, [deletedNote]);

  const data: any[] = [];

  const renderEmptyState = () => {
    if (activeTab === 'Active') {
      return (
        <EmptyState 
          title="No records yet" 
          subtitle="Track symptoms, changes or visits"
          actionTitle="Add first note"
          onAction={() => router.push('/health/add-note' as any)}
        />
      );
    }
    return (
      <EmptyState 
        title="No resolved records" 
        subtitle="Completed health issues\nwill appear here" 
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Health" />
      
      <View style={styles.segmentWrapper}>
        <SegmentedControl 
          tabs={['Active', 'Resolved']} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </View>
      
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HealthListItem 
            title={item.title}
            subtitle={item.subtitle}
            dateOrTime={item.dateOrTime}
            icon={item.icon}
            onPress={() => router.push(`/health/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/health/add-note' as any)}>
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>

      <Snackbar 
        visible={snackbarVisible} 
        message="Note deleted" 
        actionText="Undo"
        onAction={() => setSnackbarVisible(false)}
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
  segmentWrapper: {},
  listContent: {
    paddingBottom: 100,
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
