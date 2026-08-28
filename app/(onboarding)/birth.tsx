import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import OnboardingBackButton from '@/components/onboarding/OnboardingBackButton';
import OnboardingSkipButton from '@/components/onboarding/OnboardingSkipButton';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import { OnboardingCalendar } from '@/components/brand/onboarding';
import { usePetOnboardingDraft } from '@/store/petOnboardingDraft';
import { useActivePet } from '@/store/petStore';
import { createPet } from '@/services/pets';
import { uploadPetPhoto } from '@/services/storage';
import { setOnboardingComplete } from '@/services/onboarding';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/services/errors';
import { t } from '@/i18n';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { PET_BIRTH_STEP } from '@/constants/petOnboarding';
import { getPetOnboardingScale } from '@/utils/petOnboardingScale';
import { parseIsoDate } from '@/utils/calendar';

function formatDisplayDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PetBirthOnboardingScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { contentWidth } = getPetOnboardingScale(
    width,
    height,
    insets.top,
    insets.bottom,
  );

  const { draft, setBirthDate } = usePetOnboardingDraft();
  const { setActivePetId } = useActivePet();
  const { markHasPets } = useAuth();

  const [birthDate, setLocalBirthDate] = useState<string | null>(draft.birthDate);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleOpenSheet = () => {
    setSheetVisible(true);
  };

  const handleConfirmDate = (isoDate: string) => {
    setLocalBirthDate(isoDate);
    setSheetVisible(false);
  };

  const completeOnboarding = async (date: string | null) => {
    if (!draft.name || !draft.type) {
      Alert.alert(t('petOnboarding.birth_missing_data'));
      return;
    }

    setIsSubmitting(true);
    setBirthDate(date);

    try {
      let photoUrl: string | null = null;
      if (draft.photoUri) {
        photoUrl = await uploadPetPhoto(draft.photoUri);
      }

      const pet = await createPet({
        name: draft.name,
        type: draft.type,
        birth_date: date,
        photo_url: photoUrl,
      });
      await setOnboardingComplete();
      markHasPets();
      setActivePetId(pet.id);
      router.replace('/(tabs)' as never);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      if (message === t('errors.premium_required_pet')) {
        Alert.alert(t('settings.limit_pet_title'), message, [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.upgrade'),
            onPress: () => router.push('/settings/subscription' as never),
          },
        ]);
      } else {
        Alert.alert(t('errors.load_failed'), message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    void completeOnboarding(birthDate);
  };

  const handleSkip = () => {
    if (isSubmitting) return;
    void completeOnboarding(null);
  };

  const selectLabel = birthDate
    ? formatDisplayDate(birthDate)
    : t('petOnboarding.birth_select');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View
        style={[
          styles.header,
          {
            marginTop: Math.max(8, PET_BIRTH_STEP.progressTop - insets.top),
            paddingHorizontal: PET_BIRTH_STEP.cardLeft,
          },
        ]}
      >
        <OnboardingBackButton onPress={handleBack} />

        <View style={styles.headerCenter}>
          <OnboardingProgressDots currentStep={4} />
        </View>

        <OnboardingSkipButton onPress={handleSkip} />
      </View>

      <View style={styles.flex}>
        <View
          style={[
            styles.card,
            {
              marginTop: PET_BIRTH_STEP.cardTop - PET_BIRTH_STEP.progressTop - 40,
              marginHorizontal: PET_BIRTH_STEP.cardLeft,
              width: contentWidth,
              minHeight: PET_BIRTH_STEP.cardHeight,
              borderRadius: PET_BIRTH_STEP.cardRadius,
              paddingHorizontal: PET_BIRTH_STEP.cardPaddingH,
              paddingTop: PET_BIRTH_STEP.cardPaddingTop,
              paddingBottom: PET_BIRTH_STEP.cardPaddingBottom,
              gap: PET_BIRTH_STEP.cardGap,
            },
          ]}
        >
          <View style={{ alignSelf: 'center' }}>
            <OnboardingCalendar
              width={PET_BIRTH_STEP.heroWidth}
              height={PET_BIRTH_STEP.heroHeight}
            />
          </View>

          <View
            style={[
              styles.copyBlock,
              {
                width: '100%',
                gap: PET_BIRTH_STEP.copyGap,
              },
            ]}
          >
            <View style={{ gap: PET_BIRTH_STEP.titleBlockGap }}>
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: PET_BIRTH_STEP.titleSize,
                    lineHeight: PET_BIRTH_STEP.titleLine,
                  },
                ]}
              >
                {t('petOnboarding.birth_title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: PET_BIRTH_STEP.subtitleSize,
                    lineHeight: PET_BIRTH_STEP.subtitleLine,
                  },
                ]}
              >
                {t('petOnboarding.birth_subtitle')}
              </Text>
            </View>

            <Pressable
              onPress={handleOpenSheet}
              style={[
                styles.selectBtn,
                {
                  width: '100%',
                  height: PET_BIRTH_STEP.selectBtnHeight,
                  borderRadius: PET_BIRTH_STEP.selectBtnRadius,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.md,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.selectBtnText,
                  {
                    fontSize: 16,
                    lineHeight: 24,
                    color: birthDate ? colors.primaryText : colors.secondaryText,
                  },
                ]}
              >
                {selectLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: PET_BIRTH_STEP.continuePaddingH,
            paddingBottom: Math.max(insets.bottom, 10) + Spacing.sm,
            paddingTop: Spacing.md,
            borderTopLeftRadius: Radius.xl,
            borderTopRightRadius: Radius.xl,
          },
        ]}
      >
        <Pressable
          onPress={handleFinish}
          disabled={isSubmitting}
          style={[
            styles.continueBtn,
            {
              width: contentWidth,
              height: PET_BIRTH_STEP.continueBtnHeight,
              borderRadius: PET_BIRTH_STEP.continueBtnRadius,
              opacity: isSubmitting ? 0.6 : 1,
            },
          ]}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.continueText}>{t('petOnboarding.finish')}</Text>
          )}
        </Pressable>
      </View>

      <BirthDatePickerSheet
        visible={sheetVisible}
        initialDate={parseIsoDate(birthDate)}
        onClose={() => setSheetVisible(false)}
        onConfirm={handleConfirmDate}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  card: {
    alignSelf: 'center',
    backgroundColor: c.surface,
    alignItems: 'center',
  },
  copyBlock: {
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  title: {
    fontFamily: 'Rubik-Regular',
    color: c.primaryText,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    color: c.secondaryText,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  selectBtnText: {
    fontFamily: 'Rubik-Regular',
    textAlign: 'left',
  },
  footer: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: c.panel,
    shadowColor: '#1E1E1E',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  continueBtn: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  continueText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: c.button.primaryText,
    textAlign: 'center',
  },
});
