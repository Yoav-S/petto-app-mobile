import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  SPLASH_BACKGROUND,
  SPLASH_DESIGN_HEIGHT,
  SPLASH_DESIGN_WIDTH,
  SPLASH_LOGO,
} from '@/constants/splash';

/**
 * Brand splash: white canvas + Ragly wordmark at the Figma position.
 * Shown over the root stack while auth / first route settle.
 */
export default function AppSplash() {
  const { width, height } = useWindowDimensions();
  const sx = width / SPLASH_DESIGN_WIDTH;
  const sy = height / SPLASH_DESIGN_HEIGHT;

  return (
    <View style={styles.root} pointerEvents="auto" accessibilityRole="progressbar">
      <Text
        style={[
          styles.logo,
          {
            top: SPLASH_LOGO.top * sy,
            left: SPLASH_LOGO.left * sx,
            width: SPLASH_LOGO.width * sx,
            height: SPLASH_LOGO.height * sy,
            fontSize: SPLASH_LOGO.fontSize * sx,
            lineHeight: SPLASH_LOGO.lineHeight * sy,
            color: SPLASH_LOGO.color,
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
    backgroundColor: SPLASH_BACKGROUND,
    zIndex: 10000,
    elevation: 10000,
  },
  logo: {
    position: 'absolute',
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
