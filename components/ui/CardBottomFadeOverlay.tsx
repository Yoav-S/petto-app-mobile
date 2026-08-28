import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/context/ThemeContext';

const STOPS = [0, 0.22, 0.45, 0.68, 0.89, 1];

/**
 * Stacked surface-colored bands that fade a list card out as it passes the
 * bottom edge of its scroll viewport. `intensity` is 0 (visible) → 1 (faded).
 */
export default function CardBottomFadeOverlay({ intensity }: { intensity: number }) {
  const colors = useColors();
  if (intensity <= 0.01) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {STOPS.map((stop, index) => {
        const nextStop = STOPS[index + 1] ?? 1;
        const bandOpacity = intensity * stop * 0.95;
        if (bandOpacity <= 0.01) return null;
        return (
          <View
            key={stop}
            style={[
              styles.band,
              {
                top: `${stop * 100}%`,
                height: `${(nextStop - stop) * 100}%`,
                backgroundColor: colors.surface,
                opacity: bandOpacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
