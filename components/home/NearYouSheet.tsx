import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type FlatList } from 'react-native';
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
import { X } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import PlaceCard from '@/components/business/PlaceCard';
import { PlaceCardSkeletons } from '@/components/business/PlaceCardSkeleton';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import type { BusinessPlace } from '@/services/places';

/** Figma list column is 335 on a 375 frame, so 20px stays free on each side. */
const CARD_SIDE = 20;
const CARD_GAP = 16;
/** Greeting row that holds the 42px profile photo: 10px under the status bar, 46px tall. */
const GREETING_PAD_TOP = 10;
const GREETING_ROW = 46;
const LOAD_MORE_PX = 480;
const SLOP = 8;
/** Any slide past this commits. The sheet no longer waits for the halfway point. */
const NUDGE = 4;
const SNAP_MS = 280;

interface NearYouSheetProps {
  /** Distance from the top of the screen to where the sheet rests, including the 4px gap. */
  anchorTop: number;
  /** Safe-area top. The open sheet stops at the middle of the profile photo. */
  topInset: number;
  /** Measured width of the home screen. Cards stay hidden until this is known. */
  frameWidth: number;
  frameHeight: number;
  places: BusinessPlace[];
  loading: boolean;
  loadingMore: boolean;
  bottomInset: number;
  onLoadMore: () => void;
  onPressPlace: (place: BusinessPlace) => void;
  /** True while the sheet is pulled up off its resting peek. */
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * The sheet rests under the categories, or opens until its top edge crosses
 * the middle of the profile photo, so the top half of that photo stays visible.
 * It only rests closed or open. A short upward slide opens it, and a short
 * downward slide closes it. Tapping the handle toggles. The shade matches
 * the other modals. A tap outside closes it.
 */
export default function NearYouSheet({
  anchorTop,
  topInset,
  frameWidth,
  frameHeight,
  places,
  loading,
  loadingMore,
  bottomInset,
  onLoadMore,
  onPressPlace,
  onExpandedChange,
}: NearYouSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const onExpandedChangeRef = useRef(onExpandedChange);
  onExpandedChangeRef.current = onExpandedChange;
  const listRef = useAnimatedRef<FlatList<BusinessPlace>>();
  const height = useSharedValue(0);
  const restingHeight = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const listViewport = useSharedValue(0);
  const maxHeight = useSharedValue(0);
  const loadArmed = useSharedValue(true);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const listPanOn = useSharedValue(false);
  const opened = useSharedValue(false);
  const grabOrigin = useSharedValue(0);
  const grabDy = useSharedValue(0);
  const grabPeak = useSharedValue(0);
  /** Blocks the card under the finger while the curtain moves. iOS treats that slide as a tap. */
  const pressLocked = useSharedValue(false);
  const [showClose, setShowClose] = useState(false);
  const [listScroll, setListScroll] = useState(false);
  const [blockBehind, setBlockBehind] = useState(false);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const frameWidthSV = useSharedValue(frameWidth);
  const cardWidth = frameWidth > CARD_SIDE * 2 ? frameWidth - CARD_SIDE * 2 : 0;
  const cardFrame = { width: cardWidth, alignSelf: 'center' as const };
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;
  const onPressPlaceRef = useRef(onPressPlace);
  onPressPlaceRef.current = onPressPlace;

  const finishChrome = useCallback((open: boolean) => {
    setShowClose(open);
    setBlockBehind(open);
    if (!open) setListScroll(false);
    onExpandedChangeRef.current?.(open);
  }, []);

  const releasePresses = useCallback((open: boolean) => {
    setListScroll(open);
    // iOS can deliver the card tap when scrollEnabled flips. Stay locked past that.
    setTimeout(() => {
      pressLocked.value = false;
    }, 320);
  }, [pressLocked]);

  useEffect(() => {
    frameWidthSV.value = frameWidth;
  }, [frameWidth, frameWidthSV]);

  useEffect(() => {
    if (frameHeight <= 0 || anchorTop <= 0) return;
    const nextRest = Math.round(Math.max(0, frameHeight - anchorTop));
    const avatarMid = topInset + GREETING_PAD_TOP + GREETING_ROW / 2;
    const nextMax = Math.round(Math.max(nextRest, frameHeight - avatarMid));
    const atRest = height.value === 0 || Math.abs(height.value - restingHeight.value) < 2;
    restingHeight.value = nextRest;
    maxHeight.value = nextMax;
    setLayoutHeight((current) => (current === nextMax ? current : nextMax));
    if (atRest) {
      height.value = nextRest;
      opened.value = false;
    }
  }, [anchorTop, frameHeight, height, maxHeight, opened, restingHeight, topInset]);

  useEffect(() => {
    if (!loadingMore) loadArmed.value = true;
  }, [loadingMore, loadArmed]);

  const loadMorePlaces = useCallback(() => {
    onLoadMoreRef.current();
  }, []);

  const { titlePan, handleGesture, listGesture, collapseOnUI } = useMemo(() => {
    const moveSheet = (dy: number) => {
      'worklet';
      if (dy === 0) return;
      const minH = Math.max(0, restingHeight.value);
      const maxH = Math.max(minH, maxHeight.value);
      if (dy < 0) height.value = Math.min(maxH, height.value - dy);
      else height.value = Math.max(minH, height.value - dy);
    };

    const goTo = (open: boolean) => {
      'worklet';
      const minH = Math.max(0, restingHeight.value);
      const maxH = Math.max(minH, maxHeight.value);
      cancelAnimation(height);
      opened.value = open;
      pressLocked.value = true;
      if (!open) {
        scrollY.value = 0;
        scrollTo(listRef, 0, 0, false);
      }
      // Shade and the buttons behind update when the sheet commits.
      // The list stays locked until the open animation finishes, so iOS
      // does not scroll it while the curtain is still moving.
      runOnJS(finishChrome)(open);
      height.value = withTiming(open ? maxH : minH, { duration: SNAP_MS }, (finished) => {
        'worklet';
        if (finished) runOnJS(releasePresses)(open);
      });
    };

    // Net movement decides. A short slide up opens; a short slide down closes.
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
          cancelAnimation(height);
        })
        .onChange((event) => {
          moveSheet(event.changeY);
        })
        .onEnd((event) => {
          settleFrom(event.translationY);
        });

    const handleTap = Gesture.Tap()
      .maxDistance(SLOP)
      .onEnd(() => {
        goTo(!opened.value);
      });

    const title = dragPan();
    const handle = Gesture.Exclusive(dragPan(), handleTap);

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
        const minH = Math.max(0, restingHeight.value);
        const maxH = Math.max(minH, maxHeight.value);
        const atMax = height.value >= maxH - 1;
        const opening = dy < 0 && !atMax;
        const closing = dy > 0 && height.value > minH + 1 && (!atMax || scrollY.value <= 0);
        if (opening || closing) {
          if (!listPanOn.value) {
            cancelAnimation(height);
            grabOrigin.value = height.value;
            grabDy.value = dy;
            grabPeak.value = 0;
            pressLocked.value = true;
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
        grabPeak.value = Math.max(grabPeak.value, Math.abs(height.value - grabOrigin.value));
      })
      .onEnd((event) => {
        if (!listPanOn.value) return;
        const moved = height.value - grabOrigin.value;
        if (Math.abs(moved) >= NUDGE) settleFrom(-moved);
        else if (grabPeak.value >= SLOP + NUDGE) settleFrom(0);
        else settleFrom(Math.abs(event.translationY) >= NUDGE ? event.translationY : grabDy.value);
      })
      .onFinalize(() => {
        listPanOn.value = false;
      });

    return {
      titlePan: title,
      handleGesture: handle,
      listGesture: Gesture.Exclusive(list, nativeScroll),
      collapseOnUI: () => {
        'worklet';
        goTo(false);
      },
    };
  }, [finishChrome, grabDy, grabOrigin, grabPeak, height, listPanOn, listRef, maxHeight, opened, pressLocked, releasePresses, restingHeight, scrollY, startX, startY]);

  const closeSheet = () => {
    runOnUI(collapseOnUI)();
  };

  const tryLoad = (content: number, viewport: number, offset: number) => {
    'worklet';
    const remain = content - (offset + viewport);
    if (loadArmed.value && content > 0 && viewport > 0 && remain < LOAD_MORE_PX) {
      loadArmed.value = false;
      runOnJS(loadMorePlaces)();
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      tryLoad(
        event.contentSize.height,
        event.layoutMeasurement.height,
        event.contentOffset.y,
      );
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(0, maxHeight.value - height.value) }],
    opacity: height.value < 1 || frameWidthSV.value < 1 ? 0 : 1,
  }));

  const closeStyle = useAnimatedStyle(() => ({
    opacity: restingHeight.value > 0 && height.value > restingHeight.value + 16 ? 1 : 0,
  }));

  const shadeStyle = useAnimatedStyle(() => {
    const span = maxHeight.value - restingHeight.value;
    const progress = span > 1 ? (height.value - restingHeight.value) / span : 0;
    return { opacity: Math.min(1, Math.max(0, progress)) };
  });

  const data = loading ? [] : places;
  const pressPlace = useCallback((place: BusinessPlace) => {
    if (pressLocked.value) return;
    const minH = restingHeight.value;
    const maxH = Math.max(minH, maxHeight.value);
    const atRest = Math.abs(height.value - minH) < 2;
    const atOpen = maxH > minH && Math.abs(height.value - maxH) < 2;
    if (!atRest && !atOpen) return;
    onPressPlaceRef.current(place);
  }, [height, maxHeight, pressLocked, restingHeight]);
  const renderPlace = useCallback(
    ({ item }: { item: BusinessPlace }) => (
      <View style={[styles.card, { width: cardWidth, alignSelf: 'center' }]}>
        <PlaceCard place={item} onPress={() => pressPlace(item)} />
      </View>
    ),
    [cardWidth, pressPlace, styles.card],
  );

  return (
    <View style={styles.clip} pointerEvents="box-none">
      <Animated.View style={[styles.shade, shadeStyle]} pointerEvents={blockBehind ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { height: layoutHeight }, sheetStyle]}>
        <View style={styles.sheetClip}>
          <View collapsable={false}>
            <GestureDetector gesture={handleGesture}>
              <View
                collapsable={false}
                style={styles.handleRow}
                accessibilityRole="button"
                accessibilityLabel={showClose ? t('home.close_list') : t('home.near_you')}
              >
                <View style={styles.handle} />
              </View>
            </GestureDetector>
            <GestureDetector gesture={titlePan}>
              <View collapsable={false}>
                <Text style={[styles.title, showClose && styles.titleWithClose]} numberOfLines={1}>
                  {t('home.near_you')}
                </Text>
              </View>
            </GestureDetector>
          </View>
          <GestureDetector gesture={listGesture}>
            <Animated.FlatList
              ref={listRef}
              style={styles.list}
              data={data}
              keyExtractor={(place) => place.id}
              scrollEnabled={listScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
              alwaysBounceVertical={false}
              contentInsetAdjustmentBehavior="never"
              overScrollMode="never"
              onScroll={onScroll}
              scrollEventThrottle={16}
              onLayout={(event) => {
                const viewport = event.nativeEvent.layout.height;
                listViewport.value = viewport;
                const remain = contentHeight.value - (scrollY.value + viewport);
                if (loadArmed.value && contentHeight.value > 0 && viewport > 0 && remain < LOAD_MORE_PX) {
                  loadArmed.value = false;
                  loadMorePlaces();
                }
              }}
              onContentSizeChange={(_width, nextHeight) => {
                contentHeight.value = nextHeight;
                const remain = nextHeight - (scrollY.value + listViewport.value);
                if (loadArmed.value && nextHeight > 0 && listViewport.value > 0 && remain < LOAD_MORE_PX) {
                  loadArmed.value = false;
                  loadMorePlaces();
                }
              }}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                loading ? (
                  <View style={[styles.skeletons, cardFrame]}>
                    <PlaceCardSkeletons />
                  </View>
                ) : (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.empty}>{t('home.near_empty')}</Text>
                  </View>
                )
              }
              ListFooterComponent={
                loadingMore ? (
                <View
                  style={[styles.card, cardFrame, { paddingBottom: bottomInset + 22 }]}
                >
                  <PlaceCardSkeletons count={1} />
                </View>
                ) : (
                  <View style={{ height: bottomInset + 22 }} />
                )
              }
              renderItem={renderPlace}
            />
          </GestureDetector>
        </View>
        <Animated.View style={[styles.closeHit, closeStyle]} pointerEvents={showClose ? 'auto' : 'none'}>
          <HeaderIconButton
            onPress={closeSheet}
            accessibilityLabel={t('home.close_list')}
          >
            <X size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} strokeWidth={2} />
          </HeaderIconButton>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    clip: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
      zIndex: 8,
    },
    shade: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 7,
      backgroundColor: colors.overlay,
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      width: '100%',
      bottom: 0,
      zIndex: 8,
      overflow: 'visible',
    },
    sheetClip: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
    },
    handleRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
      minHeight: 28,
    },
    handle: {
      width: 36,
      height: 5,
      borderRadius: 100,
      backgroundColor: colors.border,
    },
    closeHit: {
      position: 'absolute',
      right: 20,
      top: 26,
    },
    title: {
      paddingHorizontal: 20,
      marginBottom: 10,
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      color: colors.primaryText,
    },
    titleWithClose: {
      paddingRight: 62,
    },
    list: {
      flex: 1,
      width: '100%',
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
    },
    listContent: {
      flexGrow: 1,
      width: '100%',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    card: {
      alignSelf: 'center',
      marginBottom: CARD_GAP,
      backgroundColor: colors.surface,
    },
    skeletons: {
      alignSelf: 'center',
      backgroundColor: colors.surface,
      gap: CARD_GAP,
      marginBottom: CARD_GAP,
    },
    emptyWrap: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 28,
      backgroundColor: colors.surface,
    },
    empty: {
      textAlign: 'center',
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: colors.secondaryText,
    },
  });
