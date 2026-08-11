import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import OnboardingBackButton from '@/components/onboarding/OnboardingBackButton';
import { OnboardingBed, OnboardingCat, OnboardingDog } from '@/components/brand/onboarding';
import { usePetOnboardingDraft, type PetType } from '@/store/petOnboardingDraft';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { PET_TYPE_STEP } from '@/constants/petOnboarding';
import { getPetOnboardingScale, scaleOffset } from '@/utils/petOnboardingScale';

export default function PetTypeOnboardingScreen() {
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

  const { draft, setType } = usePetOnboardingDraft();
  const [selected, setSelected] = useState<PetType | null>(draft.type);

  const canContinue = selected !== null;
  const tileWidth = (PET_TYPE_STEP.pickerWidth * sx - PET_TYPE_STEP.pickerGap * sx) / 2;
  const iconSize = 106 * sx;

  const handleSelect = (type: PetType) => {
    setSelected(type);
  };

  const handleContinue = () => {
    if (!selected) return;
    setType(selected);
    router.push('/(onboarding)/photo' as never);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View
        style={[
          styles.header,
          {
            marginTop: Math.max(8, PET_TYPE_STEP.progressTop * sy - insets.top),
            paddingHorizontal: PET_TYPE_STEP.cardLeft * sx,
          },
        ]}
      >
        <OnboardingBackButton onPress={handleBack} />

        <View style={styles.headerCenter}>
          <OnboardingProgressDots currentStep={2} />
        </View>

        <View style={{ width: 32 }} />
      </View>

      <View style={styles.flex}>
        <View
          style={[
            styles.card,
            {
              marginTop: (PET_TYPE_STEP.cardTop - PET_TYPE_STEP.progressTop - 40) * sy,
              marginHorizontal: PET_TYPE_STEP.cardLeft * sx,
              width: PET_TYPE_STEP.cardWidth * sx,
              minHeight: PET_TYPE_STEP.cardHeight * sy - scaleOffset(45, sy),
              borderRadius: PET_TYPE_STEP.cardRadius * sx,
              paddingHorizontal: PET_TYPE_STEP.cardPaddingH * sx,
              paddingTop: cardPaddingTop,
              paddingBottom: PET_TYPE_STEP.cardPaddingBottom * sy,
              gap: PET_TYPE_STEP.cardGap * sx - scaleOffset(25, sx),
            },
          ]}
        >
          <View style={{ alignSelf: 'center' }}>
            <OnboardingBed
              width={PET_TYPE_STEP.bedWidth * sx}
              height={PET_TYPE_STEP.bedHeight * sy - scaleOffset(20, sy)}
            />
          </View>

          <Text
            style={[
              styles.title,
              {
                width: PET_TYPE_STEP.copyWidth * sx,
                fontSize: PET_TYPE_STEP.titleSize * sx,
                lineHeight: PET_TYPE_STEP.titleLine * sx,
              },
            ]}
          >
            {t('petOnboarding.type_title')}
          </Text>

          <View
            style={[
              styles.pickerRow,
              {
                width: PET_TYPE_STEP.pickerWidth * sx,
                gap: PET_TYPE_STEP.pickerGap * sx,
              },
            ]}
          >
            {(['dog', 'cat'] as const).map((type) => {
              const isSelected = selected === type;
              const PetIcon = type === 'dog' ? OnboardingDog : OnboardingCat;
              const label = type === 'dog' ? t('petOnboarding.dog') : t('petOnboarding.cat');

              return (
                <Pressable
                  key={type}
                  onPress={() => handleSelect(type)}
                  style={[
                    styles.petTile,
                    {
                      width: tileWidth,
                      borderRadius: 12 * sx,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? colors.brand : colors.border,
                      paddingVertical: 12 * sy,
                      gap: 8 * sy,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={label}
                >
                  <PetIcon width={iconSize} height={iconSize} />
                  <Text
                    style={[
                      styles.petLabel,
                      {
                        width: 106 * sx,
                        height: 20 * sy,
                        fontSize: 16 * sx,
                        lineHeight: 20 * sy,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: PET_TYPE_STEP.continuePaddingH * sx,
            paddingBottom: Math.max(insets.bottom, 10 * sy) + 8 * sy,
            paddingTop: 12 * sy,
            borderTopLeftRadius: 24 * sx,
            borderTopRightRadius: 24 * sx,
          },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={[
            styles.continueBtn,
            {
              width: PET_TYPE_STEP.continueBtnWidth * sx,
              height: PET_TYPE_STEP.continueBtnHeight * sy,
              borderRadius: PET_TYPE_STEP.continueBtnRadius * sx,
            },
            !canContinue && styles.continueBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
        >
          <Text style={[styles.continueText, { fontSize: 16 * sx, lineHeight: 24 * sx }]}>
            {t('onboarding.continue')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
    title: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: c.primaryText,
      textAlign: 'left',
      alignSelf: 'stretch',
    },
    pickerRow: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    petTile: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    petLabel: {
      fontFamily: 'Rubik-Medium',
      fontWeight: '500',
      color: '#1F2937',
      textAlign: 'center',
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
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    continueBtnDisabled: {
      backgroundColor: c.button.disabledBg,
    },
    continueText: {
      fontFamily: 'Rubik-Medium',
      fontWeight: '500',
      color: c.button.primaryText,
      textAlign: 'center',
    },
  });
