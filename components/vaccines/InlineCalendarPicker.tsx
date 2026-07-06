import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';
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

interface InlineCalendarPickerProps {
  value: Date | null;
  onChange: (isoDate: string) => void;
  allowFuture?: boolean;
}

export default function InlineCalendarPicker({
  value,
  onChange,
  allowFuture = true,
}: InlineCalendarPickerProps) {
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

  const handleSelectCell = (cell: CalendarCell) => {
    if (!allowFuture && isFutureDate(cell.date)) return;
    if (!cell.inCurrentMonth) {
      setViewYear(cell.date.getFullYear());
      setViewMonth(cell.date.getMonth());
    }
    onChange(toIsoDate(cell.date));
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
        <View style={styles.pickerList}>
          <ScrollView keyboardShouldPersistTaps="handled">
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
    <View style={styles.wrap}>
      <View style={styles.dropdownRow}>
        <Pressable style={styles.dropdown} onPress={() => setOpenPicker('month')}>
          <Text style={styles.dropdownText} numberOfLines={1}>
            {t(`petOnboarding.month_${MONTH_KEYS[viewMonth]}`)}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.primaryText} />
        </Pressable>
        <Pressable style={styles.dropdown} onPress={() => setOpenPicker('year')}>
          <Text style={styles.dropdownText}>{viewYear}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.primaryText} />
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
          const isSelected = value ? isSameDay(cell.date, value) : false;
          const isFuture = !allowFuture && isFutureDate(cell.date);
          const color = isFuture
            ? '#D1D5DB'
            : cell.inCurrentMonth
              ? Colors.primaryText
              : '#D1D5DB';

          return (
            <Pressable
              key={`${cell.date.getTime()}-${cell.inCurrentMonth}`}
              onPress={() => handleSelectCell(cell)}
              disabled={isFuture}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
            >
              <Text style={[styles.dayText, { color }, isSelected && styles.dayTextSelected]}>
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {renderPickerList()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
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
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 85,
  },
  dropdownText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
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
    color: Colors.primaryText,
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
    backgroundColor: Colors.primaryText,
  },
  dayText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  dayTextSelected: {
    color: Colors.surface,
    fontFamily: 'Rubik-Medium',
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  pickerList: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    maxHeight: 220,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerItemText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    textAlign: 'center',
  },
  pickerItemTextDisabled: {
    color: '#D1D5DB',
  },
});
