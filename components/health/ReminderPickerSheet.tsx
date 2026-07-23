import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import SettingRow from '@/components/ui/SettingRow';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet, { repeatLabel } from '@/components/pickers/RepeatPickerSheet';
import { t } from '@/i18n';
import type { RepeatOption } from '@/services/reminders';
import type { HealthReminderDraft } from '@/services/healthReminder';
import {
  formatDisplayDate,
  isReminderDateTimeInPast,
  parseIsoDate,
  todayIsoDate,
} from '@/utils/calendar';

interface ReminderPickerSheetProps {
  visible: boolean;
  initialDate?: string | null;
  initialTime?: string | null;
  initialRepeat?: RepeatOption;
  onClose: () => void;
  onConfirm: (draft: HealthReminderDraft) => void;
}

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

/** Figma sheet chrome (375×812 frame). */
const SHEET = {
  height: 438,
  radius: 24,
  headerTop: 32,
  headerHeight: 32,
  /** Distance from sheet top to body (header 32+32 + 22 gap). */
  bodyTop: 86,
  bodyHeight: 352,
  bodyGap: 22,
  footerHeight: 84,
  buttonWidth: 335,
  buttonHeight: 48,
  buttonRadius: 12,
  closeSize: 32,
  closeRadius: 10,
  padH: 20,
} as const;

const TIME_CHIPS = [
  { id: 'morning', labelKey: 'health.reminder_chip_morning', time: '09:00' },
  { id: 'afternoon', labelKey: 'health.reminder_chip_afternoon', time: '13:00' },
  { id: 'evening', labelKey: 'health.reminder_chip_evening', time: '20:00' },
] as const;

type SubSheet = 'date' | 'time' | 'repeat' | null;

