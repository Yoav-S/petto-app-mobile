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
import { Spacing, type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { ALERT_OPTIONS, type AlertOption } from '@/services/reminders';
import { isAlertOptionPossible } from '@/components/reminders/reminderFormShared';

const SHEET_HEIGHT_RATIO = 0.75;
const ROW_PAD_V = 16;
const ROW_LINE = 20;
const DIVIDER_H = 1;
const HEADER_BLOCK = 44;
const DONE_BLOCK = 52;
const SHEET_GAP = 12;
const SHEET_PAD_TOP = Spacing.lg;

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
  const listHeightEstimate =
    ALERT_OPTIONS.length * (ROW_PAD_V * 2 + ROW_LINE) +
    Math.max(0, ALERT_OPTIONS.length - 1) * DIVIDER_H;
  const chromeHeight = SHEET_PAD_TOP + HEADER_BLOCK + SHEET_GAP + DONE_BLOCK + bottomPad;
  const needsScroll = chromeHeight + listHeightEstimate > sheetMaxHeight;
  const listMaxHeight = Math.max(120, sheetMaxHeight - chromeHeight);

  const list = useMemo(
    () => (
      <View style={styles.list}>
        {ALERT_OPTIONS.map((option, index) => {
          const enabled = isAlertOptionPossible(option, scheduledDate, scheduledTime);
          const isActive = option === draft && enabled;
          return (
            <View key={option}>
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
                {isActive ? (
                  <Ionicons name="checkmark" size={20} color={colors.primaryText} />
                ) : null}
              </Pressable>
              {index < ALERT_OPTIONS.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          );
        })}
      </View>
    ),
    [
      colors.primaryText,
      draft,
      scheduledDate,
      scheduledTime,
      styles.divider,
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
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.primaryText} />
          </Pressable>
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
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: Spacing.lg,
      paddingTop: SHEET_PAD_TOP,
      gap: SHEET_GAP,
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
      paddingVertical: ROW_PAD_V,
    },
    rowText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: ROW_LINE,
      color: c.primaryText,
    },
    rowTextDisabled: {
      color: c.secondaryText,
    },
    divider: {
      height: DIVIDER_H,
      width: '100%',
      backgroundColor: c.border,
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
