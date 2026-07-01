import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import { usePetOnboardingDraft } from '@/store/petOnboardingDraft';
import { t } from '@/i18n';
import { Colors } from '@/constants/theme';
import {
  PET_NAME_STEP,
} from '@/constants/petOnboarding';
import { getPetOnboardingScale, scaleOffset } from '@/utils/petOnboardingScale';

const collarImage = require('@/assets/images/pet-onboarding-collar.png');

const PET_NAME_REGEX = /^[\p{L}]+$/u;

function isValidPetName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && PET_NAME_REGEX.test(trimmed);
}

export default function PetNameOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { sx, sy, cardPaddingTop } = getPetOnboardingScale(
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

  const handleDone = () => {
    if (!canContinue) return;
    setName(name.trim());
    router.push('/(onboarding)/type' as never);
  };

  const cardRadius = PET_NAME_STEP.cardRadius * sx;
  const collarSize = PET_NAME_STEP.collarSize * sx;

  const doneBtnTop = PET_NAME_STEP.doneTop * sy - scaleOffset(87.5, sy);

  const doneBtnStyle = {
    top: doneBtnTop,
    left: PET_NAME_STEP.doneLeft * sx,
    width: PET_NAME_STEP.doneWidth * sx,
    height: PET_NAME_STEP.doneHeight * sy,
    borderRadius: PET_NAME_STEP.doneRadius * sx,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { marginTop: Math.max(8, PET_NAME_STEP.progressTop * sy - insets.top) }]}>
          <OnboardingProgressDots currentStep={1} />
        </View>

        {canContinue ? (
          <Pressable
            onPress={handleDone}
            style={[styles.doneBtn, doneBtnStyle]}
            accessibilityRole="button"
          >
            <Text style={[styles.doneText, { fontSize: 14 * sx }]}>{t('petOnboarding.done')}</Text>
          </Pressable>
        ) : (
          <View
            style={[styles.doneBtn, styles.doneBtnDisabled, doneBtnStyle]}
            pointerEvents="none"
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
          >
            <Text style={[styles.doneText, { fontSize: 14 * sx }]}>{t('petOnboarding.done')}</Text>
          </View>
        )}

        <View
          style={[
            styles.card,
            {
              marginTop: (PET_NAME_STEP.cardTop - PET_NAME_STEP.progressTop - 16) * sy,
              marginHorizontal: PET_NAME_STEP.cardLeft * sx,
              width: PET_NAME_STEP.cardWidth * sx,
              minHeight: PET_NAME_STEP.cardHeight * sy - scaleOffset(45, sy),
              borderRadius: cardRadius,
              paddingHorizontal: PET_NAME_STEP.cardPaddingH * sx,
              paddingTop: cardPaddingTop,
              paddingBottom: PET_NAME_STEP.cardPaddingBottom * sx,
              gap: PET_NAME_STEP.cardGap * sx - scaleOffset(25, sx),
            },
          ]}
        >
          <Image
            source={collarImage}
            style={{ width: collarSize, height: collarSize - scaleOffset(40, sx), alignSelf: 'center' }}
            contentFit="contain"
          />

          <View
            style={[
              styles.copyBlock,
              {
                width: PET_NAME_STEP.copyWidth * sx,
                gap: PET_NAME_STEP.copyGap * sx - scaleOffset(15, sx),
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
              placeholderTextColor={Colors.secondaryText}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              keyboardType="default"
              textContentType="name"
              returnKeyType="done"
              onSubmitEditing={handleDone}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  doneBtn: {
    position: 'absolute',
    zIndex: 2,
    backgroundColor: Colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneText: {
    fontFamily: 'Rubik-Medium',
    color: Colors.surface,
  },
  doneBtnDisabled: {
    opacity: 0.4,
  },
  card: {
    alignSelf: 'center',
    backgroundColor: Colors.surface,
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
  input: {
    fontFamily: 'Rubik-Regular',
    color: Colors.primaryText,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
  },
});
