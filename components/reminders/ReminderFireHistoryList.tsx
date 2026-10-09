import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import ScrollFadeBand from '@/components/ui/ScrollFadeBand';
import { categoryLabel } from '@/components/pickers/CategoryPickerSheet';
import { formatSheetClockTime } from '@/components/reminders/reminderFormShared';
import { t } from '@/i18n';
import type { Reminder } from '@/types/api';
import {
  REMINDER_CATEGORIES,
  resolveReminderCategory,
  type ReminderCategory,
} from '@/utils/reminderCategory';
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
} from '@/utils/calendar';

const SHEET_SNAP_MS = 320;
const LIST_ROW = 90;
const LIST_ROW_GAP = 16;
/** Handle, the gap under it, the title, and the gap before the rows. */
const SHEET_CHROME = 16 + 10 + 28 + 16;
/** Collapsed curtain shows two rows. The lower one sits in the fade. */
const COLLAPSED_PEEK = SHEET_CHROME + LIST_ROW + LIST_ROW_GAP + LIST_ROW;
const COMPLETED_BAR = '#1EC876';
const ITEM_GAP = 16;

function rowCategory(item: Reminder): ReminderCategory {
  const value = item.category;
  if (value && (REMINDER_CATEGORIES as string[]).includes(value)) {
    return value as ReminderCategory;
  }
  return resolveReminderCategory(item.title);
}

/** Today and yesterday keep a word. Older rows show the date next to the time. */
function historyDayLabel(date: string): string {
  const today = todayIsoDate();
  if (date === today) return t('common.today');
  if (date === addDaysToIsoDate(today, -1)) return t('common.yesterday');
  if (date === addDaysToIsoDate(today, 1)) return t('common.tomorrow');
  return formatDisplayDate(date);
}

