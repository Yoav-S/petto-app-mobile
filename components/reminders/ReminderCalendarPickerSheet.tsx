import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import CalendarPickerCore from '@/components/pickers/CalendarPickerCore';
import { t } from '@/i18n';
import { parseIsoDate, minReminderDateIso, toIsoDate } from '@/utils/calendar';

interface ReminderCalendarPickerSheetProps {
  visible: boolean;
  value: string | null;
  onClose: () => void;
  onConfirm: (isoDate: string) => void;
}

export default function ReminderCalendarPickerSheet({
  visible,
  value,
  onClose,
  onConfirm,
}: ReminderCalendarPickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Date | null>(parseIsoDate(value));
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setDraft(parseIsoDate(value));
    setResetKey((k) => k + 1);
  }, [visible, value]);

  const handleConfirm = () => {
    if (!draft) return;
    onConfirm(toIsoDate(draft));
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('reminders.field_date')}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.primaryText} />
            </Pressable>
          </View>

          <CalendarPickerCore
            value={draft}
            onChange={setDraft}
            allowFuture
            minDate={minReminderDateIso()}
            resetKey={resetKey}
          />

          <Pressable
            style={[styles.doneButton, !draft && styles.doneButtonDisabled]}
            onPress={handleConfirm}
            disabled={!draft}
          >
            <Text style={styles.doneText}>{t('pickers.done')}</Text>
          </Pressable>
        </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
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
    headerSpacer: { width: 32 },
    title: {
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
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneButton: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    doneButtonDisabled: {
      backgroundColor: c.track,
    },
    doneText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.button.primaryText,
    },
  });
