import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Alert,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import OnboardingBackButton from '@/components/onboarding/OnboardingBackButton';
import { OnboardingPhotoAdd } from '@/components/brand/onboarding';
import { pickImageFromCamera, pickImageFromLibrary } from '@/services/imagePicker';
import { usePetOnboardingDraft } from '@/store/petOnboardingDraft';
import { t } from '@/i18n';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { PET_PHOTO_STEP, PET_PHOTO_SHEET } from '@/constants/petOnboarding';
import { getPetOnboardingScale, scaleOffset } from '@/utils/petOnboardingScale';

export default function PetPhotoOnboardingScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { sx, sy } = getPetOnboardingScale(width, height, insets.top, insets.bottom);

  const { draft, setPhotoUri } = usePetOnboardingDraft();
  const [photoUri, setLocalPhotoUri] = useState<string | null>(draft.photoUri);
  const [sheetVisible, setSheetVisible] = useState(false);

  const outerSize = PET_PHOTO_STEP.photoOuterSize * sx;
  const innerSize = PET_PHOTO_STEP.photoInnerSize * sx;
  const innerOffset = PET_PHOTO_STEP.photoInnerOffset * sx;
  const innerRadius = PET_PHOTO_STEP.photoInnerRadius * sx;

  const sheetHeight = PET_PHOTO_SHEET.height * sy;

  const closeSheet = () => setSheetVisible(false);

  const applyPickedImage = (uri: string) => {
    setLocalPhotoUri(uri);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    // Close sheet before presenting system picker — iOS double-opens otherwise.
    closeSheet();
    const options = { allowsEditing: true, aspect: [1, 1] as [number, number] };
    const picked =
      source === 'camera'
        ? await pickImageFromCamera(options)
        : await pickImageFromLibrary(options);
    if (picked === 'denied') {
      Alert.alert(
        source === 'camera'
          ? t('petOnboarding.photo_camera_permission_title')
          : t('petOnboarding.photo_permission_title'),
        source === 'camera'
          ? t('petOnboarding.photo_camera_permission_body')
          : t('petOnboarding.photo_permission_body'),
      );
      return;
    }
    if (picked?.uri) applyPickedImage(picked.uri);
  };

  const handleOpenSheet = () => {
    setSheetVisible(true);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    setPhotoUri(photoUri);
    router.push('/(onboarding)/birth' as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View
        style={[
          styles.header,
          {
            marginTop: Math.max(8, PET_PHOTO_STEP.progressTop * sy - insets.top),
            paddingHorizontal: PET_PHOTO_STEP.cardLeft * sx,
          },
        ]}
      >
        <OnboardingBackButton onPress={handleBack} />

        <View style={styles.headerCenter}>
          <OnboardingProgressDots currentStep={3} />
        </View>

        <View style={{ width: 32 }} />
      </View>

      <View style={styles.flex}>
        <View
          style={[
            styles.card,
            {
              marginTop: (PET_PHOTO_STEP.cardTop - PET_PHOTO_STEP.progressTop - 40) * sy,
              marginHorizontal: PET_PHOTO_STEP.cardLeft * sx,
              width: PET_PHOTO_STEP.cardWidth * sx,
              minHeight: PET_PHOTO_STEP.cardHeight * sy - scaleOffset(20, sy),
              borderRadius: PET_PHOTO_STEP.cardRadius * sx,
              paddingTop: PET_PHOTO_STEP.cardPaddingTop * sy,
              paddingHorizontal: PET_PHOTO_STEP.cardPaddingH * sx,
              paddingBottom: PET_PHOTO_STEP.cardPaddingBottom * sy,
              gap: PET_PHOTO_STEP.cardGap * sx,
            },
          ]}
        >
          <View
            style={[
              styles.inner,
              {
                width: PET_PHOTO_STEP.innerWidth * sx,
                gap: PET_PHOTO_STEP.innerGap * sx,
              },
            ]}
          >
            <View style={[styles.copyBlock, { width: PET_PHOTO_STEP.copyWidth * sx, gap: PET_PHOTO_STEP.copyGap * sy }]}>
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: PET_PHOTO_STEP.titleSize * sx,
                    lineHeight: PET_PHOTO_STEP.titleLine * sx,
                  },
                ]}
              >
                {t('petOnboarding.photo_title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: PET_PHOTO_STEP.subtitleSize * sx,
                    lineHeight: PET_PHOTO_STEP.subtitleLine * sx,
                  },
                ]}
              >
                {t('petOnboarding.photo_subtitle')}
              </Text>
            </View>

            <Pressable
              onPress={handleOpenSheet}
              style={{ width: outerSize, height: outerSize, alignSelf: 'center' }}
              accessibilityRole="button"
              accessibilityLabel={t('petOnboarding.photo_add_a11y')}
            >
              {photoUri ? (
                <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
                  <Image
                    source={{ uri: photoUri }}
                    style={{
                      width: innerSize,
                      height: innerSize,
                      borderRadius: innerRadius,
                      position: 'absolute',
                      top: innerOffset,
                      left: innerOffset,
                    }}
                    contentFit="cover"
                  />
                </View>
              ) : (
                <OnboardingPhotoAdd width={outerSize} height={outerSize} />
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: PET_PHOTO_STEP.continuePaddingH * sx,
            paddingBottom: Math.max(insets.bottom, 10 * sy) + 8 * sy,
            paddingTop: 12 * sy,
            borderTopLeftRadius: 24 * sx,
            borderTopRightRadius: 24 * sx,
          },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          style={[
            styles.continueBtn,
            {
              width: PET_PHOTO_STEP.continueBtnWidth * sx,
              height: PET_PHOTO_STEP.continueBtnHeight * sy,
              borderRadius: PET_PHOTO_STEP.continueBtnRadius * sx,
            },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.continueText, { fontSize: 16 * sx, lineHeight: 24 * sx }]}>
            {t('onboarding.continue')}
          </Text>
        </Pressable>
      </View>

      <BottomSheetModal visible={sheetVisible} onClose={closeSheet}>
          <View
            style={[
              styles.sheet,
              {
                height: sheetHeight + insets.bottom,
                paddingBottom: insets.bottom,
                borderTopLeftRadius: PET_PHOTO_SHEET.radius * sx,
                borderTopRightRadius: PET_PHOTO_SHEET.radius * sx,
              },
            ]}
          >
            <View
              style={[
                styles.sheetTitleRow,
                {
                  height: PET_PHOTO_SHEET.titleRowHeight * sy,
                  marginTop: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                },
              ]}
            >
              <View style={styles.sheetTitleSpacer} />
              <Text
                style={[
                  styles.sheetTitle,
                  { fontSize: PET_PHOTO_SHEET.optionFontSize * sx, lineHeight: PET_PHOTO_SHEET.optionLineHeight * sy },
                ]}
              >
                {t('petOnboarding.photo_sheet_title')}
              </Text>
              <Pressable
                onPress={closeSheet}
                hitSlop={12}
                style={[
                  styles.sheetCloseBtn,
                  {
                    width: PET_PHOTO_SHEET.closeSize * sx,
                    height: PET_PHOTO_SHEET.closeSize * sx,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('petOnboarding.photo_close_a11y')}
              >
                <Ionicons name="close" size={PET_PHOTO_SHEET.closeSize * sx} color={colors.primaryText} />
              </Pressable>
            </View>

            <View style={styles.sheetBody}>
              <View
                style={[
                  styles.sheetOptions,
                  {
                    width: PET_PHOTO_SHEET.optionsWidth * sx,
                    minHeight: PET_PHOTO_SHEET.optionsHeight * sy,
                    borderRadius: PET_PHOTO_SHEET.optionsRadius * sx,
                    padding: PET_PHOTO_SHEET.optionsPadding * sx,
                    gap: PET_PHOTO_SHEET.optionsGap * sy,
                  },
                ]}
              >
                <Pressable onPress={() => pickImage('camera')} style={styles.sheetOptionRow}>
                  <Text
                    style={[
                      styles.sheetOptionText,
                      { fontSize: PET_PHOTO_SHEET.optionFontSize * sx, lineHeight: PET_PHOTO_SHEET.optionLineHeight * sy },
                    ]}
                  >
                    {t('petOnboarding.photo_take')}
                  </Text>
                </Pressable>
                <View style={[styles.sheetDivider, { marginHorizontal: PET_PHOTO_SHEET.optionsPadding * sx }]} />
                <Pressable onPress={() => pickImage('library')} style={styles.sheetOptionRow}>
                  <Text
                    style={[
                      styles.sheetOptionText,
                      { fontSize: PET_PHOTO_SHEET.optionFontSize * sx, lineHeight: PET_PHOTO_SHEET.optionLineHeight * sy },
                    ]}
                  >
                    {t('petOnboarding.photo_choose_library')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.sheetCancelSection,
                {
                  height: PET_PHOTO_SHEET.cancelSectionHeight * sy,
                  gap: PET_PHOTO_SHEET.cancelGap * sy,
                },
              ]}
            >
              <Pressable onPress={closeSheet} style={styles.sheetCancelBtn}>
                <Text
                  style={[
                    styles.sheetCancelText,
                    { fontSize: PET_PHOTO_SHEET.cancelFontSize * sx, lineHeight: PET_PHOTO_SHEET.cancelLineHeight * sy },
                  ]}
                >
                  {t('petOnboarding.photo_cancel')}
                </Text>
              </Pressable>
            </View>
          </View>
      </BottomSheetModal>
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
  inner: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  copyBlock: {
    alignSelf: 'center',
    alignItems: 'stretch',
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
  continueText: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    color: c.button.primaryText,
    textAlign: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: c.panel,
    alignItems: 'center',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  sheetTitleSpacer: {
    width: 24,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: c.primaryText,
    textAlign: 'center',
  },
  sheetCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptions: {
    backgroundColor: c.surface,
    alignSelf: 'center',
  },
  sheetOptionRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  sheetOptionText: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: c.primaryText,
    textAlign: 'center',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: c.border,
  },
  sheetCancelSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  sheetCancelText: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    color: c.primaryText,
    textAlign: 'center',
  },
});
