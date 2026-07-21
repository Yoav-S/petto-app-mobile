import React from 'react';
import { Pressable, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { DESIGN_WIDTH } from '@/components/home/PetHeader';

const DESIGN = {
  btnW: 60,
  btnH: 82,
  btnRadius: 22,
  iconSize: 24,
  closedDeg: -10,
  openDeg: 45,
} as const;

export const ADD_FAB_BOTTOM = 32;
export const ADD_FAB_RIGHT = 16;

export function useAddFabMetrics() {
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;
  return {
    s,
    btnW: DESIGN.btnW * s,
    btnH: DESIGN.btnH * s,
    btnRadius: DESIGN.btnRadius * s,
    iconSize: DESIGN.iconSize * s,
  };
}

interface AddFabButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  /** Rotate icon to × (home FAB menu open state). */
  open?: boolean;
  accessibilityLabel?: string;
}

export default function AddFabButton({
  onPress,
  style,
  open = false,
  accessibilityLabel,
}: AddFabButtonProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const metrics = useAddFabMetrics();

  return (
    <Pressable
      style={[
        styles.btn,
        {
          width: metrics.btnW,
          height: metrics.btnH,
          borderRadius: metrics.btnRadius,
        },
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons
        name="add"
        size={metrics.iconSize}
        color={colors.surface}
        style={{
          transform: [{ rotate: `${open ? DESIGN.openDeg : DESIGN.closedDeg}deg` }],
        }}
      />
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  btn: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
});
