import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/context/ThemeContext';
import {
  SCROLL_FADE_BAND,
  SCROLL_FADE_LINE_OFFSET,
  SCROLL_FADE_SOLID_AT,
} from '@/constants/layout';

interface ScrollBottomFadeProps {
  /** Extra height beyond the safe-area inset (default covers gesture bar zone). */
  bandHeight?: number;
  /** Fade target color — override on screens painted with `surface`. */
  color?: string;
}

/**
 * Bottom screen fade — content can scroll under it; last lines stay readable
 * when scrolled to end thanks to scroll paddingBottom on the parent screen.
 */
export default function ScrollBottomFade({
  bandHeight = SCROLL_FADE_BAND,
  color,
}: ScrollBottomFadeProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const height = bandHeight + SCROLL_FADE_LINE_OFFSET + insets.bottom;
  const fadeColor = color ?? colors.background;

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="scrollBottomFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fadeColor} stopOpacity={0} />
            <Stop offset={String(SCROLL_FADE_SOLID_AT)} stopColor={fadeColor} stopOpacity={1} />
            <Stop offset="1" stopColor={fadeColor} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrollBottomFade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
});
