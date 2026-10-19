import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type FlatList } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useTheme, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import PlaceCard from '@/components/business/PlaceCard';
import { PlaceCardSkeletons } from '@/components/business/PlaceCardSkeleton';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import type { BlurViewProps } from 'expo-blur';
import type { BusinessPlace } from '@/services/places';

/** Figma list column is 335 on a 375 frame, so 20px stays free on each side. */
const CARD_SIDE = 20;
const CARD_GAP = 16;
const FULL_SCREEN = 0.9;
/** Full-open frost. Halfway open is half of this. 100 is the strongest blur. */
const GLASS_INTENSITY = 48;
const LOAD_MORE_PX = 480;
const SLOP = 8;

const blurModule = requireOptionalNativeModule('ExpoBlurView')
  ? (require('expo-blur') as { BlurView?: React.ComponentType<BlurViewProps>; default?: React.ComponentType<BlurViewProps> })
  : null;
const BlurView = blurModule?.BlurView ?? blurModule?.default ?? null;

const AnimatedBlur = BlurView ? Animated.createAnimatedComponent(BlurView) : null;

interface NearYouSheetProps {
  /** Distance from the top of the screen to where the sheet rests, including the 4px gap. */
  anchorTop: number;
  /** Height of the greeting. The open sheet stops here so the profile photo stays clear. */
  topClearance: number;
  /** Measured width of the home screen. Cards stay hidden until this is known. */
  frameWidth: number;
  frameHeight: number;
  places: BusinessPlace[];
  loading: boolean;
  loadingMore: boolean;
  bottomInset: number;
  onLoadMore: () => void;
  onPressPlace: (place: BusinessPlace) => void;
}

/**
 * The handle and the list open and close the sheet. A drag follows the
 * finger, then coasts like a scroll and can rest anywhere between the
 * peek and the full open height. Once the sheet is fully open the list
 * scrolls on its own. Pulling down at the top of that list lowers the sheet.
 */
