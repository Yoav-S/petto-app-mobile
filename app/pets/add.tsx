import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import { ProfilePillField, ProfileSelectField } from '@/components/profile/ProfileFormFields';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
import HealthKeyboardFooter, {
  HealthKeyboardAvoidingView,
  healthKeyboardScrollPadding,
} from '@/components/health/HealthKeyboardFooter';
import { t } from '@/i18n';
import { createPet } from '@/services/pets';
import { uploadPetPhoto } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { useActivePet } from '@/store/petStore';
import { formatDisplayDate, parseIsoDate } from '@/utils/calendar';
import type { PetType } from '@/store/petOnboardingDraft';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

const PHOTO_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
};

const PLUS_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 2.19 },
  shadowOpacity: 0.08,
  shadowRadius: 10.94,
  elevation: 2,
};

const dogImage = require('@/assets/images/pet-onboarding-dog.png');
const catImage = require('@/assets/images/pet-onboarding-cat.png');
const addPhotoImage = require('@/assets/images/pet-onboarding-add-photo.png');

export default function AddPetScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { setActivePetId } = useActivePet();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [petType, setPetType] = useState<PetType | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [sex, setSex] = useState<string | null>(null);
  const [birthSheetVisible, setBirthSheetVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const layout = useMemo(
    () => ({
      formTop: 16 * sy,
      formGap: 22 * sy,
      cardWidth: 335 * sx,
      photoOuter: 128 * sx,
      photoInner: 116 * sx,
      photoInset: 6 * sx,
      photoRadius: 22 * sx,
      typeRowWidth: 304 * sx,
      typeTileWidth: 144 * sx,
      typeTileHeight: 110 * sy,
      typeGap: 16 * sx,
      footerHeight: 48 * sy,
    }),
    [sx, sy],
  );

  const canSave = name.trim().length > 0 && !!petType && !submitting;

  const pickImage = async (source: 'camera' | 'library') => {
    setPhotoSheetVisible(false);
    const options: ImagePicker.ImagePickerOptions = {
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
      const result = await ImagePicker.launchCameraAsync(options);
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('petOnboarding.photo_permission_title'), t('petOnboarding.photo_permission_body'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoSheetVisible(false);
    setPhotoUri(null);
  };

  const handleSave = async () => {
    if (!canSave || !petType) return;
    try {
      setSubmitting(true);
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadPetPhoto(photoUri);
      }
      const pet = await createPet({
        name: name.trim(),
        type: petType,
        birth_date: birthDate,
        photo_url: photoUrl,
        sex,
      });
      await setActivePetId(pet.id);
      router.back();
    } catch (err) {
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
        toast.showError(message);
      }
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <VaccineScreenHeader title={t('pets.add_title')} icon="close" />

      <HealthKeyboardAvoidingView>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.formTop,
              paddingBottom: healthKeyboardScrollPadding(sy, insets.bottom),
              gap: layout.formGap,
              alignItems: 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => setPhotoSheetVisible(true)}
            style={[
              styles.photoOuter,
              PHOTO_SHADOW,
              {
                width: layout.photoOuter,
                height: layout.photoOuter,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('pets.add_photo')}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={[
                  styles.photoFilled,
                  {
                    width: layout.photoInner,
                    height: layout.photoInner,
                    borderRadius: layout.photoRadius,
                    marginTop: layout.photoInset,
                    marginLeft: layout.photoInset,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.photoInnerEmpty,
                  {
                    width: layout.photoInner,
                    height: layout.photoInner,
                    borderRadius: layout.photoRadius,
                    marginTop: layout.photoInset,
                    marginLeft: layout.photoInset,
                  },
                ]}
              >
                <View style={styles.photoEmptyContent}>
                  <View style={styles.photoIconWrap}>
                    <Image source={addPhotoImage} style={styles.photoIcon} resizeMode="contain" />
                    <View style={[styles.plusBadge, PLUS_SHADOW]}>
                      <Ionicons name="add" size={10} color={colors.primaryText} />
                    </View>
                  </View>
                  <Text style={styles.photoLabel}>{t('pets.add_photo')}</Text>
                </View>
              </View>
            )}
          </Pressable>

          <View
            style={[
              styles.nameCard,
              CARD_SHADOW,
              { width: layout.cardWidth },
            ]}
          >
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder={t('pets.name_placeholder')}
              placeholderTextColor={colors.secondaryText}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          <View
            style={[
              styles.typeRow,
              {
                width: layout.typeRowWidth,
                height: layout.typeTileHeight,
                gap: layout.typeGap,
              },
            ]}
          >
            {(['dog', 'cat'] as const).map((type) => {
              const selected = petType === type;
              const image = type === 'dog' ? dogImage : catImage;
              const label = type === 'dog' ? t('petOnboarding.dog') : t('petOnboarding.cat');
              return (
                <Pressable
                  key={type}
                  onPress={() => setPetType(type)}
                  style={[
                    styles.typeTile,
                    {
                      width: layout.typeTileWidth,
                      height: layout.typeTileHeight,
                      borderColor: selected ? colors.brand : colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={label}
                >
                  <View style={styles.typeInner}>
                    <Image source={image} style={styles.typeImage} resizeMode="contain" />
                    <Text style={styles.typeLabel}>{label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ width: layout.cardWidth }}>
            <ProfileSelectField
              label={t('profile.birth_date')}
              valueText={birthDate ? formatDisplayDate(birthDate) : null}
              onPress={() => setBirthSheetVisible(true)}
            />
          </View>

          <View style={{ width: layout.cardWidth }}>
            <ProfilePillField
              label={t('profile.sex')}
              value={sex}
              onChange={setSex}
              options={[
                { value: 'male', label: t('profile.sex_male') },
                { value: 'female', label: t('profile.sex_female') },
              ]}
            />
          </View>
        </ScrollView>

        <HealthKeyboardFooter
          label={t('home.add_pet')}
          disabled={!canSave}
          loading={submitting}
          onPress={() => void handleSave()}
        />
      </HealthKeyboardAvoidingView>

      <BirthDatePickerSheet
        visible={birthSheetVisible}
        initialDate={parseIsoDate(birthDate)}
        onClose={() => setBirthSheetVisible(false)}
        onConfirm={(iso) => {
          setBirthDate(iso);
          setBirthSheetVisible(false);
        }}
      />

      <EditPhotoSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        onTake={() => void pickImage('camera')}
        onChoose={() => void pickImage('library')}
        onRemove={photoUri ? handleRemovePhoto : undefined}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: { flex: 1 },
    content: {
      paddingHorizontal: 20,
    },
    photoOuter: {
      backgroundColor: 'transparent',
    },
    photoInnerEmpty: {
      backgroundColor: '#F6F7F9',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    photoFilled: {
      backgroundColor: '#F6F7F9',
    },
    photoEmptyContent: {
      width: 68,
      alignItems: 'center',
      gap: 6,
    },
    photoIconWrap: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoIcon: {
      width: 50,
      height: 50,
    },
    plusBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 14,
      height: 14,
      borderRadius: 3,
      padding: 2,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoLabel: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: '#6B7280',
      textAlign: 'center',
    },
    nameCard: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      justifyContent: 'center',
    },
    nameInput: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      color: c.primaryText,
      padding: 0,
      margin: 0,
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeTile: {
      borderRadius: 16,
      backgroundColor: c.surface,
      paddingTop: 10,
      paddingBottom: 16,
      paddingHorizontal: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeInner: {
      width: 106,
      height: 84,
      alignItems: 'center',
      gap: 8,
    },
    typeImage: {
      width: 56,
      height: 56,
    },
    typeLabel: {
      width: 106,
      height: 20,
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'center',
    },
  });
