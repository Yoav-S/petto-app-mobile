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
  /** Title → subtitle. */
  copyGap: 6,
  /** Subtitle → buttons: ~3× the title/subtitle gap (Figma inner 20). */
  copyToButtonsGap: 20,
  buttonRowGap: 12,
  buttonPadH: 16,
  buttonPadV: 12,
  buttonHeight: 44,
  buttonRadius: 10,
} as const;

/** Both dialog buttons share the row and size themselves to their label. */
const BUTTON_SHAPE: ViewStyle = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 0,
  minWidth: 0,
  maxWidth: '100%',
  minHeight: MODAL.buttonHeight,
  paddingHorizontal: MODAL.buttonPadH,
  paddingVertical: MODAL.buttonPadV,
  borderRadius: MODAL.buttonRadius,
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
                  gap: MODAL.copyToButtonsGap,
                },
              ]}
            >
              <View style={[styles.copyBlock, { gap: MODAL.copyGap }]}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
              </View>

              <View style={[styles.buttonRow, { gap: MODAL.buttonRowGap }]}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>{cancelText ?? t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    variant === 'primary' ? styles.confirmButtonPrimary : styles.confirmButton
                  }
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

/** Save-button screens: leave without writing the current edits. */
export function DiscardChangesModal({
  visible,
  onDiscard,
  onStay,
}: {
  visible: boolean;
  onDiscard: () => void;
  onStay: () => void;
}) {
  return (
    <ConfirmModal
      visible={visible}
      title={t('common.discard_title')}
      message={t('common.discard_body')}
      confirmText={t('common.discard')}
      onConfirm={onDiscard}
      onCancel={onStay}
    />
  );
}

export function SignOutModal({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmModal
      visible={visible}
      title={t('common.sign_out_title')}
      message={t('common.sign_out_body')}
      confirmText={t('common.sign_out')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
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
    alignItems: 'stretch',
    borderRadius: Radius.lg,
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  copyBlock: {
    width: '100%',
    alignItems: 'center',
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
    alignItems: 'stretch',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  cancelButton: {
    ...BUTTON_SHAPE,
    backgroundColor: c.panel,
  },
  confirmButton: {
    ...BUTTON_SHAPE,
    backgroundColor: c.dangerSoft,
  },
  confirmButtonPrimary: {
    ...BUTTON_SHAPE,
    backgroundColor: c.button.primaryBg,
  },
  cancelText: {
    width: '100%',
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: c.primaryText,
    textAlign: 'center',
    flexShrink: 1,
  },
  confirmText: {
    width: '100%',
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: c.error,
    textAlign: 'center',
    flexShrink: 1,
  },
  confirmTextPrimary: {
    width: '100%',
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: c.button.primaryText,
    textAlign: 'center',
    flexShrink: 1,
  },
});
