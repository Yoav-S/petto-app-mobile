import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { REPEAT_OPTIONS, type RepeatOption } from '@/services/reminders';

interface RepeatPickerSheetProps {
  visible: boolean;
  value: RepeatOption;
  onClose: () => void;
  onSelect: (value: RepeatOption) => void;
}

export function repeatLabel(value: RepeatOption): string {
  return t(`reminders.repeat_${value}`);
}

export default function RepeatPickerSheet({ visible, value, onClose, onSelect }: RepeatPickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('reminders.repeat_title')}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.primaryText} />
            </Pressable>
          </View>

          <View style={styles.list}>
            {REPEAT_OPTIONS.map((option, index) => {
              const isActive = option === value;
              return (
                <Pressable
                  key={option}
                  style={styles.row}
                  onPress={() => onSelect(option)}
                >
                  <Text style={styles.rowText}>{repeatLabel(option)}</Text>
                  {isActive ? (
                    <Ionicons name="checkmark" size={20} color={colors.primaryText} />
                  ) : null}
                  {index < REPEAT_OPTIONS.length - 1 ? <View style={styles.divider} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: c.surface,
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
  list: {
    backgroundColor: c.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.primaryText,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: c.border,
  },
});
