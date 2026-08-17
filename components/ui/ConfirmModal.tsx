import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useSettledModalVisible } from '@/components/ui/BottomSheetModal';
import { t } from '@/i18n';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

const MODAL = {
  maxWidth: 316,
  padH: 20,
  padV: 36,
  contentGap: 10,
  buttonRowGap: 12,
  buttonWidth: 120,
  buttonHeight: 44,
} as const;

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
  cancelText,
  variant = 'danger',
}: ConfirmModalProps) {
  const styles = useThemedStyles(makeStyles);
  const { contentWidth } = useResponsiveLayout();
  const modalWidth = Math.min(contentWidth + Spacing.lg * 2, MODAL.maxWidth);
  const presented = useSettledModalVisible(visible);

  if (!presented) return null;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onCancel}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  width: modalWidth,
                  maxWidth: '100%',
                  paddingHorizontal: MODAL.padH,
                  paddingVertical: MODAL.padV,
                  gap: MODAL.contentGap,
                },
              ]}
            >
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={[styles.buttonRow, { gap: MODAL.buttonRowGap }]}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      width: MODAL.buttonWidth,
                      height: MODAL.buttonHeight,
                      borderRadius: Radius.sm + 2,
                    },
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>{cancelText ?? t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    variant === 'primary' ? styles.confirmButtonPrimary : styles.confirmButton,
                    {
                      width: MODAL.buttonWidth,
                      height: MODAL.buttonHeight,
                      borderRadius: Radius.sm + 2,
                    },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      variant === 'primary' ? styles.confirmTextPrimary : styles.confirmText
                    }
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: c.surface,
    alignItems: 'center',
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    width: '100%',
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
    textAlign: 'center',
  },
  message: {
    width: '100%',
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
    textAlign: 'center',
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: c.category.medicalBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPrimary: {
    backgroundColor: c.button.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: c.primaryText,
    textAlign: 'center',
  },
  confirmText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: c.error,
    textAlign: 'center',
  },
  confirmTextPrimary: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: c.button.primaryText,
    textAlign: 'center',
  },
});
