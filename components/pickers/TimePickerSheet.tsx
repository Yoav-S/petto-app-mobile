import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { formatHourMinuteSecond, parseHourMinute } from '@/utils/calendar';

interface TimePickerSheetProps {
  visible: boolean;
  /** Initial time as "HH:MM" (24h). */
  value?: string | null;
  /** Earliest selectable time "HH:MM" (e.g. now when date is today). */
  minTime?: string | null;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

/** Three bands: previous, selected, next. 24 + 36 + 24 inside each band. */
const ROW_HEIGHT = 84;
const VISIBLE_ROWS = 3;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;
const SPACER = ROW_HEIGHT;
const COLUMN_GAP = 36;
const FRAME_PAD_H = 15;
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = MINUTES;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, index));
}

interface WheelColumnProps {
  items: readonly number[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  mountKey: number;
}

function WheelColumn({
  items,
  selectedIndex,
  onIndexChange,
  mountKey,
}: WheelColumnProps) {
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ScrollView>(null);
  const [visualIndex, setVisualIndex] = useState(selectedIndex);
  const snappingRef = useRef(false);
  const snapOffsets = useMemo(
    () => items.map((_, index) => index * ROW_HEIGHT),
    [items],
  );

  useEffect(() => {
    setVisualIndex(selectedIndex);
    const y = selectedIndex * ROW_HEIGHT;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    });
    // Only re-sync when the sheet opens, not on every snap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountKey]);

  const commitFromOffset = useCallback(
    (y: number) => {
      const index = clampIndex(Math.round(y / ROW_HEIGHT), items.length);
      setVisualIndex(index);
      if (index !== selectedIndex) onIndexChange(index);
    },
    [items.length, onIndexChange, selectedIndex],
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (snappingRef.current) return;
    const index = clampIndex(
      Math.round(event.nativeEvent.contentOffset.y / ROW_HEIGHT),
      items.length,
    );
    setVisualIndex(index);
  }, [items.length]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      snappingRef.current = false;
      commitFromOffset(event.nativeEvent.contentOffset.y);
    },
    [commitFromOffset],
  );

  return (
    <View style={styles.column}>
      <View style={styles.wheelWrap}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          bounces
          alwaysBounceVertical
          overScrollMode="always"
          directionalLockEnabled
          snapToOffsets={snapOffsets}
          snapToEnd={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onScrollBeginDrag={() => {
            snappingRef.current = false;
          }}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(event) => {
            const velocity = event.nativeEvent.velocity?.y ?? 0;
            if (Math.abs(velocity) < 0.05) {
              handleScrollEnd(event);
            }
          }}
        >
          <View style={{ height: SPACER }} />
          {items.map((item, index) => {
            const offset = index - visualIndex;
            return (
              <View key={item} style={styles.cell}>
                <Text
                  style={[
                    styles.cellText,
                    offset === 0 && styles.cellTextSelected,
                    offset === -1 && styles.cellTextBefore,
                    offset === 1 && styles.cellTextAfter,
                    Math.abs(offset) > 1 && styles.cellTextFar,
                  ]}
                  allowFontScaling={false}
                >
                  {pad2(item)}
                </Text>
              </View>
            );
          })}
          <View style={{ height: SPACER }} />
        </ScrollView>
      </View>
    </View>
  );
}

export default function TimePickerSheet({
  visible,
  value,
  minTime,
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const clampToMin = useCallback(
    (hour: number, minute: number, second: number) => {
      const candidate = formatHourMinuteSecond(hour, minute, second);
      if (!minTime) return { hour, minute, second, time: candidate };
      const floor = parseHourMinute(minTime);
      const floorClock = formatHourMinuteSecond(floor.hour, floor.minute, floor.second);
      if (candidate >= floorClock) return { hour, minute, second, time: candidate };
      return { hour: floor.hour, minute: floor.minute, second: floor.second, time: floorClock };
    },
    [minTime],
  );

  const initial = clampToMin(
    parseHourMinute(value).hour,
    parseHourMinute(value).minute,
    parseHourMinute(value).second,
  );
  const [hourIndex, setHourIndex] = useState(initial.hour);
  const [minuteIndex, setMinuteIndex] = useState(initial.minute);
  const [secondIndex, setSecondIndex] = useState(initial.second);
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const parsed = parseHourMinute(value);
    const clamped = clampToMin(parsed.hour, parsed.minute, parsed.second);
    setHourIndex(clamped.hour);
    setMinuteIndex(clamped.minute);
    setSecondIndex(clamped.second);
    setMountKey((k) => k + 1);
  }, [visible, value, clampToMin]);

  const handleConfirm = () => {
    const clamped = clampToMin(hourIndex, minuteIndex, secondIndex);
    onConfirm(clamped.time);
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{t('pickers.time_title')}</Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.primaryText} />
          </Pressable>
        </View>

        <View style={styles.timeCard}>
          <View style={styles.timeFrame}>
            <View style={styles.columns}>
              <WheelColumn
                items={HOURS_24}
                selectedIndex={hourIndex}
                onIndexChange={setHourIndex}
                mountKey={mountKey}
              />
              <WheelColumn
                items={MINUTES}
                selectedIndex={minuteIndex}
                onIndexChange={setMinuteIndex}
                mountKey={mountKey + 1}
              />
              <WheelColumn
                items={SECONDS}
                selectedIndex={secondIndex}
                onIndexChange={setSecondIndex}
                mountKey={mountKey + 2}
              />
            </View>
            <View style={[styles.rule, { top: ROW_HEIGHT }]} pointerEvents="none" />
            <View style={[styles.rule, { top: ROW_HEIGHT * 2 }]} pointerEvents="none" />
          </View>
        </View>

        <Pressable style={styles.doneButton} onPress={handleConfirm}>
          <Text style={styles.doneText}>{t('pickers.done')}</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: c.surface,
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSpacer: { width: 32 },
    title: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeCard: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 430,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0x0f / 255,
      shadowRadius: 8,
      elevation: 3,
    },
    timeFrame: {
      width: '100%',
      overflow: 'hidden',
    },
    columns: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: FRAME_PAD_H,
      gap: COLUMN_GAP,
    },
    column: {
      flex: 1,
    },
    wheelWrap: {
      height: WHEEL_HEIGHT,
      overflow: 'hidden',
    },
    rule: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1.5,
      backgroundColor: c.button.disabledBg,
    },
    cell: {
      height: ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellText: {
      fontFamily: 'Rubik-Medium',
      textAlign: 'center',
      includeFontPadding: false,
      ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {}),
    },
    cellTextBefore: {
      fontSize: 14,
      lineHeight: 20,
      color: c.border,
    },
    cellTextSelected: {
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    cellTextAfter: {
      fontSize: 16,
      lineHeight: 20,
      color: c.border,
    },
    cellTextFar: {
      fontSize: 14,
      lineHeight: 20,
      color: c.border,
    },
    doneButton: {
      ...PRIMARY_BUTTON,
      backgroundColor: c.brand,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    doneText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.button.primaryText,
    },
  });