export default function NearYouSheet({
  anchorTop,
  topClearance,
  frameWidth,
  frameHeight,
  places,
  loading,
  loadingMore,
  bottomInset,
  onLoadMore,
  onPressPlace,
}: NearYouSheetProps) {
  const colors = useColors();
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
  const [showClose, setShowClose] = useState(false);
  const [listScroll, setListScroll] = useState(false);
  const frameWidthSV = useSharedValue(frameWidth);
  const cardWidth = frameWidth > CARD_SIDE * 2 ? frameWidth - CARD_SIDE * 2 : 0;
  const cardFrame = { width: cardWidth, alignSelf: 'center' as const };

  useEffect(() => {
    frameWidthSV.value = frameWidth;
  }, [frameWidth, frameWidthSV]);

  useEffect(() => {
    if (frameHeight <= 0 || anchorTop <= 0) return;
    const nextRest = Math.max(0, frameHeight - anchorTop);
    const underGreeting = topClearance > 0 ? frameHeight - topClearance : frameHeight * FULL_SCREEN;
    const nextMax = Math.max(nextRest, Math.min(frameHeight * FULL_SCREEN, underGreeting));
    const atRest = height.value === 0 || Math.abs(height.value - restingHeight.value) < 2;
    restingHeight.value = nextRest;
    maxHeight.value = nextMax;
    if (atRest) height.value = nextRest;
  }, [anchorTop, frameHeight, height, maxHeight, restingHeight, topClearance]);

  useEffect(() => {
    if (!loadingMore) loadArmed.value = true;
  }, [loadingMore, loadArmed]);

  useAnimatedReaction(
    () => restingHeight.value > 0 && height.value > restingHeight.value + 16,
    (open, previous) => {
      if (open !== previous) runOnJS(setShowClose)(open);
    },
  );

  useAnimatedReaction(
    () => maxHeight.value > 0 && height.value >= maxHeight.value - 1,
    (open, previous) => {
      if (open !== previous) runOnJS(setListScroll)(open);
    },
  );

  const collapseOnUI = () => {
    'worklet';
    scrollY.value = 0;
    scrollTo(listRef, 0, 0, false);
    height.value = withTiming(restingHeight.value, { duration: 280 });
  };

  const closeSheet = () => {
    runOnUI(collapseOnUI)();
  };

  const moveSheet = (dy: number) => {
    'worklet';
    if (dy === 0) return;
    const minH = Math.max(0, restingHeight.value);
    const maxH = Math.max(minH, maxHeight.value);
    if (dy < 0) height.value = Math.min(maxH, height.value - dy);
    else height.value = Math.max(minH, height.value - dy);
  };

  /** Same deceleration as a normal scroll. Stops inside the peek and full-open limits. */
  const coastSheet = (velocityY: number) => {
    'worklet';
    const minH = Math.max(0, restingHeight.value);
    const maxH = Math.max(minH, maxHeight.value);
    height.value = withDecay({
      velocity: -velocityY,
      deceleration: 0.998,
      clamp: [minH, maxH],
    });
  };

  const tryLoad = (content: number, viewport: number, offset: number) => {
    'worklet';
    const remain = content - (offset + viewport);
    if (loadArmed.value && content > 0 && viewport > 0 && remain < LOAD_MORE_PX) {
      loadArmed.value = false;
      runOnJS(onLoadMore)();
    }
  };

  const headerPan = Gesture.Pan()
    .activeOffsetY([-SLOP, SLOP])
    .failOffsetX([-28, 28])
    .onBegin(() => {
      cancelAnimation(height);
    })
    .onChange((event) => {
      moveSheet(event.changeY);
    })
    .onEnd((event) => {
      coastSheet(event.velocityY);
    });

  const nativeScroll = Gesture.Native();
  const listPan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((event) => {
      cancelAnimation(height);
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
    })
    .onEnd((event) => {
      coastSheet(event.velocityY);
    })
    .onFinalize(() => {
      listPanOn.value = false;
    });

  const listGesture = Gesture.Exclusive(listPan, nativeScroll);

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
    height: height.value,
    opacity: height.value < 1 || frameWidthSV.value < 1 ? 0 : 1,
  }));

  const blurProps = useAnimatedProps(() => {
    const span = maxHeight.value - restingHeight.value;
    const progress = span > 1 ? (height.value - restingHeight.value) / span : 0;
    const clamped = Math.min(1, Math.max(0, progress));
    return { intensity: clamped * GLASS_INTENSITY };
  });

  const veilStyle = useAnimatedStyle(() => {
    const span = maxHeight.value - restingHeight.value;
    const progress = span > 1 ? (height.value - restingHeight.value) / span : 0;
    const clamped = Math.min(1, Math.max(0, progress));
    return { opacity: clamped * 0.2 };
  });

  const data = loading ? [] : places;

  return (
    <>
      {AnimatedBlur ? (
        <AnimatedBlur
          pointerEvents="none"
          animatedProps={blurProps}
          tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
          experimentalBlurMethod="dimezisBlurView"
          blurReductionFactor={2}
          style={styles.glass}
        />
      ) : (
        <Animated.View pointerEvents="none" style={[styles.veil, veilStyle]} />
      )}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.sheetClip}>
          <GestureDetector gesture={headerPan}>
            <View>
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>
              <Text style={[styles.title, showClose && styles.titleWithClose]} numberOfLines={1}>
                {t('home.near_you')}
              </Text>
            </View>
          </GestureDetector>
          <GestureDetector gesture={listGesture}>
            <Animated.FlatList
              ref={listRef}
              style={styles.list}
              data={data}
              keyExtractor={(place) => place.id}
              scrollEnabled={listScroll}
              showsVerticalScrollIndicator={false}
              bounces={listScroll}
              overScrollMode="never"
              onScroll={onScroll}
              scrollEventThrottle={16}
              onLayout={(event) => {
                const viewport = event.nativeEvent.layout.height;
                listViewport.value = viewport;
                const remain = contentHeight.value - (scrollY.value + viewport);
                if (loadArmed.value && contentHeight.value > 0 && viewport > 0 && remain < LOAD_MORE_PX) {
                  loadArmed.value = false;
                  onLoadMore();
                }
              }}
              onContentSizeChange={(_width, nextHeight) => {
                contentHeight.value = nextHeight;
                const remain = nextHeight - (scrollY.value + listViewport.value);
                if (loadArmed.value && nextHeight > 0 && listViewport.value > 0 && remain < LOAD_MORE_PX) {
                  loadArmed.value = false;
                  onLoadMore();
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
              renderItem={({ item }) => (
                <View style={[styles.card, cardFrame]}>
                  <PlaceCard place={item} onPress={() => onPressPlace(item)} />
                </View>
              )}
            />
          </GestureDetector>
        </View>
        {showClose ? (
          <HeaderIconButton
            style={styles.closeHit}
            onPress={closeSheet}
            accessibilityLabel={t('home.close_list')}
          >
            <X size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} strokeWidth={2} />
          </HeaderIconButton>
        ) : null}
      </Animated.View>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    glass: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 7,
    },
    veil: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 7,
      backgroundColor: '#FFFFFF',
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
