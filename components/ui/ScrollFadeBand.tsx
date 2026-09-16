import React, { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '@/context/ThemeContext';
import { FOOTER_FADE_BAND, FOOTER_FADE_SOLID_AT } from '@/constants/layout';

interface ScrollFadeBandProps {
  /** Which viewport edge the band is pinned to. */
  edge?: 'top' | 'bottom';
  height?: number;
  /** Fraction of the band where the gradient reaches full opacity. */
  solidAt?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Figma scroll fade: `linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 35.57%)`.
 * Rows dissolve into plain background at the edge of their scroll viewport —
 * on a bottom band the solid tail is what a pinned footer sits on.
 */
export default function ScrollFadeBand({
  edge = 'bottom',
  height = FOOTER_FADE_BAND,
  solidAt = FOOTER_FADE_SOLID_AT,
  color,
  style,
}: ScrollFadeBandProps) {
  const colors = useColors();
  const fadeColor = color ?? colors.background;
  const gradientId = `fade-band-${useId().replace(/:/g, '')}`;
  /** Stops run top → bottom, so the top band is the mirror of the bottom one. */
  const stops =
    edge === 'bottom'
      ? [
          { offset: 0, opacity: 0 },
          { offset: solidAt, opacity: 1 },
          { offset: 1, opacity: 1 },
        ]
      : [
          { offset: 0, opacity: 1 },
          { offset: 1 - solidAt, opacity: 1 },
          { offset: 1, opacity: 0 },
        ];

  return (
    <View
      pointerEvents="none"
      style={[styles.band, edge === 'bottom' ? styles.bottom : styles.top, { height }, style]}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {stops.map((stop) => (
              <Stop
                key={stop.offset}
                offset={String(stop.offset)}
                stopColor={fadeColor}
                stopOpacity={stop.opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
});
