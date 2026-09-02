import React, { useEffect, useId, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/context/ThemeContext';
import {
  SCROLL_BOTTOM_FADE_GRADIENT,
  SCROLL_BOTTOM_FADE_SOLID_AT,
  SCROLL_TOP_FADE_GRADIENT,
  SCROLL_TOP_FADE_SOLID_AT,
} from '@/constants/layout';

interface ScrollEdgeFadesProps {
  /** Y offset where the scroll area begins (bottom of header chrome). */
  scrollTop: number;
  color?: string;
  showTop?: boolean;
  showBottom?: boolean;
  topHeight?: number;
  bottomHeight?: number;
  /**
   * Solid strip below the bottom gradient — defaults to the home-indicator inset.
   * Pass 0 when the scroll ends above a footer instead of the screen edge.
   */
  bottomInset?: number;
  /** Animate opacity when scroll overflow toggles. */
  visible?: boolean;
}

const FADE_MS = 120;

/**
 * The solid tail overlaps the gradient's last row. The gradient only reaches full
 * opacity at its very end, so without this overlap layout rounding leaves a hairline
 * of uncovered content where the fade should already be solid.
 */
const FADE_SEAM_OVERLAP = 1;

/**
 * Visual fades pinned to the scroll viewport edges.
 * Top: sits on the scroll top edge (below header) — content dissolves under the title.
 * Bottom: sits on the scroll bottom edge — solid strip over the home indicator.
 * Does NOT change scroll padding; scroll runs full height.
 */
export default function ScrollEdgeFades({
  scrollTop,
  color,
  showTop = true,
  showBottom = true,
  topHeight = SCROLL_TOP_FADE_GRADIENT,
  bottomHeight = SCROLL_BOTTOM_FADE_GRADIENT,
  bottomInset,
  visible = true,
}: ScrollEdgeFadesProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomStrip = bottomInset ?? insets.bottom;
  const fadeColor = color ?? colors.background;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const gradientId = useId().replace(/:/g, '');

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [opacity, visible]);

  return (
    <Animated.View
      style={[styles.wrap, { opacity }]}
      pointerEvents="none"
    >
      {showTop ? (
        <View
          style={[styles.edge, styles.top, { top: scrollTop, height: topHeight }]}
        >
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id={`${gradientId}-top`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={fadeColor} stopOpacity={1} />
                <Stop offset={String(SCROLL_TOP_FADE_SOLID_AT)} stopColor={fadeColor} stopOpacity={1} />
                <Stop offset="1" stopColor={fadeColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId}-top)`} />
          </Svg>
        </View>
      ) : null}

      {showBottom ? (
        <View
          style={[
            styles.edge,
            styles.bottom,
            { height: bottomHeight + bottomStrip },
          ]}
        >
          <View style={{ height: bottomHeight }}>
            <Svg width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id={`${gradientId}-bottom`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={fadeColor} stopOpacity={0} />
                  <Stop
                    offset={String(1 - SCROLL_BOTTOM_FADE_SOLID_AT)}
                    stopColor={fadeColor}
                    stopOpacity={0}
                  />
                  <Stop offset="1" stopColor={fadeColor} stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId}-bottom)`} />
            </Svg>
          </View>
          <View
            style={[
              styles.bottomSolid,
              {
                height: bottomStrip + FADE_SEAM_OVERLAP,
                backgroundColor: fadeColor,
              },
            ]}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  top: {},
  bottom: {
    bottom: 0,
  },
  bottomSolid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
