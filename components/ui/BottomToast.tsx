import React, { useEffect, useMemo } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { isRTL } from '@/i18n';
import { ADD_FAB } from '@/components/ui/SpeedDialFab';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export interface BottomToastProps {
  visible: boolean;
  message: string;
  countdownSec?: number | null;
  actionText?: string;
  onAction?: () => void;
  aboveFab?: boolean;
}

const TOAST = {
  maxWidth: '100%',
  minHeight: 48,
  padV: 14,
  padH: 16,
  gap: 10,
  bottomWithFab: 106,
  bottomPlain: 50,
  messageMaxWidth: 248,
  actionMinWidth: 36,
} as const;

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
  const { contentWidth } = useResponsiveLayout();
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);

  const toastWidth = contentWidth;

  const bottom = useMemo(() => {
    const withFab = ADD_FAB.bottom + ADD_FAB.size + 12 + Math.max(0, insets.bottom);
    return aboveFab
      ? Math.max(TOAST.bottomWithFab, withFab)
      : TOAST.bottomPlain + Math.max(0, insets.bottom);
  }, [aboveFab, insets.bottom]);

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
      style={[styles.wrap, animatedStyle, { bottom, paddingHorizontal: Spacing.lg }]}
    >
      <View
        style={[
          styles.container,
          {
            width: toastWidth,
            minHeight: TOAST.minHeight,
            borderRadius: Radius.md,
            paddingVertical: TOAST.padV,
            paddingHorizontal: TOAST.padH,
            gap: TOAST.gap,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <Text
          style={[
            styles.message,
            {
              maxWidth: actionText ? TOAST.messageMaxWidth : undefined,
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
            style={{ minWidth: TOAST.actionMinWidth }}
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
