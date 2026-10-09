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
import { type ThemeColors } from '@/constants/theme';
import { FOOTER_FADE_BAND } from '@/constants/layout';
import ScrollFadeBand from '@/components/ui/ScrollFadeBand';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useHomePanelLayout } from '@/hooks/useHomePanelLayout';
import ListScrollLayout, { type ListScrollInsets } from '@/components/ui/ListScrollLayout';
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


const VACCINE_CARD_PAD_V = 22;
const VACCINE_CARD_GAP = 4;
const VACCINE_THUMB = 48;
const VACCINE_TITLE_LINE = 20;
const VACCINE_BODY_GAP = 10;
/** Date label, its gap, and the date value. */
const VACCINE_DATE_BLOCK = 36;
const VACCINE_CARD_HEIGHT =
  VACCINE_CARD_PAD_V * 2 +
  Math.max(VACCINE_THUMB, VACCINE_TITLE_LINE + VACCINE_BODY_GAP + VACCINE_DATE_BLOCK);

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
  const { fabBottom, fabTopInset } = useHomePanelLayout();

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
  const toast = useToast();

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
    scrollable: boolean,
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
            actionTitle={t('common.add')}
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
          scrollMetricsProps.onLayout(e);
          scrollMetricsProps.markScrollable();
        }}
        onContentSizeChange={scrollMetricsProps.onContentSizeChange}
        renderItem={({ item }) => (
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
            </TouchableOpacity>
          </SwipeToDeleteRow>
        )}
        contentContainerStyle={{
          paddingTop,
          paddingBottom,
          backgroundColor: colors.background,
        }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustsScrollIndicatorInsets={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollable}
        bounces={scrollable}
        alwaysBounceVertical={false}
        overScrollMode={scrollable ? 'auto' : 'never'}
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

  return (
    <View style={styles.screen}>
      <ListScrollLayout
        fadeKey="vaccines"
        pinHeader
        contentGap={4}
        topFade={false}
        bottomFade={false}
        contentBottomPadding={Math.max(0, fabTopInset - VACCINE_CARD_GAP + 16)}
        chrome={<VaccineScreenHeader title={t('vaccines.list_title')} />}
      >
        {({ paddingTop, paddingBottom, scrollable, scrollMetricsProps }) =>
          renderContent(paddingTop, paddingBottom, scrollable, scrollMetricsProps)
        }
      </ListScrollLayout>
      <View pointerEvents="none" style={styles.bottomFade}>
        <ScrollFadeBand
          edge="bottom"
          height={FOOTER_FADE_BAND}
          solidAt={0.8913}
          color={colors.surface}
        />
      </View>
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
          bottom={fabBottom}
        />
      ) : null}
      <ListFetchBlocker visible={loadingMore} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    list: {
      flex: 1,
      backgroundColor: c.background,
    },
    bottomFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: FOOTER_FADE_BAND,
      zIndex: 1,
      overflow: 'hidden',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      marginBottom: VACCINE_CARD_GAP,
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'center',
      paddingTop: VACCINE_CARD_PAD_V,
      paddingBottom: VACCINE_CARD_PAD_V,
      paddingLeft: 20,
      paddingRight: 20,
      gap: 10,
      flexDirection: 'row',
      alignItems: 'flex-start',
      overflow: 'hidden',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 3,
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
      gap: VACCINE_BODY_GAP,
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
