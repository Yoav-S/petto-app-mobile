import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
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
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('reminders.repeat_title')}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.primaryText} />
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
                    <Ionicons name="checkmark" size={20} color={Colors.primaryText} />
                  ) : null}
                  {index < REPEAT_OPTIONS.length - 1 ? <View style={styles.divider} /> : null}
                </Pressable>
              );
            })}
          </View>
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
  list: {
    backgroundColor: Colors.surface,
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
    color: Colors.primaryText,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
});