function chipForTime(time: string): string | null {
  const match = TIME_CHIPS.find((chip) => chip.time === time);
  return match?.id ?? null;
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Prefer the given time; if past, first future chip; else leave empty so Save stays disabled. */
function resolveInitialTime(isoDate: string, preferred: string): { time: string; chipId: string | null } {
  if (preferred && !isReminderDateTimeInPast(isoDate, preferred)) {
    return { time: preferred, chipId: chipForTime(preferred) };
  }
  for (const chip of TIME_CHIPS) {
    if (!isReminderDateTimeInPast(isoDate, chip.time)) {
      return { time: chip.time, chipId: chip.id };
    }
  }
  return { time: preferred || '13:00', chipId: chipForTime(preferred || '13:00') };
}

export default function ReminderPickerSheet({
  visible,
  initialDate,
  initialTime,
  initialRepeat = 'off',
  onClose,
  onConfirm,
}: ReminderPickerSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const [date, setDate] = useState(todayIsoDate());
  const [time, setTime] = useState('13:00');
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [selectedChip, setSelectedChip] = useState<string | null>('afternoon');
  const [subSheet, setSubSheet] = useState<SubSheet>(null);

  useEffect(() => {
    if (!visible) return;
    const nextDate = initialDate ?? todayIsoDate();
    const preferred = initialTime ?? '13:00';
    const resolved = resolveInitialTime(nextDate, preferred);
    setDate(nextDate);
    setTime(resolved.time);
    setRepeat(initialRepeat);
    setSelectedChip(resolved.chipId);
    setSubSheet(null);
  }, [visible, initialDate, initialTime, initialRepeat]);

  const canSave = useMemo(
    () => Boolean(date && time) && !isReminderDateTimeInPast(date, time),
    [date, time],
  );

  const layout = useMemo(() => {
    const bodyHeight = SHEET.bodyHeight * sy;
    const bodyGap = SHEET.bodyGap * sy;
    const footerHeight = SHEET.footerHeight * sy;
    return {
      /** Content chrome matches Figma 438; safe area is extra below. */
      sheetHeight: SHEET.height * sy + Math.max(0, insets.bottom),
      radius: SHEET.radius * sx,
      headerTop: SHEET.headerTop * sy,
      headerHeight: SHEET.headerHeight * sy,
      bodyHeight,
      bodyGap,
      footerHeight,
      cardHeight: Math.max(0, bodyHeight - bodyGap - footerHeight),
      buttonWidth: SHEET.buttonWidth * sx,
      buttonHeight: SHEET.buttonHeight * sy,
      buttonRadius: SHEET.buttonRadius * sx,
      closeSize: SHEET.closeSize * sx,
      closeRadius: SHEET.closeRadius * sx,
      padH: SHEET.padH * sx,
    };
  }, [sx, sy, insets.bottom]);

  const handleChipPress = (chipId: string, chipTime: string) => {
    if (isReminderDateTimeInPast(date, chipTime)) return;
    setSelectedChip(chipId);
    setTime(chipTime);
  };

  const handleDateConfirm = (iso: string) => {
    setDate(iso);
    if (isReminderDateTimeInPast(iso, time)) {
      const resolved = resolveInitialTime(iso, time);
      setTime(resolved.time);
      setSelectedChip(resolved.chipId);
    }
    setSubSheet(null);
  };

  const handleDone = () => {
    if (!canSave) return;
    onConfirm({ date, time, repeat });
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View
            style={[
              styles.sheet,
              {
                height: layout.sheetHeight,
                borderTopLeftRadius: layout.radius,
                borderTopRightRadius: layout.radius,
                paddingBottom: Math.max(0, insets.bottom),
              },
            ]}
          >
            <View
              style={[
                styles.header,
                {
                  marginTop: layout.headerTop,
                  height: layout.headerHeight,
                  paddingHorizontal: layout.padH,
                },
              ]}
            >
              <View style={{ width: layout.closeSize }} />
              <Text style={styles.title} numberOfLines={1}>
                {t('health.set_reminder')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    width: layout.closeSize,
                    height: layout.closeSize,
                    borderRadius: layout.closeRadius,
                  },
                ]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
              >
                <Ionicons name="close" size={22} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.body,
                {
                  height: layout.bodyHeight,
                  marginTop: layout.bodyGap,
                  gap: layout.bodyGap,
                  paddingHorizontal: layout.padH,
                },
              ]}
            >
              <View style={[styles.contentCard, { height: layout.cardHeight }]}>
                <Text style={styles.sectionTitle}>{t('common.today')}</Text>

                <View style={styles.chipsContainer}>
                  {TIME_CHIPS.map((chip) => {
                    const isSelected = selectedChip === chip.id;
                    const chipPast = isReminderDateTimeInPast(date, chip.time);
                    return (
                      <TouchableOpacity
                        key={chip.id}
                        style={[
                          styles.chip,
                          isSelected && styles.chipActive,
                          chipPast && !isSelected && styles.chipDisabled,
                        ]}
                        onPress={() => handleChipPress(chip.id, chip.time)}
                        disabled={chipPast}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            isSelected && styles.chipLabelActive,
                            chipPast && !isSelected && styles.chipLabelDisabled,
                          ]}
                        >
                          {t(chip.labelKey)}
                        </Text>
                        <Text
                          style={[
                            styles.chipTime,
                            isSelected && styles.chipTimeActive,
                            chipPast && !isSelected && styles.chipTimeDisabled,
                          ]}
                        >
                          {formatTimeDisplay(chip.time)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.settingsWrapper}>
                  <SettingRow
                    icon="calendar-outline"
                    label={t('reminders.field_date')}
                    value={formatDisplayDate(date)}
                    onPress={() => setSubSheet('date')}
                  />
                  <SettingRow
                    icon="time-outline"
                    label={t('reminders.field_time')}
                    value={formatTimeDisplay(time)}
                    onPress={() => setSubSheet('time')}
                  />
                  <SettingRow
                    icon="repeat-outline"
                    label={t('reminders.field_repeat')}
                    value={repeatLabel(repeat)}
                    hideDivider
                    onPress={() => setSubSheet('repeat')}
                  />
                </View>
              </View>

              <View style={[styles.footer, { height: layout.footerHeight }]}>
                <TouchableOpacity
                  style={[
                    styles.doneButton,
                    {
                      width: layout.buttonWidth,
                      height: layout.buttonHeight,
                      borderRadius: layout.buttonRadius,
                    },
                    !canSave && styles.doneButtonDisabled,
                  ]}
                  onPress={handleDone}
                  disabled={!canSave}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.doneButtonText, !canSave && styles.doneButtonTextDisabled]}>
                    {t('common.save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <BirthDatePickerSheet
        visible={subSheet === 'date'}
        initialDate={parseIsoDate(date)}
        allowFuture
        minDate={todayIsoDate()}
        title={t('reminders.field_date')}
        confirmLabel={t('pickers.done')}
        onClose={() => setSubSheet(null)}
        onConfirm={handleDateConfirm}
      />
      <TimePickerSheet
        visible={subSheet === 'time'}
        value={time}
        onClose={() => setSubSheet(null)}
        onConfirm={(value) => {
          setTime(value);
          setSelectedChip(chipForTime(value));
          setSubSheet(null);
        }}
      />
      <RepeatPickerSheet
        visible={subSheet === 'repeat'}
        value={repeat}
        onClose={() => setSubSheet(null)}
        onSelect={(value) => {
          setRepeat(value);
          setSubSheet(null);
        }}
      />
    </>
  );
}

const CARD_SHADOW = {
  shadowColor: '#1F1F1F',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      width: '100%',
      backgroundColor: c.panel,
      overflow: 'hidden',
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
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    closeButton: {
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 3,
    },
    body: {
      width: '100%',
    },
    contentCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      overflow: 'hidden',
      ...CARD_SHADOW,
    },
    sectionTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
      marginBottom: 12,
    },
    chipsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      flex: 1,
      backgroundColor: c.panel,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    chipActive: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    chipDisabled: {
      opacity: 0.45,
    },
    chipLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      color: c.secondaryText,
      marginBottom: 4,
    },
    chipLabelActive: {
      color: c.button.primaryText,
    },
    chipLabelDisabled: {
      color: c.secondaryText,
    },
    chipTime: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      color: c.primaryText,
    },
    chipTimeActive: {
      color: c.button.primaryText,
    },
    chipTimeDisabled: {
      color: c.secondaryText,
    },
    settingsWrapper: {
      marginTop: 4,
    },
    footer: {
      alignItems: 'center',
      justifyContent: 'center',
      // No divider / border — panel gap only between card and Save.
      borderTopWidth: 0,
    },
    doneButton: {
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    doneButtonDisabled: {
      backgroundColor: c.track,
    },
    doneButtonText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: c.button.primaryText,
    },
    doneButtonTextDisabled: {
      color: c.button.disabledText,
    },
  });
