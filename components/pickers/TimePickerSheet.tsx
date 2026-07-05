import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

interface TimePickerSheetProps {
  visible: boolean;
  /** Initial time as "HH:MM" (24h). */
  value?: string | null;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const ITEM_HEIGHT = 44;

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

export default function TimePickerSheet({ visible, value, onClose, onConfirm }: TimePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [hour, setHour] = useState(() => parseValue(value).hour);
  const [minute, setMinute] = useState(() => parseValue(value).minute);

  useEffect(() => {
    if (!visible) return;
    const parsed = parseValue(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
  }, [visible, value]);

  const renderColumn = (
    data: number[],
    selected: number,
    onSelect: (n: number) => void,
    label: string,
  ) => (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView
        style={styles.columnScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}
      >
        {data.map((n) => {
          const isActive = n === selected;
          return (
            <Pressable
              key={n}
              style={[styles.cell, isActive && styles.cellActive]}
              onPress={() => onSelect(n)}
            >
              <Text style={[styles.cellText, isActive && styles.cellTextActive]}>{pad(n)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('pickers.time_title')}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.primaryText} />
            </Pressable>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewText}>{pad(hour)}:{pad(minute)}</Text>
          </View>

          <View style={styles.columns}>
            {renderColumn(HOURS, hour, setHour, t('pickers.hours'))}
            {renderColumn(MINUTES, minute, setMinute, t('pickers.minutes'))}
          </View>

          <Pressable style={styles.doneButton} onPress={() => onConfirm(`${pad(hour)}:${pad(minute)}`)}>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 32,
    color: Colors.primaryText,
  },
  columns: {
    flexDirection: 'row',
    gap: Spacing.lg,
    height: ITEM_HEIGHT * 5,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  columnScroll: {
    flex: 1,
  },
  columnContent: {
    paddingVertical: Spacing.xs,
  },
  cell: {
    height: ITEM_HEIGHT,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    backgroundColor: Colors.primaryText,
  },
  cellText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 18,
    color: Colors.primaryText,
  },
  cellTextActive: {
    color: Colors.surface,
    fontFamily: 'Rubik-Medium',
  },
  doneButton: {
    backgroundColor: Colors.primaryText,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  doneText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
