import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TurboModuleRegistry,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal, { waitForBottomSheetsToSettle } from '@/components/ui/BottomSheetModal';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import { useColors, useTheme } from '@/context/ThemeContext';
import { currentLocale, t } from '@/i18n';
import { formatHourMinute, parseHourMinute } from '@/utils/calendar';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

type AndroidPicker = {
  open: (params: {
    value: Date;
    mode: 'time';
    is24Hour: boolean;
    display: 'default';
    minuteInterval: 1;
    onChange: (event: DateTimePickerEvent, date?: Date) => void;
  }) => void;
  dismiss: (mode: 'time') => void;
};

type PickerModule = {
  default: typeof DateTimePickerComponent;
  DateTimePickerAndroid?: AndroidPicker;
};

let pickerModule: PickerModule | null | undefined;

function nativePickerInstalled(): boolean {
  if (Platform.OS === 'android') {
    return TurboModuleRegistry.get('RNCTimePicker') != null
      && TurboModuleRegistry.get('RNCDatePicker') != null;
  }
  if (Platform.OS === 'ios') return true;
  return false;
}

function loadPicker(): PickerModule | null {
  if (pickerModule !== undefined) return pickerModule;
  if (!nativePickerInstalled()) {
    pickerModule = null;
    return null;
  }
  try {
    pickerModule = require('@react-native-community/datetimepicker') as PickerModule;
  } catch {
    pickerModule = null;
  }
  return pickerModule;
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

export default function TimePickerSheet({
  visible,
  value,
  minTime,
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const { scheme } = useTheme();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const systemPicker = nativePickerInstalled();
  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  const valueRef = useRef(value);
  const minTimeRef = useRef(minTime);
  onCloseRef.current = onClose;
  onConfirmRef.current = onConfirm;
  valueRef.current = value;
  minTimeRef.current = minTime;

  const [draft, setDraft] = useState(() => dateFromTime(value));

  useEffect(() => {
    if (!visible) return;
    setDraft(dateFromTime(valueRef.current));
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android' || !systemPicker) return;
    const android = loadPicker()?.DateTimePickerAndroid;
    if (!android) {
      onCloseRef.current();
      return;
    }

    let cancelled = false;
    void (async () => {
      await waitForBottomSheetsToSettle();
      if (cancelled) return;
      const initial = dateFromTime(valueRef.current);
      android.open({
        value: initial,
        mode: 'time',
        is24Hour: true,
        display: 'default',
        minuteInterval: 1,
        onChange: (event, date) => {
          if (cancelled) return;
          if (event.type === 'set' && date) {
            onConfirmRef.current(clampTime(timeFromDate(date), minTimeRef.current));
          }
          onCloseRef.current();
        },
      });
    })();

    return () => {
      cancelled = true;
      android.dismiss('time');
    };
  }, [visible, systemPicker]);

  if (!visible || !systemPicker) return null;
  if (Platform.OS !== 'ios') return null;

  const DateTimePicker = loadPicker()?.default;
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
  picker: {
    height: 216,
    width: '100%',
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
