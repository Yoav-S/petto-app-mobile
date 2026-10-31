import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ReviewListCard from '@/components/business/ReviewListCard';
import ReviewActionsSheet from '@/components/business/ReviewActionsSheet';
import { waitForBottomSheetsToSettle } from '@/components/ui/BottomSheetModal';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import {
  deletePlaceReview,
  forgetOpenedReview,
  readOpenedReview,
  rememberPlaceReview,
  reportPlaceReview,
  type PlaceReview,
} from '@/services/places';

function paramText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function BusinessReviewViewScreen() {
  const params = useLocalSearchParams<{ id: string; reviewId: string }>();
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const businessId = paramText(params.id);
  const reviewId = paramText(params.reviewId);
  const [review, setReview] = useState<PlaceReview | null>(() =>
    businessId && reviewId ? readOpenedReview(businessId, reviewId) : null,
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!businessId || !reviewId) return;
      const next = readOpenedReview(businessId, reviewId);
      if (next) setReview(next);
    }, [businessId, reviewId]),
  );

  if (!review) {
    return (
      <View style={styles.screen}>
        <SettingsHeader title={t('business.review')} rounded />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SettingsHeader title={t('business.review')} rounded />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        endFillColor={colors.background}
        showsVerticalScrollIndicator={false}
      >
        <ReviewListCard
          review={review}
          expanded
          onMenuPress={() => setMenuOpen(true)}
        />
      </ScrollView>
      <ReviewActionsSheet
        visible={menuOpen}
        isMine={review.is_mine === true}
        onClose={() => setMenuOpen(false)}
        onEdit={() => {
          setMenuOpen(false);
          router.push({
            pathname: '/business/[id]/reviews/[reviewId]',
            params: {
              id: businessId,
              reviewId: review.id,
              rating: String(review.rating),
              comment: review.comment ?? '',
            },
          } as never);
        }}
        onRemove={() => {
          const snapshot = review;
          setMenuOpen(false);
          forgetOpenedReview(businessId, review.id);
          router.back();
          void waitForBottomSheetsToSettle().then(() => {
            toast.showUndo({
              message: t('business.review_deleted'),
              onUndo: () => {
                rememberPlaceReview(businessId, snapshot);
              },
              onCommit: async () => {
                try {
                  await deletePlaceReview(businessId);
                } catch (err) {
                  toast.showError(getErrorMessage(err));
                }
              },
            });
          });
        }}
        onReport={(reason) => {
          setMenuOpen(false);
          void waitForBottomSheetsToSettle().then(() => {
            toast.showUndo({
              message: t('business.report_submitted'),
              onUndo: () => {},
              onCommit: async () => {
                try {
                  await reportPlaceReview(businessId, review.id, reason);
                } catch (err) {
                  toast.showError(getErrorMessage(err));
                }
              },
            });
          });
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
      backgroundColor: c.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: 4,
      paddingBottom: 24,
      backgroundColor: c.background,
    },
  });
