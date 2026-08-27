import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Pencil } from 'lucide-react-native';
import { Radius, type ThemeColors } from '@/constants/theme';
import { pickImageFromCamera, pickImageFromLibrary } from '@/services/imagePicker';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import {
  HealthFormSaveScroll,
  HealthKeyboardAvoidingView,
} from '@/components/health/HealthKeyboardFooter';
import { dismissKeyboard } from '@/components/ui/keyboardUtils';
import { useKeyboardAwareScroll } from '@/hooks/useKeyboardAwareScroll';
import { patchPetInCache, updatePet, deletePet } from '@/services/pets';
import { uploadPetPhoto } from '@/services/storage';
import { prefetchPetPhoto } from '@/utils/petPhotoSource';
import { getErrorMessage } from '@/services/errors';
import type { Pet } from '@/types/api';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import { formatDisplayDateLong, parseIsoDate } from '@/utils/calendar';
import { useHeaderTopPadding } from '@/utils/headerLayout';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  ProfileNameField,
  ProfileTextField,
  ProfileSelectField,
  ProfilePillField,
} from '@/components/profile/ProfileFormFields';
import HeaderIconButton, {
  HEADER_ICON_BTN,
} from '@/components/ui/HeaderIconButton';
import { defaultPetPhotoSource } from '@/utils/petPhotoSource';
import PetPhotoImage from '@/components/ui/PetPhotoImage';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const PHOTO_DESIGN = { size: 128, radius: 22 } as const;
const PHOTO_EDIT_BTN = {
  size: 24,
  radius: 6,
  padding: 4,
  top: 92,
  left: 92,
  borderWidth: 1,
  iconSize: 13.33,
  iconStroke: 1,
} as const;

