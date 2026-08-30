import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

/**
 * Dims the screen slightly and swallows every tap (header, rows, FAB, sheets)
 * while a list page is in flight. Not a spinner and not the home skeleton.
 */
export default function ListFetchBlocker({ visible }: { visible: boolean }) {
  const { isDark } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[styles.blocker, isDark ? styles.dimDark : styles.dimLight]}
      pointerEvents="auto"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  blocker: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
  dimLight: {
    backgroundColor: 'rgba(45, 45, 42, 0.10)',
  },
  dimDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
});
