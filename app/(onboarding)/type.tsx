import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import { usePetOnboardingDraft, type PetType } from '@/store/petOnboardingDraft';
import { t } from '@/i18n';
import { Colors } from '@/constants/theme';
import { PET_TYPE_STEP } from '@/constants/petOnboarding';
import { getPetOnboardingScale, scaleOffset } from '@/utils/petOnboardingScale';

const bedImage = require('@/assets/images/pet-onboarding-bed.png');
const dogImage = require('@/assets/images/pet-onboarding-dog.png');
const catImage = require('@/assets/images/pet-onboarding-cat.png');

const DISABLED_BTN_BG = '#D1D5DB';

export default function PetTypeOnboardingScreen() {
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
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={[styles.backBtn, { width: 40 * sx, height: 40 * sy }]}
          accessibilityRole="button"
          accessibilityLabel={t('petOnboarding.back')}
        >
          <Ionicons name="chevron-back" size={24 * sx} color={Colors.primaryText} />
        </Pressable>

        <View style={styles.headerCenter}>
          <OnboardingProgressDots currentStep={2} />
        </View>

        <View style={[styles.backBtn, { width: 40 * sx }]} />
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
          <Image
            source={bedImage}
            style={{
              width: PET_TYPE_STEP.bedWidth * sx,
              height: PET_TYPE_STEP.bedHeight * sy - scaleOffset(20, sy),
              alignSelf: 'center',
            }}
            contentFit="contain"
          />

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
                height: PET_TYPE_STEP.pickerHeight * sy,
                gap: PET_TYPE_STEP.pickerGap * sx,
              },
            ]}
          >
            {(['dog', 'cat'] as const).map((type) => {
              const isSelected = selected === type;
              const image = type === 'dog' ? dogImage : catImage;
              const label = type === 'dog' ? t('petOnboarding.dog') : t('petOnboarding.cat');

              return (
                <Pressable
                  key={type}
                  onPress={() => handleSelect(type)}
                  style={[
                    styles.petTile,
                    {
                      width: tileWidth,
                      height: PET_TYPE_STEP.pickerHeight * sy,
                      borderRadius: 12 * sx,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? Colors.primaryText : Colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={label}
                >
                  <Image
                    source={image}
                    style={{
                      width: tileWidth - 16 * sx,
                      height: PET_TYPE_STEP.pickerHeight * sy - 32 * sy,
                    }}
                    contentFit="contain"
                  />
                  <Text style={[styles.petLabel, { fontSize: 14 * sx }]}>{label}</Text>
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
            paddingBottom: Math.max(insets.bottom, 16 * sy),
            paddingTop: 8 * sy,
          },
        ]}
      >
        {canContinue ? (
          <Pressable
            onPress={handleContinue}
            style={[
              styles.continueBtn,
              {
                width: PET_TYPE_STEP.continueBtnWidth * sx,
                height: PET_TYPE_STEP.continueBtnHeight * sy,
                borderRadius: PET_TYPE_STEP.continueBtnRadius * sx,
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.continueText, { fontSize: 16 * sx, lineHeight: 24 * sx }]}>
              {t('onboarding.continue')}
            </Text>
          </Pressable>
        ) : (
          <View
            style={[
              styles.continueBtn,
              styles.continueBtnDisabled,
              {
                width: PET_TYPE_STEP.continueBtnWidth * sx,
                height: PET_TYPE_STEP.continueBtnHeight * sy,
                borderRadius: PET_TYPE_STEP.continueBtnRadius * sx,
              },
            ]}
            pointerEvents="none"
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
          >
            <Text style={[styles.continueText, { fontSize: 16 * sx, lineHeight: 24 * sx }]}>
              {t('onboarding.continue')}
            </Text>
          </View>
        )}
      </View>
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: '#1F2937',
    textAlign: 'center',
    alignSelf: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  petTile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 8,
  },
  petLabel: {
    fontFamily: 'Rubik-Regular',
    color: Colors.primaryText,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
  },
  continueBtn: {
    backgroundColor: Colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  continueBtnDisabled: {
    backgroundColor: DISABLED_BTN_BG,
  },
  continueText: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    color: Colors.surface,
    textAlign: 'center',
  },
});
