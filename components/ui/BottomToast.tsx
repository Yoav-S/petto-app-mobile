import React, { useEffect, useMemo } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { isRTL } from '@/i18n';
import { ADD_FAB } from '@/components/ui/SpeedDialFab';

export interface BottomToastProps {
  visible: boolean;
  message: string;
  /** Optional countdown seconds shown as "(Ns)" after the message. */
  countdownSec?: number | null;
  actionText?: string;
  onAction?: () => void;
  /** When true, sits above the add FAB; otherwise ~50px from the bottom. */
  aboveFab?: boolean;
}

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const TOAST = {
  width: 335,
  minHeight: 48,
  padV: 14,
  padH: 16,
  gap: 10,
  radius: 12,
  /** Figma top 658 on 812 → bottom offset when FAB is present. */
  bottomWithFab: 106,
  bottomPlain: 50,
  messageMaxWidth: 248,
  actionMinWidth: 36,
} as const;

/**
 * Bottom toast / error logger. Grows vertically for long messages.
 * Theme-aware inverse surface; RTL-aware row direction.
 */
export default function BottomToast({
  visible,
  message,
  countdownSec,
  actionText,
  onAction,
  aboveFab = false,
}: BottomToastProps) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);

  const layout = useMemo(() => {
    const withFab =
      (ADD_FAB.bottom + ADD_FAB.size + 12) * sy + Math.max(0, insets.bottom);
    return {
      width: TOAST.width * sx,
      minHeight: TOAST.minHeight * sy,
      padV: TOAST.padV * sy,
      padH: TOAST.padH * sx,
      gap: TOAST.gap * sx,
      radius: TOAST.radius * sx,
      bottom: aboveFab
        ? Math.max(TOAST.bottomWithFab * sy, withFab)
        : TOAST.bottomPlain * sy + Math.max(0, insets.bottom),
      messageMaxWidth: TOAST.messageMaxWidth * sx,
      actionMinWidth: TOAST.actionMinWidth * sx,
    };
  }, [aboveFab, insets.bottom, sx, sy]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 16, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      translateY.value = withTiming(120, { duration: 220 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const displayMessage =
    countdownSec != null && countdownSec >= 0
      ? `${message} (${countdownSec}s)`
      : message;

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        animatedStyle,
        {
          bottom: layout.bottom,
          paddingHorizontal: ((DESIGN_WIDTH - TOAST.width) / 2) * sx,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            width: layout.width,
            minHeight: layout.minHeight,
            borderRadius: layout.radius,
            paddingVertical: layout.padV,
            paddingHorizontal: layout.padH,
            gap: layout.gap,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <Text
          style={[
            styles.message,
            {
              maxWidth: actionText ? layout.messageMaxWidth : undefined,
              flex: 1,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {displayMessage}
        </Text>

        {actionText && onAction ? (
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={actionText}
            style={{ minWidth: layout.actionMinWidth }}
          >
            <Text style={[styles.actionText, { textAlign: isRTL ? 'left' : 'right' }]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 2000,
      elevation: 20,
    },
    container: {
      // Inverse of page: dark bar in light mode, light bar in dark mode.
      backgroundColor: c.primaryText,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    message: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.background,
      flexShrink: 1,
    },
    actionText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: c.background,
      marginTop: 1,
    },
  });
