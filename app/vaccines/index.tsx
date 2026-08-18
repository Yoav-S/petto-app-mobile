import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import VaccineScreenHeader, { getVaccineHeaderContentOffset } from '@/components/vaccines/VaccineScreenHeader';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import EmptyState from '@/components/ui/EmptyState';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { listVaccinations } from '@/services/vaccines';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDateLong } from '@/utils/calendar';
import type { Vaccination } from '@/types/api';

const EMPTY_TOP = 304;
const EMPTY_GAP = 20;

function VaccineThumbnail({ uri }: { uri?: string | null }) {
  const styles = useThemedStyles(makeStyles);
  if (uri) {
    return <Image source={{ uri }} style={styles.thumb} contentFit="cover" />;
  }
  return (
    <View style={[styles.thumb, styles.thumbPlaceholder]}>
      <Image source={HOME_CATEGORY_ICONS.vaccines} style={styles.thumbIcon} contentFit="contain" />
    </View>
  );
}

export default function VaccinesScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { activePetId } = useActivePet();
  const headerOffset = getVaccineHeaderContentOffset(812);
  const emptyTop = Math.max(Spacing.lg, EMPTY_TOP - headerOffset);
  const emptyGap = EMPTY_GAP;

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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <VaccineScreenHeader
        title={t('vaccines.list_title')}
        right={
          <HeaderIconButton
            onPress={() => router.push('/vaccines/add' as never)}
            accessibilityLabel={t('vaccines.add')}
          >
            <Ionicons name="add" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
          </HeaderIconButton>
        }
      />
      {renderContent()}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    flexGrow: 1,
  },
  listContentEmpty: {
    flexGrow: 0,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: 10,
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: c.background,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.category.vaccinesBg,
  },
  thumbIcon: {
    width: 28,
    height: 28,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    height: 72,
    gap: Spacing.md,
  },
  cardTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
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
});
