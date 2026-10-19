import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TurboModuleRegistry,
  useWindowDimensions,
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
    display: 'default' | 'spinner' | 'clock';
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

/**
 * Android's package factory calls TurboModuleRegistry.getEnforcing as soon as
 * it is required. Metro reports that as fatal even inside try/catch, so the
 * modules must be probed with get() — which returns null — before require.
 */
function nativePickerInstalled(): boolean {
  if (Platform.OS === 'ios') return true;
  if (Platform.OS !== 'android') return false;
  return (
    TurboModuleRegistry.get('RNCDatePicker') != null &&
    TurboModuleRegistry.get('RNCTimePicker') != null
  );
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
  const { width: windowWidth } = useWindowDimensions();
  const pickerWidth = Math.max(0, windowWidth - 40);
  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  const valueRef = useRef(value);
  const minTimeRef = useRef(minTime);
  const openedRef = useRef(false);
  onCloseRef.current = onClose;
  onConfirmRef.current = onConfirm;
  valueRef.current = value;
  minTimeRef.current = minTime;

  const [draft, setDraft] = useState(() => dateFromTime(value));
  /** Android fallback: mount the dialog component when imperative API is unavailable. */
  const [androidInline, setAndroidInline] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAndroidInline(false);
      openedRef.current = false;
      return;
    }
    setDraft(dateFromTime(valueRef.current));
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    const mod = loadPicker();
    const android = mod?.DateTimePickerAndroid;
    let cancelled = false;

    void (async () => {
      await waitForBottomSheetsToSettle();
      if (cancelled) return;

      if (android) {
        openedRef.current = true;
        android.open({
          value: dateFromTime(valueRef.current),
          mode: 'time',
          is24Hour: true,
          display: 'default',
          minuteInterval: 1,
          onChange: (event, date) => {
            if (cancelled) return;
            openedRef.current = false;
            if (event.type === 'set' && date) {
              onConfirmRef.current(clampTime(timeFromDate(date), minTimeRef.current));
            }
            onCloseRef.current();
          },
        });
        return;
      }

      if (mod?.default) {
        setAndroidInline(true);
        return;
      }

      onCloseRef.current();
    })();

    return () => {
      cancelled = true;
      if (openedRef.current && android) {
        try {
          android.dismiss('time');
        } catch {
          // ignore
        }
        openedRef.current = false;
      }
    };
  }, [visible]);

  if (Platform.OS === 'android') {
    if (!visible || !androidInline) return null;
    const DateTimePicker = loadPicker()?.default;
    if (!DateTimePicker) return null;

    return (
      <PickerBoundary onFail={onClose}>
        <DateTimePicker
          value={draft}
          mode="time"
          is24Hour
          display="default"
          minuteInterval={1}
          onChange={(event, date) => {
            if (event.type === 'set' && date) {
              onConfirm(clampTime(timeFromDate(date), minTime));
            }
            setAndroidInline(false);
            onClose();
          }}
        />
      </PickerBoundary>
    );
  }

  if (!visible) return null;

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
              style={[styles.picker, { width: pickerWidth }]}
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
  pickerWrap: {
    width: '100%',
    height: 216,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    height: 216,
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
