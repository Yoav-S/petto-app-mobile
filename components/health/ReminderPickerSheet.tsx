import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet, { repeatLabel } from '@/components/pickers/RepeatPickerSheet';
import { t } from '@/i18n';
import type { RepeatOption } from '@/services/reminders';
import type { HealthReminderDraft } from '@/services/healthReminder';
import {
  formatDisplayDate,
  formatDisplayTime,
  formatHourMinute,
  isIsoDateBefore,
  isReminderDateTimeInPast,
  minReminderDateIso,
  parseIsoDate,
  todayIsoDate,
} from '@/utils/calendar';
import {
  clampReminderTimeForDate,
  isReminderScheduleInPast,
  minReminderTimeForDate,
} from '@/components/reminders/reminderFormShared';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface ReminderPickerSheetProps {
  visible: boolean;
  initialDate?: string | null;
  initialTime?: string | null;
  initialRepeat?: RepeatOption;
  onClose: () => void;
  onConfirm: (draft: HealthReminderDraft) => void;
}

/** Figma sheet chrome (375×812 frame). */
const SHEET = {
  height: 438,
  radius: 24,
  headerTop: 32,
  headerHeight: 32,
  bodyTop: 86,
  bodyGap: 22,
  footerHeight: 84,
  contentWidth: 335,
  cardHeight: 246,
  cardPadTop: 16,
  cardPadBottom: 8,
  cardPadH: 16,
  cardRadius: 12,
  innerHeight: 222,
  innerGap: 22,
  todayBlockHeight: 80,
  todayTitleHeight: 20,
  todayBlockGap: 12,
  chipsRowHeight: 48,
  chipsGap: 16,
  chipHeight: 48,
  chipPadV: 6,
  chipPadH: 12,
  chipGap: 4,
  chipRadius: 12,
  /** Card: 335×120, 14/16 padding → 303×92 inner, 8px between rows. */
  settingsHeight: 120,
  settingsPadV: 14,
  /** Rows and dividers span the full 303pt inner width. */
  settingsPadH: 0,
  settingsInnerGap: 8,
  settingsRowHeight: 25,
  buttonWidth: 335,
  buttonHeight: 48,
  buttonRadius: 12,
  closeSize: 32,
  closeRadius: 10,
  padH: 20,
} as const;

const TIME_CHIPS = [
  { id: 'morning', labelKey: 'topics.reminder_chip_morning', time: '09:00' },
  { id: 'afternoon', labelKey: 'topics.reminder_chip_afternoon', time: '13:00' },
  { id: 'evening', labelKey: 'topics.reminder_chip_evening', time: '20:00' },
] as const;

type SubSheet = 'date' | 'time' | 'repeat' | null;

function chipForTime(time: string): string | null {
  const match = TIME_CHIPS.find((chip) => chip.time === time);
  return match?.id ?? null;
}

function formatTimeDisplay(time: string): string {
  return formatDisplayTime(time);
}

function resolveInitialDate(preferred?: string | null): string {
  const min = minReminderDateIso();
  if (!preferred || isIsoDateBefore(preferred, min)) return min;
  return preferred;
}

