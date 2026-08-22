import React from 'react';
import { View, StyleSheet } from 'react-native';

/** Blocks taps/navigation while a list page is loading. */
export default function ListFetchBlocker({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return <View style={styles.blocker} pointerEvents="auto" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}

const styles = StyleSheet.create({
  blocker: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
  },
});
