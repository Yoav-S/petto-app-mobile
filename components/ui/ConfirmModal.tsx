import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const DELETE_BG = '#FEE2E2';
const DELETE_TEXT = '#EF4444';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelText?: string;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
  cancelText,
}: ConfirmModalProps) {
  const { width, height } = useWindowDimensions();
  const styles = useThemedStyles(makeStyles);
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const layout = useMemo(
    () => ({
      modalWidth: 316 * sx,
      modalRadius: 16 * sx,
      modalPadH: 20 * sx,
      modalPadV: 36 * sy,
      contentGap: 10 * sy,
      contentWidth: 276 * sx,
      titleHeight: 20 * sy,
      messageMinHeight: 20 * sy,
      buttonRowHeight: 44 * sy,
      buttonRowGap: 12 * sx,
      buttonWidth: 120 * sx,
      buttonHeight: 44 * sy,
      buttonRadius: 10 * sx,
      buttonPadV: 12 * sy,
      buttonPadH: 16 * sx,
    }),
    [sx, sy],
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  width: layout.modalWidth,
                  borderRadius: layout.modalRadius,
                  paddingHorizontal: layout.modalPadH,
                  paddingVertical: layout.modalPadV,
                  gap: layout.contentGap,
                },
              ]}
            >
              <Text
                style={[
                  styles.title,
                  { width: layout.contentWidth, minHeight: layout.titleHeight },
                ]}
              >
                {title}
              </Text>

              <Text
                style={[
                  styles.message,
                  { width: layout.contentWidth, minHeight: layout.messageMinHeight },
                ]}
              >
                {message}
              </Text>

              <View
                style={[
                  styles.buttonRow,
                  {
                    width: layout.contentWidth,
                    height: layout.buttonRowHeight,
                    gap: layout.buttonRowGap,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      width: layout.buttonWidth,
                      height: layout.buttonHeight,
                      borderRadius: layout.buttonRadius,
                      paddingVertical: layout.buttonPadV,
                      paddingHorizontal: layout.buttonPadH,
                    },
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>{cancelText ?? t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      width: layout.buttonWidth,
                      height: layout.buttonHeight,
                      borderRadius: layout.buttonRadius,
                      paddingVertical: layout.buttonPadV,
                      paddingHorizontal: layout.buttonPadH,
                    },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
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
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: c.surface,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
    textAlign: 'center',
  },
  buttonRow: {
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
    backgroundColor: DELETE_BG,
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
    color: DELETE_TEXT,
    textAlign: 'center',
  },
});