function resolveInitialTime(
  date: string,
  preferred: string,
): { time: string; chipId: string | null } {
  const time =
    clampReminderTimeForDate(date, preferred || formatHourMinute(13, 0)) ??
    preferred ??
    formatHourMinute(13, 0);
  return { time, chipId: chipForTime(time) };
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
  const { contentWidth } = useResponsiveLayout();

  const [date, setDate] = useState(minReminderDateIso);
  const [time, setTime] = useState('13:00');
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [selectedChip, setSelectedChip] = useState<string | null>('afternoon');
  const [subSheet, setSubSheet] = useState<SubSheet>(null);

  useEffect(() => {
    if (!visible) {
      setSubSheet(null);
      return;
    }
    const nextDate = resolveInitialDate(initialDate);
    const preferred = initialTime ?? '13:00';
    const resolved = resolveInitialTime(nextDate, preferred);
    setDate(nextDate);
    setTime(resolved.time);
    setRepeat(initialRepeat);
    setSelectedChip(resolved.chipId);
    setSubSheet(null);
  }, [visible, initialDate, initialTime, initialRepeat]);

  const canSave = useMemo(
    () => Boolean(date && time) && !isReminderScheduleInPast(date, time),
    [date, time],
  );

  /** Stable Date for BirthDatePickerSheet — a new object each render resets the calendar. */
  const parsedDate = useMemo(() => parseIsoDate(date), [date]);

  /**
   * Never stack two RN Modals (parent reminder + date/time/repeat).
   * That freezes iOS simulators/devices. Hide the parent while a sub-sheet is open,
   * matching the exclusive-sheet pattern used by ReminderFormBody.
   */
  const parentVisible = visible && subSheet === null;

  const layout = useMemo(
    () => ({
      sheetHeight: SHEET.height + Math.max(0, insets.bottom),
      radius: SHEET.radius,
      headerTop: SHEET.headerTop,
      headerHeight: SHEET.headerHeight,
      bodyGap: SHEET.bodyGap,
      footerHeight: SHEET.footerHeight,
      contentWidth,
      cardHeight: SHEET.cardHeight,
      cardPadTop: SHEET.cardPadTop,
      cardPadBottom: SHEET.cardPadBottom,
      cardPadH: SHEET.cardPadH,
      cardRadius: SHEET.cardRadius,
      innerGap: SHEET.innerGap,
      todayBlockHeight: SHEET.todayBlockHeight,
      todayTitleHeight: SHEET.todayTitleHeight,
      todayBlockGap: SHEET.todayBlockGap,
      chipsRowHeight: SHEET.chipsRowHeight,
      chipsGap: SHEET.chipsGap,
      chipHeight: SHEET.chipHeight,
      chipPadV: SHEET.chipPadV,
      chipPadH: SHEET.chipPadH,
      chipGap: SHEET.chipGap,
      chipRadius: SHEET.chipRadius,
      settingsHeight: SHEET.settingsHeight,
      settingsPadV: SHEET.settingsPadV,
      settingsPadH: SHEET.settingsPadH,
      settingsInnerGap: SHEET.settingsInnerGap,
      settingsRowHeight: SHEET.settingsRowHeight,
      buttonWidth: '100%' as const,
      buttonHeight: SHEET.buttonHeight,
      buttonRadius: SHEET.buttonRadius,
      closeSize: SHEET.closeSize,
      closeRadius: SHEET.closeRadius,
      padH: SHEET.padH,
    }),
    [contentWidth, insets.bottom],
  );

  const handleChipPress = (chipId: string, chipTime: string) => {
    const today = todayIsoDate();
    if (isReminderDateTimeInPast(today, chipTime)) return;
    setDate(today);
    setSelectedChip(chipId);
    setTime(chipTime);
  };

  const handleDateConfirm = (iso: string) => {
    const nextDate = resolveInitialDate(iso);
    const nextTime = clampReminderTimeForDate(nextDate, time) ?? time;
    setDate(nextDate);
    setTime(nextTime);
    setSelectedChip(chipForTime(nextTime));
    setSubSheet(null);
  };

  const handleDone = () => {
    if (!canSave) return;
    onConfirm({ date, time, repeat });
    onClose();
  };

  const scheduleRows: {
    key: SubSheet;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }[] = [
    {
      key: 'date',
      icon: 'calendar-outline',
      label: t('reminders.field_date'),
      value: formatDisplayDate(date),
    },
    {
      key: 'time',
      icon: 'time-outline',
      label: t('reminders.field_time'),
      value: formatTimeDisplay(time),
    },
    {
      key: 'repeat',
      icon: 'repeat-outline',
      label: t('reminders.field_repeat'),
      value: repeatLabel(repeat),
    },
  ];

  return (
    <>
      <BottomSheetModal visible={parentVisible} onClose={onClose}>
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
                {t('topics.set_reminder')}
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
                  marginTop: layout.bodyGap,
                  gap: layout.bodyGap,
                  alignItems: 'center',
                },
              ]}
            >
              <View
                style={[
                  styles.contentCard,
                  {
                    width: layout.contentWidth,
                    minHeight: layout.cardHeight,
                    borderRadius: layout.cardRadius,
                    paddingTop: layout.cardPadTop,
                    paddingBottom: layout.cardPadBottom,
                    paddingHorizontal: layout.cardPadH,
                  },
                ]}
              >
                <View style={[styles.cardInner, { gap: layout.innerGap }]}>
                  <View
                    style={[
                      styles.todayBlock,
                      {
                        height: layout.todayBlockHeight,
                        gap: layout.todayBlockGap,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.sectionTitle, { height: layout.todayTitleHeight, lineHeight: layout.todayTitleHeight }]}
                    >
                      {t('common.today')}
                    </Text>

                    <View
                      style={[
                        styles.chipsContainer,
                        {
                          height: layout.chipsRowHeight,
                          gap: layout.chipsGap,
                        },
                      ]}
                    >
                      {TIME_CHIPS.map((chip) => {
                        const isSelected = selectedChip === chip.id && date === todayIsoDate();
                        const isPast = isReminderDateTimeInPast(todayIsoDate(), chip.time);
                        return (
                          <TouchableOpacity
                            key={chip.id}
                            style={[
                              styles.chip,
                              {
                                height: layout.chipHeight,
                                borderRadius: layout.chipRadius,
                                paddingVertical: layout.chipPadV,
                                paddingHorizontal: layout.chipPadH,
                                gap: layout.chipGap,
                              },
                              isSelected && styles.chipActive,
                              isPast && styles.chipDisabled,
                            ]}
                            onPress={() => handleChipPress(chip.id, chip.time)}
                            disabled={isPast}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.chipLabel,
                                isSelected && styles.chipLabelActive,
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.8}
                            >
                              {t(chip.labelKey)}
                            </Text>
                            <Text
                              style={[
                                styles.chipTime,
                                isSelected && styles.chipTimeActive,
                              ]}
                              numberOfLines={1}
                            >
                              {formatTimeDisplay(chip.time)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.settingsBlock,
                      {
                        minHeight: layout.settingsHeight,
                        borderRadius: layout.cardRadius,
                        paddingVertical: layout.settingsPadV,
                        paddingHorizontal: layout.settingsPadH,
                      },
                    ]}
                  >
                    {scheduleRows.map((row, index) => (
                      <React.Fragment key={row.key}>
                        <TouchableOpacity
                          style={[
                            styles.scheduleRow,
                            { minHeight: layout.settingsRowHeight },
                          ]}
                          onPress={() => setSubSheet(row.key)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.scheduleLeft}>
                            <Ionicons
                              name={row.icon}
                              size={18}
                              color={colors.primaryText}
                              style={styles.scheduleIcon}
                            />
                            <Text style={styles.scheduleLabel}>{row.label}</Text>
                          </View>
                          <Text
                            style={[
                              styles.scheduleValue,
                              row.key === 'repeat' ? styles.scheduleRepeatValue : null,
                            ]}
                            numberOfLines={1}
                          >
                            {row.value}
                          </Text>
                        </TouchableOpacity>
                        {index < scheduleRows.length - 1 ? (
                          <View style={styles.scheduleDivider} />
                        ) : null}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              </View>

              <View style={[styles.footer, { height: layout.footerHeight, width: layout.contentWidth }]}>
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
      </BottomSheetModal>

      <BirthDatePickerSheet
        visible={visible && subSheet === 'date'}
        initialDate={parsedDate}
        allowFuture
        minDate={minReminderDateIso()}
        title={t('reminders.field_date')}
        confirmLabel={t('pickers.done')}
        onClose={() => setSubSheet(null)}
        onConfirm={handleDateConfirm}
      />
      <TimePickerSheet
        visible={visible && subSheet === 'time'}
        value={time}
        minTime={minReminderTimeForDate(date)}
        onClose={() => setSubSheet(null)}
        onConfirm={(value) => {
          const next = clampReminderTimeForDate(date, value) ?? value;
          setTime(next);
          setSelectedChip(chipForTime(next));
          setSubSheet(null);
        }}
      />
      <RepeatPickerSheet
        visible={visible && subSheet === 'repeat'}
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

const CHIP_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
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
      ...CARD_SHADOW,
    },
    cardInner: {
      flex: 1,
      width: '100%',
    },
    todayBlock: {
      width: '100%',
    },
    sectionTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
      textAlign: 'left',
      alignSelf: 'flex-start',
      width: '100%',
    },
    chipsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
    },
    chip: {
      /** Width follows the label; only shrinks when the row runs out of space. */
      flexGrow: 0,
      flexShrink: 1,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...CHIP_SHADOW,
    },
    chipActive: {
      backgroundColor: c.brand,
    },
    chipDisabled: {
      opacity: 0.45,
    },
    chipLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
      color: c.secondaryText,
    },
    chipLabelActive: {
      color: c.button.primaryText,
    },
    chipLabelDisabled: {
      color: c.secondaryText,
    },
    chipTime: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
      color: c.secondaryText,
    },
    chipTimeActive: {
      color: c.button.primaryText,
    },
    chipTimeDisabled: {
      color: c.secondaryText,
    },
    settingsBlock: {
      width: '100%',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    },
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      alignSelf: 'stretch',
    },
    scheduleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexShrink: 1,
      minWidth: 0,
    },
    scheduleIcon: {
      marginRight: 6,
    },
    scheduleLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'left',
    },
    scheduleValue: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      marginLeft: 8,
      flexShrink: 1,
      textAlign: 'right',
    },
    scheduleRepeatValue: {
      color: c.secondaryText,
    },
    /** Sits centered in the 8px gap: 3.5 + 1 + 3.5. */
    scheduleDivider: {
      width: '100%',
      height: 1,
      backgroundColor: c.border,
      marginVertical: (SHEET.settingsInnerGap - 1) / 2,
    },
    footer: {
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 0,
    },
    doneButton: {
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    doneButtonDisabled: {
      backgroundColor: c.button.disabledBg,
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
