import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import HeaderIconButton, {
  HEADER_ICON_BTN,
} from '@/components/ui/HeaderIconButton';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
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
  const { contentWidth } = useResponsiveLayout();

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + Spacing.md }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title} numberOfLines={1}>
            {t('reminders.category_title')}
          </Text>
          <HeaderIconButton onPress={onClose} accessibilityLabel={t('common.close')}>
            <Ionicons
              name="close"
              size={HEADER_ICON_BTN.iconSize}
              color={colors.primaryText}
            />
          </HeaderIconButton>
        </View>

        <View style={styles.body}>
          <View style={[styles.optionsCard, { width: contentWidth }]}>
            {REMINDER_CATEGORIES.map((option, index) => {
              const isActive = option === value;
              return (
                <Pressable
                  key={option}
                  style={styles.row}
                  onPress={() => onSelect(option)}
                >
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
                  {index < REMINDER_CATEGORIES.length - 1 ? (
                    <View style={styles.divider} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.cancelButton, { width: contentWidth }]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 32,
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
      minHeight: 32,
    },
    headerSpacer: { width: HEADER_ICON_BTN.size },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    body: {
      gap: 22,
      alignItems: 'center',
    },
    optionsCard: {
      borderRadius: Radius.lg,
      backgroundColor: c.surface,
      padding: 16,
      gap: 10,
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
    },
    row: {
      minHeight: 40,
      paddingVertical: 8,
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
    cancelButton: {
      height: 48,
      borderRadius: Radius.lg,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 3,
    },
    cancelText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
  });
