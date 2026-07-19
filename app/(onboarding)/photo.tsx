import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Alert,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import { usePetOnboardingDraft } from '@/store/petOnboardingDraft';
import { t } from '@/i18n';
import { Colors } from '@/constants/theme';
import { PET_PHOTO_STEP, PET_PHOTO_SHEET } from '@/constants/petOnboarding';
import { getPetOnboardingScale, scaleOffset } from '@/utils/petOnboardingScale';

const addPhotoImage = require('@/assets/images/pet-onboarding-add-photo.png');

export default function PetPhotoOnboardingScreen() {
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
    closeSheet();
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    };

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('petOnboarding.photo_camera_permission_title'),
          t('petOnboarding.photo_camera_permission_body'),
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync(pickerOptions);
      if (!result.canceled && result.assets[0]?.uri) {
        applyPickedImage(result.assets[0].uri);
      }
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('petOnboarding.photo_permission_title'), t('petOnboarding.photo_permission_body'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (!result.canceled && result.assets[0]?.uri) {
      applyPickedImage(result.assets[0].uri);
    }
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
          <OnboardingProgressDots currentStep={3} />
        </View>

        <View style={[styles.backBtn, { width: 40 * sx }]} />
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
                <Image
                  source={addPhotoImage}
                  style={{ width: outerSize, height: outerSize }}
                  contentFit="contain"
                />
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
            paddingBottom: Math.max(insets.bottom, 16 * sy),
            paddingTop: 8 * sy,
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

      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} accessibilityLabel={t('petOnboarding.photo_close_a11y')} />
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
                  width: PET_PHOTO_SHEET.titleRowWidth * sx,
                  height: PET_PHOTO_SHEET.titleRowHeight * sy,
                  marginTop: PET_PHOTO_SHEET.titleRowTop * sy,
                  marginLeft: PET_PHOTO_SHEET.titleRowLeft * sx,
                },
              ]}
            >
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
                style={{ width: PET_PHOTO_SHEET.closeSize * sx, height: PET_PHOTO_SHEET.closeSize * sx }}
                accessibilityRole="button"
                accessibilityLabel={t('petOnboarding.photo_close_a11y')}
              >
                <Ionicons name="close" size={PET_PHOTO_SHEET.closeSize * sx} color={Colors.primaryText} />
              </Pressable>
            </View>

            <View
              style={[
                styles.sheetOptions,
                {
                  width: PET_PHOTO_SHEET.optionsWidth * sx,
                  minHeight: PET_PHOTO_SHEET.optionsHeight * sy,
                  borderRadius: PET_PHOTO_SHEET.optionsRadius * sx,
                  padding: PET_PHOTO_SHEET.optionsPadding * sx,
                  gap: PET_PHOTO_SHEET.optionsGap * sy,
                  marginTop: 16 * sy,
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
        </View>
      </Modal>
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
  inner: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  copyBlock: {
    alignSelf: 'center',
    alignItems: 'center',
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
  footer: {
    alignItems: 'center',
  },
  continueBtn: {
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  continueText: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    color: Colors.surface,
    textAlign: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: PET_PHOTO_SHEET.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'flex-start',
  },
  sheetTitle: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: '#1F2937',
  },
  sheetOptions: {
    backgroundColor: Colors.surface,
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
    color: '#1F2937',
    textAlign: 'center',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.border,
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
    color: '#1F2937',
    textAlign: 'center',
  },
});
