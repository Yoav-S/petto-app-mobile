import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '@/context/ThemeContext';

/** Mirror of ScrollBottomFade — solid top → transparent bottom. */
const FADE_SOLID_AT = 0.8913;

/** Opaque band below tabs before the soft fade (keeps ~12px clear of tab chrome). */
const FADE_MARGIN = 12;

/** Visible fade band where list rows dissolve while scrolling up. */
const FADE_BAND = 44;

interface ScrollTopFadeProps {
  marginHeight?: number;
  bandHeight?: number;
}

/**
 * Top list fade — rows scroll underneath; content fades before reaching tabs.
 */
export default function ScrollTopFade({
  marginHeight = FADE_MARGIN,
  bandHeight = FADE_BAND,
}: ScrollTopFadeProps) {
  const colors = useColors();
  const height = marginHeight + bandHeight;
  const solidStop = marginHeight / height;

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="scrollTopFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.background} stopOpacity={1} />
            <Stop offset={String(solidStop)} stopColor={colors.background} stopOpacity={1} />
            <Stop
              offset={String(solidStop + (1 - solidStop) * FADE_SOLID_AT)}
              stopColor={colors.background}
              stopOpacity={0}
            />
            <Stop offset="1" stopColor={colors.background} stopOpacity={0} />
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
