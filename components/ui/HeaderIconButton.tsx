import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

/** Figma header / chrome icon chip (settings, back, close, ⋮). */
export const HEADER_ICON_BTN = {
  size: 32,
  radius: 10,
  padding: 4,
  /** Glyph size that fits inside 32 with 4px padding. */
  iconSize: 20,
  gap: 10,
} as const;

export const HEADER_ICON_BTN_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  boxShadow: '0px 4px 20px rgba(45, 45, 42, 0.080)',
  elevation: 3,
} as const;

/** Theme-aware style matching Figma: 32×32, r10, p4, surface + soft shadow. */
export function makeHeaderIconButtonStyle(c: ThemeColors) {
  return {
    width: HEADER_ICON_BTN.size,
    height: HEADER_ICON_BTN.size,
    borderRadius: HEADER_ICON_BTN.radius,
    padding: HEADER_ICON_BTN.padding,
    backgroundColor: c.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...HEADER_ICON_BTN_SHADOW,
  };
}

interface HeaderIconButtonProps {
  onPress?: () => void;
  accessibilityLabel?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/** Shared 32×32 surface icon button used in headers across the app. */
export default function HeaderIconButton({
  onPress,
  accessibilityLabel,
  children,
  style,
  disabled,
}: HeaderIconButtonProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.outer, style]} collapsable={false}>
      <View style={styles.fill} collapsable={false}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || !onPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          activeOpacity={0.85}
          style={styles.hit}
        >
          {children}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    // Shadow and fill both sit on plain views. iOS skips a background that
    // lives only on the pressable.
    outer: {
      width: HEADER_ICON_BTN.size,
      height: HEADER_ICON_BTN.size,
      borderRadius: HEADER_ICON_BTN.radius,
      backgroundColor: c.surface,
      ...HEADER_ICON_BTN_SHADOW,
    },
    fill: {
      flex: 1,
      borderRadius: HEADER_ICON_BTN.radius,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    hit: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
  });
