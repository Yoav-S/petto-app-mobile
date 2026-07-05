import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { listVaccinations } from '@/services/vaccines';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
import type { Vaccination } from '@/types/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  up_to_date: { bg: Colors.category.remindersBg, text: Colors.category.reminders },
  due_soon: { bg: Colors.category.notesBg, text: Colors.category.notes },
  overdue: { bg: '#FBE9E9', text: Colors.error },
};

function StatusBadge({ status }: { status: string }) {
  const palette = STATUS_COLORS[status] ?? STATUS_COLORS.up_to_date;
  const label = t(`status.${status}`);
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>
        {label === `status.${status}` ? status : label}
      </Text>
    </View>
  );
}

export default function VaccinesScreen() {
  const router = useRouter();
  const { activePetId } = useActivePet();

  const [items, setItems] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!activePetId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const list = await listVaccinations(activePetId);
      setItems(list);
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

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryText} />
        </View>
      );
    }

    if (error) {
      return (
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
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardDate}>
              {t('vaccines.given')} {formatDisplayDate(item.date)}
            </Text>
            {item.next_date ? (
              <Text style={styles.cardDate}>
                {t('vaccines.next')} {formatDisplayDate(item.next_date)}
              </Text>
            ) : null}
            {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('vaccines.empty_title')}
            subtitle={t('vaccines.empty_subtitle')}
            actionTitle={t('vaccines.add')}
            onAction={() => router.push('/vaccines/add' as never)}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('vaccines.title')} />
      {renderContent()}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/vaccines/add' as never)}
      >
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>
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
    paddingTop: Spacing.md,
    paddingBottom: 120,
    flexGrow: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
    flex: 1,
    marginRight: Spacing.md,
  },
  cardDate: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  cardNote: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
    marginTop: Spacing.xs,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
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
