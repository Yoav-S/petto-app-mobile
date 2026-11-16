import React, { useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SPLASH_DARK, SPLASH_LIGHT, SPLASH_LOGO } from '@/constants/splash';

type SplashPalette = typeof SPLASH_LIGHT | typeof SPLASH_DARK;

interface AppSplashProps {
  palette: SplashPalette;
  /**
   * Called from onLayout after the first JS splash frame is painted.
   * Hide the native splash here — never from a useEffect.
   */
  onReady?: () => void;
}

/**
 * Brand splash: Ragly wordmark at full opacity (no fade-in).
 * Mounted as a stable sibling of the auth tree so it is not remounted
 * when auth/sync state updates.
 */
export default function AppSplash({ palette, onReady }: AppSplashProps) {
  const { width, height } = useWindowDimensions();
  const left = (width - SPLASH_LOGO.width) / 2;
  const top = height * (SPLASH_LOGO.top / 812);
  const signaledRef = useRef(false);

  const signalReady = () => {
    if (signaledRef.current) return;
    signaledRef.current = true;
    onReady?.();
  };

  return (
    <View
      style={[styles.root, { backgroundColor: palette.background }]}
      pointerEvents="auto"
      accessibilityRole="progressbar"
      collapsable={false}
      onLayout={signalReady}
    >
      <Text
        style={[
          styles.logo,
          {
            top,
            left,
            width: SPLASH_LOGO.width,
            height: SPLASH_LOGO.height,
            fontSize: SPLASH_LOGO.fontSize,
            lineHeight: SPLASH_LOGO.lineHeight,
            color: palette.logo,
          },
        ]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        Ragly
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
  },
  logo: {
    position: 'absolute',
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
