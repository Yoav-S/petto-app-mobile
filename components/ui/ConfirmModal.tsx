import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  type ViewStyle,
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
  /** Floor only — both buttons share the row and grow with their labels. */
  buttonMinWidth: 120,
  buttonPadH: 12,
  buttonHeight: 44,
} as const;

/** Both dialog buttons share the row and size themselves to their label. */
const BUTTON_SHAPE: ViewStyle = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
  minWidth: MODAL.buttonMinWidth,
  paddingHorizontal: MODAL.buttonPadH,
  alignItems: 'center',
  justifyContent: 'center',
};

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
                      minHeight: MODAL.buttonHeight,
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
                      minHeight: MODAL.buttonHeight,
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
    ...BUTTON_SHAPE,
    backgroundColor: c.surface,
  },
  confirmButton: {
    ...BUTTON_SHAPE,
    backgroundColor: c.category.medicalBg,
  },
  confirmButtonPrimary: {
    ...BUTTON_SHAPE,
    backgroundColor: c.button.primaryBg,
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
