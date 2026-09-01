import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '@/context/ThemeContext';
import {
  SCROLL_FADE_LINE_OFFSET,
  SCROLL_FADE_SOLID_AT,
} from '@/constants/layout';

interface ScrollTopFadeProps {
  /** Total height from screen top through the header chrome. */
  height: number;
  /** Fade target color — override on screens painted with `surface`. */
  color?: string;
}

/**
 * Top screen fade — content scrolls under the title row; solid background at
 * the top eases into transparent over the first content lines.
 */
export default function ScrollTopFade({ height, color }: ScrollTopFadeProps) {
  const colors = useColors();
  const fadeColor = color ?? colors.background;
  const totalHeight = height + SCROLL_FADE_LINE_OFFSET;

  return (
    <View style={[styles.wrap, { height: totalHeight }]} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="scrollTopFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fadeColor} stopOpacity={1} />
            <Stop offset={String(1 - SCROLL_FADE_SOLID_AT)} stopColor={fadeColor} stopOpacity={1} />
            <Stop offset="1" stopColor={fadeColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrollTopFade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
});
