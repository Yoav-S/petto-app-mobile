import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
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
            <HeaderIconButton onPress={onClose} accessibilityLabel={t('common.close')}>
              <Ionicons name="close" size={24} color={colors.primaryText} />
            </HeaderIconButton>
          </View>

          <View style={styles.list}>
            {REPEAT_OPTIONS.map((option, index) => {
              const isActive = option === value;
              return (
                <React.Fragment key={option}>
                  <Pressable
                    style={styles.row}
                    onPress={() => onSelect(option)}
                  >
                    <Text style={styles.rowText}>{repeatLabel(option)}</Text>
                    <View style={[styles.checkbox, isActive && styles.checkboxChecked]}>
                      {isActive ? (
                        <Ionicons name="checkmark" size={16} color={colors.button.primaryText} />
                      ) : null}
                    </View>
                  </Pressable>
                  {index < REPEAT_OPTIONS.length - 1 ? (
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                    </View>
                  ) : null}
                </React.Fragment>
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
    backgroundColor: c.panel,
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
    color: c.primaryText,
  },
  list: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: '#1F1F1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0x0f / 255,
    shadowRadius: 8,
    boxShadow: '0px 3px 8px rgba(31, 31, 31, 0.059)',
    elevation: 3,
  },
  row: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 20,
    color: c.primaryText,
  },
  checkbox: {
    width: 20,
    height: 20,
    margin: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkboxChecked: {
    backgroundColor: c.brand,
    borderColor: c.brand,
  },
  divider: {
    height: 0,
    overflow: 'visible',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 0,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
});
