import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ReviewListCard from '@/components/business/ReviewListCard';
import WriteReviewSheet from '@/components/business/WriteReviewSheet';
import { t } from '@/i18n';
import { queryKeys } from '@/services/queryKeys';
import { listPlaceReviews, type PlaceReview } from '@/services/places';

export default function BusinessReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const [footerHeight, setFooterHeight] = useState(88);
  const [reviewOpen, setReviewOpen] = useState(false);
  const openedOnce = useRef(false);

  const fetchPage = useCallback(
    (params: { limit: number; cursor?: string }) =>
      id ? listPlaceReviews(id, params) : Promise.resolve([]),
    [id],
  );
  const {
    items: reviews,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
  } = useCursorPagination<PlaceReview>({
    fetchPage,
    enabled: Boolean(id),
    resetKey: id,
    cacheKey: queryKeys.businesses.reviews(id ?? ''),
  });

  useEffect(() => {
    if (error) toast.showError(error);
  }, [error, toast]);

  useFocusEffect(
    useCallback(() => {
      if (!openedOnce.current) {
        openedOnce.current = true;
        return;
      }
      void refresh();
    }, [refresh]),
  );

  const mine = reviews.find((review) => review.is_mine);

  return (
    <View style={styles.screen}>
      <SettingsHeader title={t('business.review')} />
      {loading && reviews.length === 0 ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(review) => review.id}
          style={styles.scroll}
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: footerHeight + 4,
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            void loadMore();
          }}
          onEndReachedThreshold={0.35}
          renderItem={({ item }) => (
            <ReviewListCard
              review={item}
              onPress={
                item.is_mine
                  ? () =>
                      router.push({
                        pathname: '/business/[id]/reviews/[reviewId]',
                        params: {
                          id,
                          reviewId: item.id,
                          rating: String(item.rating),
                          comment: item.comment ?? '',
                        },
                      } as never)
                  : undefined
              }
            />
          )}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : null
          }
        />
      )}
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
      >
        <TouchableOpacity style={styles.writeButton} onPress={() => setReviewOpen(true)}>
          <Text style={styles.writeLabel}>{t('business.write_review')}</Text>
        </TouchableOpacity>
      </View>
      <WriteReviewSheet
        visible={reviewOpen}
        businessId={id}
        initialRating={mine?.rating}
        initialComment={mine?.comment}
        onClose={() => setReviewOpen(false)}
        onSaved={() => {
          void refresh();
        }}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: {
      flex: 1,
    },
    separator: {
      height: 4,
    },
    loader: {
      marginTop: 24,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: 12,
      paddingHorizontal: 20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: c.surface,
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 8,
    },
    writeButton: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    writeLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: '#F6F7F9',
    },
  });
