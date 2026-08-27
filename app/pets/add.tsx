import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
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
import { OnboardingPhotoAdd } from '@/components/brand/onboarding';
import { HealthFormScreen } from '@/components/health/HealthKeyboardFooter';
import { useKeyboardAwareScroll } from '@/hooks/useKeyboardAwareScroll';
import { t } from '@/i18n';
import { createPet } from '@/services/pets';
import { uploadPetPhoto } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { guardAddPet } from '@/services/subscription';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import { useActivePet } from '@/store/petStore';
import { formatDisplayDate, parseIsoDate } from '@/utils/calendar';
import type { PetType } from '@/store/petOnboardingDraft';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const TYPE_DOG_EMOJI = require('@/assets/images/pets/type-dog.png');
const TYPE_CAT_EMOJI = require('@/assets/images/pets/type-cat.png');

const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

const TYPE_CARD = {
  height: 90,
  radius: 12,
  padV: 14,
  padH: 16,
  gap: 10,
  optionsGap: 16,
  chipW: 92,
  optionH: 36,
  optionRadius: 12,
  optionPadV: 6,
  optionPadH: 16,
  optionGap: 10,
  emoji: 20,
} as const;

export default function AddPetScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { setActivePetId } = useActivePet();
  const petsQuery = usePetsQuery();
  const pets = petsQuery.data ?? [];
  const { contentWidth } = useResponsiveLayout();
  const { scrollRef, onScroll, onInputFocus } = useKeyboardAwareScroll(0);

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
    Keyboard.dismiss();
    if (!canSave || !petType) return;
    if (!(await guardAddPet(router, pets.length))) return;
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
    <>
      <HeaderScrollLayout
        header={<VaccineScreenHeader title={t('pets.add_title')} icon="close" />}
        edges={['left', 'right']}
      >
        {({ paddingTop }) => (
          <HealthFormScreen
          scrollInsetTop={paddingTop}
          scrollRef={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: layout.formTop,
            gap: layout.formGap,
          }}
          footer={{
            label: t('home.add_pet'),
            disabled: !canSave,
            loading: submitting,
            onPress: () => void handleSave(),
          }}
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
            onFocus={onInputFocus}
          />

          <View
            style={[
              styles.typeCard,
              CARD_SHADOW,
              {
                width: layout.cardWidth,
                minHeight: TYPE_CARD.height,
                borderRadius: TYPE_CARD.radius,
                paddingVertical: TYPE_CARD.padV,
                paddingHorizontal: TYPE_CARD.padH,
                gap: TYPE_CARD.gap,
              },
            ]}
          >
            <Text style={styles.typeLabel}>{t('pets.type')}</Text>
            <View style={[styles.typeOptions, { gap: TYPE_CARD.optionsGap }]}>
              {(['dog', 'cat'] as const).map((type) => {
                const selected = petType === type;
                const label = type === 'dog' ? t('petOnboarding.dog') : t('petOnboarding.cat');
                const emoji = type === 'dog' ? TYPE_DOG_EMOJI : TYPE_CAT_EMOJI;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setPetType(type)}
                    style={[
                      styles.typeOption,
                      {
                        width: TYPE_CARD.chipW,
                        height: TYPE_CARD.optionH,
                        borderRadius: TYPE_CARD.optionRadius,
                        paddingTop: TYPE_CARD.optionPadV,
                        paddingBottom: TYPE_CARD.optionPadV,
                        paddingHorizontal: TYPE_CARD.optionPadH,
                        gap: TYPE_CARD.optionGap,
                      },
                      selected ? styles.typeOptionSelected : styles.typeOptionUnselected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                  >
                    <Image
                      source={emoji}
                      style={{ width: TYPE_CARD.emoji, height: TYPE_CARD.emoji }}
                      contentFit="contain"
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        selected ? styles.typeOptionTextSelected : styles.typeOptionTextUnselected,
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ width: layout.cardWidth }}>
            <ProfileSelectField
              label={t('profile.birth_date')}
              valueText={birthDate ? formatDisplayDate(birthDate) : null}
              showIcon={false}
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
          </HealthFormScreen>
        )}
      </HeaderScrollLayout>

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
    </>
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
    content: {
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
    typeCard: {
      backgroundColor: c.surface,
      justifyContent: 'center',
    },
    typeLabel: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    typeOptions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeOptionSelected: {
      backgroundColor: c.brand,
    },
    typeOptionUnselected: {
      backgroundColor: c.inactiveControl,
    },
    typeOptionText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
    },
    typeOptionTextSelected: {
      color: c.button.primaryText,
    },
    typeOptionTextUnselected: {
      color: c.primaryText,
    },
  });