function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const { activePetId } = useActivePet();
  const headerTopPadding = useHeaderTopPadding();
  const { contentWidth, width: screenWidth } = useResponsiveLayout();
  const pagePad = Math.max(16, Math.round((screenWidth - contentWidth) / 2));
  const {
    scrollRef,
    onScroll,
    onInputFocus,
  } = useKeyboardAwareScroll(0);

  /** Keep 128×128 / r22 shape; only shrink on narrow screens. */
  const photoSize = Math.round(
    Math.min(PHOTO_DESIGN.size, contentWidth * (PHOTO_DESIGN.size / 335)),
  );
  const photoRadius = Math.round(PHOTO_DESIGN.radius * (photoSize / PHOTO_DESIGN.size));
  const photoEditScale = photoSize / PHOTO_DESIGN.size;
  const photoEditTop = Math.round(PHOTO_EDIT_BTN.top * photoEditScale);
  const photoEditLeft = Math.round(PHOTO_EDIT_BTN.left * photoEditScale);
  const photoEditSize = Math.max(20, Math.round(PHOTO_EDIT_BTN.size * photoEditScale));
  const photoEditRadius = Math.max(4, Math.round(PHOTO_EDIT_BTN.radius * photoEditScale));
  const photoEditPad = Math.max(3, Math.round(PHOTO_EDIT_BTN.padding * photoEditScale));
  const photoEditIcon = Math.max(11, PHOTO_EDIT_BTN.iconSize * photoEditScale);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [sex, setSex] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [weight, setWeight] = useState('');
  const [isNeutered, setIsNeutered] = useState<boolean | null>(null);
  const [chipId, setChipId] = useState('');
  const [petType, setPetType] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [petCount, setPetCount] = useState(0);

  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const petsQuery = usePetsQuery();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!activePetId) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const applyPet = (pets: Pet[]) => {
          const pet = pets.find((p) => p.id === activePetId);
          if (!pet) {
            setNotFound(true);
            return false;
          }
          setPetCount(pets.length);
          setName(pet.name ?? '');
          setSex(pet.sex ?? null);
          setBirthDate(pet.birth_date ?? null);
          setBreed(pet.breed ?? '');
          setColor(pet.color ?? '');
          setWeight(pet.weight != null ? String(pet.weight) : '');
          setIsNeutered(pet.is_neutered ?? null);
          setChipId(pet.chip_id ?? '');
          setPetType(pet.type ?? null);
          setPhotoUri(pet.photo_url ?? null);
          setPhotoChanged(false);
          setNotFound(false);
          return true;
        };

        // Paint from cache immediately when available.
        if (petsQuery.data?.length && applyPet(petsQuery.data) && !cancelled) {
          setLoading(false);
        }

        try {
          const result = await petsQuery.refetch();
          if (cancelled) return;
          const pets = result.data ?? [];
          if (!applyPet(pets)) setNotFound(true);
        } catch {
          if (!cancelled && !petsQuery.data?.length) setNotFound(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [activePetId, petsQuery.refetch]),
  );

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
    if (picked?.uri) {
      setPhotoUri(picked.uri);
      setPhotoChanged(true);
    }
  };

  const removePhoto = () => {
    setPhotoSheetVisible(false);
    const previousUri = photoUri;
    setPhotoUri(null);
    setPhotoChanged(true);

    // Persist clear immediately for an already-uploaded photo so a back/refresh
    // does not restore the old Firebase URL.
    const wasRemote = Boolean(previousUri && /^https?:\/\//i.test(previousUri));
    if (!wasRemote || !activePetId) return;

    void (async () => {
      try {
        await updatePet(activePetId, { photo_url: null });
        setPhotoChanged(false);
      } catch (err) {
        toast.showError(getErrorMessage(err));
        setPhotoUri(previousUri);
        setPhotoChanged(false);
      }
    })();
  };

  const handleSave = async () => {
    dismissKeyboard();
    if (!activePetId) return;
    if (!name.trim()) {
      Alert.alert(t('profile.edit.name_required'));
      return;
    }
    try {
      setSaving(true);
      let photoUrl: string | null | undefined;
      if (photoChanged) {
        if (photoUri) {
          patchPetInCache(activePetId, { photo_url: photoUri });
        }
        photoUrl = photoUri ? await uploadPetPhoto(photoUri) : null;
        if (photoUrl) {
          patchPetInCache(activePetId, { photo_url: photoUrl });
          await prefetchPetPhoto(photoUrl);
        } else if (photoUri === null) {
          patchPetInCache(activePetId, { photo_url: null });
        }
      }

      const weightValue = weight.trim() ? Number(weight.trim().replace(',', '.')) : null;

      await updatePet(activePetId, {
        name: name.trim(),
        sex,
        birth_date: birthDate,
        breed: trimOrNull(breed),
        color: trimOrNull(color),
        weight: weightValue != null && Number.isFinite(weightValue) ? weightValue : null,
        is_neutered: isNeutered,
        chip_id: trimOrNull(chipId),
        ...(photoChanged ? { photo_url: photoUrl ?? null } : {}),
      });
      router.back();
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePress = () => {
    if (petCount <= 1) {
      Alert.alert(
        t('profile.edit.last_pet_title'),
        t('profile.edit.last_pet_body'),
      );
      return;
    }
    setPhotoSheetVisible(false);
    setDateSheetVisible(false);
    setDeleteVisible(true);
  };

  const handleDelete = async () => {
    if (!activePetId) return;
    setDeleteVisible(false);
    try {
      await deletePet(activePetId);
      router.replace('/(tabs)' as never);
    } catch (err) {
      toast.showError(getErrorMessage(err));
    }
  };

  const birthDateLabel = birthDate ? formatDisplayDateLong(birthDate) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={{ paddingTop: headerTopPadding, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <HeaderIconButton
            onPress={() => router.back()}
            accessibilityLabel={t('petOnboarding.back')}
          >
            <Ionicons name="chevron-back" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
          </HeaderIconButton>
          <Text style={styles.headerTitle}>{t('profile.edit.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryText} />
        </View>
      ) : notFound ? (
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>{t('profile.edit.not_found')}</Text>
        </View>
      ) : (
        <View style={styles.flex}>
          <HealthKeyboardAvoidingView>
            <HealthFormSaveScroll
              footer={{
                label: t('common.save'),
                loading: saving,
                onPress: () => void handleSave(),
              }}
              scrollRef={scrollRef}
              onScroll={onScroll}
              scrollEventThrottle={16}
              fieldsStyle={[
                styles.content,
                { paddingHorizontal: pagePad },
              ]}
            >
            <View style={[styles.photoWrap, { width: photoSize, height: photoSize }]}>
              <PetPhotoImage
                source={photoUri ? { uri: photoUri } : defaultPetPhotoSource(petType)}
                style={[styles.photo, { width: photoSize, height: photoSize, borderRadius: photoRadius }]}
                contentFit="cover"
                accessibilityLabel={t('profile.edit.change_photo')}
              />
              <TouchableOpacity
                style={[
                  styles.photoEditBtn,
                  {
                    top: photoEditTop,
                    left: photoEditLeft,
                    width: photoEditSize,
                    height: photoEditSize,
                    borderRadius: photoEditRadius,
                    padding: photoEditPad,
                  },
                ]}
                onPress={() => {
                  setDateSheetVisible(false);
                  setPhotoSheetVisible(true);
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('profile.edit.change_photo')}
              >
                <Pencil
                  size={photoEditIcon}
                  color={colors.primaryText}
                  strokeWidth={PHOTO_EDIT_BTN.iconStroke}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.fields, { width: contentWidth, alignSelf: 'center' }]}>
              <ProfileNameField value={name} onChangeText={setName} onFocus={onInputFocus} />

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

              <ProfileSelectField
                label={t('profile.birth_date')}
                valueText={birthDateLabel}
                onPress={() => {
                  setPhotoSheetVisible(false);
                  setDateSheetVisible(true);
                }}
                showIcon={false}
              />

              <ProfileTextField
                label={t('profile.breed')}
                value={breed}
                onChangeText={setBreed}
                onFocus={onInputFocus}
              />

              <ProfileTextField
                label={t('profile.color')}
                value={color}
                onChangeText={setColor}
                onFocus={onInputFocus}
              />

              <ProfileTextField
                label={t('profile.weight_label')}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                onFocus={onInputFocus}
              />

              <ProfilePillField
                label={t('profile.neutered')}
                value={isNeutered == null ? null : isNeutered ? 'yes' : 'no'}
                onChange={(v) => setIsNeutered(v === 'yes')}
                options={[
                  { value: 'yes', label: t('common.yes') },
                  { value: 'no', label: t('common.no') },
                ]}
              />

              <ProfileTextField
                label={t('profile.chip_id')}
                value={chipId}
                onChangeText={setChipId}
                keyboardType="number-pad"
                autoCapitalize="none"
                onFocus={onInputFocus}
              />

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={handleRemovePress}
                activeOpacity={0.7}
              >
                <Text style={styles.removeText}>{t('profile.edit.remove_pet')}</Text>
              </TouchableOpacity>
            </View>
            </HealthFormSaveScroll>
          </HealthKeyboardAvoidingView>
        </View>
      )}

      <BirthDatePickerSheet
        visible={dateSheetVisible}
        initialDate={parseIsoDate(birthDate)}
        onClose={() => setDateSheetVisible(false)}
        onConfirm={(iso) => {
          setBirthDate(iso);
          setDateSheetVisible(false);
        }}
      />

      <EditPhotoSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        onTake={() => void pickImage('camera')}
        onChoose={() => void pickImage('library')}
        onRemove={photoUri ? removePhoto : undefined}
        hasPhoto={Boolean(photoUri)}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={t('profile.edit.remove_confirm_title')}
        message={t('profile.edit.remove_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />
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
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  headerSpacer: {
    width: HEADER_ICON_BTN.size,
    height: HEADER_ICON_BTN.size,
  },
  headerTitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 24,
    lineHeight: 28,
    color: c.primaryText,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.secondaryText,
  },
  content: {
    paddingTop: 22,
    alignItems: 'center',
  },

  photoWrap: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  photo: {
    backgroundColor: '#E8E2D8',
  },
  photoEditBtn: {
    position: 'absolute',
    borderWidth: PHOTO_EDIT_BTN.borderWidth,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  fields: {
    gap: 16,
  },
  removeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  removeText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: c.error,
  },
});
