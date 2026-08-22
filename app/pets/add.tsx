import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { pickImageFromCamera, pickImageFromLibrary } from '@/services/imagePicker';
import { type ThemeColors } from '@/constants/theme';
import { centeredInputText } from '@/constants/textField';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import { ProfilePillField, ProfileSelectField } from '@/components/profile/ProfileFormFields';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
import {
  OnboardingCat,
  OnboardingDog,
  OnboardingPhotoAdd,
} from '@/components/brand/onboarding';
import HealthKeyboardFooter, {
  HealthKeyboardAvoidingView,
} from '@/components/health/HealthKeyboardFooter';
import { t } from '@/i18n';
import { createPet } from '@/services/pets';
import { uploadPetPhoto } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { useActivePet } from '@/store/petStore';
import { formatDisplayDate, parseIsoDate } from '@/utils/calendar';
import type { PetType } from '@/store/petOnboardingDraft';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

export default function AddPetScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { setActivePetId } = useActivePet();
  const { contentWidth } = useResponsiveLayout();

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
      formTop: 16,
      formGap: 22,
      cardWidth: contentWidth,
      photoSize: 128,
      photoInner: 116,
      photoInset: 6,
      photoRadius: 22,
      inputHeight: 52,
      typeRowWidth: Math.min(contentWidth, 304),
      typeTileWidth: 144,
      typeTileHeight: 110,
      typeGap: 16,
    }),
    [contentWidth],
  );

  const canSave = name.trim().length > 0 && !!petType && !submitting;

  const pickImage = async (source: 'camera' | 'library') => {
    setPhotoSheetVisible(false);
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
    if (picked?.uri) setPhotoUri(picked.uri);
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
        <View
          style={[
            styles.content,
            {
              paddingTop: layout.formTop,
              paddingBottom: 12,
              gap: layout.formGap,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              setBirthSheetVisible(false);
              setPhotoSheetVisible(true);
            }}
            style={{
              width: layout.photoSize,
              height: layout.photoSize,
              alignSelf: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel={t('pets.add_photo')}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{
                  width: layout.photoInner,
                  height: layout.photoInner,
                  borderRadius: layout.photoRadius,
                  marginTop: layout.photoInset,
                  marginLeft: layout.photoInset,
                }}
                contentFit="cover"
              />
            ) : (
              <OnboardingPhotoAdd width={layout.photoSize} height={layout.photoSize} />
            )}
          </Pressable>

          <TextInput
            style={[
              styles.nameInput,
              CARD_SHADOW,
              {
                width: layout.cardWidth,
                height: layout.inputHeight,
                borderRadius: 12,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t('pets.name_placeholder')}
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="words"
            returnKeyType="done"
            textAlignVertical="center"
          />

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
              const PetIcon = type === 'dog' ? OnboardingDog : OnboardingCat;
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
                    <PetIcon width={56} height={56} />
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
              onPress={() => {
                setPhotoSheetVisible(false);
                setBirthSheetVisible(true);
              }}
            />
          </View>

          <View style={{ width: layout.cardWidth }}>
            <ProfilePillField
              layout="sex"
              label={t('profile.sex')}
              value={sex}
              onChange={setSex}
              options={[
                { value: 'male', label: t('profile.sex_male') },
                { value: 'female', label: t('profile.sex_female') },
              ]}
            />
          </View>
        </View>

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
    content: {
      flex: 1,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    nameInput: {
      ...centeredInputText({
        fontFamily: 'Rubik-Regular',
        fontSize: 16,
        lineHeight: 20,
        color: c.primaryText,
        backgroundColor: c.surface,
        paddingHorizontal: 16,
        height: undefined,
      }),
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
    typeLabel: {
      width: 106,
      height: 20,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'center',
    },
  });
