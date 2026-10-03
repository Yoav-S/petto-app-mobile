import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HealthFormScreen } from '@/components/health/HealthKeyboardFooter';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { savePlaceReview } from '@/services/places';

const SCORES = [1, 2, 3, 4, 5] as const;

export default function BusinessReviewScreen() {
  const { id, rating: ratingParam, comment: commentParam } = useLocalSearchParams<{
    id: string;
    reviewId: string;
    rating?: string;
    comment?: string;
  }>();
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const initialRating = Number(ratingParam);
  const [rating, setRating] = useState<number | null>(
    initialRating >= 1 && initialRating <= 5 ? initialRating : null,
  );
  const [comment, setComment] = useState(typeof commentParam === 'string' ? commentParam : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!id || !rating || saving) return;
    try {
      setSaving(true);
      await savePlaceReview(id, { rating, comment });
      router.back();
    } catch (err) {
      toast.showError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SettingsHeader title={t('business.review')} />
      <HealthFormScreen
        contentContainerStyle={styles.form}
        footer={{
          label: t('common.save'),
          disabled: !rating || saving,
          loading: saving,
          onPress: () => void save(),
        }}
      >
        <View style={styles.experience}>
          <Text style={styles.label}>{t('business.experience')}</Text>
          <View style={styles.scores}>
            {SCORES.map((score) => {
              const selected = rating === score;
              return (
                <TouchableOpacity
                  key={score}
                  style={[styles.score, selected && styles.scoreSelected]}
                  onPress={() => setRating(score)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.scoreText, selected && styles.scoreTextSelected]}>
                    {score}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.label}>{t('business.tell_us')}</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t('business.how_it_was')}
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>
      </HealthFormScreen>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    form: {
      paddingTop: 22,
      paddingHorizontal: 20,
      paddingBottom: 22,
      gap: 22,
    },
    experience: {
      alignSelf: 'flex-start',
      gap: 16,
    },
    label: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    scores: {
      flexDirection: 'row',
      gap: 4,
    },
    score: {
      width: 42,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreSelected: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    scoreText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      textAlign: 'center',
      color: c.primaryText,
    },
    scoreTextSelected: {
      color: '#F6F7F9',
    },
    description: {
      gap: 6,
    },
    input: {
      height: 108,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: 16,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
  });
