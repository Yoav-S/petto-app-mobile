import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { pickImageFromLibrary } from '@/services/imagePicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import VaccinePhotoViewer from '@/components/vaccines/VaccinePhotoViewer';
import VaccineClinicField from '@/components/vaccines/VaccineClinicField';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getVaccination, updateVaccination, deleteVaccination } from '@/services/vaccines';
import { uploadImage } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { addYearsToIsoDate, formatDisplayDate, isIsoDateAfter, parseIsoDate, todayIsoDate } from '@/utils/calendar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { DESIGN_HEIGHT } from '@/constants/layout';
import type { Vaccination } from '@/types/api';

type PickerTarget = 'date' | 'next' | null;

export default function VaccineDetailsScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activePetId } = useActivePet();
  const { height } = useResponsiveLayout();
  const deleteBottomPad = Math.max(24, Math.round(height * (58 / DESIGN_HEIGHT)));

  const [vaccine, setVaccine] = useState<Vaccination | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [clinic, setClinic] = useState('');
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const needsScroll = contentH > viewportH + 1;

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
        toast.showError(getErrorMessage(err));
        fetchData();
      }
    },
    [activePetId, id, fetchData, toast],
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
    const picked = await pickImageFromLibrary();
    if (picked === 'denied') {
      Alert.alert(t('petOnboarding.photo_permission_title'), t('petOnboarding.photo_permission_body'));
      return;
    }
    if (!picked?.uri) return;
    try {
      setUploading(true);
      const url = await uploadImage(picked.uri, 'vaccines');
      await save({ photo_url: url });
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    if (!activePetId || !id) return;
    setDeleteVisible(false);
    toast.showUndo({
      message: t('vaccines.deleted'),
      onUndo: () => {},
      onCommit: async () => {
        try {
          await deleteVaccination(activePetId, id);
          router.back();
        } catch (err) {
          toast.showError(getErrorMessage(err));
        }
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <ScreenHeader title={t('vaccines.list_title')} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !vaccine) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScreenHeader title={t('vaccines.list_title')} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: deleteBottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={needsScroll}
          bounces={needsScroll}
          onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setContentH(h)}
        >
          <View>
          {/* Name */}
          <View style={styles.card}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              onBlur={handleNameBlur}
              placeholder={t('vaccines.field_name')}
              placeholderTextColor={colors.secondaryText}
              returnKeyType="done"
            />
          </View>

          {/* Dates */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => {
                setViewerVisible(false);
                setDeleteVisible(false);
                setPicker('date');
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.dateRowLabel}>{t('vaccines.vaccinated_on')}</Text>
              <Text style={styles.dateRowValue}>{formatDisplayDate(vaccine.date)}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => {
                setViewerVisible(false);
                setDeleteVisible(false);
                setPicker('next');
              }}
              activeOpacity={0.6}
            >
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
                  onPress={() => {
                    setPicker(null);
                    setDeleteVisible(false);
                    setViewerVisible(true);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="expand-outline" size={18} color={colors.primaryText} />
                </TouchableOpacity>
                {uploading ? (
                  <View style={styles.photoOverlay}>
                    <ActivityIndicator color={colors.surface} />
                  </View>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPlaceholder} onPress={pickImage} activeOpacity={0.7}>
                {uploading ? (
                  <ActivityIndicator color={colors.secondaryText} />
                ) : (
                  <>
                    <Image
                      source={HOME_CATEGORY_ICONS.vaccines}
                      style={styles.defaultPhoto}
                      contentFit="contain"
                    />
                    <Text style={styles.photoPlaceholderText}>{t('vaccines.add_photo')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <VaccineClinicField
            value={clinic}
            onChangeText={setClinic}
            onBlur={handleClinicBlur}
            style={styles.clinicCard}
          />
          </View>

          <View style={styles.deleteSpacer} />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setPicker(null);
              setViewerVisible(false);
              setDeleteVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteText}>{t('vaccines.delete')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <BirthDatePickerSheet
        visible={picker === 'date'}
        initialDate={parseIsoDate(vaccine.date)}
        onClose={() => setPicker(null)}
        onConfirm={(iso) => {
          setPicker(null);
          if (isIsoDateAfter(iso, todayIsoDate())) {
            toast.showError(t('errors.vaccination_date_in_future'));
            return;
          }
          if (iso === vaccine.date) return;
          const patch: Partial<Vaccination> = { date: iso };
          if (vaccine.next_date && iso > vaccine.next_date) {
            patch.next_date = addYearsToIsoDate(iso, 1);
          }
          save(patch);
        }}
        title={t('vaccines.vaccinated_on')}
        confirmLabel={t('pickers.done')}
      />
      <BirthDatePickerSheet
        visible={picker === 'next'}
        initialDate={parseIsoDate(vaccine.next_date ?? null)}
        allowFuture
        minDate={vaccine.date}
        onClose={() => setPicker(null)}
        onConfirm={(iso) => {
          setPicker(null);
          if (iso !== vaccine.next_date) save({ next_date: iso });
        }}
        title={t('vaccines.valid_until')}
        confirmLabel={t('pickers.done')}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={t('vaccines.delete_confirm_title')}
        message={t('vaccines.delete_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />

      <VaccinePhotoViewer
        visible={viewerVisible}
        uri={vaccine.photo_url}
        onClose={() => setViewerVisible(false)}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  card: {
    backgroundColor: c.surface,
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
    color: c.primaryText,
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
    color: c.primaryText,
    flex: 1,
    marginRight: Spacing.md,
  },
  dateRowValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.primaryText,
  },
  dateRowPlaceholder: {
    color: c.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
    marginVertical: Spacing.xs,
  },
  sectionLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.primaryText,
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
    backgroundColor: c.background,
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
    borderRadius: Radius.md,
    aspectRatio: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.category.vaccinesBg,
  },
  defaultPhoto: {
    width: 48,
    height: 48,
  },
  photoPlaceholderText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.secondaryText,
    marginTop: Spacing.sm,
  },
  clinicCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: 0,
    minHeight: 78,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteSpacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  deleteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 18,
    color: c.error,
  },
});
