import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { savePlaceReview } from '@/services/places';

const SCORES = [1, 2, 3, 4, 5] as const;

interface WriteReviewSheetProps {
  visible: boolean;
  businessId: string;
  initialRating?: number | null;
  initialComment?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function WriteReviewSheet({
  visible,
  businessId,
  initialRating,
  initialComment,
  onClose,
  onSaved,
}: WriteReviewSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [comment, setComment] = useState(initialComment ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setRating(initialRating ?? null);
    setComment(initialComment ?? '');
  }, [visible, initialRating, initialComment]);

  const save = async () => {
    if (!rating || saving) return;
    try {
      setSaving(true);
      await savePlaceReview(businessId, { rating, comment });
      onSaved();
      onClose();
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerSide} />
            <Text style={styles.title}>{t('business.write_review')}</Text>
            <TouchableOpacity
              style={styles.close}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('petOnboarding.photo_close_a11y')}
            >
              <Ionicons name="close" size={20} color={colors.primaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
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
          </View>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[styles.save, !rating && styles.saveDisabled]}
              disabled={!rating || saving}
              onPress={() => void save()}
            >
              {saving ? (
                <ActivityIndicator color="#F6F7F9" />
              ) : (
                <Text style={styles.saveLabel}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    header: {
      paddingTop: 32,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSide: {
      width: 32,
      height: 32,
    },
    title: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      textAlign: 'center',
      color: c.primaryText,
    },
    close: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
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
    footer: {
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
    save: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveDisabled: {
      opacity: 0.5,
    },
    saveLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: '#F6F7F9',
    },
  });
