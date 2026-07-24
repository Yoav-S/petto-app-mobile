import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { reminderCategoryIcon } from '@/utils/reminderCategory';
import { formatSheetClockTime } from '@/components/reminders/reminderFormShared';

interface ReminderActionSheetProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  time?: string;
  /** Relative/absolute date label under the subtitle (Today / Yesterday / Apr 21). */
  dateLabel?: string;
  currentIndex?: number;
  totalCount?: number;
  onClose: () => void;
  onDone: () => void;
  onMissed: () => void;
}

export default function ReminderActionSheet({
  visible,
  title,
  subtitle,
  time,
  dateLabel,
  currentIndex,
  totalCount,
  onClose,
  onDone,
  onMissed,
}: ReminderActionSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [subtitleExpanded, setSubtitleExpanded] = useState(false);

  useEffect(() => {
    if (!visible) setSubtitleExpanded(false);
  }, [visible, title, subtitle]);

  const showPagination =
    currentIndex !== undefined && totalCount !== undefined && totalCount > 1;
  const clock = time ? formatSheetClockTime(time) : '';
  const hasSubtitle = Boolean(subtitle?.trim());

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.headerSide}>
              {showPagination ? (
                <Text style={styles.paginationText}>
                  {currentIndex}/{totalCount}
                </Text>
              ) : null}
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t('reminders.action_sheet_title')}
            </Text>
            <View style={[styles.headerSide, styles.headerSideEnd]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
              >
                <Ionicons name="close" size={24} color={colors.primaryText} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <ScrollView
              style={styles.cardScroll}
              contentContainerStyle={styles.cardInner}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.topSection}>
                <View style={styles.iconWrap}>
                  <Image
                    source={reminderCategoryIcon(title)}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  {clock ? (
                    <Text style={styles.cardTime} numberOfLines={1}>
                      {clock}
                    </Text>
                  ) : null}
                </View>

                {hasSubtitle ? (
                  <Pressable
                    onPress={() => setSubtitleExpanded((v) => !v)}
                    accessibilityRole="button"
                  >
                    <Text
                      style={styles.cardSubtitle}
                      numberOfLines={subtitleExpanded ? undefined : 2}
                      ellipsizeMode="tail"
                    >
                      {subtitle}
                    </Text>
                    {!subtitleExpanded && (subtitle?.length ?? 0) > 60 ? (
                      <Text style={styles.showMore}>{t('reminders.show_more')}</Text>
                    ) : null}
                  </Pressable>
                ) : null}

                {dateLabel ? <Text style={styles.cardDate}>{dateLabel}</Text> : null}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.doneButton} onPress={onDone} activeOpacity={0.85}>
                  <Text style={styles.doneText}>{t('reminders.mark_done')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.missedButton}
                  onPress={onMissed}
                  activeOpacity={0.85}
                >
                  <Text style={styles.missedText}>{t('reminders.mark_missed')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
    </BottomSheetModal>
  );
}

const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.panel,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 28,
      paddingHorizontal: 20,
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
      minHeight: 44,
      paddingVertical: 6,
      marginBottom: 22,
    },
    headerSide: {
      width: 56,
      justifyContent: 'center',
    },
    headerSideEnd: {
      alignItems: 'flex-end',
    },
    paginationText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.secondaryText,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      padding: 4,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...CARD_SHADOW,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingVertical: 20,
      paddingHorizontal: 16,
      marginBottom: 8,
      ...CARD_SHADOW,
      shadowOpacity: 0.04,
    },
    cardScroll: {
      maxHeight: 360,
    },
    cardInner: {
      gap: 20,
    },
    topSection: {
      gap: 8,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: c.panel,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    icon: {
      width: 44,
      height: 44,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
    },
    cardTitle: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    cardTime: {
      minWidth: 52,
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      textAlign: 'right',
      color: c.primaryText,
    },
    cardSubtitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    showMore: {
      marginTop: 2,
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: c.brand,
    },
    cardDate: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    actions: {
      gap: 12,
    },
    doneButton: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.button.primaryText,
    },
    missedButton: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    missedText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
    },
  });
