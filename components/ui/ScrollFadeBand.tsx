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
  /**
   * 'linear' is the Figma ramp. 'soft' ramps late (bottom of long lists).
   * 'listTop' is opaque at the tabs and already visible on the first row.
   * 'documentTop' is 122pt tall but clear over the first lines.
   */
  ramp?: 'linear' | 'soft' | 'listTop' | 'documentTop';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

interface GradientStop {
  offset: number;
  opacity: number;
}

/** Stops from the band's open edge (transparent) to its solid edge. */
function rampStops(
  solidAt: number,
  ramp: 'linear' | 'soft' | 'listTop' | 'documentTop',
): GradientStop[] {
  const stops =
    ramp === 'documentTop'
      ? [
          { offset: 0, opacity: 0 },
          { offset: 0.55, opacity: 0 },
          { offset: 0.72, opacity: 0.08 },
          { offset: 0.88, opacity: 0.35 },
          { offset: 1, opacity: 1 },
        ]
      : ramp === 'listTop'
        ? [
            { offset: 0, opacity: 0 },
            { offset: 0.55, opacity: 0.12 },
            { offset: 0.82, opacity: 0.65 },
            { offset: 1, opacity: 1 },
          ]
        : ramp === 'soft'
          ? [
              { offset: 0, opacity: 0 },
              { offset: solidAt * 0.5, opacity: 0.08 },
              { offset: solidAt * 0.8, opacity: 0.4 },
              { offset: solidAt, opacity: 1 },
              { offset: 1, opacity: 1 },
            ]
          : [
              { offset: 0, opacity: 0 },
              { offset: solidAt, opacity: 1 },
              { offset: 1, opacity: 1 },
            ];
  /** A band with no solid tail ends exactly at 1 — drop the duplicate stop. */
  return stops.filter((stop, i) => i === 0 || stop.offset > stops[i - 1].offset);
}

/**
 * Figma scroll fade: `linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 35.57%)`.
 * Rows dissolve into plain background at the edge of their scroll viewport —
 * on a bottom band the solid tail is what a pinned footer sits on.
 */
export default function ScrollFadeBand({
  edge = 'bottom',
  height = FOOTER_FADE_BAND,
  solidAt: solidAtProp,
  ramp = 'linear',
  color,
  style,
}: ScrollFadeBandProps) {
  const solidAt = solidAtProp ?? FOOTER_FADE_SOLID_AT;
  const colors = useColors();
  const fadeColor = color ?? colors.background;
  const gradientId = `fade-band-${useId().replace(/:/g, '')}`;
  const ramped = rampStops(solidAt, ramp);
  /** Stops run top → bottom, so the top band is the mirror of the bottom one. */
  const stops =
    edge === 'bottom'
      ? ramped
      : ramped
          .map((stop) => ({ offset: 1 - stop.offset, opacity: stop.opacity }))
          .reverse();

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
