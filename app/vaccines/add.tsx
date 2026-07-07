import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import InlineCalendarPicker from '@/components/vaccines/InlineCalendarPicker';
import VaccinePhotoSourceSheet from '@/components/vaccines/VaccinePhotoSourceSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createVaccination } from '@/services/vaccines';
import { uploadImage } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import {
  addYearsToIsoDate,
  formatDisplayDate,
  parseIsoDate,
  todayIsoDate,
} from '@/utils/calendar';

type ExpandedDatePicker = 'date' | 'next' | null;

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

export default function AddVaccineScreen() {
  const router = useRouter();
  const { activePetId } = useActivePet();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const layout = useMemo(
    () => ({
      formTop: Math.max(Spacing.sm, 116 * sy - insets.top),
      formGap: 22 * sy,
      cardWidth: 335 * sx,
      cardRadius: 12 * sx,
      cardPadH: 16 * sx,
      cardPadV: 14 * sy,
      nameHeight: 48 * sy,
      datesHeight: 84 * sy,
      photoHeight: 150 * sy,
      clinicHeight: 78 * sy,
      photoPadBottom: 20 * sy,
      innerGap: 10 * sy,
      photoInnerHeight: Math.max(72 * sy, 150 * sy - 14 * sy - 20 * sy - 18 * sy - 10 * sy),
    }),
    [sx, sy, insets.top],
  );

  const [name, setName] = useState('');
  const [date, setDate] = useState(todayIsoDate);
  const [nextDate, setNextDate] = useState(() => addYearsToIsoDate(todayIsoDate(), 1));
  const [clinic, setClinic] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [expandedPicker, setExpandedPicker] = useState<ExpandedDatePicker>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const canSave = name.trim().length > 0 && !submitting;

  const handleVaccinatedDateChange = (iso: string) => {
    setDate(iso);
    setNextDate(addYearsToIsoDate(iso, 1));
  };

  const pickImage = async (source: 'camera' | 'library') => {
    setPhotoSheetVisible(false);
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
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

  const handleSave = async () => {
    if (!canSave || !activePetId) return;
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
      Alert.alert(t('common.error'), getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const togglePicker = (target: ExpandedDatePicker) => {
    setExpandedPicker((prev) => (prev === target ? null : target));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color={Colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('vaccines.add_title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.formTop,
              paddingBottom: Spacing.lg,
              gap: layout.formGap,
              alignItems: 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
              placeholderTextColor={Colors.secondaryText}
              autoFocus
              returnKeyType="next"
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
                minHeight: expandedPicker ? undefined : layout.datesHeight,
                gap: layout.innerGap,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => togglePicker('date')}
              activeOpacity={0.6}
            >
              <Text style={styles.dateRowLabel}>{t('vaccines.vaccinated_on')}</Text>
              <Text style={styles.dateRowValue}>{formatDisplayDate(date)}</Text>
            </TouchableOpacity>

            {expandedPicker === 'date' ? (
              <InlineCalendarPicker
                value={parseIsoDate(date)}
                onChange={handleVaccinatedDateChange}
                allowFuture
              />
            ) : null}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => togglePicker('next')}
              activeOpacity={0.6}
            >
              <Text style={styles.dateRowLabel}>{t('vaccines.valid_until')}</Text>
              <Text style={styles.dateRowValue}>{formatDisplayDate(nextDate)}</Text>
            </TouchableOpacity>

            {expandedPicker === 'next' ? (
              <InlineCalendarPicker
                value={parseIsoDate(nextDate)}
                onChange={setNextDate}
                allowFuture
              />
            ) : null}
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
                <TouchableOpacity activeOpacity={0.9} onPress={() => setPhotoSheetVisible(true)}>
                  <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setViewerVisible(true)}
                  hitSlop={8}
                >
                  <Ionicons name="expand-outline" size={18} color={Colors.primaryText} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.photoPlaceholder, { height: layout.photoInnerHeight }]}
                onPress={() => setPhotoSheetVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={24} color={Colors.secondaryText} />
                <Text style={styles.photoPlaceholderText}>{t('vaccines.add_vaccine_photo')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Veterinarian / Clinic */}
          <View
            style={[
              styles.card,
              {
                width: layout.cardWidth,
                borderRadius: layout.cardRadius,
                paddingHorizontal: layout.cardPadH,
                paddingVertical: layout.cardPadV,
                minHeight: layout.clinicHeight,
                gap: layout.innerGap,
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={styles.fieldLabel}>{t('vaccines.vet_clinic')}</Text>
            <TextInput
              style={styles.clinicInput}
              value={clinic}
              onChangeText={setClinic}
              placeholder={t('vaccines.vet_clinic_placeholder')}
              placeholderTextColor={Colors.secondaryText}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {keyboardVisible ? (
              <View style={styles.keyboardDoneRow}>
                <TouchableOpacity style={styles.keyboardDoneBtn} onPress={() => Keyboard.dismiss()}>
                  <Text style={styles.keyboardDoneText}>{t('pickers.done')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
                {t('common.save')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <VaccinePhotoSourceSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        onTakePhoto={() => pickImage('camera')}
        onChooseLibrary={() => pickImage('library')}
      />

      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewerVisible(false)} />
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)} hitSlop={10}>
            <Ionicons name="close" size={28} color={Colors.surface} />
          </TouchableOpacity>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.viewerImage} contentFit="contain" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 24,
    color: Colors.primaryText,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nameInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    padding: 0,
    margin: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
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
  photoPlaceholder: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 6,
  },
  fieldLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  clinicInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    padding: 0,
  },
  keyboardDoneRow: {
    alignItems: 'flex-end',
    marginTop: Spacing.md,
  },
  keyboardDoneBtn: {
    backgroundColor: Colors.primaryText,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  keyboardDoneText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.primaryText,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.button.disabledBg,
  },
  saveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
  saveTextDisabled: {
    color: Colors.button.disabledText,
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
