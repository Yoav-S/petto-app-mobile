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
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { PET_TYPE_STEP } from '@/constants/petOnboarding';
import { getPetOnboardingScale } from '@/utils/petOnboardingScale';

export default function PetTypeOnboardingScreen() {
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

  const { draft, setType } = usePetOnboardingDraft();
  const [selected, setSelected] = useState<PetType | null>(draft.type);

  const canContinue = selected !== null;
  const tileWidth =
    (Math.max(0, contentWidth - PET_TYPE_STEP.cardPaddingH * 2) - PET_TYPE_STEP.pickerGap) / 2;

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
            marginTop: Math.max(8, PET_TYPE_STEP.progressTop - insets.top),
            paddingHorizontal: PET_TYPE_STEP.cardLeft,
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
              marginTop: PET_TYPE_STEP.cardTop - PET_TYPE_STEP.progressTop - 40,
              marginHorizontal: PET_TYPE_STEP.cardLeft,
              width: contentWidth,
              minHeight: PET_TYPE_STEP.cardHeight,
              borderRadius: PET_TYPE_STEP.cardRadius,
              paddingHorizontal: PET_TYPE_STEP.cardPaddingH,
              paddingTop: PET_TYPE_STEP.cardPaddingTop,
              paddingBottom: PET_TYPE_STEP.cardPaddingBottom,
              gap: PET_TYPE_STEP.cardGap,
            },
          ]}
        >
          <View style={{ alignSelf: 'center' }}>
            <OnboardingBed
              width={PET_TYPE_STEP.bedWidth}
              height={PET_TYPE_STEP.bedHeight}
            />
          </View>

          <Text
            style={[
              styles.title,
              {
                width: '100%',
                fontSize: PET_TYPE_STEP.titleSize,
                lineHeight: PET_TYPE_STEP.titleLine,
              },
            ]}
          >
            {t('petOnboarding.type_title')}
          </Text>

          <View
            style={[
              styles.pickerRow,
              {
                width: '100%',
                gap: PET_TYPE_STEP.pickerGap,
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
                      borderRadius: Radius.md,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? colors.brand : colors.border,
                      paddingVertical: Spacing.md,
                      gap: Spacing.sm,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={label}
                >
                  <PetIcon width={PET_TYPE_STEP.petIconWidth} height={PET_TYPE_STEP.petIconHeight} />
                  <Text style={styles.petLabel}>{label}</Text>
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
            paddingHorizontal: PET_TYPE_STEP.continuePaddingH,
            paddingBottom: Math.max(insets.bottom, 10) + Spacing.sm,
            paddingTop: Spacing.md,
            borderTopLeftRadius: Radius.xl,
            borderTopRightRadius: Radius.xl,
          },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={[
            styles.continueBtn,
            {
              width: contentWidth,
              height: PET_TYPE_STEP.continueBtnHeight,
              borderRadius: PET_TYPE_STEP.continueBtnRadius,
            },
            !canContinue && styles.continueBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
        >
          <Text style={styles.continueText}>{t('onboarding.continue')}</Text>
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
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
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
      fontSize: 16,
      lineHeight: 24,
      color: c.button.primaryText,
      textAlign: 'center',
    },
  });
