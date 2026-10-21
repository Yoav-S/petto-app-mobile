import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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

const SLOP = 8;
/** Any slide past this commits. The sheet no longer waits for the halfway point. */
const NUDGE = 4;
const SNAP_MS = 280;
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
  const listRef = useAnimatedRef<Animated.ScrollView>();
  const shift = useSharedValue(1200);
  const openY = useSharedValue(0);
  const closedY = useSharedValue(800);
  const opened = useSharedValue(false);
  const dragging = useSharedValue(false);
  const scrollY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const listPanOn = useSharedValue(false);
  const grabOrigin = useSharedValue(0);
  const grabDy = useSharedValue(0);
  const grabPeak = useSharedValue(0);
  const screenRef = useRef(0);
  const anchorRef = useRef(anchorTop);
  const footerRef = useRef(footerInset);
  const [frameHeight, setFrameHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [listScroll, setListScroll] = useState(false);
  const [blockBehind, setBlockBehind] = useState(false);
  const [placed, setPlaced] = useState(false);

  anchorRef.current = anchorTop;
  footerRef.current = footerInset;
  const expandedTopRef = useRef(expandedTop);
  expandedTopRef.current = Math.max(0, expandedTop);

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

  const finishChrome = useCallback((open: boolean) => {
    setExpanded(open);
    setBlockBehind(open);
    if (!open) setListScroll(false);
  }, []);

  const releaseScroll = useCallback((open: boolean) => {
    setListScroll(open);
  }, []);

  const syncRest = useCallback(() => {
    const screen = screenRef.current;
    if (!screen || anchorRef.current <= 0) return;
    const peek = peekFor(screen);
    onPeekHeight?.(peek);
    const open = Math.max(0, expandedTopRef.current);
    const closed = Math.max(open + 1, collapsedShift());
    openY.value = open;
    closedY.value = closed;
    if (dragging.value) return;
    const next = opened.value ? open : closed;
    shift.value = next;
    if (!placed) setPlaced(true);
  }, [closedY, collapsedShift, dragging, onPeekHeight, openY, opened, peekFor, placed, shift]);

  useEffect(() => {
    syncRest();
  }, [anchorTop, expandedTop, footerInset, frameHeight, syncRest]);

  const { titlePan, handleGesture, listGesture, collapseOnUI } = useMemo(() => {
    const moveSheet = (dy: number) => {
      'worklet';
      if (dy === 0) return;
      const minY = Math.max(0, openY.value);
      const maxY = Math.max(minY + 1, closedY.value);
      shift.value = Math.min(maxY, Math.max(minY, shift.value + dy));
    };

    const goTo = (open: boolean) => {
      'worklet';
      const minY = Math.max(0, openY.value);
      const maxY = Math.max(minY + 1, closedY.value);
      cancelAnimation(shift);
      opened.value = open;
      dragging.value = false;
      if (!open) {
        scrollY.value = 0;
        scrollTo(listRef, 0, 0, false);
      }
      runOnJS(finishChrome)(open);
      shift.value = withTiming(open ? minY : maxY, { duration: SNAP_MS }, (finished) => {
        'worklet';
        if (finished) runOnJS(releaseScroll)(open);
      });
    };

    const settleFrom = (translationY: number) => {
      'worklet';
      if (translationY <= -NUDGE) goTo(true);
      else if (translationY >= NUDGE) goTo(false);
      else goTo(opened.value);
    };

    const dragPan = () =>
      Gesture.Pan()
        .activeOffsetY([-SLOP, SLOP])
        .failOffsetX([-28, 28])
        .onBegin(() => {
          cancelAnimation(shift);
          dragging.value = true;
        })
        .onChange((event) => {
          moveSheet(event.changeY);
        })
        .onEnd((event) => {
          dragging.value = false;
          settleFrom(event.translationY);
        });

    const handleTap = Gesture.Tap()
      .maxDistance(SLOP)
      .onEnd(() => {
        goTo(!opened.value);
      });

    const nativeScroll = Gesture.Native();
    const list = Gesture.Pan()
      .manualActivation(true)
      .onTouchesDown((event) => {
        const touch = event.allTouches[0];
        if (!touch) return;
        startX.value = touch.x;
        startY.value = touch.y;
        listPanOn.value = false;
      })
      .onTouchesMove((event, state) => {
        if (listPanOn.value) return;
        const touch = event.allTouches[0];
        if (!touch) return;
        const dx = touch.x - startX.value;
        const dy = touch.y - startY.value;
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          state.fail();
          return;
        }
        const minY = Math.max(0, openY.value);
        const maxY = Math.max(minY + 1, closedY.value);
        const atOpen = shift.value <= minY + 1;
        const opening = dy < 0 && !atOpen;
        const closing = dy > 0 && shift.value < maxY - 1 && (!atOpen || scrollY.value <= 0);
        if (opening || closing) {
          if (!listPanOn.value) {
            cancelAnimation(shift);
            grabOrigin.value = shift.value;
            grabDy.value = dy;
            grabPeak.value = 0;
            dragging.value = true;
          }
          listPanOn.value = true;
          state.activate();
          return;
        }
        state.fail();
      })
      .onTouchesUp((_, state) => {
        if (!listPanOn.value) state.fail();
      })
      .onChange((event) => {
        moveSheet(event.changeY);
        grabPeak.value = Math.max(grabPeak.value, Math.abs(shift.value - grabOrigin.value));
      })
      .onEnd((event) => {
        if (!listPanOn.value) return;
        dragging.value = false;
        const moved = shift.value - grabOrigin.value;
        if (Math.abs(moved) >= NUDGE) settleFrom(moved);
        else if (grabPeak.value >= SLOP + NUDGE) settleFrom(0);
        else settleFrom(Math.abs(event.translationY) >= NUDGE ? event.translationY : grabDy.value);
      })
      .onFinalize(() => {
        listPanOn.value = false;
      });

    return {
      titlePan: dragPan(),
      handleGesture: Gesture.Exclusive(dragPan(), handleTap),
      listGesture: Gesture.Exclusive(list, nativeScroll),
      collapseOnUI: () => {
        'worklet';
        goTo(false);
      },
    };
  }, [closedY, dragging, finishChrome, grabDy, grabOrigin, grabPeak, listPanOn, listRef, openY, opened, releaseScroll, scrollY, shift, startX, startY]);

  const closeSheet = useCallback(() => {
    runOnUI(collapseOnUI)();
  }, [collapseOnUI]);
  const closeRef = useRef(closeSheet);
  closeRef.current = closeSheet;

  usePreventRemove(expanded, () => {
    closeRef.current();
  });

  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeRef.current();
      return true;
    });
    return () => sub.remove();
  }, [expanded]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: shift.value }],
  }));

  const shadeStyle = useAnimatedStyle(() => {
    const span = closedY.value - openY.value;
    const progress = span > 1 ? (closedY.value - shift.value) / span : 0;
    return { opacity: Math.min(1, Math.max(0, progress)) };
  });

  if (items.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={styles.clip}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        if (!height || height === screenRef.current) return;
        screenRef.current = height;
        setFrameHeight(height);
      }}
    >
      <Animated.View
        style={[styles.backdrop, shadeStyle]}
        pointerEvents={blockBehind ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          sheetStyle,
          {
            height: frameHeight || '100%',
            opacity: placed ? 1 : 0,
          },
        ]}
      >
        <GestureDetector gesture={handleGesture}>
          <View collapsable={false} style={styles.handleHit} accessibilityRole="button">
            <View style={styles.handle} />
          </View>
        </GestureDetector>
        <View style={[styles.body, expanded ? null : styles.bodyCollapsed]}>
          <GestureDetector gesture={titlePan}>
            <View collapsable={false}>
              <Text style={styles.heading} numberOfLines={1}>
                {t('reminders.recent_list')}
              </Text>
            </View>
          </GestureDetector>
          <View style={styles.listFrame}>
            <GestureDetector gesture={listGesture}>
              <Animated.ScrollView
                ref={listRef}
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  expanded
                    ? { paddingBottom: Math.max(0, expandedTop) + footerInset + insets.bottom }
                    : items.length > 1
                      ? { paddingBottom: LIST_ROW }
                      : null,
                ]}
                scrollEnabled={listScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="always"
                onScroll={onScroll}
                scrollEventThrottle={16}
              >
                {items.map((item) => (
                  <HistoryRow key={item.id} item={item} />
                ))}
              </Animated.ScrollView>
            </GestureDetector>
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
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    clip: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 8,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
      zIndex: 7,
      elevation: 5,
    },
    sheet: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 8,
      elevation: 8,
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
