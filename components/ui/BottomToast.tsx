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

export interface ToastItem {
  id: number;
  message: string;
  countdownSec?: number | null;
  actionText?: string;
  onAction?: () => void;
  aboveFab?: boolean;
}

export interface BottomToastProps {
  visible: boolean;
  message: string;
  countdownSec?: number | null;
  actionText?: string;
  onAction?: () => void;
  aboveFab?: boolean;
}

const TOAST = {
  minHeight: 48,
  padV: 14,
  padH: 16,
  gap: 10,
  stackGap: 8,
  bottomWithFab: 106,
  bottomPlain: 50,
  messageMaxWidth: 248,
  actionMinWidth: 36,
} as const;

function ToastChip({
  message,
  countdownSec,
  actionText,
  onAction,
  width,
}: {
  message: string;
  countdownSec?: number | null;
  actionText?: string;
  onAction?: () => void;
  width: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const translateY = useSharedValue(24);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 16, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 180 });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const displayMessage =
    countdownSec != null && countdownSec >= 0
      ? `${message} (${countdownSec}s)`
      : message;

  return (
    <Animated.View style={[{ width }, animatedStyle]}>
      <View
        style={[
          styles.container,
          {
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

/** One or more chips stacked above the home indicator / FAB. Newest sits at the bottom. */
export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsiveLayout();

  const aboveFab = toasts.some((toast) => toast.aboveFab);
  const bottom = useMemo(() => {
    const withFab = ADD_FAB.bottom + ADD_FAB.size + 12 + Math.max(0, insets.bottom);
    return aboveFab
      ? Math.max(TOAST.bottomWithFab, withFab)
      : TOAST.bottomPlain + Math.max(0, insets.bottom);
  }, [aboveFab, insets.bottom]);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.stack,
        {
          bottom,
          paddingHorizontal: Spacing.lg,
          gap: TOAST.stackGap,
        },
      ]}
    >
      {toasts.map((toast) => (
        <ToastChip
          key={toast.id}
          message={toast.message}
          countdownSec={toast.countdownSec}
          actionText={toast.actionText}
          onAction={toast.onAction}
          width={contentWidth}
        />
      ))}
    </View>
  );
}

/** @deprecated Use ToastStack — kept for a single-chip call site. */
export default function BottomToast({
  visible,
  message,
  countdownSec,
  actionText,
  onAction,
  aboveFab = false,
}: BottomToastProps) {
  if (!visible) return null;
  return (
    <ToastStack
      toasts={[
        {
          id: 0,
          message,
          countdownSec,
          actionText,
          onAction,
          aboveFab,
        },
      ]}
    />
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    stack: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'flex-end',
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
