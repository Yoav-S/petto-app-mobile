import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import {
  REMINDER_CATEGORIES,
  reminderCategoryIconFor,
  type ReminderCategory,
} from '@/utils/reminderCategory';

interface CategoryPickerSheetProps {
  visible: boolean;
  value: ReminderCategory;
  onClose: () => void;
  onSelect: (value: ReminderCategory) => void;
}

export function categoryLabel(value: ReminderCategory): string {
  return t(`reminders.category_${value}`);
}

export default function CategoryPickerSheet({
  visible,
  value,
  onClose,
  onSelect,
}: CategoryPickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{t('reminders.category_title')}</Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.primaryText} />
          </Pressable>
        </View>

        <View style={styles.list}>
          {REMINDER_CATEGORIES.map((option, index) => {
            const isActive = option === value;
            return (
              <Pressable key={option} style={styles.row} onPress={() => onSelect(option)}>
                <View style={styles.rowLeft}>
                  <Image
                    source={reminderCategoryIconFor(option)}
                    style={styles.rowIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.rowText}>{categoryLabel(option)}</Text>
                </View>
                {isActive ? (
                  <Ionicons name="checkmark" size={20} color={colors.primaryText} />
                ) : null}
                {index < REMINDER_CATEGORIES.length - 1 ? <View style={styles.divider} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: {
      borderRadius: Radius.lg,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    row: {
      minHeight: 52,
      paddingVertical: 14,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      paddingRight: 12,
    },
    rowIcon: {
      width: 28,
      height: 28,
    },
    rowText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      color: c.primaryText,
    },
    divider: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
    },
  });
