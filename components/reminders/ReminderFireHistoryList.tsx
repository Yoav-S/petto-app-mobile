import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { FOOTER_FADE_BAND, FOOTER_FADE_CONTENT_INSET } from '@/constants/layout';
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
const SCROLLED_EPSILON = 4;

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
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const rowsHeight = useMemo(() => {
    if (items.length === 0) return 0;
    return items.length * HISTORY_ITEM_HEIGHT + (items.length - 1) * HISTORY_ITEM_GAP;
  }, [items.length]);

  const fixedHeight = Math.min(
    Math.max(rowsHeight, HISTORY_ITEM_HEIGHT),
    HISTORY_LIST_MAX_HEIGHT,
  );
  const scrollRoom = contentBottomInset ?? FOOTER_FADE_CONTENT_INSET;
  const overflows = contentHeight > viewportHeight + 1;
  const atEnd = scrollY + viewportHeight >= contentHeight - SCROLLED_EPSILON;
  const showTopFade = overflows && scrollY > SCROLLED_EPSILON;
  const showBottomFade = bottomFade && overflows && !atEnd;

  if (items.length === 0) return null;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

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
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setContentHeight(h)}
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
        {showTopFade ? <ScrollFadeBand edge="top" /> : null}
        {showBottomFade ? <ScrollFadeBand edge="bottom" /> : null}
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
