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
import OnboardingSkipButton from '@/components/onboarding/OnboardingSkipButton';
import {
  OnboardingPhotoEmpty,
  OnboardingPhotoMask,
  OnboardingDefaultPetPhoto,
} from '@/components/brand/onboarding';
import { pickImageFromCamera, pickImageFromLibrary } from '@/services/imagePicker';
import { usePetOnboardingDraft } from '@/store/petOnboardingDraft';
import { t } from '@/i18n';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { PET_PHOTO_STEP, PET_PHOTO_SHEET } from '@/constants/petOnboarding';
import { getPetOnboardingScale } from '@/utils/petOnboardingScale';

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

  const heroW = PET_PHOTO_STEP.heroWidth * sx;
  const heroH = PET_PHOTO_STEP.heroHeight * sx;
  const sheetHeight = PET_PHOTO_SHEET.height * sy;
  const hasPhoto = Boolean(photoUri);
  // Dog with no user pick → show bundled default in the polaroid frame.
  const showDefaultDog = !hasPhoto && draft.type === 'dog';
  const actionBtnWidth = (
    hasPhoto ? PET_PHOTO_STEP.changeBtnWidth : PET_PHOTO_STEP.addBtnWidth
  ) * sx;

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

  const handleRemovePhoto = () => {
    closeSheet();
    setLocalPhotoUri(null);
  };

  const handleOpenSheet = () => {
    setSheetVisible(true);
  };

  const handleBack = () => {
    router.back();
  };

  const goNext = (uri: string | null) => {
    setPhotoUri(uri);
    router.push('/(onboarding)/birth' as never);
  };

  const handleContinue = () => {
    goNext(photoUri);
  };

  const handleSkip = () => {
    goNext(null);
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

        <OnboardingSkipButton onPress={handleSkip} scale={sx} />
      </View>

      <View style={styles.flex}>
        <View
          style={[
            styles.card,
            {
              marginTop: (PET_PHOTO_STEP.cardTop - PET_PHOTO_STEP.progressTop - 40) * sy,
              marginHorizontal: PET_PHOTO_STEP.cardLeft * sx,
              width: PET_PHOTO_STEP.cardWidth * sx,
              minHeight: PET_PHOTO_STEP.cardHeight * sy,
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
            {/* Order: svg → title → subtitle → add/change photo btn */}
            <Pressable
              onPress={handleOpenSheet}
              style={{
                width: heroW,
                height: heroH,
                alignSelf: 'center',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 12 * sx,
              }}
              accessibilityRole="button"
              accessibilityLabel={t('petOnboarding.photo_add_a11y')}
            >
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <OnboardingPhotoEmpty width={heroW} height={heroH} />
              </View>
              {hasPhoto ? (
                <Image
                  source={{ uri: photoUri! }}
                  style={{
                    position: 'absolute',
                    width: PET_PHOTO_STEP.userPhotoWidth * sx,
                    height: PET_PHOTO_STEP.userPhotoHeight * sx,
                    top: PET_PHOTO_STEP.userPhotoTop * sx,
                    left: PET_PHOTO_STEP.userPhotoLeft * sx,
                    zIndex: 2,
                    elevation: 2,
                  }}
                  contentFit="cover"
                />
              ) : showDefaultDog ? (
                <View
                  style={{
                    position: 'absolute',
                    width: PET_PHOTO_STEP.userPhotoWidth * sx,
                    height: PET_PHOTO_STEP.userPhotoHeight * sx,
                    top: PET_PHOTO_STEP.userPhotoTop * sx,
                    left: PET_PHOTO_STEP.userPhotoLeft * sx,
                    zIndex: 2,
                    elevation: 2,
                    overflow: 'hidden',
                  }}
                  pointerEvents="none"
                >
                  <OnboardingDefaultPetPhoto
                    width={PET_PHOTO_STEP.userPhotoWidth * sx}
                    height={PET_PHOTO_STEP.userPhotoHeight * sx}
                  />
                </View>
              ) : null}
              {(hasPhoto || showDefaultDog) ? (
                <View
                  style={{
                    position: 'absolute',
                    top: PET_PHOTO_STEP.maskTop * sx,
                    left: PET_PHOTO_STEP.maskLeft * sx,
                    zIndex: 3,
                    elevation: 3,
                  }}
                  pointerEvents="none"
                >
                  <OnboardingPhotoMask
                    width={PET_PHOTO_STEP.maskWidth * sx}
                    height={PET_PHOTO_STEP.maskHeight * sx}
                  />
                </View>
              ) : null}
            </Pressable>

            <View
              style={[
                styles.copyBlock,
                { width: PET_PHOTO_STEP.copyWidth * sx, gap: PET_PHOTO_STEP.copyGap * sy },
              ]}
            >
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
              style={[
                styles.addPhotoBtn,
                {
                  width: actionBtnWidth,
                  height: PET_PHOTO_STEP.addBtnHeight * sx,
                  borderRadius: PET_PHOTO_STEP.addBtnRadius * sx,
                  paddingHorizontal: PET_PHOTO_STEP.addBtnPaddingH * sx,
                  paddingVertical: PET_PHOTO_STEP.addBtnPaddingV * sx,
                  gap: PET_PHOTO_STEP.addBtnGap * sx,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                hasPhoto ? t('profile.edit.change_photo') : t('petOnboarding.photo_add_a11y')
              }
            >
              <Ionicons
                name="image-outline"
                size={PET_PHOTO_STEP.addBtnIconSize * sx}
                color={colors.primaryText}
              />
              <Text
                style={[
                  styles.addPhotoText,
                  {
                    fontSize: PET_PHOTO_STEP.addBtnFontSize * sx,
                    lineHeight: PET_PHOTO_STEP.addBtnLineHeight * sx,
                  },
                ]}
              >
                {hasPhoto ? t('profile.edit.change_photo') : t('pets.add_photo')}
              </Text>
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
              height: sheetHeight + insets.bottom + (hasPhoto ? 48 * sy : 0),
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
                {
                  fontSize: PET_PHOTO_SHEET.optionFontSize * sx,
                  lineHeight: PET_PHOTO_SHEET.optionLineHeight * sy,
                },
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
              <Ionicons
                name="close"
                size={PET_PHOTO_SHEET.closeSize * sx}
                color={colors.primaryText}
              />
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
                    {
                      fontSize: PET_PHOTO_SHEET.optionFontSize * sx,
                      lineHeight: PET_PHOTO_SHEET.optionLineHeight * sy,
                    },
                  ]}
                >
                  {t('petOnboarding.photo_take')}
                </Text>
              </Pressable>
              <View
                style={[
                  styles.sheetDivider,
                  { marginHorizontal: PET_PHOTO_SHEET.optionsPadding * sx },
                ]}
              />
              <Pressable onPress={() => pickImage('library')} style={styles.sheetOptionRow}>
                <Text
                  style={[
                    styles.sheetOptionText,
                    {
                      fontSize: PET_PHOTO_SHEET.optionFontSize * sx,
                      lineHeight: PET_PHOTO_SHEET.optionLineHeight * sy,
                    },
                  ]}
                >
                  {t('petOnboarding.photo_choose_library')}
                </Text>
              </Pressable>
              {hasPhoto ? (
                <>
                  <View
                    style={[
                      styles.sheetDivider,
                      { marginHorizontal: PET_PHOTO_SHEET.optionsPadding * sx },
                    ]}
                  />
                  <Pressable onPress={handleRemovePhoto} style={styles.sheetOptionRow}>
                    <Text
                      style={[
                        styles.sheetOptionTextDanger,
                        {
                          fontSize: PET_PHOTO_SHEET.optionFontSize * sx,
                          lineHeight: PET_PHOTO_SHEET.optionLineHeight * sy,
                        },
                      ]}
                    >
                      {t('petOnboarding.photo_remove')}
                    </Text>
                  </Pressable>
                </>
              ) : null}
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
                  {
                    fontSize: PET_PHOTO_SHEET.cancelFontSize * sx,
                    lineHeight: PET_PHOTO_SHEET.cancelLineHeight * sy,
                  },
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
    addPhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: c.border,
      // panel (#F6F7F9 / #111315) breaks slightly from card surface
      backgroundColor: c.panel,
    },
    addPhotoText: {
      fontFamily: 'Rubik-Medium',
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
    continueText: {
      fontFamily: 'Rubik-Medium',
      color: c.button.primaryText,
      textAlign: 'center',
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
      color: c.primaryText,
      textAlign: 'center',
    },
    sheetOptionTextDanger: {
      fontFamily: 'Rubik-Regular',
      color: c.error,
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
      color: c.primaryText,
      textAlign: 'center',
    },
  });
