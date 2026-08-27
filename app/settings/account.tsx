import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { t } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount } from '@/services/auth';
import { getErrorMessage } from '@/services/errors';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

export default function AccountSettingsScreen() {
  const { user, signOut } = useAuth();
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const toast = useToast();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const email = user?.email ?? '';
  const canDelete = !!email && !deleting;

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
        <View style={styles.card}>
          <View style={styles.emailSection}>
            <Text style={styles.emailLabel}>{t('settings.account_email')}</Text>
            <Text style={styles.emailValue} numberOfLines={1} ellipsizeMode="tail">
              {email || '\u2014'}
            </Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.deleteRow}
            onPress={() => setConfirmVisible(true)}
            disabled={!canDelete}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            {deleting ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={[styles.deleteText, !canDelete && styles.deleteTextDisabled]}>
                {t('settings.delete_account')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </HeaderScrollScreen>

      <ConfirmModal
        visible={confirmVisible}
        title={t('settings.delete_account_confirm_title')}
        message={t('settings.delete_account_confirm_body')}
        confirmText={t('settings.delete_account')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  content: {
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  emailSection: {
    gap: 6,
  },
  emailLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
  },
  emailValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: c.primaryText,
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
  },
  deleteRow: {
    minHeight: 20,
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.error,
  },
  deleteTextDisabled: {
    opacity: 0.5,
  },
});
