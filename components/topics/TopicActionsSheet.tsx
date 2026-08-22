import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal, {
  waitForBottomSheetsToSettle,
} from '@/components/ui/BottomSheetModal';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useTheme, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';

interface TopicActionsSheetProps {
  visible: boolean;
  isResolved?: boolean;
  onClose: () => void;
  onMarkResolved?: () => void;
  onReopen?: () => void;
  onEditTopic: () => void;
  onRemoveTopic: () => void;
}

export default function TopicActionsSheet({
  visible,
  isResolved = false,
  onClose,
  onMarkResolved,
  onReopen,
  onEditTopic,
  onRemoveTopic,
}: TopicActionsSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const runAfterClose = (action: () => void) => {
    onClose();
    void waitForBottomSheetsToSettle().then(action);
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{t('topics.topic_actions')}</Text>
          <HeaderIconButton onPress={onClose} accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
          </HeaderIconButton>
        </View>

        <View style={styles.body}>
          <View style={styles.menuContainer}>
            <View style={styles.menuList}>
              {isResolved ? (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => runAfterClose(() => onReopen?.())}
                    accessibilityRole="button"
                  >
                    <Text style={styles.menuItemText}>{t('topics.reopen_topic')}</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => runAfterClose(() => onMarkResolved?.())}
                    accessibilityRole="button"
                  >
                    <Text style={styles.menuItemText}>{t('topics.mark_resolved')}</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              )}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => runAfterClose(onEditTopic)}
                accessibilityRole="button"
              >
                <Text style={styles.menuItemText}>{t('topics.edit_topic')}</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => runAfterClose(onRemoveTopic)}
                accessibilityRole="button"
              >
                <Text style={[styles.menuItemText, styles.removeText]}>
                  {t('topics.remove_topic')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cancelWrap}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
              <Text style={[styles.cancelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: c.panel,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 32,
      paddingHorizontal: Spacing.lg,
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 12,
    },
    header: {
      height: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    headerSpacer: {
      width: HEADER_ICON_BTN.size,
      height: HEADER_ICON_BTN.size,
    },
    title: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
      textAlign: 'center',
    },
    body: {
      gap: 22,
    },
    menuContainer: {
      width: '100%',
      height: 136,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    menuList: {
      width: 303,
      minHeight: 104,
      gap: 8,
      justifyContent: 'center',
    },
    menuDivider: {
      width: 303,
      height: 0,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      alignSelf: 'center',
    },
    menuItem: {
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuItemText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
      textAlign: 'center',
    },
    removeText: {
      color: c.error,
    },
    cancelWrap: {
      minHeight: 84,
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 2,
    },
    cancelButton: {
      width: '100%',
      height: 48,
      borderRadius: 12,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 3,
    },
    cancelText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
    },
  });
