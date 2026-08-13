import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import { OnboardingCollar } from '@/components/brand/onboarding';
import { HealthKeyboardAvoidingView } from '@/components/health/HealthKeyboardFooter';
import { usePetOnboardingDraft } from '@/store/petOnboardingDraft';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { PET_NAME_STEP } from '@/constants/petOnboarding';
import { getPetOnboardingScale } from '@/utils/petOnboardingScale';

const PET_NAME_REGEX = /^[\p{L}]+$/u;

function isValidPetName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && PET_NAME_REGEX.test(trimmed);
}

export default function PetNameOnboardingScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { sx, sy } = getPetOnboardingScale(
    width,
    height,
    insets.top,
    insets.bottom,
  );
  const inputRef = useRef<TextInput>(null);

  const { draft, setName } = usePetOnboardingDraft();
  const [name, setLocalName] = useState(draft.name);

  const canContinue = isValidPetName(name);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }, []),
  );

  const handleNameChange = (text: string) => {
    const lettersOnly = text.replace(/[^\p{L}]/gu, '');
    setLocalName(lettersOnly);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    setName(name.trim());
    router.push('/(onboarding)/type' as never);
  };

  const cardRadius = PET_NAME_STEP.cardRadius * sx;
  const heroW = PET_NAME_STEP.heroWidth * sx;
  const heroH = PET_NAME_STEP.heroHeight * sx;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Sticky Continue at screen bottom; Done chip floats on keyboard (same as other forms). */}
      <HealthKeyboardAvoidingView>
        <View
          style={[
            styles.header,
            {
              marginTop: Math.max(8, PET_NAME_STEP.progressTop * sy - insets.top),
              paddingHorizontal: PET_NAME_STEP.cardLeft * sx,
            },
          ]}
        >
          <View style={styles.headerSide} />
          <View style={styles.headerCenter}>
            <OnboardingProgressDots currentStep={1} />
          </View>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.flex}>
          <View
            style={[
              styles.card,
              {
                marginTop: (PET_NAME_STEP.cardTop - PET_NAME_STEP.progressTop - 16) * sy,
                marginHorizontal: PET_NAME_STEP.cardLeft * sx,
                width: PET_NAME_STEP.cardWidth * sx,
                minHeight: PET_NAME_STEP.cardHeight * sy,
                borderRadius: cardRadius,
                paddingHorizontal: PET_NAME_STEP.cardPaddingH * sx,
                paddingTop: PET_NAME_STEP.cardPaddingTop * sy,
                paddingBottom: PET_NAME_STEP.cardPaddingBottom * sy,
                gap: PET_NAME_STEP.cardGap * sx,
              },
            ]}
          >
            <View style={{ alignSelf: 'center' }}>
              <OnboardingCollar width={heroW} height={heroH} />
            </View>

            <View
              style={[
                styles.copyBlock,
                {
                  width: PET_NAME_STEP.copyWidth * sx,
                  gap: PET_NAME_STEP.copyGap * sx,
                },
              ]}
            >
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: PET_NAME_STEP.titleSize * sx,
                    lineHeight: PET_NAME_STEP.titleLine * sx,
                  },
                ]}
              >
                {t('petOnboarding.name_title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: PET_NAME_STEP.subtitleSize * sx,
                    lineHeight: PET_NAME_STEP.subtitleLine * sx,
                  },
                ]}
              >
                {t('petOnboarding.name_subtitle')}
              </Text>

              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    width: PET_NAME_STEP.inputWidth * sx,
                    height: PET_NAME_STEP.inputHeight * sy,
                    borderRadius: PET_NAME_STEP.inputRadius * sx,
                    fontSize: 16 * sx,
                  },
                ]}
                value={name}
                onChangeText={handleNameChange}
                placeholder={t('petOnboarding.name_placeholder')}
                placeholderTextColor={colors.secondaryText}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                keyboardType="default"
                textContentType="name"
                returnKeyType="next"
                textAlign="left"
                onSubmitEditing={handleContinue}
              />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: 20 * sx,
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
                width: 335 * sx,
                height: 48 * sy,
                borderRadius: 12 * sx,
              },
              !canContinue && styles.continueBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
          >
            <Text style={[styles.continueText, { fontSize: 16 * sx, lineHeight: 24 * sy }]}>
              {t('onboarding.continue')}
            </Text>
          </Pressable>
        </View>
      </HealthKeyboardAvoidingView>
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
      minHeight: 32,
    },
    headerSide: {
      width: 32,
      height: 32,
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
      width: '100%',
    },
    title: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: c.primaryText,
      textAlign: 'left',
      alignSelf: 'stretch',
    },
    subtitle: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: c.secondaryText,
      textAlign: 'left',
      alignSelf: 'stretch',
    },
    input: {
      fontFamily: 'Rubik-Regular',
      color: c.primaryText,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
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
