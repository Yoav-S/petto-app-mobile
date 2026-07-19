import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import { formatReminderClockTime, parseTime24, toTime24 } from '@/utils/calendar';

interface TimePickerSheetProps {
  visible: boolean;
  /** Initial time as "HH:MM" (24h). */
  value?: string | null;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;
const SHEET_HEIGHT = 474;
const SHEET_RADIUS = 24;
const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS: Array<'am' | 'pm'> = ['am', 'pm'];

function padMinute(n: number): string {
  return String(n).padStart(2, '0');
}

interface WheelColumnProps<T extends string | number> {
  items: readonly T[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  label: string;
  wheelHeight: number;
  mountKey: number;
  formatItem?: (item: T) => string;
}

function WheelColumn<T extends string | number>({
  items,
  selectedIndex,
  onIndexChange,
  label,
  wheelHeight,
  mountKey,
  formatItem,
}: WheelColumnProps<T>) {
  const listRef = useRef<FlatList<T>>(null);
  const padding = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;
  const scrollingRef = useRef(false);

  useEffect(() => {
    scrollingRef.current = false;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [mountKey]);

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      listRef.current?.scrollToOffset({
        offset: clamped * ITEM_HEIGHT,
        animated: true,
      });
      if (clamped !== selectedIndex) {
        onIndexChange(clamped);
      }
    },
    [items.length, onIndexChange, selectedIndex],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollingRef.current = false;
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      snapToIndex(index);
    },
    [snapToIndex],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const isActive = index === selectedIndex;
      const labelText = formatItem ? formatItem(item) : String(item);
      return (
        <View style={styles.cell}>
          <Text style={[styles.cellText, isActive && styles.cellTextActive]}>{labelText}</Text>
        </View>
      );
    },
    [formatItem, selectedIndex],
  );

  return (
    <View style={[styles.column, { height: wheelHeight }]}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={[styles.wheelWrap, { height: wheelHeight - 24 }]}>
        <FlatList
          ref={listRef}
          data={items as T[]}
          keyExtractor={(item, index) => `${String(item)}-${index}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          nestedScrollEnabled
          onScrollBeginDrag={() => {
            scrollingRef.current = true;
          }}
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
          contentContainerStyle={{ paddingVertical: padding }}
        />
        <View style={styles.selectionBand} pointerEvents="none" />
        <View style={[styles.fade, styles.fadeTop]} pointerEvents="none" />
        <View style={[styles.fade, styles.fadeBottom]} pointerEvents="none" />
      </View>
    </View>
  );
}

export default function TimePickerSheet({ visible, value, onClose, onConfirm }: TimePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const initial = parseTime24(value);
  const [hourIndex, setHourIndex] = useState(initial.hour12 - 1);
  const [minuteIndex, setMinuteIndex] = useState(initial.minute);
  const [periodIndex, setPeriodIndex] = useState(initial.isPm ? 1 : 0);
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const parsed = parseTime24(value);
    setHourIndex(parsed.hour12 - 1);
    setMinuteIndex(parsed.minute);
    setPeriodIndex(parsed.isPm ? 1 : 0);
    setMountKey((k) => k + 1);
  }, [visible, value]);

  const layout = useMemo(
    () => ({
      sheetHeight: SHEET_HEIGHT * sy + insets.bottom,
      radius: SHEET_RADIUS * sx,
      padH: 20 * sx,
      padTop: 20 * sy,
      wheelHeight: ITEM_HEIGHT * VISIBLE_ROWS,
      buttonHeight: 48 * sy,
      buttonRadius: 12 * sx,
    }),
    [sx, sy, insets.bottom],
  );

  const preview = formatReminderClockTime(
    toTime24(HOURS_12[hourIndex] ?? 8, minuteIndex, periodIndex === 1),
  );

  const handleConfirm = () => {
    const hour12 = HOURS_12[hourIndex] ?? 8;
    onConfirm(toTime24(hour12, minuteIndex, periodIndex === 1));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              height: layout.sheetHeight,
              paddingBottom: insets.bottom + 16 * sy,
              borderTopLeftRadius: layout.radius,
              borderTopRightRadius: layout.radius,
              paddingHorizontal: layout.padH,
              paddingTop: layout.padTop,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('pickers.time_title')}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.primaryText} />
            </Pressable>
          </View>

          <Text style={styles.preview}>{preview}</Text>

          <View style={styles.columns}>
            <WheelColumn
              items={HOURS_12}
              selectedIndex={hourIndex}
              onIndexChange={setHourIndex}
              label={t('pickers.hours')}
              wheelHeight={layout.wheelHeight}
              mountKey={mountKey}
            />
            <WheelColumn
              items={MINUTES}
              selectedIndex={minuteIndex}
              onIndexChange={setMinuteIndex}
              label={t('pickers.minutes')}
              wheelHeight={layout.wheelHeight}
              mountKey={mountKey + 1}
              formatItem={padMinute}
            />
            <WheelColumn
              items={PERIODS}
              selectedIndex={periodIndex}
              onIndexChange={setPeriodIndex}
              label={t('pickers.period')}
              wheelHeight={layout.wheelHeight}
              mountKey={mountKey + 2}
              formatItem={(period) => t(`pickers.${period}`)}
            />
          </View>

          <Pressable
            style={[
              styles.doneButton,
              {
                height: layout.buttonHeight,
                borderRadius: layout.buttonRadius,
              },
            ]}
            onPress={handleConfirm}
          >
            <Text style={styles.doneText}>{t('pickers.done')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerSpacer: { width: 32 },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    color: Colors.primaryText,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  columns: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 8,
    height: 16,
  },
  wheelWrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  cell: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 20,
    color: '#D1D5DB',
  },
  cellTextActive: {
    color: Colors.primaryText,
    fontFamily: 'Rubik-Medium',
    fontSize: 22,
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -(ITEM_HEIGHT / 2),
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
  },
  fadeTop: {
    top: 0,
    backgroundColor: Colors.surface,
    opacity: 0.85,
  },
  fadeBottom: {
    bottom: 0,
    backgroundColor: Colors.surface,
    opacity: 0.85,
  },
  doneButton: {
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  doneText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
