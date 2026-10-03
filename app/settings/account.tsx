import React, { useEffect, useState } from 'react';
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
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
import { OnboardingPhotoAdd } from '@/components/brand/onboarding';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccountSettingsScreen() {
  const { user, signOut, markAccountName } = useAuth();
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savedEmail, setSavedEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [remotePhoto, setRemotePhoto] = useState<string | null>(null);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAccount()
      .then((profile) => {
        if (!active) return;
        setName(profile.name ?? '');
        setPhone(profile.phone ?? '');
        setEmail(profile.email);
        setSavedEmail(profile.email);
        setRemotePhoto(profile.photo_url ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const shownPhoto = localPhoto ?? (photoRemoved ? null : remotePhoto);
  const canSave = name.trim().length > 0 && !saving && !deleting;

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
      setLocalPhoto(picked.uri);
      setPhotoMime(picked.mimeType);
      setPhotoRemoved(false);
    }
  };

  const saveProfile = async () => {
    let photoUrl: string | null = photoRemoved ? null : remotePhoto;
    if (localPhoto) {
      photoUrl = await uploadAccountPhoto(localPhoto, photoMime);
    }
    const profile = await updateAccount({
      name: name.trim(),
      phone: phone.trim() || null,
      photo_url: photoUrl,
    });
    markAccountName(profile.name ?? name.trim());
    setRemotePhoto(profile.photo_url ?? null);
    setLocalPhoto(null);
    setPhotoRemoved(false);
    setPhone(profile.phone ?? '');
    return profile;
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!canSave) return;
    const nextEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(nextEmail)) {
      toast.showError(t('errors.invalid_email'));
      return;
    }
    try {
      setSaving(true);
      await saveProfile();
      if (nextEmail !== savedEmail.trim().toLowerCase()) {
        await sendAccountEmailOtp(nextEmail);
        setOtp('');
        setOtpVisible(true);
        return;
      }
      toast.show({ message: t('settings.account_saved') });
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cancelEmailChange = () => {
    setOtpVisible(false);
    setOtp('');
    setEmail(savedEmail);
  };

  const confirmEmail = async () => {
    const code = otp.trim();
    if (code.length !== 6 || saving) return;
    try {
      setSaving(true);
      const profile = await confirmAccountEmail(email.trim().toLowerCase(), code);
      setSavedEmail(profile.email);
      setEmail(profile.email);
      setOtpVisible(false);
      setOtp('');
      toast.show({ message: t('settings.account_saved') });
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmVisible(false);
    try {
      setDeleting(true);
      await deleteAccount();
      await signOut();
    } catch (err) {
      setDeleting(false);
      toast.showError(getErrorMessage(err));
    }
  };

  return (
    <>
      <HeaderScrollScreen
        header={<SettingsHeader title={t('settings.account')} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.form}>
          <Pressable
            onPress={() => setPhotoSheetVisible(true)}
            style={styles.photo}
            accessibilityRole="button"
            accessibilityLabel={t('pets.add_photo')}
          >
            {shownPhoto ? (
              <Image source={{ uri: shownPhoto }} style={styles.photoImage} contentFit="cover" />
            ) : (
              <OnboardingPhotoAdd width={128} height={128} />
            )}
          </Pressable>

          <TextInput
            value={name}
            onChangeText={setName}
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
              placeholder={t('settings.account_phone_placeholder')}
              placeholderTextColor={colors.secondaryText}
              style={styles.fieldValue}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveDisabled]}
          onPress={() => void handleSave()}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.button.primaryText} />
          ) : (
            <Text style={styles.saveLabel}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteRow}
          onPress={() => setConfirmVisible(true)}
          disabled={!savedEmail || deleting}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteLabel}>{t('settings.delete_account')}</Text>
        </TouchableOpacity>
      </HeaderScrollScreen>

      <EditPhotoSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        onTake={() => void pickImage('camera')}
        onChoose={() => void pickImage('library')}
        onRemove={shownPhoto ? () => { setPhotoSheetVisible(false); setLocalPhoto(null); setPhotoRemoved(true); } : undefined}
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
              disabled={otp.trim().length !== 6 || saving}
            >
              {saving ? (
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
    content: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 22,
    },
    form: {
      gap: 22,
      alignItems: 'center',
    },
    photo: {
      width: 128,
      height: 128,
      alignSelf: 'center',
    },
    photoImage: {
      width: 116,
      height: 116,
      borderRadius: 22,
      marginTop: 6,
      marginLeft: 6,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    nameInput: {
      alignSelf: 'stretch',
      height: 48,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
      color: c.primaryText,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
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
      gap: 10,
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
      lineHeight: 24,
      color: c.primaryText,
      padding: 0,
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
    deleteRow: {
      alignSelf: 'stretch',
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: '#E5484D',
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
