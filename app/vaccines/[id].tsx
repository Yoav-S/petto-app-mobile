import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getVaccination, updateVaccination, deleteVaccination } from '@/services/vaccines';
import { uploadImage } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate, parseIsoDate } from '@/utils/calendar';
import type { Vaccination } from '@/types/api';

type PickerTarget = 'date' | 'next' | null;

export default function VaccineDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activePetId } = useActivePet();

  const [vaccine, setVaccine] = useState<Vaccination | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [clinic, setClinic] = useState('');
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activePetId || !id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      const data = await getVaccination(activePetId, id);
      setVaccine(data);
      setName(data.name);
      setClinic(data.vet_clinic ?? '');
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [activePetId, id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setNotFound(false);
      fetchData();
    }, [fetchData]),
  );

  const save = useCallback(
    async (patch: Partial<Vaccination>) => {
      if (!activePetId || !id) return;
      // Optimistic local update.
      setVaccine((prev) => (prev ? { ...prev, ...patch } : prev));
      try {
        const updated = await updateVaccination(activePetId, id, patch);
        setVaccine(updated);
      } catch (err) {
        Alert.alert(t('common.error'), getErrorMessage(err));
        fetchData();
      }
    },
    [activePetId, id, fetchData],
  );

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (!vaccine || trimmed.length === 0 || trimmed === vaccine.name) {
      setName(vaccine?.name ?? '');
      return;
    }
    save({ name: trimmed });
  };

  const handleClinicBlur = () => {
    const trimmed = clinic.trim();
    if (!vaccine || trimmed === (vaccine.vet_clinic ?? '')) return;
    save({ vet_clinic: trimmed || null });
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('petOnboarding.photo_permission_title'), t('petOnboarding.photo_permission_body'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]?.uri) return;
    try {
      setUploading(true);
      const url = await uploadImage(result.assets[0].uri, 'vaccines');
      await save({ photo_url: url });
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!activePetId || !id) return;
    setDeleteVisible(false);
    try {
      await deleteVaccination(activePetId, id);
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title={t('vaccines.list_title')} />
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !vaccine) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title={t('vaccines.list_title')} />
        <View style={styles.centered}>
          <EmptyState
            title={t('vaccines.not_found_title')}
            subtitle={t('vaccines.not_found_subtitle')}
            actionTitle={t('reminders.back')}
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('vaccines.list_title')} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <View style={styles.card}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              onBlur={handleNameBlur}
              placeholder={t('vaccines.field_name')}
              placeholderTextColor={Colors.secondaryText}
              returnKeyType="done"
            />
          </View>

          {/* Dates */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.dateRow} onPress={() => setPicker('date')} activeOpacity={0.6}>
              <Text style={styles.dateRowLabel}>{t('vaccines.vaccinated_on')}</Text>
              <Text style={styles.dateRowValue}>{formatDisplayDate(vaccine.date)}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dateRow} onPress={() => setPicker('next')} activeOpacity={0.6}>
              <Text style={styles.dateRowLabel}>{t('vaccines.valid_until')}</Text>
              <Text style={[styles.dateRowValue, !vaccine.next_date && styles.dateRowPlaceholder]}>
                {vaccine.next_date ? formatDisplayDate(vaccine.next_date) : t('vaccines.field_next_placeholder')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Proof photo */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('vaccines.proof_photo')}</Text>
            {vaccine.photo_url ? (
              <View style={styles.photoWrap}>
                <TouchableOpacity activeOpacity={0.9} onPress={pickImage} style={styles.photoTouchable}>
                  <Image source={{ uri: vaccine.photo_url }} style={styles.photo} contentFit="cover" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setViewerVisible(true)}
                  hitSlop={8}
                >
                  <Ionicons name="expand-outline" size={18} color={Colors.primaryText} />
                </TouchableOpacity>
                {uploading ? (
                  <View style={styles.photoOverlay}>
                    <ActivityIndicator color={Colors.surface} />
                  </View>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPlaceholder} onPress={pickImage} activeOpacity={0.7}>
                {uploading ? (
                  <ActivityIndicator color={Colors.secondaryText} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={28} color={Colors.secondaryText} />
                    <Text style={styles.photoPlaceholderText}>{t('vaccines.add_photo')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Veterinarian / Clinic */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('vaccines.vet_clinic')}</Text>
            <TextInput
              style={styles.clinicInput}
              value={clinic}
              onChangeText={setClinic}
              onBlur={handleClinicBlur}
              placeholder={t('vaccines.vet_clinic_placeholder')}
              placeholderTextColor={Colors.secondaryText}
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={() => setDeleteVisible(true)} activeOpacity={0.7}>
            <Text style={styles.deleteText}>{t('vaccines.delete')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <BirthDatePickerSheet
        visible={picker === 'date'}
        initialDate={parseIsoDate(vaccine.date)}
        allowFuture
        onClose={() => setPicker(null)}
        onConfirm={(iso) => {
          setPicker(null);
          if (iso !== vaccine.date) save({ date: iso });
        }}
      />
      <BirthDatePickerSheet
        visible={picker === 'next'}
        initialDate={parseIsoDate(vaccine.next_date ?? null)}
        allowFuture
        onClose={() => setPicker(null)}
        onConfirm={(iso) => {
          setPicker(null);
          if (iso !== vaccine.next_date) save({ next_date: iso });
        }}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={t('vaccines.delete_confirm_title')}
        message={t('vaccines.delete_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />

      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewerVisible(false)} />
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewerVisible(false)}
            hitSlop={10}
          >
            <Ionicons name="close" size={28} color={Colors.surface} />
          </TouchableOpacity>
          {vaccine.photo_url ? (
            <Image source={{ uri: vaccine.photo_url }} style={styles.viewerImage} contentFit="contain" />
          ) : null}
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
  centered: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nameInput: {
    fontFamily: 'Rubik-Medium',
    fontSize: 22,
    color: Colors.primaryText,
    padding: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  dateRowLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
    flex: 1,
    marginRight: Spacing.md,
  },
  dateRowValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  dateRowPlaceholder: {
    color: Colors.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  sectionLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  photoWrap: {
    position: 'relative',
  },
  photoTouchable: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  expandButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    aspectRatio: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  photoPlaceholderText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: Spacing.sm,
  },
  clinicInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    padding: 0,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  deleteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.error,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 48,
    right: Spacing.lg,
    zIndex: 2,
  },
  viewerImage: {
    width: '92%',
    height: '80%',
  },
});
