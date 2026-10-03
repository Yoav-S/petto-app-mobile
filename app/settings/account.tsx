import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/i18n';
import {
  confirmAccountEmail,
  deleteAccount,
  fetchAccount,
  sendAccountEmailOtp,
  updateAccount,
} from '@/services/auth';
import { getErrorMessage } from '@/services/errors';
import { pickImageFromCamera, pickImageFromLibrary } from '@/services/imagePicker';
import { uploadAccountPhoto } from '@/services/storage';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ConfirmModal from '@/components/ui/ConfirmModal';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { HealthFormScreen } from '@/components/health/HealthKeyboardFooter';
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
import { OnboardingPhotoAdd } from '@/components/brand/onboarding';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHOTO_SIZE = 128;

type Draft = {
  name: string;
  phone: string;
  email: string;
  remotePhoto: string | null;
  localPhoto: string | null;
  photoMime: string | null;
  photoRemoved: boolean;
};

export default function AccountSettingsScreen() {
  const navigation = useNavigation();
  const { user, signOut, markAccountName, markAccountPhoto } = useAuth();
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [remotePhoto, setRemotePhoto] = useState<string | null>(null);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const readyRef = useRef(false);

  const committed = useRef({
    name: '',
    phone: '',
    email: (user?.email ?? '').trim().toLowerCase(),
    photo: null as string | null,
  });
  const draft = useRef<Draft>({
    name: '',
    phone: '',
    email: user?.email ?? '',
    remotePhoto: null,
    localPhoto: null,
    photoMime: null,
    photoRemoved: false,
  });
  const saveQueue = useRef(Promise.resolve());
  const leavingRef = useRef(false);
  const deletingRef = useRef(false);

  draft.current = {
    name,
    phone,
    email,
    remotePhoto,
    localPhoto,
    photoMime,
    photoRemoved,
  };

  useEffect(() => {
    let active = true;
    fetchAccount()
      .then((profile) => {
        if (!active) return;
        const nextName = profile.name ?? '';
        const nextPhone = profile.phone ?? '';
        const nextEmail = profile.email;
        const nextPhoto = profile.photo_url ?? null;
        setName(nextName);
        setPhone(nextPhone);
        setEmail(nextEmail);
        setRemotePhoto(nextPhoto);
        committed.current = {
          name: nextName.trim(),
          phone: nextPhone.trim(),
          email: nextEmail.trim().toLowerCase(),
          photo: nextPhoto,
        };
        readyRef.current = true;
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const shownPhoto = localPhoto ?? (photoRemoved ? null : remotePhoto);

  const enqueue = (task: () => Promise<void>) => {
    saveQueue.current = saveQueue.current.then(task, task);
    return saveQueue.current;
  };

  const commitProfile = (source: Draft = draft.current) =>
    enqueue(async () => {
      if (!readyRef.current) return;
      const nextName = source.name.trim();
      if (!nextName) {
        setName(committed.current.name);
        return;
      }
      let photoUrl: string | null = source.photoRemoved ? null : source.remotePhoto;
      if (source.localPhoto) {
        photoUrl = await uploadAccountPhoto(source.localPhoto, source.photoMime);
      }
      const nextPhone = source.phone.trim();
      if (
        nextName === committed.current.name &&
        nextPhone === committed.current.phone &&
        photoUrl === committed.current.photo
      ) {
        return;
      }
      const profile = await updateAccount({
        name: nextName,
        phone: nextPhone || null,
        photo_url: photoUrl,
      });
      committed.current = {
        ...committed.current,
        name: (profile.name ?? nextName).trim(),
        phone: (profile.phone ?? '').trim(),
        photo: profile.photo_url ?? null,
      };
      markAccountName(profile.name ?? nextName);
      markAccountPhoto(profile.photo_url ?? null);
      setRemotePhoto(profile.photo_url ?? null);
      setLocalPhoto(null);
      setPhotoRemoved(false);
      setPhone(profile.phone ?? '');
    });

  const commitProfileRef = useRef(commitProfile);
  commitProfileRef.current = commitProfile;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (leavingRef.current || deletingRef.current || !readyRef.current) return;
      const source = draft.current;
      const nextName = source.name.trim();
      const nextPhone = source.phone.trim();
      const dirty =
        Boolean(nextName) &&
        (nextName !== committed.current.name ||
          nextPhone !== committed.current.phone ||
          Boolean(source.localPhoto) ||
          source.photoRemoved);
      if (!dirty) return;
      event.preventDefault();
      leavingRef.current = true;
      void commitProfileRef
        .current(source)
        .catch((err) => {
          leavingRef.current = false;
          toast.showError(getErrorMessage(err));
        })
        .then(() => {
          if (leavingRef.current) navigation.dispatch(event.data.action);
        });
    });
    return unsubscribe;
  }, [navigation, toast]);

  const commitEmail = async () => {
    const nextEmail = draft.current.email.trim().toLowerCase();
    if (nextEmail === committed.current.email) return;
    if (!EMAIL_RE.test(nextEmail)) {
      toast.showError(t('errors.invalid_email'));
      setEmail(committed.current.email);
      return;
    }
    try {
      await commitProfile();
      await sendAccountEmailOtp(nextEmail);
      setOtp('');
      setOtpVisible(true);
    } catch (err) {
      toast.showError(getErrorMessage(err));
    }
  };

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
    if (!picked?.uri) return;
    const next: Draft = {
      ...draft.current,
      localPhoto: picked.uri,
      photoMime: picked.mimeType,
      photoRemoved: false,
    };
    setLocalPhoto(picked.uri);
    setPhotoMime(picked.mimeType);
    setPhotoRemoved(false);
    void commitProfile(next).catch((err) => toast.showError(getErrorMessage(err)));
  };

  const removePhoto = () => {
    setPhotoSheetVisible(false);
    const next: Draft = {
      ...draft.current,
      localPhoto: null,
      photoRemoved: true,
    };
    setLocalPhoto(null);
    setPhotoRemoved(true);
    void commitProfile(next).catch((err) => toast.showError(getErrorMessage(err)));
  };

  const cancelEmailChange = () => {
    setOtpVisible(false);
    setOtp('');
    setEmail(committed.current.email);
  };

  const confirmEmail = async () => {
    const code = otp.trim();
    if (code.length !== 6 || savingEmail) return;
    try {
      setSavingEmail(true);
      const profile = await confirmAccountEmail(draft.current.email.trim().toLowerCase(), code);
      committed.current = { ...committed.current, email: profile.email.trim().toLowerCase() };
      setEmail(profile.email);
      setOtpVisible(false);
      setOtp('');
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setSavingEmail(false);
    }
  };

  const handleDelete = async () => {
    setConfirmVisible(false);
    deletingRef.current = true;
    try {
      setDeleting(true);
      await deleteAccount();
      await signOut();
    } catch (err) {
      deletingRef.current = false;
      setDeleting(false);
      toast.showError(getErrorMessage(err));
    }
  };

  return (
    <>
      <HeaderScrollLayout
        header={<SettingsHeader title={t('settings.account')} />}
        edges={['left', 'right']}
        bottomFade
        fadeMode="form"
      >
        {({ paddingTop }) => (
          <HealthFormScreen
            scrollInsetTop={paddingTop}
            contentContainerStyle={styles.form}
            footer={{
              label: t('settings.delete_account'),
              tone: 'destructive-text',
              loading: deleting,
              disabled: !committed.current.email || deleting,
              onPress: () => setConfirmVisible(true),
            }}
          >
            <Pressable
              onPress={() => setPhotoSheetVisible(true)}
              style={styles.photo}
              accessibilityRole="button"
              accessibilityLabel={t('pets.add_photo')}
            >
              {shownPhoto ? (
                <Image source={{ uri: shownPhoto }} style={styles.photoImage} contentFit="cover" />
              ) : (
                <OnboardingPhotoAdd width={PHOTO_SIZE} height={PHOTO_SIZE} />
              )}
            </Pressable>

            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={() => {
                void commitProfile().catch((err) => toast.showError(getErrorMessage(err)));
              }}
              placeholder={t('settings.account_name_placeholder')}
              placeholderTextColor={colors.secondaryText}
              style={styles.nameInput}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <View style={styles.tallField}>
              <Text style={styles.fieldLabel}>{t('settings.account_email')}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onBlur={() => {
                  Keyboard.dismiss();
                  void commitEmail();
                }}
                placeholder="example@gmail.com"
                placeholderTextColor={colors.secondaryText}
                style={styles.fieldValue}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.tallField}>
              <Text style={styles.fieldLabel}>{t('settings.account_phone')}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                onBlur={() => {
                  void commitProfile().catch((err) => toast.showError(getErrorMessage(err)));
                }}
                placeholder={t('settings.account_phone_placeholder')}
                placeholderTextColor={colors.secondaryText}
                style={styles.fieldValue}
                keyboardType="phone-pad"
              />
            </View>
          </HealthFormScreen>
        )}
      </HeaderScrollLayout>

      <EditPhotoSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        onTake={() => void pickImage('camera')}
        onChoose={() => void pickImage('library')}
        onRemove={shownPhoto ? removePhoto : undefined}
      />

      <ConfirmModal
        visible={confirmVisible}
        title={t('settings.delete_account_confirm_title')}
        message={t('settings.delete_account_confirm_body')}
        confirmText={t('settings.delete_account')}
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmVisible(false)}
      />

      <Modal visible={otpVisible} transparent animationType="fade" onRequestClose={cancelEmailChange}>
        <View style={styles.otpBackdrop}>
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>{t('settings.account_email_otp_title')}</Text>
            <Text style={styles.otpBody}>{t('settings.account_email_otp_body')}</Text>
            <TextInput
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={colors.secondaryText}
            />
            <TouchableOpacity
              style={[styles.saveButton, otp.trim().length !== 6 && styles.saveDisabled]}
              onPress={() => void confirmEmail()}
              disabled={otp.trim().length !== 6 || savingEmail}
            >
              {savingEmail ? (
                <ActivityIndicator color={colors.button.primaryText} />
              ) : (
                <Text style={styles.saveLabel}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelEmailChange} style={styles.otpCancel}>
              <Text style={styles.otpCancelLabel}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    form: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      gap: 22,
      alignItems: 'center',
    },
    photo: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      borderRadius: 22,
      backgroundColor: c.surface,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 20 / 255,
      shadowRadius: 20,
      elevation: 4,
    },
    photoImage: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      borderRadius: 22,
    },
    nameInput: {
      alignSelf: 'stretch',
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
      color: c.primaryText,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 1,
    },
    tallField: {
      alignSelf: 'stretch',
      minHeight: 78,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 6,
      backgroundColor: c.surface,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 1,
    },
    fieldLabel: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    fieldValue: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      color: c.primaryText,
      padding: 0,
      margin: 0,
    },
    saveButton: {
      alignSelf: 'stretch',
      height: PRIMARY_BUTTON.height,
      borderRadius: PRIMARY_BUTTON.borderRadius,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveDisabled: {
      opacity: 0.5,
    },
    saveLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: c.button.primaryText,
    },
    otpBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    otpCard: {
      width: '100%',
      borderRadius: 16,
      backgroundColor: c.surface,
      padding: 20,
      gap: 12,
    },
    otpTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 18,
      lineHeight: 24,
      color: c.primaryText,
    },
    otpBody: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    otpInput: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: c.background,
      color: c.primaryText,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      letterSpacing: 4,
    },
    otpCancel: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    otpCancelLabel: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.secondaryText,
    },
  });
