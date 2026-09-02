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

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { PAGE_HORIZONTAL_PADDING, LIST_HEADER_CONTENT_GAP } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ListScrollLayout, { type ListScrollInsets } from '@/components/ui/ListScrollLayout';
import CardBottomFadeOverlay from '@/components/ui/CardBottomFadeOverlay';
import { rowFadeIntensity } from '@/components/ui/listItemFade';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import SpeedDialFab from '@/components/ui/SpeedDialFab';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import EmptyState from '@/components/ui/EmptyState';
import SwipeToDeleteRow from '@/components/ui/SwipeToDeleteRow';
import ListLoadMoreFooter from '@/components/ui/ListLoadMoreFooter';
import ListFetchBlocker from '@/components/ui/ListFetchBlocker';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDateLong } from '@/utils/calendar';
import { deleteVaccination, listVaccinations } from '@/services/vaccines';
import { invalidateVaccinations } from '@/services/queryClient';
import { queryKeys } from '@/services/queryKeys';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import type { Vaccination } from '@/types/api';


const VACCINE_CARD_HEIGHT = 100;
const VACCINE_CARD_GAP = 12;

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

  const fetchPage = useCallback(
    async (params: { limit: number; cursor?: string }) => {
      if (!activePetId) return [];
      return listVaccinations(activePetId, params);
    },
    [activePetId],
  );

  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    setItems,
  } = useCursorPagination<Vaccination>({
    fetchPage,
    enabled: Boolean(activePetId),
    resetKey: activePetId,
    cacheKey: [...queryKeys.vaccinations.all(activePetId ?? ''), 'page1'],
  });

  const [refreshing, setRefreshing] = useState(false);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const toast = useToast();

  const getItemFadeIntensity = useCallback(
    (index: number, contentTop: number, bottomFadeInset: number) =>
      rowFadeIntensity({
        rowBottom: index * (VACCINE_CARD_HEIGHT + VACCINE_CARD_GAP) + VACCINE_CARD_HEIGHT,
        contentTop,
        scrollY,
        fadeLine: listHeight - bottomFadeInset,
        fadeZone: VACCINE_CARD_HEIGHT * 0.89,
      }),
    [listHeight, scrollY],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    if (loadingMore) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [loadingMore, refresh]);

  const handleDeleteVaccine = useCallback(
    (id: string) => {
      if (!activePetId) return;
      setSwipeOpenId(null);
      const idx = items.findIndex((v) => v.id === id);
      if (idx < 0) return;
      const restore = items[idx];
      setItems((prev) => prev.filter((v) => v.id !== id));
      toast.showUndo({
        message: t('vaccines.deleted'),
        aboveFab: true,
        onUndo: () => {
          setItems((prev) => {
            const list = [...prev];
            list.splice(Math.min(idx, list.length), 0, restore);
            return list;
          });
        },
        onCommit: async () => {
          try {
            await deleteVaccination(activePetId, id);
          } catch (err) {
            setItems((prev) => {
              const list = [...prev];
              list.splice(Math.min(idx, list.length), 0, restore);
              return list;
            });
            invalidateVaccinations(activePetId);
            toast.showError(getErrorMessage(err), { aboveFab: true });
          }
        },
      });
    },
    [activePetId, items, setItems, toast],
  );

  const renderContent = (
    paddingTop: number,
    paddingBottom: number,
    bottomFadeInset: number,
    scrollMetricsProps: ListScrollInsets['scrollMetricsProps'],
  ) => {
    if (loading && items.length === 0) {
      return (
        <View
          style={[styles.centered, { paddingTop }]}
          onLayout={(e) => {
            scrollMetricsProps.onLayout(e);
            scrollMetricsProps.markNonScrollable({ transient: true });
          }}
        >
          <ActivityIndicator color={colors.primaryText} />
        </View>
      );
    }

    if (error && !items.length) {
      return (
        <View
          style={[styles.centered, { paddingTop }]}
          onLayout={(e) => {
            scrollMetricsProps.onLayout(e);
            scrollMetricsProps.markNonScrollable();
          }}
        >
          <EmptyState
            title={t('common.error')}
            subtitle={error}
            actionTitle={t('common.retry')}
            onAction={() => {
              void refresh();
            }}
          />
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <View
          style={[styles.centered, { paddingTop }]}
          onLayout={(e) => {
            scrollMetricsProps.onLayout(e);
            scrollMetricsProps.markNonScrollable();
          }}
        >
          <EmptyState
            title={t('vaccines.empty_title')}
            subtitle={t('vaccines.empty_subtitle')}
            actionTitle={t('vaccines.add')}
            actionCompact
            onAction={() => router.push('/vaccines/add' as never)}
          />
        </View>
      );
    }

    return (
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        scrollEventThrottle={16}
        onLayout={(e) => {
          setListHeight(e.nativeEvent.layout.height);
          scrollMetricsProps.onLayout(e);
          scrollMetricsProps.markScrollable();
        }}
        onContentSizeChange={scrollMetricsProps.onContentSizeChange}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        renderItem={({ item, index }) => (
          <SwipeToDeleteRow
            open={swipeOpenId === item.id}
            onOpenChange={(open) => setSwipeOpenId(open ? item.id : null)}
            onDelete={() => handleDeleteVaccine(item.id)}
          >
            <TouchableOpacity
              style={styles.card}
              // Press feedback comes from the swipe row's disabled wash.
              activeOpacity={1}
              onPress={() => {
                setSwipeOpenId(null);
                router.push(`/vaccines/${item.id}` as never);
              }}
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

              <CardBottomFadeOverlay
                intensity={getItemFadeIntensity(index, paddingTop, bottomFadeInset)}
              />
            </TouchableOpacity>
          </SwipeToDeleteRow>
        )}
        contentContainerStyle={[styles.listContent, { paddingTop, paddingBottom }]}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          void loadMore();
        }}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          <ListLoadMoreFooter loading={loadingMore} hasMore={hasMore} />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      />
    );
  };

  const showFab = items.length > 0 && !loading && !(error && !items.length);

  return (
    <>
      <ListScrollLayout
        fadeKey="vaccines"
        contentGap={LIST_HEADER_CONTENT_GAP}
        fabOverlay={showFab}
        chrome={<VaccineScreenHeader title={t('vaccines.list_title')} />}
      >
        {({ paddingTop, paddingBottom, bottomFadeInset, scrollMetricsProps }) =>
          renderContent(paddingTop, paddingBottom, bottomFadeInset, scrollMetricsProps)
        }
      </ListScrollLayout>
      {items.length > 0 && !loading && !(error && !items.length) ? (
        <SpeedDialFab
          items={[
            {
              key: 'add-vaccine',
              label: t('vaccines.add'),
              icon: HOME_CATEGORY_ICONS.vaccines,
              onPress: () => router.push('/vaccines/add' as never),
            },
          ]}
          accessibilityLabel={t('vaccines.add')}
        />
      ) : null}
      <ListFetchBlocker visible={loadingMore} />
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    list: {
      flex: 1,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      marginBottom: VACCINE_CARD_GAP,
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 10,
      height: VACCINE_CARD_HEIGHT,
      flexDirection: 'row',
      alignItems: 'flex-start',
      overflow: 'hidden',
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
