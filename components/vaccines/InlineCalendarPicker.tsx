import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import {
  getCalendarCells,
  getYearOptions,
  isBeforeIsoDate,
  isFutureDate,
  isSameDay,
  MONTH_KEYS,
  toIsoDate,
  WEEKDAY_KEYS,
  type CalendarCell,
} from '@/utils/calendar';

interface InlineCalendarPickerProps {
  value: Date | null;
  onChange: (isoDate: string) => void;
  allowFuture?: boolean;
  /** Earliest selectable date (YYYY-MM-DD). */
  minDate?: string;
}

export default function InlineCalendarPicker({
  value,
  onChange,
  allowFuture = true,
  minDate,
}: InlineCalendarPickerProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? new Date().getMonth());
  const [openPicker, setOpenPicker] = useState<'month' | 'year' | null>(null);

  const cells = useMemo(() => getCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const years = useMemo(
    () => getYearOptions(allowFuture ? { futureYears: 10, pastYears: 30 } : { pastYears: 30 }),
    [allowFuture],
  );

  useEffect(() => {
    const base = value ?? new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }, [value]);

  const isCellDisabled = (cell: CalendarCell) => {
    if (!allowFuture && isFutureDate(cell.date)) return true;
    if (minDate && isBeforeIsoDate(cell.date, minDate)) return true;
    return false;
  };

  const handleSelectCell = (cell: CalendarCell) => {
    if (isCellDisabled(cell)) return;
    if (!cell.inCurrentMonth) {
      setViewYear(cell.date.getFullYear());
      setViewMonth(cell.date.getMonth());
    }
    onChange(toIsoDate(cell.date));
  };

  const pickerItems = useMemo(() => {
    if (!openPicker) return [];
    const now = new Date();
    const minYear = minDate ? Number(minDate.split('-')[0]) : null;
    const minMonth = minDate ? Number(minDate.split('-')[1]) - 1 : null;

    if (openPicker === 'month') {
      return MONTH_KEYS.map((key, index) => ({
        key,
        index,
        label: t(`petOnboarding.month_${key}`),
        disabled:
          (!allowFuture && viewYear === now.getFullYear() && index > now.getMonth()) ||
          (minYear != null &&
            minMonth != null &&
            viewYear === minYear &&
            index < minMonth),
      }));
    }

    return years.map((year) => ({
      key: String(year),
      index: year,
      label: String(year),
      disabled: minYear != null && year < minYear,
    }));
  }, [allowFuture, minDate, openPicker, viewYear, years]);

  return (
    <View style={styles.wrap}>
      <View style={styles.dropdownRow}>
        <Pressable style={styles.dropdown} onPress={() => setOpenPicker('month')}>
          <Text style={styles.dropdownText} numberOfLines={1}>
            {t(`petOnboarding.month_${MONTH_KEYS[viewMonth]}`)}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.primaryText} />
        </Pressable>
        <Pressable style={styles.dropdown} onPress={() => setOpenPicker('year')}>
          <Text style={styles.dropdownText}>{viewYear}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.primaryText} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_KEYS.map((key) => (
          <Text key={key} style={styles.weekday}>
            {t(`petOnboarding.weekday_${key}`)}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          const disabled = isCellDisabled(cell);
          const isSelected = value ? isSameDay(cell.date, value) : false;
          const color = disabled
            ? '#D1D5DB'
            : cell.inCurrentMonth
              ? colors.primaryText
              : '#D1D5DB';

          return (
            <Pressable
              key={`${cell.date.getTime()}-${cell.inCurrentMonth}`}
              onPress={() => handleSelectCell(cell)}
              disabled={disabled}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
            >
              <Text style={[styles.dayText, { color }, isSelected && styles.dayTextSelected]}>
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={openPicker != null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenPicker(null)}
      >
        <TouchableWithoutFeedback onPress={() => setOpenPicker(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerList}>
                <ScrollView
                  style={styles.pickerScroll}
                  contentContainerStyle={styles.pickerScrollContent}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  keyboardShouldPersistTaps="handled"
                >
                  {pickerItems.map((item) => (
                    <Pressable
                      key={item.key}
                      style={styles.pickerItem}
                      disabled={item.disabled}
                      onPress={() => {
                        if (openPicker === 'month') {
                          setViewMonth(item.index);
                        } else {
                          setViewYear(item.index);
                          const now = new Date();
                          if (
                            !allowFuture &&
                            item.index === now.getFullYear() &&
                            viewMonth > now.getMonth()
                          ) {
                            setViewMonth(now.getMonth());
                          }
                          if (minDate) {
                            const minYear = Number(minDate.split('-')[0]);
                            const minMonth = Number(minDate.split('-')[1]) - 1;
                            if (item.index === minYear && viewMonth < minMonth) {
                              setViewMonth(minMonth);
                            }
                          }
                        }
                        setOpenPicker(null);
                      }}
                    >
                      <Text
                        style={[styles.pickerItemText, item.disabled && styles.pickerItemTextDisabled]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  wrap: {
    paddingTop: Spacing.md,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 85,
  },
  dropdownText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.primaryText,
    marginRight: 4,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekday: {
    flex: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.primaryText,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: c.brand,
  },
  dayText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  dayTextSelected: {
    color: c.surface,
    fontFamily: 'Rubik-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  pickerList: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.md,
    maxHeight: 320,
    overflow: 'hidden',
  },
  pickerScroll: {
    maxHeight: 320,
  },
  pickerScrollContent: {
    paddingVertical: Spacing.xs,
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
