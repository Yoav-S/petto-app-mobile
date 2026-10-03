import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ReviewListCard from '@/components/business/ReviewListCard';
import WriteReviewSheet from '@/components/business/WriteReviewSheet';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { getPlace, type PlaceReview } from '@/services/places';

export default function BusinessReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const [reviews, setReviews] = useState<PlaceReview[] | null>(null);
  const [footerHeight, setFooterHeight] = useState(88);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getPlace(id)
      .then((place) => {
        if (active) setReviews(place.reviews ?? []);
      })
      .catch((err) => {
        if (active) toast.showError(getErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [id, reloadToken, toast]);

  return (
    <View style={styles.screen}>
      <SettingsHeader title={t('business.review')} />
      {reviews == null ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: footerHeight + 4,
            gap: 4,
          }}
          showsVerticalScrollIndicator={false}
        >
          {reviews.map((review) => (
            <ReviewListCard
              key={review.id}
              review={review}
              onPress={() =>
                router.push({
                  pathname: '/business/[id]/reviews/[reviewId]',
                  params: { id, reviewId: review.id },
                } as never)
              }
            />
          ))}
        </ScrollView>
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
        initialRating={reviews?.find((review) => review.is_mine)?.rating}
        initialComment={reviews?.find((review) => review.is_mine)?.comment}
        onClose={() => setReviewOpen(false)}
        onSaved={() => setReloadToken((value) => value + 1)}
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
