import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheetModal, {
  waitForBottomSheetsToSettle,
} from '@/components/ui/BottomSheetModal';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';

interface TopicActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onMarkResolved: () => void;
}

export default function TopicActionsSheet({
  visible,
  onClose,
  onMarkResolved,
}: TopicActionsSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />

        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{t('topics.title')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              // Never present ConfirmModal over a dismissing sheet on iOS.
              void waitForBottomSheetsToSettle().then(onMarkResolved);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.menuItemText}>{t('topics.mark_resolved')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      gap: Spacing.md,
    },
    dragHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSpacer: {
      width: 36,
    },
    title: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'center',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    menuContainer: {
      backgroundColor: c.background,
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    menuItem: {
      paddingVertical: 16,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    menuItemText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 22,
      color: c.primaryText,
    },
    cancelButton: {
      marginTop: Spacing.xs,
      height: 48,
      borderRadius: Radius.md,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
    },
  });
