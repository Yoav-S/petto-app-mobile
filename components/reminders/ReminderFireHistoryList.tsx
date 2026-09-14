import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Radius, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { SCROLL_BOTTOM_FADE_SOLID_AT } from '@/constants/layout';
import { t } from '@/i18n';
import type { Reminder } from '@/types/api';
import { formatSheetClockTime } from '@/components/reminders/reminderFormShared';
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
} from '@/utils/calendar';

/** Figma compact history row. */
export const HISTORY_ITEM_HEIGHT = 54;
export const HISTORY_ITEM_GAP = 12;
export const HISTORY_LIST_MAX_HEIGHT = 404;
/** Figma fade band (375×812 → 122pt). */
export const HISTORY_LIST_FADE_HEIGHT = 122;
const TITLE_TO_LIST = 16;

function historyDayLabel(date: string): string {
  const today = todayIsoDate();
  if (date === today) return t('common.today');
  if (date === addDaysToIsoDate(today, -1)) return t('common.yesterday');
  if (date === addDaysToIsoDate(today, 1)) return t('common.tomorrow');
  return formatDisplayDate(date);
}

function HistoryRow({ item }: { item: Reminder }) {
  const styles = useThemedStyles(makeRowStyles);
  return (
    <View style={styles.card}>
      {item.status === 'completed' ? <View style={styles.completedBar} /> : null}
      <View style={styles.inner}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time} numberOfLines={1}>
            {formatSheetClockTime(item.time)}
          </Text>
        </View>
        <Text style={styles.day} numberOfLines={1}>
          {historyDayLabel(item.date)}
        </Text>
      </View>
    </View>
  );
}

export default function ReminderFireHistoryList({
  items,
  width,
}: {
  items: Reminder[];
  width: number;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [gradientId] = useState(() => `hist-fade-${Math.random().toString(36).slice(2, 8)}`);

  const contentHeight = useMemo(() => {
    if (items.length === 0) return 0;
    return items.length * HISTORY_ITEM_HEIGHT + (items.length - 1) * HISTORY_ITEM_GAP;
  }, [items.length]);

  const viewportHeight = Math.min(
    Math.max(contentHeight, HISTORY_ITEM_HEIGHT),
    HISTORY_LIST_MAX_HEIGHT,
  );
  const innerScrolls = contentHeight > HISTORY_LIST_MAX_HEIGHT;
  const showFade = viewportHeight >= HISTORY_ITEM_HEIGHT * 2;

  if (items.length === 0) return null;

  return (
    <View style={[styles.wrap, { width }]}>
      <Text style={styles.heading}>{t('reminders.recent_list')}</Text>
      <View style={[styles.listFrame, { height: viewportHeight }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            showFade ? { paddingBottom: HISTORY_LIST_FADE_HEIGHT * 0.45 } : null,
          ]}
          nestedScrollEnabled
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          scrollEnabled={innerScrolls || contentHeight > viewportHeight}
        >
          {items.map((item, index) => (
            <View
              key={item.id}
              style={index < items.length - 1 ? { marginBottom: HISTORY_ITEM_GAP } : null}
            >
              <HistoryRow item={item} />
            </View>
          ))}
        </ScrollView>
        {showFade ? (
          <View style={styles.fade} pointerEvents="none">
            <Svg width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.background} stopOpacity="0" />
                  <Stop
                    offset={String(1 - SCROLL_BOTTOM_FADE_SOLID_AT)}
                    stopColor={colors.background}
                    stopOpacity="0"
                  />
                  <Stop offset="1" stopColor={colors.background} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
            </Svg>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      gap: TITLE_TO_LIST,
    },
    heading: {
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      color: c.primaryText,
    },
    listFrame: {
      width: '100%',
      overflow: 'hidden',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    fade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: HISTORY_LIST_FADE_HEIGHT,
    },
  });

const makeRowStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: '100%',
      height: HISTORY_ITEM_HEIGHT,
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      flexDirection: 'row',
      overflow: 'hidden',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 3,
    },
    completedBar: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 2,
      backgroundColor: c.success,
    },
    inner: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      justifyContent: 'center',
      gap: 2,
    },
    titleRow: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    time: {
      flexShrink: 0,
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'right',
    },
    day: {
      height: 16,
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
    },
  });
