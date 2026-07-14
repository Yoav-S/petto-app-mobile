import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';

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
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseValue(value?: string | null): { hour: number; minute: number } {
  if (value) {
    const [h, m] = value.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) return { hour: h, minute: m };
  }
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

interface WheelColumnProps {
  data: number[];
  selected: number;
  onSelect: (value: number) => void;
  label: string;
  wheelHeight: number;
  resetKey: number;
}

function WheelColumn({
  data,
  selected,
  onSelect,
  label,
  wheelHeight,
  resetKey,
}: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const padding = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selected * ITEM_HEIGHT, animated: false });
  }, [resetKey, selected]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(data.length - 1, index));
      if (clamped !== selected) onSelect(clamped);
      scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
    },
    [data.length, onSelect, selected],
  );

  return (
    <View style={[styles.column, { height: wheelHeight }]}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={[styles.wheelWrap, { height: wheelHeight - 24 }]}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          nestedScrollEnabled
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          contentContainerStyle={{ paddingVertical: padding }}
        >
          {data.map((n) => {
            const isActive = n === selected;
            return (
              <View key={n} style={styles.cell}>
                <Text style={[styles.cellText, isActive && styles.cellTextActive]}>{pad(n)}</Text>
              </View>
            );
          })}
        </ScrollView>
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

  const [hour, setHour] = useState(() => parseValue(value).hour);
  const [minute, setMinute] = useState(() => parseValue(value).minute);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const parsed = parseValue(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setResetKey((k) => k + 1);
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

          <View style={styles.columns}>
            <WheelColumn
              data={HOURS}
              selected={hour}
              onSelect={setHour}
              label={t('pickers.hours')}
              wheelHeight={layout.wheelHeight}
              resetKey={resetKey}
            />
            <WheelColumn
              data={MINUTES}
              selected={minute}
              onSelect={setMinute}
              label={t('pickers.minutes')}
              wheelHeight={layout.wheelHeight}
              resetKey={resetKey + 1}
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
            onPress={() => onConfirm(`${pad(hour)}:${pad(minute)}`)}
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
    marginBottom: 12,
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
  columns: {
    flexDirection: 'row',
    gap: 16,
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
    backgroundColor: Colors.primaryText,
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
