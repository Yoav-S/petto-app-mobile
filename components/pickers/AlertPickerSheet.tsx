import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import { t } from '@/i18n';
import { ALERT_OPTIONS, type AlertOption } from '@/services/reminders';
import { isAlertOptionPossible } from '@/components/reminders/reminderFormShared';

const SHEET_HEIGHT_RATIO = 0.75;
const ROW_H = 24;
const LIST_GAP = 16;
const CARD_PAD = 16;
const HEADER_BLOCK = 32;
const DONE_BLOCK = 48;
const SHEET_GAP = 12;
const SHEET_PAD_TOP = 20;

interface AlertPickerSheetProps {
  visible: boolean;
  value: AlertOption;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  onClose: () => void;
  onConfirm: (value: AlertOption) => void;
}

export function alertLabel(value: AlertOption): string {
  return t(`reminders.alert_${value}`);
}

export default function AlertPickerSheet({
  visible,
  value,
  scheduledDate,
  scheduledTime,
  onClose,
  onConfirm,
}: AlertPickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [draft, setDraft] = useState<AlertOption>(value);

  useEffect(() => {
    if (!visible) return;
    setDraft(isAlertOptionPossible(value, scheduledDate, scheduledTime) ? value : 'off');
  }, [visible, value, scheduledDate, scheduledTime]);

  const sheetMaxHeight = Math.round(windowHeight * SHEET_HEIGHT_RATIO);
  const bottomPad = Math.max(insets.bottom, 16);
  const dividerCount = Math.max(0, ALERT_OPTIONS.length - 1);
  // Row, 16px, zero-height rule, 16px, row. Eight rows land on the 416px list.
  const listHeightEstimate =
    ALERT_OPTIONS.length * ROW_H +
    (ALERT_OPTIONS.length + dividerCount - 1) * LIST_GAP +
    CARD_PAD * 2;
  const chromeHeight = SHEET_PAD_TOP + HEADER_BLOCK + SHEET_GAP * 2 + DONE_BLOCK + bottomPad;
  const needsScroll = chromeHeight + listHeightEstimate > sheetMaxHeight;
  const listMaxHeight = Math.max(120, sheetMaxHeight - chromeHeight);

  const list = useMemo(
    () => (
      <View style={styles.list}>
        {ALERT_OPTIONS.map((option, index) => {
          const enabled = isAlertOptionPossible(option, scheduledDate, scheduledTime);
          const isActive = option === draft && enabled;
          return (
            <React.Fragment key={option}>
              <Pressable
                style={styles.row}
                disabled={!enabled}
                onPress={() => {
                  if (enabled) setDraft(option);
                }}
              >
                <Text style={[styles.rowText, !enabled && styles.rowTextDisabled]}>
                  {alertLabel(option)}
                </Text>
                <View style={[styles.checkbox, isActive && styles.checkboxChecked]}>
                  {isActive ? (
                    <Ionicons name="checkmark" size={16} color={colors.button.primaryText} />
                  ) : null}
                </View>
              </Pressable>
              {index < ALERT_OPTIONS.length - 1 ? (
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                </View>
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    ),
    [
      colors.button.primaryText,
      draft,
      scheduledDate,
      scheduledTime,
      styles.checkbox,
      styles.checkboxChecked,
      styles.divider,
      styles.dividerLine,
      styles.list,
      styles.row,
      styles.rowText,
      styles.rowTextDisabled,
    ],
  );

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View
        style={[
          styles.sheet,
          {
            paddingBottom: bottomPad,
            maxHeight: sheetMaxHeight,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{t('reminders.alert_title')}</Text>
          <HeaderIconButton onPress={onClose} accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} color={colors.primaryText} />
          </HeaderIconButton>
        </View>

        {needsScroll ? (
          <ScrollView
            style={{ maxHeight: listMaxHeight }}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {list}
          </ScrollView>
        ) : (
          list
        )}

        <Pressable
          style={styles.doneButton}
          onPress={() => {
            const next = isAlertOptionPossible(draft, scheduledDate, scheduledTime)
              ? draft
              : 'off';
            onConfirm(next);
            onClose();
          }}
        >
          <Text style={styles.doneText}>{t('pickers.done')}</Text>
        </Pressable>
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
      paddingHorizontal: 20,
      paddingTop: SHEET_PAD_TOP,
      gap: SHEET_GAP,
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
      minHeight: HEADER_BLOCK,
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
      padding: CARD_PAD,
      gap: LIST_GAP,
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0x0f / 255,
      shadowRadius: 8,
      boxShadow: '0px 3px 8px rgba(31, 31, 31, 0.059)',
      elevation: 3,
    },
    row: {
      height: ROW_H,
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
    rowTextDisabled: {
      color: c.secondaryText,
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
    doneButton: {
      ...PRIMARY_BUTTON,
      backgroundColor: c.brand,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    doneText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.button.primaryText,
    },
  });
