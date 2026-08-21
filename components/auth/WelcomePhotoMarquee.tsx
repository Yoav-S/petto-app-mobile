import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/context/ThemeContext';
import { DESIGN_HEIGHT, WELCOME_DESIGN_WIDTH, coverScale } from '@/constants/layout';

const TILE_W = 114.68145751953125;
const TILE_H = 203.434814453125;
const TILE_RADIUS = 8.37;
/** Vertical step between tile tops in the Figma file (~tile + gap) */
const TILE_STEP = 211.41;
const COL_LEFTS = [0, 122.66, 245.32] as const;
/** Actual painted width of the 3 columns (not the 375 frame — that left a right gutter). */
const COLLAGE_WIDTH = COL_LEFTS[2] + TILE_W;
/** One full column loop — slower scroll for 8-tile columns. */
const LOOP_MS = 110000;
/** Extra design-space height so the loop never shows empty bands. */
const VERTICAL_BLEED = 200;
const GRID_TOP = -90;
/** Tiny overscan so rounding never leaves a 1px hairline. */
const COVER_OVERSCAN = 1.02;

/** Left column — top → bottom (8 tiles). */
const LEFT_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/welcome/welcome-left-01.png'),
  require('@/assets/images/welcome/welcome-left-02.png'),
  require('@/assets/images/welcome/welcome-left-03.png'),
  require('@/assets/images/welcome/welcome-left-04.png'),
  require('@/assets/images/welcome/welcome-left-05.png'),
  require('@/assets/images/welcome/welcome-left-06.png'),
  require('@/assets/images/welcome/welcome-left-07.png'),
  require('@/assets/images/welcome/welcome-left-08.png'),
];

/** Middle column — top → bottom (8 tiles). */
const MIDDLE_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/welcome/welcome-mid-01.png'),
  require('@/assets/images/welcome/welcome-mid-02.png'),
  require('@/assets/images/welcome/welcome-mid-03.png'),
  require('@/assets/images/welcome/welcome-mid-04.png'),
  require('@/assets/images/welcome/welcome-mid-05.png'),
  require('@/assets/images/welcome/welcome-mid-06.png'),
  require('@/assets/images/welcome/welcome-mid-07.png'),
  require('@/assets/images/welcome/welcome-mid-08.png'),
];

/** Right column — top → bottom (8 tiles). */
const RIGHT_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/welcome/welcome-right-01.png'),
  require('@/assets/images/welcome/welcome-right-02.png'),
  require('@/assets/images/welcome/welcome-right-03.png'),
  require('@/assets/images/welcome/welcome-right-04.png'),
  require('@/assets/images/welcome/welcome-right-05.png'),
  require('@/assets/images/welcome/welcome-right-06.png'),
  require('@/assets/images/welcome/welcome-right-07.png'),
  require('@/assets/images/welcome/welcome-right-08.png'),
];

/** Stagger offsets matching Figma column starts (left / middle / right). */
const COL_TOP_OFFSETS = [29.92, 79.78, 0] as const;

type Direction = 'down' | 'up';

function MarqueeColumn({
  images,
  left,
  topOffset,
  direction,
}: {
  images: ImageSourcePropType[];
  left: number;
  topOffset: number;
  direction: Direction;
}) {
  const progress = useSharedValue(0);
  const cycle = TILE_STEP * images.length;

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: LOOP_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [cycle, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const distance = progress.value * cycle;
    const translateY = direction === 'down' ? -cycle + distance : -distance;
    return { transform: [{ translateY }] };
  });

  const strip = useMemo(() => [...images, ...images], [images]);

  return (
    <Animated.View
      style={[
        styles.column,
        {
          left,
          top: topOffset,
          width: TILE_W,
        },
        animatedStyle,
      ]}
    >
      {strip.map((source, index) => (
        <Image
          key={`${left}-${index}`}
          source={source}
          style={{
            width: TILE_W,
            height: TILE_H,
            borderRadius: TILE_RADIUS,
            marginBottom: TILE_STEP - TILE_H,
          }}
          contentFit="cover"
        />
      ))}
    </Animated.View>
  );
}

/**
 * Three-column pet collage, cover-scaled from the painted collage width (~360)
 * so it fills every phone without the old right-side white gutter.
 */
export function WelcomePhotoMarquee() {
  const { width, height } = useWindowDimensions();
  const colors = useColors();
  // Scale from the real collage bounds, not the 375 frame (that left ~15pt empty).
  const scale =
    coverScale(width, height, COLLAGE_WIDTH || WELCOME_DESIGN_WIDTH, DESIGN_HEIGHT) *
    COVER_OVERSCAN;

  const columns = useMemo(
    () => [
      {
        images: LEFT_IMAGES,
        left: COL_LEFTS[0],
        topOffset: COL_TOP_OFFSETS[0],
        direction: 'down' as const,
      },
      {
        images: MIDDLE_IMAGES,
        left: COL_LEFTS[1],
        topOffset: COL_TOP_OFFSETS[1],
        direction: 'up' as const,
      },
      {
        images: RIGHT_IMAGES,
        left: COL_LEFTS[2],
        topOffset: COL_TOP_OFFSETS[2],
        direction: 'down' as const,
      },
    ],
    [],
  );

  const designW = COLLAGE_WIDTH;
  const designH = DESIGN_HEIGHT + VERTICAL_BLEED;

  return (
    <View
      style={[styles.root, { width, height, backgroundColor: colors.background }]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.grid,
          {
            width: designW,
            height: designH,
            // RN scales from the view center — center the collage, then cover-scale.
            left: (width - designW) / 2,
            top: (height - designH) / 2 + GRID_TOP * scale,
            transform: [{ scale }],
          },
        ]}
      >
        {columns.map((col) => (
          <MarqueeColumn
            key={col.left}
            images={col.images}
            left={col.left}
            topOffset={col.topOffset}
            direction={col.direction}
          />
        ))}
      </View>
      <View style={[styles.veil, { backgroundColor: isSoftVeil(colors.background) }]} />
    </View>
  );
}

function isSoftVeil(background: string): string {
  // Slightly deeper than before so the welcome collage reads softer (~1–2%).
  return background.toLowerCase() === '#f6f7f9'
    ? 'rgba(246,247,249,0.22)'
    : 'rgba(17,19,21,0.38)';
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    overflow: 'hidden',
  },
  column: {
    position: 'absolute',
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
});