function HistoryRow({ item }: { item: Reminder }) {
  const styles = useThemedStyles(makeRowStyles);
  const completed = item.status === 'completed';
  return (
    <View style={styles.card}>
      {completed ? <View style={styles.completedBar} /> : null}
      <View style={[styles.content, !completed && styles.contentInset]}>
        <View style={styles.line}>
          <Text style={styles.category} numberOfLines={1}>
            {categoryLabel(rowCategory(item))}
          </Text>
          <Text style={styles.time} numberOfLines={1}>
            {formatSheetClockTime(item.time)}
          </Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.desc} numberOfLines={1}>
            {item.title}
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
  anchorTop,
  expandedTop,
  footerInset,
  onPeekHeight,
}: {
  items: Reminder[];
  /** Distance from the top of the screen to the bottom of the fields above. */
  anchorTop: number;
  /** Open sheet starts here, just under the Recent title. */
  expandedTop: number;
  /** Delete footer height the collapsed sheet rests above. */
  footerInset: number;
  onPeekHeight?: (height: number) => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const shift = useRef(new Animated.Value(1200)).current;
  const shiftRef = useRef(800);
  const screenRef = useRef(0);
  const anchorRef = useRef(anchorTop);
  const footerRef = useRef(footerInset);
  const expandedRef = useRef(false);
  const draggingRef = useRef(false);
  const animatingRef = useRef(false);
  const dragOriginRef = useRef(0);
  const [frameHeight, setFrameHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [placed, setPlaced] = useState(false);

  anchorRef.current = anchorTop;
  footerRef.current = footerInset;
  const expandedTopRef = useRef(expandedTop);
  expandedTopRef.current = Math.max(0, expandedTop);
  const placedRef = useRef(false);

  const peekFor = useCallback((screen: number) => {
    const anchor = anchorRef.current;
    if (!screen || anchor <= 0) return 72;
    const room = screen - footerRef.current - anchor;
    if (room <= 48) return Math.max(0, room);
    return Math.min(COLLAPSED_PEEK, room);
  }, []);

  const collapsedShift = useCallback(() => {
    const screen = screenRef.current;
    if (!screen) return 0;
    return Math.max(0, screen - footerRef.current - peekFor(screen));
  }, [peekFor]);

  const moveTo = useCallback((next: number) => {
    if (Math.abs(shiftRef.current - next) < 1) {
      shift.setValue(next);
      shiftRef.current = next;
      return;
    }
    animatingRef.current = true;
    Animated.timing(shift, {
      toValue: next,
      duration: SHEET_SNAP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) animatingRef.current = false;
    });
  }, [shift]);

  const syncRest = useCallback(() => {
    const screen = screenRef.current;
    if (!screen || anchorRef.current <= 0) return;
    const peek = peekFor(screen);
    onPeekHeight?.(peek);
    if (draggingRef.current || animatingRef.current) return;
    const next = expandedRef.current ? expandedTopRef.current : collapsedShift();
    if (!placedRef.current) {
      placedRef.current = true;
      shift.setValue(next);
      shiftRef.current = next;
      setPlaced(true);
      return;
    }
    moveTo(next);
  }, [collapsedShift, moveTo, onPeekHeight, peekFor, shift]);

  useEffect(() => {
    const id = shift.addListener(({ value }) => {
      shiftRef.current = value;
    });
    return () => shift.removeListener(id);
  }, [shift]);

  useEffect(() => {
    syncRest();
  }, [anchorTop, expandedTop, footerInset, syncRest]);

  const snapSheet = useCallback((toExpanded: boolean) => {
    const screen = screenRef.current;
    if (!screen) return;
    const target = toExpanded ? expandedTopRef.current : collapsedShift();
    expandedRef.current = toExpanded;
    setExpanded(toExpanded);
    animatingRef.current = true;
    Animated.timing(shift, {
      toValue: target,
      duration: SHEET_SNAP_MS,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: true,
    }).start(() => {
      animatingRef.current = false;
    });
  }, [collapsedShift, shift]);

  const snapRef = useRef(snapSheet);
  snapRef.current = snapSheet;

  usePreventRemove(expanded, () => {
    snapRef.current(false);
  });

  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      snapRef.current(false);
      return true;
    });
    return () => sub.remove();
  }, [expanded]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          draggingRef.current = true;
          animatingRef.current = false;
          setDragging(true);
          dragOriginRef.current = shiftRef.current;
          shift.stopAnimation();
        },
        onPanResponderMove: (_, gesture) => {
          const maxShift = collapsedShift();
          const next = Math.min(
            maxShift,
            Math.max(expandedTopRef.current, dragOriginRef.current + gesture.dy),
          );
          shiftRef.current = next;
          shift.setValue(next);
        },
        onPanResponderRelease: () => {
          draggingRef.current = false;
          setDragging(false);
          const maxShift = collapsedShift();
          const mid = (expandedTopRef.current + maxShift) / 2;
          snapRef.current(shiftRef.current < mid);
        },
        onPanResponderTerminate: () => {
          draggingRef.current = false;
          setDragging(false);
          const maxShift = collapsedShift();
          const mid = (expandedTopRef.current + maxShift) / 2;
          snapRef.current(shiftRef.current < mid);
        },
      }),
    [collapsedShift, shift],
  );

  if (items.length === 0) return null;

  const raised = expanded || dragging;
  const openY = Math.max(0, expandedTop);
  const closedY = Math.max(openY + 1, collapsedShift());
  const backdropOpacity = shift.interpolate({
    inputRange: [openY, closedY],
    outputRange: [0.2, 0],
    extrapolate: 'clamp',
  });

  return (
    <>
    <Animated.View
      pointerEvents="none"
      style={[styles.backdrop, { opacity: backdropOpacity }]}
    />
    <Animated.View
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        if (!height || height === screenRef.current) return;
        screenRef.current = height;
        setFrameHeight(height);
        syncRest();
      }}
      style={[
        styles.sheet,
        {
          height: frameHeight || '100%',
          zIndex: raised ? 20 : 4,
          elevation: raised ? 8 : 4,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          opacity: placed ? 1 : 0,
          transform: [{ translateY: shift }],
        },
      ]}
    >
      <View style={styles.handleHit} {...pan.panHandlers}>
        <View style={styles.handle} />
      </View>
      <View style={[styles.body, expanded ? null : styles.bodyCollapsed]}>
        <View {...pan.panHandlers}>
          <Text style={styles.heading} numberOfLines={1}>
            {t('reminders.recent_list')}
          </Text>
        </View>
        <View style={styles.listFrame}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              expanded
                ? { paddingBottom: Math.max(0, expandedTop) + footerInset + insets.bottom }
                : items.length > 1
                  ? { paddingBottom: LIST_ROW }
                  : null,
            ]}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {items.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </ScrollView>
          {!expanded && items.length > 1 ? (
            <ScrollFadeBand
              edge="bottom"
              height={LIST_ROW}
              solidAt={1}
              color={colors.surface}
            />
          ) : null}
        </View>
      </View>
      </Animated.View>
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
      zIndex: 5,
      elevation: 5,
    },
    sheet: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    body: {
      flex: 1,
      gap: 16,
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    bodyCollapsed: {
      marginTop: 10,
    },
    handleHit: {
      height: 16,
      alignItems: 'center',
    },
    handle: {
      marginTop: 8,
      width: 36,
      height: 5,
      borderRadius: 100,
      backgroundColor: c.border,
    },
    heading: {
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      color: c.primaryText,
      textAlign: 'left',
    },
    scroll: {
      flex: 1,
    },
    listFrame: {
      flex: 1,
      minHeight: 0,
    },
    scrollContent: {
      paddingBottom: 24,
      gap: ITEM_GAP,
    },
  });

const makeRowStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: '100%',
      minHeight: 90,
      boxSizing: 'border-box',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: 24,
      paddingTop: 7,
      paddingBottom: 7,
      paddingRight: 16,
      backgroundColor: c.background,
      overflow: 'hidden',
    },
    completedBar: {
      width: 6,
      height: 76,
      borderRadius: 2,
      backgroundColor: COMPLETED_BAR,
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },
    contentInset: {
      marginLeft: 16,
    },
    line: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    category: {
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
    desc: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    day: {
      flexShrink: 0,
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      textAlign: 'right',
    },
  });
