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

/** Figma frame base width for the collage */
const DESIGN_WIDTH = 360;
const TILE_W = 114.68145751953125;
const TILE_H = 203.434814453125;
const TILE_RADIUS = 8.37;
/** Vertical step between tile tops in the Figma file (~tile + gap) */
const TILE_STEP = 211.41;
const COL_LEFTS = [0, 122.66, 245.32] as const;
const LOOP_MS = 42000;

const WELCOME_IMAGES: ImageSourcePropType[] = [
  require('@/assets/images/welcome/welcome-01.png'),
  require('@/assets/images/welcome/welcome-02.png'),
  require('@/assets/images/welcome/welcome-03.png'),
  require('@/assets/images/welcome/welcome-04.png'),
  require('@/assets/images/welcome/welcome-05.png'),
  require('@/assets/images/welcome/welcome-06.png'),
  require('@/assets/images/welcome/welcome-07.png'),
  require('@/assets/images/welcome/welcome-08.png'),
  require('@/assets/images/welcome/welcome-09.png'),
  require('@/assets/images/welcome/welcome-10.png'),
  require('@/assets/images/welcome/welcome-11.png'),
  require('@/assets/images/welcome/welcome-12.png'),
  require('@/assets/images/welcome/welcome-13.png'),
  require('@/assets/images/welcome/welcome-14.png'),
  require('@/assets/images/welcome/welcome-15.png'),
  require('@/assets/images/welcome/welcome-16.png'),
  require('@/assets/images/welcome/welcome-17.png'),
  require('@/assets/images/welcome/welcome-18.png'),
];

/** Stagger offsets matching Figma column starts (left / middle / right). */
const COL_TOP_OFFSETS = [29.92, 79.78, 0] as const;

type Direction = 'down' | 'up';

function MarqueeColumn({
  images,
  left,
  topOffset,
  direction,
  scale,
}: {
  images: ImageSourcePropType[];
  left: number;
  topOffset: number;
  direction: Direction;
  scale: number;
}) {
  const progress = useSharedValue(0);
  const cycle = TILE_STEP * images.length * scale;

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
          left: left * scale,
          top: topOffset * scale,
          width: TILE_W * scale,
        },
        animatedStyle,
      ]}
    >
      {strip.map((source, index) => (
        <Image
          key={`${left}-${index}`}
          source={source}
          style={{
            width: TILE_W * scale,
            height: TILE_H * scale,
            borderRadius: TILE_RADIUS * scale,
            marginBottom: (TILE_STEP - TILE_H) * scale,
          }}
          contentFit="cover"
        />
      ))}
    </Animated.View>
  );
}

/**
 * Three-column pet collage. Left & right scroll top→bottom; middle scrolls bottom→top.
 */
export function WelcomePhotoMarquee() {
  const { width, height } = useWindowDimensions();
  const colors = useColors();
  const scale = width / DESIGN_WIDTH;

  const columns = useMemo(
    () => [
      {
        images: WELCOME_IMAGES.slice(0, 6),
        left: COL_LEFTS[0],
        topOffset: COL_TOP_OFFSETS[0],
        direction: 'down' as const,
      },
      {
        images: WELCOME_IMAGES.slice(6, 12),
        left: COL_LEFTS[1],
        topOffset: COL_TOP_OFFSETS[1],
        direction: 'up' as const,
      },
      {
        images: WELCOME_IMAGES.slice(12, 18),
        left: COL_LEFTS[2],
        topOffset: COL_TOP_OFFSETS[2],
        direction: 'down' as const,
      },
    ],
    [],
  );

  return (
    <View style={[styles.root, { width, height, backgroundColor: colors.background }]} pointerEvents="none">
      <View style={[styles.grid, { width: DESIGN_WIDTH * scale, height: height + 200 * scale }]}>
        {columns.map((col) => (
          <MarqueeColumn
            key={col.left}
            images={col.images}
            left={col.left}
            topOffset={col.topOffset}
            direction={col.direction}
            scale={scale}
          />
        ))}
      </View>
      {/* Soft veil so the white card stays readable */}
      <View style={[styles.veil, { backgroundColor: isSoftVeil(colors.background) }]} />
    </View>
  );
}

function isSoftVeil(background: string): string {
  // Light canvas gets a soft white veil; dark canvas gets a soft dark veil.
  return background.toLowerCase() === '#f6f7f9' ? 'rgba(255,255,255,0.18)' : 'rgba(17,19,21,0.35)';
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    top: -90,
    left: 0,
    overflow: 'hidden',
  },
  column: {
    position: 'absolute',
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
});
