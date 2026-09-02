import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { pickImageFromCamera, pickImageFromLibrary } from '@/services/imagePicker';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { centeredInputText, NAME_FIELD_TEXT } from '@/constants/textField';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import VaccinePhotoSourceSheet from '@/components/vaccines/VaccinePhotoSourceSheet';
import VaccinePhotoViewer from '@/components/vaccines/VaccinePhotoViewer';
import VaccineClinicField from '@/components/vaccines/VaccineClinicField';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import { HealthFormScreen } from '@/components/health/HealthKeyboardFooter';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createVaccination } from '@/services/vaccines';
import { uploadImage } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import {
  addYearsToIsoDate,
  formatDisplayDate,
  isIsoDateAfter,
  isIsoDateBefore,
  parseIsoDate,
  todayIsoDate,
} from '@/utils/calendar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type DateSheet = 'date' | 'next' | null;

export default function AddVaccineScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const { activePetId } = useActivePet();
  const { contentWidth } = useResponsiveLayout();

  const [name, setName] = useState('');
  const [date, setDate] = useState(todayIsoDate);
  const [nextDate, setNextDate] = useState(() => addYearsToIsoDate(todayIsoDate(), 1));
  const [clinic, setClinic] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const layout = useMemo(() => {
    const innerGap = 10;
    const cardPadV = 14;
    const photoPadBottom = 20;
    const photoCardHeight = photoUri ? 286 : 150;
    const labelAndGap = 18 + innerGap;
    const photoInnerHeight = Math.max(
      72,
      photoCardHeight - cardPadV - photoPadBottom - labelAndGap,
    );

    return {
      formTop: 16,
      formGap: 22,
      cardWidth: contentWidth,
      cardRadius: 12,
      cardPadH: 16,
      cardPadV,
      nameHeight: 48,
      datesHeight: 84,
      photoHeight: photoCardHeight,
      clinicHeight: 78,
      photoPadBottom,
      innerGap,
      photoInnerHeight,
      saveHeight: 48,
      savePadV: 12,
      savePadH: 16,
    };
  }, [contentWidth, photoUri]);
  const [dateSheet, setDateSheet] = useState<DateSheet>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openDateSheet = (target: DateSheet) => {
    setPhotoSheetVisible(false);
    setViewerVisible(false);
    setDateSheet(target);
  };

  const openPhotoSheet = () => {
    setDateSheet(null);
    setViewerVisible(false);
    setPhotoSheetVisible(true);
  };

  const openViewer = () => {
    setPhotoSheetVisible(false);
    setDateSheet(null);
    setViewerVisible(true);
  };

  const canSave = name.trim().length > 0 && !submitting;

  const handleVaccinatedDateChange = (iso: string) => {
    setDate(iso);
    setNextDate(addYearsToIsoDate(iso, 1));
    setDateSheet(null);
  };

  const handleValidUntilChange = (iso: string) => {
    if (isIsoDateBefore(iso, date)) {
      toast.showError(t('vaccines.valid_until_before_vaccinated'));
      return;
    }
    setNextDate(iso);
    setDateSheet(null);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    setPhotoSheetVisible(false);
    const picked =
      source === 'camera' ? await pickImageFromCamera() : await pickImageFromLibrary();
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

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!canSave || !activePetId) return;
    if (isIsoDateAfter(date, todayIsoDate())) {
      toast.showError(t('errors.vaccination_date_in_future'));
      return;
    }
    if (isIsoDateBefore(nextDate, date)) {
      toast.showError(t('vaccines.valid_until_before_vaccinated'));
      return;
    }
    try {
      setSubmitting(true);
      let photoUrl: string | undefined;
      if (photoUri) {
        photoUrl = await uploadImage(photoUri, 'vaccines');
      }
      await createVaccination(activePetId, {
        name: name.trim(),
        date,
        next_date: nextDate,
        photo_url: photoUrl,
        vet_clinic: clinic.trim() || undefined,
      });
      router.back();
    } catch (err) {
      toast.showError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <HeaderScrollLayout
        header={<VaccineScreenHeader title={t('vaccines.add_title')} icon="close" />}
        edges={['left', 'right']}
        topFade
        bottomFade
      >
        {({ paddingTop }) => (
          <HealthFormScreen
            scrollInsetTop={paddingTop}
            contentContainerStyle={{
              paddingTop: layout.formTop,
              gap: layout.formGap,
              alignItems: 'center',
            }}
            footer={{
              label: t('common.save'),
              disabled: !canSave,
              loading: submitting,
              onPress: handleSave,
            }}
          >
          {/* Vaccine name */}
          <View
            style={[
              styles.card,
              {
                width: layout.cardWidth,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                paddingVertical: layout.cardPadV,
                minHeight: layout.nameHeight,
                justifyContent: 'center',
              },
            ]}
          >
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder={t('vaccines.field_name_placeholder')}
              placeholderTextColor={colors.secondaryText}
              autoFocus
              returnKeyType="next"
              textAlignVertical="center"
            />
          </View>

          {/* Dates */}
          <View
            style={[
              styles.card,
              {
                width: layout.cardWidth,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                paddingVertical: layout.cardPadV,
                minHeight: layout.datesHeight,
                gap: layout.innerGap,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => openDateSheet('date')}
              activeOpacity={0.6}
            >
              <Text style={styles.dateRowLabel}>{t('vaccines.vaccinated_on')}</Text>
              <Text style={styles.dateRowValue}>{formatDisplayDate(date)}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => openDateSheet('next')}
              activeOpacity={0.6}
            >
              <Text style={styles.dateRowLabel}>{t('vaccines.valid_until')}</Text>
              <Text style={styles.dateRowValue}>{formatDisplayDate(nextDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* Proof photo */}
          <View
            style={[
              styles.card,
              {
                width: layout.cardWidth,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                paddingTop: layout.cardPadV,
                paddingBottom: layout.photoPadBottom,
                minHeight: layout.photoHeight,
                gap: layout.innerGap,
              },
            ]}
          >
            <Text style={styles.sectionLabel}>{t('vaccines.proof_photo')}</Text>
            {photoUri ? (
              <View style={[styles.photoWrap, { height: layout.photoInnerHeight }]}>
                <TouchableOpacity activeOpacity={0.9} onPress={openPhotoSheet}>
                  <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={openViewer}
                  hitSlop={8}
                >
                  <Ionicons name="expand-outline" size={18} color={colors.primaryText} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.photoPlaceholder, { height: layout.photoInnerHeight }]}
                onPress={openPhotoSheet}
                activeOpacity={0.7}
              >
                <Image
                  source={HOME_CATEGORY_ICONS.vaccines}
                  style={styles.defaultPhoto}
                  contentFit="contain"
                />
                <Text style={styles.photoPlaceholderText}>{t('vaccines.add_vaccine_photo')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <VaccineClinicField
            value={clinic}
            onChangeText={setClinic}
            style={[
              styles.card,
              {
                width: layout.cardWidth,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                paddingVertical: layout.cardPadV,
                minHeight: layout.clinicHeight,
              },
            ]}
          />
          </HealthFormScreen>
        )}
      </HeaderScrollLayout>

      <VaccinePhotoSourceSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        onTakePhoto={() => pickImage('camera')}
        onChooseLibrary={() => pickImage('library')}
      />

      <BirthDatePickerSheet
        visible={dateSheet === 'date'}
        initialDate={parseIsoDate(date)}
        onClose={() => setDateSheet(null)}
        onConfirm={handleVaccinatedDateChange}
        title={t('vaccines.vaccinated_on')}
        confirmLabel={t('pickers.done')}
      />

      <BirthDatePickerSheet
        visible={dateSheet === 'next'}
        initialDate={parseIsoDate(nextDate)}
        onClose={() => setDateSheet(null)}
        onConfirm={handleValidUntilChange}
        allowFuture
        minDate={date}
        title={t('vaccines.valid_until')}
        confirmLabel={t('pickers.done')}
      />

      <VaccinePhotoViewer
        visible={viewerVisible}
        uri={photoUri}
        onClose={() => setViewerVisible(false)}
      />
    </>
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
  content: {
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: c.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nameInput: {
    ...centeredInputText({
      ...NAME_FIELD_TEXT,
      color: c.primaryText,
    }),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  divider: {
    height: 1,
    backgroundColor: c.border,
  },
  sectionLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.primaryText,
  },
  photoWrap: {
    position: 'relative',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
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
  photoPlaceholder: {
    backgroundColor: c.category.vaccinesBg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultPhoto: {
    width: 48,
    height: 48,
  },
  photoPlaceholderText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.secondaryText,
    marginTop: 6,
  },
});
