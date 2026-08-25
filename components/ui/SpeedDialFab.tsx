import React, { useEffect, useMemo, useState } from 'react';
import {
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Figma 375×812 FAB metrics. Size/offset use bounded structural scale; type stays fixed. */
export const ADD_FAB = {
  size: 56,
  radius: 16,
  padding: 16,
  iconSize: 24,
  right: 22,
  bottom: 38,
  menuGap: 12,
  menuItemH: 40,
  animMs: 200,
  menuIcon: 22,
} as const;

/** @deprecated use ADD_FAB.bottom */
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Shared add FAB: 56×56 square, brand fill. Fixed size/position across devices.
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
  const { structuralScale, insets } = useResponsiveLayout();
  const s = structuralScale;

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

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
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

  /** Tight chip width from the longest label — stay compact on all locales. */
  const minMenuWidth = useMemo(() => {
    const longest = Math.max(...items.map((it) => it.label.length), 6);
    return Math.max(96, Math.ceil(longest * 7.2 + ADD_FAB.menuIcon + 10 + 24));
  }, [items]);

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
            right: ADD_FAB.right * s,
            bottom: Math.max(ADD_FAB.bottom * s, 16 + insets.bottom),
          },
          style,
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.menu,
            { gap: ADD_FAB.menuGap * s, marginBottom: ADD_FAB.menuGap * s },
            menuStyle,
          ]}
          pointerEvents={open ? 'box-none' : 'none'}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                {
                  minHeight: ADD_FAB.menuItemH * s,
                  minWidth: minMenuWidth,
                },
              ]}
              onPress={() => {
                close();
                item.onPress();
              }}
              activeOpacity={0.85}
            >
              {item.icon ? (
                <Image
                  source={item.icon}
                  style={{ width: ADD_FAB.menuIcon, height: ADD_FAB.menuIcon }}
                  contentFit="contain"
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
              width: ADD_FAB.size * s,
              height: ADD_FAB.size * s,
              borderRadius: ADD_FAB.radius * s,
            },
          ]}
          onPress={toggle}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: open }}
        >
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={ADD_FAB.iconSize} color={colors.button.primaryText} />
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
      backgroundColor: c.overlay,
      zIndex: 90,
    },
    anchor: {
      position: 'absolute',
      alignItems: 'flex-end',
      zIndex: 100,
    },
    menu: {
      alignItems: 'flex-end',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingLeft: 12,
      paddingRight: 12,
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
      fontSize: 13,
      lineHeight: 18,
      color: c.primaryText,
      flexShrink: 0,
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
