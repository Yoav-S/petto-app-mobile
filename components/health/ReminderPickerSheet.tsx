import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import SettingRow from '@/components/ui/SettingRow';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet, { repeatLabel } from '@/components/pickers/RepeatPickerSheet';
import { t } from '@/i18n';
import type { RepeatOption } from '@/services/reminders';
import type { HealthReminderDraft } from '@/services/healthReminder';
import { formatDisplayDate, parseIsoDate, todayIsoDate } from '@/utils/calendar';

interface ReminderPickerSheetProps {
  visible: boolean;
  initialDate?: string | null;
  initialTime?: string | null;
  initialRepeat?: RepeatOption;
  onClose: () => void;
  onConfirm: (draft: HealthReminderDraft) => void;
}

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
  const [date, setDate] = useState(todayIsoDate());
  const [time, setTime] = useState('13:00');
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [selectedChip, setSelectedChip] = useState<string | null>('afternoon');
  const [subSheet, setSubSheet] = useState<SubSheet>(null);

  useEffect(() => {
    if (!visible) return;
    const nextDate = initialDate ?? todayIsoDate();
    const nextTime = initialTime ?? '13:00';
    setDate(nextDate);
    setTime(nextTime);
    setRepeat(initialRepeat);
    setSelectedChip(chipForTime(nextTime) ?? null);
    setSubSheet(null);
  }, [visible, initialDate, initialTime, initialRepeat]);

  const handleChipPress = (chipId: string, chipTime: string) => {
    setSelectedChip(chipId);
    setTime(chipTime);
  };

  const handleDone = () => {
    onConfirm({ date, time, repeat });
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />

            <View style={styles.header}>
              <View style={styles.headerSpacer} />
              <Text style={styles.title}>{t('health.add_reminder')}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.contentCard}>
                <Text style={styles.sectionTitle}>{t('common.today')}</Text>

                <View style={styles.chipsContainer}>
                  {TIME_CHIPS.map((chip) => {
                    const isSelected = selectedChip === chip.id;
                    return (
                      <TouchableOpacity
                        key={chip.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => handleChipPress(chip.id, chip.time)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>
                          {t(chip.labelKey)}
                        </Text>
                        <Text style={[styles.chipTime, isSelected && styles.chipTimeActive]}>
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
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.8}>
                <Text style={styles.doneButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BirthDatePickerSheet
        visible={subSheet === 'date'}
        initialDate={parseIsoDate(date)}
        allowFuture
        onClose={() => setSubSheet(null)}
        onConfirm={(iso) => {
          setDate(iso);
          setSubSheet(null);
        }}
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: c.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: c.primaryText,
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: c.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  contentCard: {
    backgroundColor: c.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.primaryText,
    marginBottom: Spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  chip: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: c.brand,
  },
  chipLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
    color: c.secondaryText,
    marginBottom: 4,
  },
  chipLabelActive: {
    color: c.surface,
  },
  chipTime: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: c.primaryText,
  },
  chipTimeActive: {
    color: c.surface,
  },
  settingsWrapper: {
    marginTop: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  doneButton: {
    backgroundColor: c.brand,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
