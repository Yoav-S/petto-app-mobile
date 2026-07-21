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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import { usePetOnboardingDraft } from '@/store/petOnboardingDraft';
import { useActivePet } from '@/store/petStore';
import { createPet } from '@/services/pets';
import { uploadPetPhoto } from '@/services/storage';
import { setOnboardingComplete } from '@/services/onboarding';
import { getErrorMessage } from '@/services/errors';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { PET_BIRTH_STEP } from '@/constants/petOnboarding';
import { getPetOnboardingScale, scaleOffset } from '@/utils/petOnboardingScale';
import { parseIsoDate } from '@/utils/calendar';

const calendarImage = require('@/assets/images/pet-onboarding-calendar.png');

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
  const { sx, sy, cardPaddingTop } = getPetOnboardingScale(
    width,
    height,
    insets.top,
    insets.bottom,
  );

  const { draft, setBirthDate } = usePetOnboardingDraft();
  const { setActivePetId } = useActivePet();

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

  const handleFinish = async () => {
    if (!draft.name || !draft.type) {
      Alert.alert(t('petOnboarding.birth_missing_data'));
      return;
    }

    setIsSubmitting(true);
    setBirthDate(birthDate);

    try {
      let photoUrl: string | null = null;
      if (draft.photoUri) {
        photoUrl = await uploadPetPhoto(draft.photoUri);
      }

      const pet = await createPet({
        name: draft.name,
        type: draft.type,
        birth_date: birthDate,
        photo_url: photoUrl,
      });
      await setOnboardingComplete();
      setActivePetId(pet.id);
      router.replace('/(tabs)' as never);
    } catch (err: unknown) {
      Alert.alert(t('errors.load_failed'), getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
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
            marginTop: Math.max(8, PET_BIRTH_STEP.progressTop * sy - insets.top),
            paddingHorizontal: PET_BIRTH_STEP.cardLeft * sx,
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={[styles.backBtn, { width: 40 * sx, height: 40 * sy }]}
          accessibilityRole="button"
          accessibilityLabel={t('petOnboarding.back')}
        >
          <Ionicons name="chevron-back" size={24 * sx} color={colors.primaryText} />
        </Pressable>

        <View style={styles.headerCenter}>
          <OnboardingProgressDots currentStep={4} />
        </View>

        <View style={[styles.backBtn, { width: 40 * sx }]} />
      </View>

      <View style={styles.flex}>
        <View
          style={[
            styles.card,
            {
              marginTop: (PET_BIRTH_STEP.cardTop - PET_BIRTH_STEP.progressTop - 40) * sy,
              marginHorizontal: PET_BIRTH_STEP.cardLeft * sx,
              width: PET_BIRTH_STEP.cardWidth * sx,
              minHeight: PET_BIRTH_STEP.cardHeight * sy - scaleOffset(45, sy),
              borderRadius: PET_BIRTH_STEP.cardRadius * sx,
              paddingHorizontal: PET_BIRTH_STEP.cardPaddingH * sx,
              paddingTop: cardPaddingTop,
              paddingBottom: PET_BIRTH_STEP.cardPaddingBottom * sy,
              gap: PET_BIRTH_STEP.cardGap * sx - scaleOffset(25, sx),
            },
          ]}
        >
          <View
            style={{
              width: PET_BIRTH_STEP.heroSize * sx,
              height: PET_BIRTH_STEP.heroSize * sy - scaleOffset(40, sx),
              alignSelf: 'center',
            }}
          >
            <Image
              source={calendarImage}
              style={{
                position: 'absolute',
                top: PET_BIRTH_STEP.heroImageTop * sy,
                left: PET_BIRTH_STEP.heroImageLeft * sx,
                width: PET_BIRTH_STEP.heroImageWidth * sx,
                height: PET_BIRTH_STEP.heroImageHeight * sy,
              }}
              contentFit="contain"
            />
          </View>

          <View
            style={[
              styles.copyBlock,
              {
                width: PET_BIRTH_STEP.copyWidth * sx,
                gap: PET_BIRTH_STEP.copyGap * sy - scaleOffset(15, sy),
              },
            ]}
          >
            <View style={{ gap: PET_BIRTH_STEP.titleBlockGap * sy }}>
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: PET_BIRTH_STEP.titleSize * sx,
                    lineHeight: PET_BIRTH_STEP.titleLine * sx,
                  },
                ]}
              >
                {t('petOnboarding.birth_title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: PET_BIRTH_STEP.subtitleSize * sx,
                    lineHeight: PET_BIRTH_STEP.subtitleLine * sy,
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
                  width: PET_BIRTH_STEP.selectBtnWidth * sx,
                  height: PET_BIRTH_STEP.selectBtnHeight * sy,
                  borderRadius: PET_BIRTH_STEP.selectBtnRadius * sx,
                  paddingHorizontal: 16 * sx,
                  paddingVertical: 12 * sy,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.selectBtnText,
                  {
                    fontSize: 16 * sx,
                    lineHeight: 24 * sy,
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
            paddingHorizontal: PET_BIRTH_STEP.continuePaddingH * sx,
            paddingBottom: Math.max(insets.bottom, 16 * sy),
            paddingTop: 8 * sy,
          },
        ]}
      >
        <Pressable
          onPress={handleFinish}
          disabled={isSubmitting}
          style={[
            styles.continueBtn,
            {
              width: PET_BIRTH_STEP.continueBtnWidth * sx,
              height: PET_BIRTH_STEP.continueBtnHeight * sy,
              borderRadius: PET_BIRTH_STEP.continueBtnRadius * sx,
              opacity: isSubmitting ? 0.6 : 1,
            },
          ]}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={[styles.continueText, { fontSize: 16 * sx, lineHeight: 24 * sy }]}>
              {t('onboarding.continue')}
            </Text>
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
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '400',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  continueBtn: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  continueText: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    color: c.surface,
    textAlign: 'center',
  },
});
