import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/context/ThemeContext';
import {
  SCROLL_BOTTOM_FADE_GRADIENT,
  SCROLL_TOP_FADE_GRADIENT,
} from '@/constants/layout';

interface ScrollEdgeFadesProps {
  /** Y offset where the scroll area begins (bottom of header chrome). */
  scrollTop: number;
  color?: string;
  showTop?: boolean;
  showBottom?: boolean;
}

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
}: ScrollEdgeFadesProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const fadeColor = color ?? colors.background;

  return (
    <>
      {showTop && scrollTop > 0 ? (
        <View
          style={[styles.edge, styles.top, { top: scrollTop, height: SCROLL_TOP_FADE_GRADIENT }]}
          pointerEvents="none"
        >
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="edgeFadeTop" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={fadeColor} stopOpacity={1} />
                <Stop offset="1" stopColor={fadeColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#edgeFadeTop)" />
          </Svg>
        </View>
      ) : null}

      {showBottom ? (
        <View
          style={[
            styles.edge,
            styles.bottom,
            { height: SCROLL_BOTTOM_FADE_GRADIENT + insets.bottom },
          ]}
          pointerEvents="none"
        >
          <View style={{ height: SCROLL_BOTTOM_FADE_GRADIENT }}>
            <Svg width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="edgeFadeBottom" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={fadeColor} stopOpacity={0} />
                  <Stop offset="1" stopColor={fadeColor} stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#edgeFadeBottom)" />
            </Svg>
          </View>
          {insets.bottom > 0 ? (
            <View style={{ height: insets.bottom, backgroundColor: fadeColor }} />
          ) : null}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
  },
  top: {},
  bottom: {
    bottom: 0,
  },
});
