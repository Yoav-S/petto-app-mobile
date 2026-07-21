import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { PET_BIRTH_SHEET } from '@/constants/petOnboarding';
import { getPetOnboardingScale } from '@/utils/petOnboardingScale';
import {
  getCalendarCells,
  getYearOptions,
  isFutureDate,
  isSameDay,
  MONTH_KEYS,
  toIsoDate,
  WEEKDAY_KEYS,
  type CalendarCell,
} from '@/utils/calendar';

interface BirthDatePickerSheetProps {
  visible: boolean;
  initialDate: Date | null;
  onClose: () => void;
  onConfirm: (isoDate: string) => void;
  /** Allow selecting dates in the future (reminders / vaccine next date). */
  allowFuture?: boolean;
  /** Optional sheet title override. */
  title?: string;
}

export default function BirthDatePickerSheet({
  visible,
  initialDate,
  onClose,
  onConfirm,
  allowFuture = false,
  title,
}: BirthDatePickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { sx, sy } = getPetOnboardingScale(width, height, insets.top, insets.bottom);

  const [viewYear, setViewYear] = useState(initialDate?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate?.getMonth() ?? new Date().getMonth());
  const [selected, setSelected] = useState<Date | null>(initialDate);
  const [openPicker, setOpenPicker] = useState<'month' | 'year' | null>(null);

  const sheetHeight = PET_BIRTH_SHEET.height * sy;
  const cells = useMemo(() => getCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const years = useMemo(
    () => getYearOptions(allowFuture ? { futureYears: 10 } : undefined),
    [allowFuture],
  );

  useEffect(() => {
    if (!visible) return;
    const base = initialDate ?? new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setSelected(initialDate);
    setOpenPicker(null);
  }, [visible, initialDate]);

  const dropdownStyle = {
    height: PET_BIRTH_SHEET.dropdownHeight * sy,
    borderRadius: PET_BIRTH_SHEET.dropdownRadius * sx,
    paddingHorizontal: 12 * sx,
    paddingVertical: 10 * sy,
  };

  const handleSelectCell = (cell: CalendarCell) => {
    if (!allowFuture && isFutureDate(cell.date)) return;
    if (!cell.inCurrentMonth) {
      setViewYear(cell.date.getFullYear());
      setViewMonth(cell.date.getMonth());
    }
    setSelected(cell.date);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(toIsoDate(selected));
  };

  const renderPickerList = () => {
    if (!openPicker) return null;

    const now = new Date();
    const items =
      openPicker === 'month'
        ? MONTH_KEYS.map((key, index) => ({
            key,
            index,
            label: t(`petOnboarding.month_${key}`),
            disabled: !allowFuture && viewYear === now.getFullYear() && index > now.getMonth(),
          }))
        : years.map((year) => ({
            key: String(year),
            index: year,
            label: String(year),
            disabled: false,
          }));

    return (
      <View style={styles.pickerOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpenPicker(null)} />
        <View style={[styles.pickerList, { borderRadius: 12 * sx, maxHeight: 220 * sy }]}>
          <ScrollView>
            {items.map((item) => (
              <Pressable
                key={item.key}
                style={styles.pickerItem}
                disabled={item.disabled}
                onPress={() => {
                  if (openPicker === 'month') {
                    setViewMonth(item.index);
                  } else {
                    setViewYear(item.index);
                    // Snap month back if the new year makes it a future month.
                    if (!allowFuture && item.index === now.getFullYear() && viewMonth > now.getMonth()) {
                      setViewMonth(now.getMonth());
                    }
                  }
                  setOpenPicker(null);
                }}
              >
                <Text style={[styles.pickerItemText, item.disabled && styles.pickerItemTextDisabled]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              height: sheetHeight + insets.bottom,
              paddingBottom: insets.bottom,
              borderTopLeftRadius: PET_BIRTH_SHEET.radius * sx,
              borderTopRightRadius: PET_BIRTH_SHEET.radius * sx,
            },
          ]}
        >
          <View
            style={[
              styles.titleRow,
              {
                width: PET_BIRTH_SHEET.titleRowWidth * sx,
                height: PET_BIRTH_SHEET.titleRowHeight * sy,
                marginTop: PET_BIRTH_SHEET.titleRowTop * sy,
                marginLeft: PET_BIRTH_SHEET.titleRowLeft * sx,
              },
            ]}
          >
            <Text
              style={[
                styles.sheetTitle,
                { fontSize: PET_BIRTH_SHEET.titleSize * sx, lineHeight: PET_BIRTH_SHEET.titleLine * sy },
              ]}
            >
              {title ?? t('petOnboarding.birth_sheet_title')}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{ width: PET_BIRTH_SHEET.closeSize * sx, height: PET_BIRTH_SHEET.closeSize * sx }}
              accessibilityRole="button"
              accessibilityLabel={t('petOnboarding.photo_close_a11y')}
            >
              <Ionicons name="close" size={PET_BIRTH_SHEET.closeSize * sx} color={colors.primaryText} />
            </Pressable>
          </View>

          <View
            style={[
              styles.body,
              {
                marginTop: (PET_BIRTH_SHEET.bodyTop - PET_BIRTH_SHEET.titleRowTop - PET_BIRTH_SHEET.titleRowHeight) * sy,
                gap: PET_BIRTH_SHEET.bodyGap * sy,
              },
            ]}
          >
            <View style={[styles.dropdownRow, { gap: 8 * sx, paddingHorizontal: 20 * sx }]}>
              <Pressable
                style={[styles.dropdown, dropdownStyle, { width: PET_BIRTH_SHEET.monthBtnWidth * sx }]}
                onPress={() => setOpenPicker('month')}
              >
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {t(`petOnboarding.month_${MONTH_KEYS[viewMonth]}`)}
                </Text>
                <Ionicons name="chevron-down" size={16 * sx} color={colors.primaryText} />
              </Pressable>
              <Pressable
                style={[styles.dropdown, dropdownStyle, { width: PET_BIRTH_SHEET.yearBtnWidth * sx }]}
                onPress={() => setOpenPicker('year')}
              >
                <Text style={styles.dropdownText}>{viewYear}</Text>
                <Ionicons name="chevron-down" size={16 * sx} color={colors.primaryText} />
              </Pressable>
            </View>

            <View style={[styles.weekdayRow, { width: PET_BIRTH_SHEET.weekdayRowWidth * sx }]}>
              {WEEKDAY_KEYS.map((key) => (
                <Text
                  key={key}
                  style={[
                    styles.weekday,
                    {
                      fontSize: PET_BIRTH_SHEET.dayFontSize * sx,
                      lineHeight: PET_BIRTH_SHEET.dayLineHeight * sy,
                      width: (PET_BIRTH_SHEET.gridWidth * sx) / 7,
                    },
                  ]}
                >
                  {t(`petOnboarding.weekday_${key}`)}
                </Text>
              ))}
            </View>

            <View
              style={[
                styles.grid,
                {
                  width: PET_BIRTH_SHEET.gridWidth * sx,
                  minHeight: PET_BIRTH_SHEET.gridHeight * sy,
                },
              ]}
            >
              {cells.map((cell) => {
                const isSelected = selected ? isSameDay(cell.date, selected) : false;
                const isFuture = !allowFuture && isFutureDate(cell.date);
                const color = isFuture
                  ? PET_BIRTH_SHEET.mutedDayColor
                  : cell.inCurrentMonth
                    ? colors.primaryText
                    : PET_BIRTH_SHEET.mutedDayColor;

                return (
                  <Pressable
                    key={`${cell.date.getTime()}-${cell.inCurrentMonth}`}
                    onPress={() => handleSelectCell(cell)}
                    disabled={isFuture}
                    style={[
                      styles.dayCell,
                      {
                        width: (PET_BIRTH_SHEET.gridWidth * sx) / 7,
                        height: PET_BIRTH_SHEET.dayCellHeight * sy,
                        borderRadius: PET_BIRTH_SHEET.dropdownRadius * sx,
                      },
                      isSelected && styles.dayCellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          fontSize: PET_BIRTH_SHEET.dayFontSize * sx,
                          lineHeight: PET_BIRTH_SHEET.dayLineHeight * sy,
                          color,
                        },
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.footer, { height: PET_BIRTH_SHEET.continueSectionHeight * sy }]}>
            {selected ? (
              <Pressable
                onPress={handleConfirm}
                style={[
                  styles.continueBtn,
                  {
                    width: 335 * sx,
                    height: 48 * sy,
                    borderRadius: 12 * sx,
                  },
                ]}
              >
                <Text style={[styles.continueText, { fontSize: 16 * sx, lineHeight: 24 * sy }]}>
                  {t('onboarding.continue')}
                </Text>
              </Pressable>
            ) : (
              <View
                style={[
                  styles.continueBtn,
                  styles.continueBtnDisabled,
                  {
                    width: 335 * sx,
                    height: 48 * sy,
                    borderRadius: 12 * sx,
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={[styles.continueText, { fontSize: 16 * sx, lineHeight: 24 * sy }]}>
                  {t('onboarding.continue')}
                </Text>
              </View>
            )}
          </View>

          {renderPickerList()}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: PET_BIRTH_SHEET.background,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'flex-start',
  },
  sheetTitle: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  body: {
    alignItems: 'center',
    width: '100%',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  dropdownText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.primaryText,
    flex: 1,
  },
  weekdayRow: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  weekday: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: c.primaryText,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#E5E7EB',
  },
  dayText: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  continueBtn: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueText: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    color: c.surface,
    textAlign: 'center',
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  pickerList: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    zIndex: 10,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerItemText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.primaryText,
    textAlign: 'center',
  },
  pickerItemTextDisabled: {
    color: '#D1D5DB',
  },
});
