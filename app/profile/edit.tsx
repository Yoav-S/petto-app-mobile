import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { apiGet } from '@/services/api';
import { updatePet, deletePet } from '@/services/pets';
import { uploadPetPhoto } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import type { Pet } from '@/types/api';
import { formatDisplayDateLong, parseIsoDate } from '@/utils/calendar';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  ProfileNameField,
  ProfileTextField,
  ProfileSelectField,
  ProfilePillField,
} from '@/components/profile/ProfileFormFields';

const PET_PLACEHOLDER = require('@/assets/images/onboarding-cover.png');

function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activePetId } = useActivePet();

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
  const [passport, setPassport] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [petCount, setPetCount] = useState(0);

  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

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
        try {
          const pets = await apiGet<Pet[]>('/pets');
          if (cancelled) return;
          const pet = pets.find((p) => p.id === activePetId);
          if (!pet) {
            setNotFound(true);
            return;
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
          setPassport(pet.passport_number ?? '');
          setPhotoUri(pet.photo_url ?? null);
          setPhotoChanged(false);
          setNotFound(false);
        } catch {
          if (!cancelled) setNotFound(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [activePetId]),
  );

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
        setPhotoChanged(true);
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
      setPhotoChanged(true);
    }
  };

  const handleSave = async () => {
    if (!activePetId) return;
    if (!name.trim()) {
      Alert.alert(t('profile.edit.name_required'));
      return;
    }
    try {
      setSaving(true);
      let photoUrl: string | null | undefined;
      if (photoChanged) {
        photoUrl = photoUri ? await uploadPetPhoto(photoUri) : null;
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
        passport_number: trimOrNull(passport),
        ...(photoChanged ? { photo_url: photoUrl } : {}),
      });
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
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
    setDeleteVisible(true);
  };

  const handleDelete = async () => {
    if (!activePetId) return;
    setDeleteVisible(false);
    try {
      await deletePet(activePetId);
      router.replace('/(tabs)' as never);
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  const birthDateLabel = birthDate ? formatDisplayDateLong(birthDate) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={t('petOnboarding.back')}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.primaryText} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.edit.title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryText} />
        </View>
      ) : notFound ? (
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>{t('profile.edit.not_found')}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 44}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.photoWrap}>
              <Image
                source={photoUri ? { uri: photoUri } : PET_PLACEHOLDER}
                style={styles.photo}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.photoEditBtn}
                onPress={() => setPhotoSheetVisible(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('profile.edit.change_photo')}
              >
                <Ionicons name="pencil" size={14} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.fields}>
              <ProfileNameField value={name} onChangeText={setName} />

              <ProfilePillField
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
                onPress={() => setDateSheetVisible(true)}
              />

              <ProfileTextField label={t('profile.breed')} value={breed} onChangeText={setBreed} />

              <ProfileTextField label={t('profile.color')} value={color} onChangeText={setColor} />

              <ProfileTextField
                label={t('profile.weight_label')}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
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
                autoCapitalize="characters"
              />

              <ProfileTextField
                label={t('profile.passport')}
                value={passport}
                onChangeText={setPassport}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={handleRemovePress}
                activeOpacity={0.7}
              >
                <Text style={styles.removeText}>{t('profile.edit.remove_pet')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.saveText}>{t('common.save')}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
  headerBtn: {
    width: 40,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: Colors.primaryText,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.secondaryText,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  photoWrap: {
    width: 128,
    height: 128,
    alignSelf: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#E8E2D8',
  },
  photoEditBtn: {
    position: 'absolute',
    top: 92,
    left: 92,
    width: 32,
    height: 32,
    borderRadius: 10,
    padding: 4,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
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
    color: Colors.error,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
