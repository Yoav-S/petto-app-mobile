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
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AddFabButton, { ADD_FAB_BOTTOM, ADD_FAB_RIGHT } from '@/components/ui/AddFabButton';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import VaccineScreenHeader, { getVaccineHeaderContentOffset } from '@/components/vaccines/VaccineScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { listVaccinations } from '@/services/vaccines';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDateLong } from '@/utils/calendar';
import type { Vaccination } from '@/types/api';

const DESIGN_HEIGHT = 812;
const EMPTY_TOP = 304;
const EMPTY_GAP = 20;

function VaccineThumbnail({ uri }: { uri?: string | null }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  if (uri) {
    return <Image source={{ uri }} style={styles.thumb} contentFit="cover" />;
  }
  return (
    <View style={[styles.thumb, styles.thumbPlaceholder]}>
      <MaterialCommunityIcons name="needle" size={22} color={colors.category.vaccines} />
    </View>
  );
}

export default function VaccinesScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { activePetId } = useActivePet();
  const { height } = useWindowDimensions();
  const sy = height / DESIGN_HEIGHT;
  const headerOffset = getVaccineHeaderContentOffset(height);
  const emptyTop = Math.max(Spacing.lg, EMPTY_TOP * sy - headerOffset);
  const emptyGap = EMPTY_GAP * sy;

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
          <ActivityIndicator color={colors.primaryText} />
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
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/vaccines/${item.id}` as never)}
          >
            <VaccineThumbnail uri={item.photo_url} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.datesRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>{t('vaccines.vaccinated_on')}</Text>
                  <Text style={styles.dateValue}>{formatDisplayDateLong(item.date)}</Text>
                </View>
                {item.next_date ? (
                  <View style={[styles.dateCol, styles.dateColRight]}>
                    <Text style={styles.dateLabel}>{t('vaccines.valid_until')}</Text>
                    <Text style={styles.dateValue}>{formatDisplayDateLong(item.next_date)}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('vaccines.empty_title')}
            subtitle={t('vaccines.empty_subtitle')}
            actionTitle={t('vaccines.add')}
            onAction={() => router.push('/vaccines/add' as never)}
            topOffset={emptyTop}
            contentGap={emptyGap}
          />
        }
        contentContainerStyle={[styles.listContent, items.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <VaccineScreenHeader title={t('vaccines.list_title')} />
      {renderContent()}

      <AddFabButton
        style={styles.fab}
        onPress={() => router.push('/vaccines/add' as never)}
        accessibilityLabel={t('vaccines.add')}
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
    paddingTop: Spacing.md,
    paddingBottom: 120,
    flexGrow: 1,
  },
  listContentEmpty: {
    flexGrow: 0,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: c.background,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.category.vaccinesBg,
  },
  cardBody: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.primaryText,
    marginBottom: Spacing.sm,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateCol: {
    flex: 1,
  },
  dateColRight: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: c.secondaryText,
    marginBottom: 2,
  },
  dateValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.primaryText,
  },
  fab: {
    position: 'absolute',
    bottom: ADD_FAB_BOTTOM,
    right: ADD_FAB_RIGHT,
    zIndex: 20,
  },
});
