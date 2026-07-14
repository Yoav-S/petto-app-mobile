import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import InlineCalendarPicker from '@/components/vaccines/InlineCalendarPicker';
import { t } from '@/i18n';
import { parseIsoDate, minReminderDateIso } from '@/utils/calendar';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;
const SHEET_HEIGHT = 605;
const SHEET_RADIUS = 24;

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
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const [draft, setDraft] = useState<string | null>(value);

  useEffect(() => {
    if (!visible) return;
    setDraft(value);
  }, [visible, value]);

  const layout = useMemo(
    () => ({
      sheetHeight: SHEET_HEIGHT * sy + insets.bottom,
      radius: SHEET_RADIUS * sx,
      padH: 20 * sx,
      padTop: 20 * sy,
      buttonHeight: 48 * sy,
      buttonRadius: 12 * sx,
      buttonWidth: 335 * sx,
    }),
    [sx, sy, insets.bottom],
  );

  const handleConfirm = () => {
    if (!draft) return;
    onConfirm(draft);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              height: layout.sheetHeight,
              paddingBottom: insets.bottom + 16 * sy,
              borderTopLeftRadius: layout.radius,
              borderTopRightRadius: layout.radius,
              paddingHorizontal: layout.padH,
              paddingTop: layout.padTop,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('reminders.field_date')}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.primaryText} />
            </Pressable>
          </View>

          <View style={styles.calendarWrap}>
            <InlineCalendarPicker
              value={parseIsoDate(draft)}
              onChange={setDraft}
              allowFuture
              minDate={minReminderDateIso()}
            />
          </View>

          <Pressable
            style={[
              styles.doneButton,
              {
                width: layout.buttonWidth,
                height: layout.buttonHeight,
                borderRadius: layout.buttonRadius,
                alignSelf: 'center',
              },
              !draft && styles.doneButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!draft}
          >
            <Text style={styles.doneText}>{t('pickers.done')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerSpacer: { width: 32 },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    color: Colors.primaryText,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarWrap: {
    flex: 1,
  },
  doneButton: {
    backgroundColor: Colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  doneButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  doneText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
