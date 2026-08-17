import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  SPLASH_BACKGROUND,
  SPLASH_LOGO,
} from '@/constants/splash';

/**
 * Brand splash: white canvas + Ragly wordmark at fixed Figma position.
 */
export default function AppSplash() {
  return (
    <View style={styles.root} pointerEvents="auto" accessibilityRole="progressbar">
      <Text
        style={[
          styles.logo,
          {
            top: SPLASH_LOGO.top,
            left: SPLASH_LOGO.left,
            width: SPLASH_LOGO.width,
            height: SPLASH_LOGO.height,
            fontSize: SPLASH_LOGO.fontSize,
            lineHeight: SPLASH_LOGO.lineHeight,
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
    textAlign: 'center',
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
