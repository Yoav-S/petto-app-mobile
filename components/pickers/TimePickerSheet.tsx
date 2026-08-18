import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
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
  const listRef = useRef<FlatList<number>>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    });
    // Only re-sync when the sheet opens, not on every snap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountKey]);

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      listRef.current?.scrollToOffset({
        offset: clamped * ITEM_HEIGHT,
        animated: true,
      });
      if (clamped !== selectedIndex) onIndexChange(clamped);
    },
    [items.length, onIndexChange, selectedIndex],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      snapToIndex(index);
    },
    [snapToIndex],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const isActive = index === selectedIndex;
      return (
        <View style={styles.cell}>
          <Text
            style={[styles.cellText, isActive && styles.cellTextActive]}
            allowFontScaling={false}
          >
            {pad2(item)}
          </Text>
        </View>
      );
    },
    [selectedIndex, styles.cell, styles.cellText, styles.cellTextActive],
  );

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={styles.wheelWrap}>
        <FlatList
          ref={listRef}
          data={items as number[]}
          keyExtractor={(item) => String(item)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          nestedScrollEnabled
          disableIntervalMomentum
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(event) => {
            if (!event.nativeEvent.velocity || Math.abs(event.nativeEvent.velocity.y) < 0.1) {
              handleScrollEnd(event);
            }
          }}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          extraData={selectedIndex}
          ListHeaderComponent={<View style={{ height: SPACER }} />}
          ListFooterComponent={<View style={{ height: SPACER }} />}
        />
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
