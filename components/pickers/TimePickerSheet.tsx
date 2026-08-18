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
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { formatHourMinute, parseHourMinute } from '@/utils/calendar';

interface TimePickerSheetProps {
  visible: boolean;
  /** Initial time as "HH:MM" (24h). */
  value?: string | null;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const SPACER = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

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
  label: string;
  mountKey: number;
}

function WheelColumn({
  items,
  selectedIndex,
  onIndexChange,
  label,
  mountKey,
}: WheelColumnProps) {
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ScrollView>(null);
  const [visualIndex, setVisualIndex] = useState(selectedIndex);
  const snappingRef = useRef(false);
  const snapOffsets = useMemo(
    () => items.map((_, index) => index * ITEM_HEIGHT),
    [items],
  );

  useEffect(() => {
    setVisualIndex(selectedIndex);
    const y = selectedIndex * ITEM_HEIGHT;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    });
    // Only re-sync when the sheet opens, not on every snap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountKey]);

  const commitFromOffset = useCallback(
    (y: number) => {
      const index = clampIndex(Math.round(y / ITEM_HEIGHT), items.length);
      setVisualIndex(index);
      if (index !== selectedIndex) onIndexChange(index);
    },
    [items.length, onIndexChange, selectedIndex],
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (snappingRef.current) return;
    const index = clampIndex(
      Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
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
      <Text style={styles.columnLabel}>{label}</Text>
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
            const isActive = index === visualIndex;
            return (
              <View key={item} style={styles.cell}>
                <Text
                  style={[styles.cellText, isActive && styles.cellTextActive]}
                  allowFontScaling={false}
                >
                  {pad2(item)}
                </Text>
              </View>
            );
          })}
          <View style={{ height: SPACER }} />
        </ScrollView>
        <View style={styles.selectionBand} pointerEvents="none" />
        <View style={[styles.fade, styles.fadeTop]} pointerEvents="none" />
        <View style={[styles.fade, styles.fadeBottom]} pointerEvents="none" />
      </View>
    </View>
  );
}

export default function TimePickerSheet({ visible, value, onClose, onConfirm }: TimePickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const initial = parseHourMinute(value);
  const [hourIndex, setHourIndex] = useState(initial.hour);
  const [minuteIndex, setMinuteIndex] = useState(initial.minute);
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const parsed = parseHourMinute(value);
    setHourIndex(parsed.hour);
    setMinuteIndex(parsed.minute);
    setMountKey((k) => k + 1);
  }, [visible, value]);

  const preview = formatHourMinute(hourIndex, minuteIndex);

  const handleConfirm = () => {
    onConfirm(formatHourMinute(hourIndex, minuteIndex));
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

        <Text style={styles.preview}>{preview}</Text>

        <View style={styles.columns}>
          <WheelColumn
            items={HOURS_24}
            selectedIndex={hourIndex}
            onIndexChange={setHourIndex}
            label={t('pickers.hours')}
            mountKey={mountKey}
          />
          <WheelColumn
            items={MINUTES}
            selectedIndex={minuteIndex}
            onIndexChange={setMinuteIndex}
            label={t('pickers.minutes')}
            mountKey={mountKey + 1}
          />
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
    preview: {
      fontFamily: 'Rubik-Medium',
      fontSize: 18,
      lineHeight: 22,
      color: c.primaryText,
      textAlign: 'center',
    },
    columns: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    column: {
      flex: 1,
    },
    columnLabel: {
      fontFamily: 'Rubik-Regular',
      fontSize: 13,
      lineHeight: 16,
      color: c.secondaryText,
      textAlign: 'center',
      marginBottom: 8,
    },
    wheelWrap: {
      height: WHEEL_HEIGHT,
      overflow: 'hidden',
      position: 'relative',
    },
    cell: {
      height: ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 20,
      lineHeight: 24,
      color: c.disabled,
      textAlign: 'center',
      includeFontPadding: false,
      ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {}),
    },
    cellTextActive: {
      color: c.primaryText,
      fontFamily: 'Rubik-Medium',
      fontSize: 22,
      lineHeight: 26,
    },
    selectionBand: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: SPACER,
      height: ITEM_HEIGHT,
      borderRadius: 12,
      backgroundColor: 'rgba(31, 41, 55, 0.06)',
      borderWidth: 1,
      borderColor: c.border,
    },
    fade: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: ITEM_HEIGHT * 1.5,
    },
    fadeTop: {
      top: 0,
      backgroundColor: c.surface,
      opacity: 0.72,
    },
    fadeBottom: {
      bottom: 0,
      backgroundColor: c.surface,
      opacity: 0.72,
    },
    doneButton: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.brand,
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
