import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal, {
  waitForBottomSheetsToSettle,
} from '@/components/ui/BottomSheetModal';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
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
  const { contentWidth } = useResponsiveLayout();

  const runAfterClose = (action: () => void) => {
    onClose();
    void waitForBottomSheetsToSettle().then(action);
  };

  const actions: { key: string; label: string; danger?: boolean; onPress: () => void }[] = [
    isResolved
      ? {
          key: 'reopen',
          label: t('topics.reopen_topic'),
          onPress: () => runAfterClose(() => onReopen?.()),
        }
      : {
          key: 'resolve',
          label: t('topics.mark_resolved'),
          onPress: () => runAfterClose(() => onMarkResolved?.()),
        },
    {
      key: 'edit',
      label: t('topics.edit_topic'),
      onPress: () => runAfterClose(onEditTopic),
    },
    {
      key: 'remove',
      label: t('topics.remove_topic'),
      danger: true,
      onPress: () => runAfterClose(onRemoveTopic),
    },
  ];

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
          <View style={[styles.menuContainer, { width: contentWidth }]}>
            <View style={[styles.menuList, { width: contentWidth - 32 }]}>
              {actions.map((action, index) => (
                <React.Fragment key={action.key}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={action.onPress}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        action.danger ? styles.removeText : null,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                  {index < actions.length - 1 ? <View style={styles.menuDivider} /> : null}
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.cancelWrap}>
            <TouchableOpacity
              style={[styles.cancelButton, { width: contentWidth }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
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
      paddingHorizontal: 20,
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
      alignItems: 'center',
    },
    menuContainer: {
      minHeight: 136,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    menuList: {
      minHeight: 104,
      gap: 8,
      justifyContent: 'center',
    },
    menuDivider: {
      height: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      alignSelf: 'stretch',
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
      ...PRIMARY_BUTTON,
      backgroundColor: c.surface,
      flexDirection: 'row',
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
      lineHeight: 24,
      textAlign: 'center',
    },
  });
