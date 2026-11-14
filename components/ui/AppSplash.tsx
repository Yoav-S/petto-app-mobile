import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SPLASH_DARK, SPLASH_LIGHT, SPLASH_LOGO } from '@/constants/splash';
import { useTheme } from '@/context/ThemeContext';

/**
 * Brand splash: Ragly wordmark centered. Follows the resolved theme scheme
 * (including system) so dark-mode cold starts stay dark.
 */
export default function AppSplash() {
  const { isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const palette = isDark ? SPLASH_DARK : SPLASH_LIGHT;
  const left = (width - SPLASH_LOGO.width) / 2;
  const top = height * (SPLASH_LOGO.top / 812);

  return (
    <View
      style={[styles.root, { backgroundColor: palette.background }]}
      pointerEvents="auto"
      accessibilityRole="progressbar"
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
