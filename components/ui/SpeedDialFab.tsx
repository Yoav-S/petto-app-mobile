import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { DESIGN_WIDTH } from '@/components/home/PetHeader';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Figma 375×812: left 299 → right 20; top 718 → bottom 38. */
export const ADD_FAB = {
  size: 56,
  radius: 16,
  padding: 16,
  iconSize: 24,
  right: 20,
  bottom: 38,
  menuGap: 12,
  menuItemH: 40,
  animMs: 200,
} as const;

/** @deprecated use ADD_FAB.bottom — kept for existing style imports */
export const ADD_FAB_BOTTOM = ADD_FAB.bottom;
/** @deprecated use ADD_FAB.right */
export const ADD_FAB_RIGHT = ADD_FAB.right;

export interface SpeedDialItem {
  key: string;
  label: string;
  onPress: () => void;
  icon?: ImageSourcePropType;
}

interface SpeedDialFabProps {
  items: SpeedDialItem[];
  accessibilityLabel?: string;
  style?: ViewStyle;
  /** Controlled open state (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Shared add FAB: 56×56 square, brand fill. The + icon rotates 45° to × when
 * open — the button itself never rotates. Menu items stack above the button.
 */
export default function SpeedDialFab({
  items,
  accessibilityLabel,
  style,
  open: openProp,
  onOpenChange,
}: SpeedDialFabProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: ADD_FAB.animMs });
  }, [open, progress]);

  const layout = useMemo(
    () => ({
      size: ADD_FAB.size * s,
      radius: ADD_FAB.radius * s,
      iconSize: ADD_FAB.iconSize * s,
      right: ADD_FAB.right * s,
      bottom: ADD_FAB.bottom * s + Math.max(0, insets.bottom - 8),
      menuGap: ADD_FAB.menuGap * s,
      menuItemH: ADD_FAB.menuItemH * s,
      menuIcon: 18 * s,
    }),
    [s, insets.bottom],
  );

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.2,
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [8, 0]) }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const close = () => setOpen(false);
  const toggle = () => setOpen(!open);

  const maxMenuWidth = useMemo(() => {
    // Approximate label width; menu items size to content with min padding.
    return Math.max(...items.map((it) => it.label.length * 8 + 60), 120) * s;
  }, [items, s]);

  return (
    <>
      <AnimatedPressable
        style={[styles.scrim, scrimStyle]}
        pointerEvents={open ? 'auto' : 'none'}
        onPress={close}
      />

      <View
        style={[
          styles.anchor,
          {
            right: layout.right,
            bottom: layout.bottom,
          },
          style,
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[styles.menu, { gap: layout.menuGap, marginBottom: layout.menuGap }, menuStyle]}
          pointerEvents={open ? 'box-none' : 'none'}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, { minHeight: layout.menuItemH, maxWidth: maxMenuWidth }]}
              onPress={() => {
                close();
                item.onPress();
              }}
              activeOpacity={0.85}
            >
              {item.icon ? (
                <Image
                  source={item.icon}
                  style={{ width: layout.menuIcon, height: layout.menuIcon }}
                  resizeMode="contain"
                />
              ) : null}
              <Text style={styles.menuLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.btn,
            {
              width: layout.size,
              height: layout.size,
              borderRadius: layout.radius,
            },
          ]}
          onPress={toggle}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: open }}
        >
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={layout.iconSize} color={colors.button.primaryText} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
      zIndex: 90,
    },
    anchor: {
      position: 'absolute',
      alignItems: 'flex-end',
      zIndex: 100,
      elevation: 100,
    },
    menu: {
      alignItems: 'flex-end',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: c.surface,
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
    },
    menuLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      color: c.primaryText,
    },
    btn: {
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 6,
    },
  });
