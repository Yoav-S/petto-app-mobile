import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
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

export type CalendarPickerMode = 'day' | 'month' | 'year';

export interface CalendarPickerCoreProps {
  /** Currently selected date (draft or committed). */
  value: Date | null;
  /** Called when the user picks a day. Cleared (null) when month/year changes. */
  onChange: (date: Date | null) => void;
  allowFuture?: boolean;
  /** Earliest selectable date (YYYY-MM-DD). */
  minDate?: string;
  /**
   * When the sheet/parent remounts or `resetKey` changes, reset view to this
   * date's month/year (or today) and open on the days grid.
   */
  resetKey?: string | number | boolean;
}

const CHIP_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 3,
};

/**
 * Shared day / month / year calendar body.
 * Opens on days for the current (or value) month+year. Tapping the month or
 * year chip swaps the grid; choosing a month/year clears the day and returns
 * to the days view so the user picks a valid day for that month.
 */
export default function CalendarPickerCore({
  value,
  onChange,
  allowFuture = true,
  minDate,
  resetKey,
}: CalendarPickerCoreProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const now = useMemo(() => new Date(), []);

  const [mode, setMode] = useState<CalendarPickerMode>('day');
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? now.getMonth());

  useEffect(() => {
    const base = value ?? new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setMode('day');
    // Only reset when the parent asks (sheet open) — not on every value edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const cells = useMemo(() => getCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const years = useMemo(
    () =>
      getYearOptions(
        allowFuture ? { futureYears: 10, pastYears: 30 } : { pastYears: 80, futureYears: 0 },
      ),
    [allowFuture],
  );

  const isDayDisabled = (cell: CalendarCell) => {
    if (!allowFuture && isFutureDate(cell.date)) return true;
    if (minDate && isBeforeIsoDate(cell.date, minDate)) return true;
    return false;
  };

  const isMonthDisabled = (monthIndex: number) => {
    if (!allowFuture && viewYear === now.getFullYear() && monthIndex > now.getMonth()) {
      return true;
    }
    if (minDate) {
      const minYear = Number(minDate.split('-')[0]);
      const minMonth = Number(minDate.split('-')[1]) - 1;
      if (viewYear < minYear) return true;
      if (viewYear === minYear && monthIndex < minMonth) return true;
    }
    return false;
  };

  const isYearDisabled = (year: number) => {
    if (!allowFuture && year > now.getFullYear()) return true;
    if (minDate) {
      const minYear = Number(minDate.split('-')[0]);
      if (year < minYear) return true;
    }
    return false;
  };

  const toggleMode = (next: CalendarPickerMode) => {
    setMode((current) => (current === next ? 'day' : next));
  };

  const selectMonth = (monthIndex: number) => {
    if (isMonthDisabled(monthIndex)) return;
    setViewMonth(monthIndex);
    onChange(null);
    setMode('day');
  };

  const selectYear = (year: number) => {
    if (isYearDisabled(year)) return;
    setViewYear(year);
    // If the current month becomes invalid in the new year, snap it.
    if (!allowFuture && year === now.getFullYear() && viewMonth > now.getMonth()) {
      setViewMonth(now.getMonth());
    }
    if (minDate) {
      const minYear = Number(minDate.split('-')[0]);
      const minMonth = Number(minDate.split('-')[1]) - 1;
      if (year === minYear && viewMonth < minMonth) {
        setViewMonth(minMonth);
      }
    }
    onChange(null);
    setMode('day');
  };

  const handleSelectCell = (cell: CalendarCell) => {
    if (isDayDisabled(cell)) return;
    if (!cell.inCurrentMonth) {
      setViewYear(cell.date.getFullYear());
      setViewMonth(cell.date.getMonth());
    }
    onChange(cell.date);
  };

  const renderChips = () => (
    <View style={styles.chipRow}>
      <Pressable
        style={styles.chip}
        onPress={() => toggleMode('month')}
        accessibilityRole="button"
        accessibilityState={{ expanded: mode === 'month' }}
      >
        <View style={styles.chipInner}>
          <Text style={styles.chipText} numberOfLines={1}>
            {t(`petOnboarding.month_${MONTH_KEYS[viewMonth]}`)}
          </Text>
          <Ionicons
            name={mode === 'month' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primaryText}
          />
        </View>
      </Pressable>
      <Pressable
        style={styles.chip}
        onPress={() => toggleMode('year')}
        accessibilityRole="button"
        accessibilityState={{ expanded: mode === 'year' }}
      >
        <View style={styles.chipInner}>
          <Text style={styles.chipText}>{viewYear}</Text>
          <Ionicons
            name={mode === 'year' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primaryText}
          />
        </View>
      </Pressable>
    </View>
  );

  const renderDays = () => (
    <View style={styles.daysBlock}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_KEYS.map((key) => (
          <Text key={key} style={styles.weekday}>
            {t(`petOnboarding.weekday_${key}`)}
          </Text>
        ))}
      </View>
      <View style={styles.dayGrid}>
        {cells.map((cell) => {
          const disabled = isDayDisabled(cell);
          const selected = value ? isSameDay(cell.date, value) : false;
          const muted = disabled || !cell.inCurrentMonth;
          return (
            <Pressable
              key={`${toIsoDate(cell.date)}-${cell.inCurrentMonth}`}
              onPress={() => handleSelectCell(cell)}
              disabled={disabled}
              style={[styles.dayCell, selected && styles.dayCellSelected]}
            >
              <Text
                style={[
                  styles.dayText,
                  muted && styles.dayTextMuted,
                  selected && styles.dayTextSelected,
                ]}
              >
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderMonthGrid = () => (
    <View style={styles.optionGrid}>
      {MONTH_KEYS.map((key, index) => {
        const selected = index === viewMonth;
        const disabled = isMonthDisabled(index);
        return (
          <Pressable
            key={key}
            disabled={disabled}
            onPress={() => selectMonth(index)}
            style={[
              styles.optionCell,
              selected && styles.optionCellSelected,
              disabled && styles.optionCellDisabled,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selected && styles.optionTextSelected,
                disabled && styles.optionTextDisabled,
              ]}
            >
              {t(`petOnboarding.month_${key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderYearGrid = () => (
    <ScrollView
      style={styles.yearScroll}
      contentContainerStyle={styles.optionGrid}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {years.map((year) => {
        const selected = year === viewYear;
        const disabled = isYearDisabled(year);
        return (
          <Pressable
            key={year}
            disabled={disabled}
            onPress={() => selectYear(year)}
            style={[
              styles.optionCell,
              selected && styles.optionCellSelected,
              disabled && styles.optionCellDisabled,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selected && styles.optionTextSelected,
                disabled && styles.optionTextDisabled,
              ]}
            >
              {year}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.card}>
      <View style={styles.inner}>
        {renderChips()}
        {mode === 'day' ? renderDays() : null}
        {mode === 'month' ? renderMonthGrid() : null}
        {mode === 'year' ? renderYearGrid() : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: '100%',
      borderRadius: 12,
      padding: 16,
      backgroundColor: c.surface,
      ...CHIP_SHADOW,
      shadowOpacity: 0.04,
    },
    inner: {
      gap: 16,
    },
    chipRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    chip: {
      height: 40,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: c.surface,
      justifyContent: 'center',
      ...CHIP_SHADOW,
    },
    chipInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    chipText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
    },
    daysBlock: {
      gap: 8,
    },
    weekdayRow: {
      flexDirection: 'row',
    },
    weekday: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'center',
    },
    dayGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: `${100 / 7}%`,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    dayCellSelected: {
      backgroundColor: c.brand,
    },
    dayText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'center',
    },
    dayTextMuted: {
      color: c.secondaryText,
      opacity: 0.45,
    },
    dayTextSelected: {
      color: c.button.primaryText,
      fontFamily: 'Rubik-Medium',
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'space-between',
    },
    optionCell: {
      width: '31%',
      minHeight: 64,
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth * 1.5,
      borderColor: c.border,
    },
    optionCellSelected: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    optionCellDisabled: {
      opacity: 0.4,
    },
    optionText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'center',
    },
    optionTextSelected: {
      color: c.button.primaryText,
    },
    optionTextDisabled: {
      color: c.secondaryText,
    },
    yearScroll: {
      maxHeight: 280,
    },
  });
