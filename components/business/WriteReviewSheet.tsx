import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Platform,
  Dimensions,
  useWindowDimensions,
  type KeyboardEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { dismissKeyboard, useKeyboardWindowResized } from '@/components/ui/keyboardUtils';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { savePlaceReview, type PlaceReview } from '@/services/places';

/** Distance from the keyboard top to the bottom of the physical screen. */
function keyboardLiftFromEvent(event: KeyboardEvent): number {
  const height = Math.round(event.endCoordinates?.height ?? 0);
  const screenY = event.endCoordinates?.screenY;
  const fromScreen =
    typeof screenY === 'number'
      ? Math.max(0, Math.round(Dimensions.get('screen').height - screenY))
      : 0;
  return Math.max(0, height, fromScreen);
}

function useSheetKeyboardLift(): number {
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (event: KeyboardEvent) => setLift(keyboardLiftFromEvent(event));
    const onHide = () => setLift(0);
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return lift;
}

const SCORES = [1, 2, 3, 4, 5] as const;

interface WriteReviewSheetProps {
  visible: boolean;
  businessId: string;
  initialRating?: number | null;
  initialComment?: string | null;
  onClose: () => void;
  onSaved: (review: PlaceReview) => void;
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
  const { height: windowHeight } = useWindowDimensions();
  const keyboardOverlap = useSheetKeyboardLift();
  const windowResized = useKeyboardWindowResized();
  const keyboardLift = windowResized || keyboardOverlap <= 0 ? 0 : keyboardOverlap;
  const toast = useToast();
  const scrollRef = useRef<ScrollView>(null);
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [comment, setComment] = useState(initialComment ?? '');
  const [saving, setSaving] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64);
  const [footerHeight, setFooterHeight] = useState(88);

  const sheetMaxHeight = windowHeight - keyboardLift - Math.max(insets.top, 12);
  const scrollMaxHeight = Math.max(0, sheetMaxHeight - headerHeight - footerHeight);
  const footerPadBottom = keyboardLift > 0 ? 8 : Math.max(insets.bottom, 16);

  useEffect(() => {
    if (!visible) return;
    setRating(initialRating ?? null);
    setComment(initialComment ?? '');
  }, [visible, initialRating, initialComment]);

  useEffect(() => {
    if (keyboardLift <= 0) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [keyboardLift]);

  const save = async () => {
    if (!rating || saving) return;
    dismissKeyboard();
    try {
      setSaving(true);
      const saved = await savePlaceReview(businessId, { rating, comment });
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { maxHeight: sheetMaxHeight, marginBottom: keyboardLift }]}>
        <View
          style={styles.header}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.height);
            setHeaderHeight((current) => (current === next ? current : next));
          }}
        >
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

        <ScrollView
          ref={scrollRef}
          style={{ maxHeight: scrollMaxHeight }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
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
              onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
            />
          </View>
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: footerPadBottom }]}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.height);
            setFooterHeight((current) => (current === next ? current : next));
          }}
        >
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
