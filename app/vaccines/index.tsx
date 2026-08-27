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
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import SpeedDialFab from '@/components/ui/SpeedDialFab';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import EmptyState from '@/components/ui/EmptyState';
import SwipeToDeleteRow from '@/components/ui/SwipeToDeleteRow';
import ListLoadMoreFooter from '@/components/ui/ListLoadMoreFooter';
import ListFetchBlocker from '@/components/ui/ListFetchBlocker';
import { LIST_FAB_SCROLL_PADDING } from '@/constants/pagination';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDateLong } from '@/utils/calendar';
import { deleteVaccination, listVaccinations } from '@/services/vaccines';
import { invalidateVaccinations } from '@/services/queryClient';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import type { Vaccination } from '@/types/api';


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
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

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

  const renderContent = (paddingTop: number) => {
    if (loading) {
      return (
        <View style={[styles.centered, { paddingTop }]}>
          <ActivityIndicator color={colors.primaryText} />
        </View>
      );
    }

    if (error && !items.length) {
      return (
        <View style={[styles.centered, { paddingTop }]}>
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

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeToDeleteRow
            open={swipeOpenId === item.id}
            onOpenChange={(open) => setSwipeOpenId(open ? item.id : null)}
            onDelete={() => handleDeleteVaccine(item.id)}
          >
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
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
        ListEmptyComponent={
          <EmptyState
            title={t('vaccines.empty_title')}
            subtitle={t('vaccines.empty_subtitle')}
            actionTitle={t('vaccines.add')}
            actionCompact
            topOffset={Spacing.lg}
            onAction={() => router.push('/vaccines/add' as never)}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingTop },
          items.length === 0 ? styles.listContentEmpty : null,
        ]}
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

  return (
    <>
      <HeaderScrollLayout
        header={<VaccineScreenHeader title={t('vaccines.list_title')} />}
        edges={['left', 'right', 'bottom']}
      >
        {({ paddingTop }) => renderContent(paddingTop)}
      </HeaderScrollLayout>
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingBottom: LIST_FAB_SCROLL_PADDING,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      marginBottom: 12,
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
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
