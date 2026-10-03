import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ReviewListCard from '@/components/business/ReviewListCard';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { getPlace, type PlaceReview } from '@/services/places';

export default function BusinessReviewScreen() {
  const { id, reviewId } = useLocalSearchParams<{ id: string; reviewId: string }>();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const [review, setReview] = useState<PlaceReview | null>(null);

  useEffect(() => {
    if (!id || !reviewId) return;
    let active = true;
    getPlace(id)
      .then((place) => {
        if (!active) return;
        setReview(place.reviews.find((item) => item.id === reviewId) ?? null);
      })
      .catch((err) => {
        if (active) toast.showError(getErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [id, reviewId, toast]);

  return (
    <View style={styles.screen}>
      <SettingsHeader title={t('business.review')} />
      {review == null ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ReviewListCard review={review} expanded />
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingTop: 4,
      paddingBottom: 24,
    },
    loader: {
      marginTop: 24,
    },
  });
