import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import { useColors, useTheme } from '@/context/ThemeContext';
import { currentLocale, t } from '@/i18n';
import { formatHourMinute, parseHourMinute } from '@/utils/calendar';
import type DateTimePickerComponent from '@react-native-community/datetimepicker';

interface TimePickerSheetProps {
  visible: boolean;
  /** Initial time as "HH:MM" or "HH:MM:SS" (24h). Seconds are ignored. */
  value?: string | null;
  /** Earliest selectable time "HH:MM" (e.g. now when the date is today). */
  minTime?: string | null;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

/** 24-hour locales so the system wheel is 0–23 and 0–59, not 1–12 with AM/PM. */
const PICKER_LOCALE: Record<string, string> = {
  en: 'en_GB',
  he: 'he_IL',
  ro: 'ro_RO',
  ru: 'ru_RU',
};

const ROW = 44;
const VISIBLE_ROWS = 5;
const WHEEL_PAD = ROW * Math.floor(VISIBLE_ROWS / 2);
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

type PickerModule = {
  default: typeof DateTimePickerComponent;
};

let iosPicker: PickerModule | null | undefined;

function loadIosPicker(): PickerModule | null {
  if (Platform.OS !== 'ios') return null;
  if (iosPicker !== undefined) return iosPicker;
  try {
    iosPicker = require('@react-native-community/datetimepicker') as PickerModule;
  } catch {
    iosPicker = null;
  }
  return iosPicker;
}

class PickerBoundary extends React.Component<
  { onFail: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onFail();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function dateFromTime(value?: string | null): Date {
  const { hour, minute } = parseHourMinute(value);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function timeFromDate(date: Date): string {
  return formatHourMinute(date.getHours(), date.getMinutes());
}

function clampTime(time: string, minTime?: string | null): string {
  if (!minTime) return time;
  const floor = parseHourMinute(minTime);
  const floorClock = formatHourMinute(floor.hour, floor.minute);
  return time >= floorClock ? time : floorClock;
}

function TimeWheel({
  items,
  selected,
  color,
  muted,
  onSelect,
}: {
  items: string[];
  selected: number;
  color: string;
  muted: string;
  onSelect: (index: number) => void;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current?.scrollTo({ y: selected * ROW, animated: false });
    });
    return () => cancelAnimationFrame(frame);
    // Scroll to the opening value once. Later updates come from the wheel itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ROW);
    const next = Math.max(0, Math.min(items.length - 1, index));
    if (next !== selected) onSelect(next);
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.wheel}
      contentContainerStyle={styles.wheelContent}
      snapToInterval={ROW}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      onMomentumScrollEnd={onEnd}
      onScrollEndDrag={onEnd}
    >
      {items.map((label, index) => (
        <View key={label} style={styles.wheelRow}>
          <Text style={[styles.wheelText, { color: index === selected ? color : muted }]}>
            {label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function AndroidTimeSheet({
  visible,
  value,
  minTime,
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const initial = parseHourMinute(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    if (!visible) return;
    const next = parseHourMinute(value);
    setHour(next.hour);
    setMinute(next.minute);
  }, [visible, value]);

  const confirm = () => {
    onConfirm(clampTime(formatHourMinute(hour, minute), minTime));
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: colors.panel, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.title, { color: colors.primaryText }]}>{t('pickers.time_title')}</Text>
          <HeaderIconButton onPress={onClose} accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} color={colors.primaryText} />
          </HeaderIconButton>
        </View>
        <View style={styles.wheels}>
          <View style={[styles.selection, { backgroundColor: colors.surface }]} pointerEvents="none" />
          <TimeWheel
            items={HOURS}
            selected={hour}
            color={colors.primaryText}
            muted={colors.secondaryText}
            onSelect={setHour}
          />
          <Text style={[styles.colon, { color: colors.primaryText }]}>:</Text>
          <TimeWheel
            items={MINUTES}
            selected={minute}
            color={colors.primaryText}
            muted={colors.secondaryText}
            onSelect={setMinute}
          />
        </View>
        <Pressable style={[styles.done, { backgroundColor: colors.brand }]} onPress={confirm}>
          <Text style={[styles.doneText, { color: colors.button.primaryText }]}>{t('pickers.done')}</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

export default function TimePickerSheet(props: TimePickerSheetProps) {
  if (Platform.OS === 'android') {
    return <AndroidTimeSheet {...props} />;
  }
  return <IosTimeSheet {...props} />;
}

function IosTimeSheet({
  visible,
  value,
  minTime,
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const { scheme } = useTheme();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(() => dateFromTime(value));

  useEffect(() => {
    if (!visible) return;
    setDraft(dateFromTime(value));
  }, [visible, value]);

  if (!visible) return null;

  const DateTimePicker = loadIosPicker()?.default;
  if (!DateTimePicker) return null;

  const confirm = () => {
    onConfirm(clampTime(timeFromDate(draft), minTime));
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <PickerBoundary onFail={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.panel, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={[styles.title, { color: colors.primaryText }]}>{t('pickers.time_title')}</Text>
            <HeaderIconButton onPress={onClose} accessibilityLabel={t('common.close')}>
              <Ionicons name="close" size={24} color={colors.primaryText} />
            </HeaderIconButton>
          </View>
          <View style={styles.pickerWrap} collapsable={false}>
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              locale={PICKER_LOCALE[currentLocale] ?? 'en_GB'}
              minuteInterval={1}
              themeVariant={scheme}
              onChange={(_event, date) => {
                if (date) setDraft(date);
              }}
              style={styles.picker}
            />
          </View>
          <Pressable style={[styles.done, { backgroundColor: colors.brand }]} onPress={confirm}>
            <Text style={[styles.doneText, { color: colors.button.primaryText }]}>{t('pickers.done')}</Text>
          </Pressable>
        </View>
      </PickerBoundary>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    shadowColor: '#1E1E1E',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    boxShadow: '0px -3px 8px rgba(30, 30, 30, 0.080)',
    elevation: 12,
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
  },
  wheels: {
    height: ROW * VISIBLE_ROWS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  selection: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: ROW,
    borderRadius: 10,
  },
  wheel: {
    width: 72,
    height: ROW * VISIBLE_ROWS,
  },
  wheelContent: {
    paddingVertical: WHEEL_PAD,
  },
  wheelRow: {
    height: ROW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 22,
    lineHeight: 28,
  },
  colon: {
    fontFamily: 'Rubik-Medium',
    fontSize: 22,
    lineHeight: 28,
    width: 16,
    textAlign: 'center',
  },
  pickerWrap: {
    width: '100%',
    height: 216,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    height: 216,
    width: 280,
    alignSelf: 'center',
  },
  done: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
  },
});
