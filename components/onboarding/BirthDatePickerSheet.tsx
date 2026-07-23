import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import CalendarPickerCore from '@/components/pickers/CalendarPickerCore';
import { toIsoDate } from '@/utils/calendar';

interface BirthDatePickerSheetProps {
  visible: boolean;
  initialDate: Date | null;
  onClose: () => void;
  onConfirm: (isoDate: string) => void;
  /** Allow selecting dates in the future (reminders / vaccine next date). */
  allowFuture?: boolean;
  /** Optional sheet title override. */
  title?: string;
  /** Confirm button label. Defaults to onboarding Continue. */
  confirmLabel?: string;
  /** Earliest selectable date (YYYY-MM-DD). */
  minDate?: string;
}

export default function BirthDatePickerSheet({
  visible,
  initialDate,
  onClose,
  onConfirm,
  allowFuture = false,
  title,
  confirmLabel,
  minDate,
}: BirthDatePickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Date | null>(initialDate);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setSelected(initialDate);
    setResetKey((k) => k + 1);
  }, [visible, initialDate]);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(toIsoDate(selected));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {title ?? t('petOnboarding.birth_sheet_title')}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={t('petOnboarding.photo_close_a11y')}
            >
              <Ionicons name="close" size={24} color={colors.primaryText} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <CalendarPickerCore
              value={selected}
              onChange={setSelected}
              allowFuture={allowFuture}
              minDate={minDate}
              resetKey={resetKey}
            />
          </View>

          <Pressable
            onPress={handleConfirm}
            disabled={!selected}
            style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
          >
            <Text style={styles.confirmText}>
              {confirmLabel ?? t('onboarding.continue')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      width: '100%',
      backgroundColor: c.panel,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 28,
      paddingHorizontal: 20,
      gap: 22,
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
    },
    headerSpacer: {
      width: 32,
    },
    sheetTitle: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
      textAlign: 'center',
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      width: '100%',
    },
    confirmBtn: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    confirmBtnDisabled: {
      backgroundColor: c.track,
    },
    confirmText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: c.button.primaryText,
      textAlign: 'center',
    },
  });
