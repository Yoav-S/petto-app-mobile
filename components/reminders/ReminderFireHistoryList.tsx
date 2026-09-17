import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import {
  FOOTER_FADE_BAND,
  FOOTER_FADE_CONTENT_INSET,
  SCROLL_LIST_TOP_FADE_GRADIENT,
} from '@/constants/layout';
import ScrollFadeBand from '@/components/ui/ScrollFadeBand';
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
/** Figma shows roughly this much of the list on landing (375×812). */
export const HISTORY_LIST_MIN_HEIGHT = 200;
/** Figma fade band (375×812 → 122pt). */
export const HISTORY_LIST_FADE_HEIGHT = FOOTER_FADE_BAND;
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
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.time} numberOfLines={1}>
            {formatSheetClockTime(item.time)}
          </Text>
          <Text style={styles.day} numberOfLines={1}>
            {historyDayLabel(item.date)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ReminderFireHistoryList({
  items,
  width,
  fill = false,
  bottomFade = true,
  contentBottomInset,
}: {
  items: Reminder[];
  width: number;
  /** Take the remaining screen height instead of sizing to the rows. */
  fill?: boolean;
  /** Off when the screen already paints a fade band over the list bottom. */
  bottomFade?: boolean;
  /** Scroll room below the last row so it can clear the fade band. */
  contentBottomInset?: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const [overflows, setOverflows] = useState(false);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);

  const rowsHeight = useMemo(() => {
    if (items.length === 0) return 0;
    return items.length * HISTORY_ITEM_HEIGHT + (items.length - 1) * HISTORY_ITEM_GAP;
  }, [items.length]);

  const fixedHeight = Math.min(
    Math.max(rowsHeight, HISTORY_ITEM_HEIGHT),
    HISTORY_LIST_MAX_HEIGHT,
  );
  const scrollRoom = contentBottomInset ?? FOOTER_FADE_CONTENT_INSET;

  const syncOverflow = () => {
    setOverflows(contentHeight.current > viewportHeight.current + 1);
  };

  if (items.length === 0) return null;

  return (
    <View style={[styles.wrap, { width }, fill ? styles.wrapFill : null]}>
      <Text style={styles.heading}>{t('reminders.recent_list')}</Text>
      <View
        style={[
          styles.listFrame,
          fill ? styles.listFrameFill : { height: fixedHeight },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            scrollRoom > 0 ? { paddingBottom: scrollRoom } : null,
          ]}
          nestedScrollEnabled
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          onLayout={(e) => {
            viewportHeight.current = e.nativeEvent.layout.height;
            syncOverflow();
          }}
          onContentSizeChange={(_w, h) => {
            contentHeight.current = h;
            syncOverflow();
          }}
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
        {overflows ? (
          <ScrollFadeBand edge="top" height={SCROLL_LIST_TOP_FADE_GRADIENT} />
        ) : null}
        {bottomFade && overflows ? <ScrollFadeBand edge="bottom" /> : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      gap: TITLE_TO_LIST,
    },
    wrapFill: {
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: 'auto',
      minHeight: HISTORY_LIST_MIN_HEIGHT,
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
    listFrameFill: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: HISTORY_ITEM_HEIGHT,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
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
    /** Name top-left, time over date top-right — the row is not vertically centered. */
    inner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 10,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
    },
    meta: {
      flexShrink: 0,
      alignItems: 'flex-end',
      gap: 4,
    },
    time: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: c.primaryText,
      textAlign: 'right',
    },
    day: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
      textAlign: 'right',
    },
  });
