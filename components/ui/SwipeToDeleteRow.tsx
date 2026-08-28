import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  BackHandler,
  Platform,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useTheme, useThemedStyles } from '@/context/ThemeContext';
import { t, isRTL } from '@/i18n';

/** Figma: 335 closed → 409 open, 32px gap before a 42pt trash column. */
const REVEAL_GAP = 32;
const TRASH_COLUMN_WIDTH = 42;
const TRASH_COLUMN_HEIGHT = 58;
const ACTION_WIDTH = REVEAL_GAP + TRASH_COLUMN_WIDTH;

/**
 * Share of the reveal at which the card has travelled past the whole trash
 * column, i.e. the first moment there is room for all 42px of it.
 */
const TRASH_CLEARED_AT = TRASH_COLUMN_WIDTH / ACTION_WIDTH;

const TRASH_BUTTON = {
  size: 32,
  radius: 10,
  iconSize: 24,
  iconStroke: 1.5,
} as const;

/** Vertical gap the row children reserve below the card (list item spacing). */
const DEFAULT_ROW_BOTTOM_GAP = 12;

/** Disabled-state wash shown over the card while the trash is revealed. */
const DISABLED_BG_LIGHT = '#E5E7EB';
const DISABLED_BG_DARK = '#373C42';
/** Keeps the card readable while still reading as disabled. */
const DISABLED_BG_OPACITY = 0.6;

interface SwipeToDeleteRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  enabled?: boolean;
  /** When false, force-close (e.g. another row opened / back). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Bottom margin the child card reserves, so the trash stays card-centered. */
  rowBottomGap?: number;
}

/**
 * Swipe toward the trailing edge to reveal a themed trash control.
 *
 * The card keeps its full width and slides under a static clipping window, so
 * the part that leaves the content column is hidden instead of spilling into
 * the page gutter.
 *
 * The trash control is never animated: it sits statically at the trailing edge,
 * behind the card, and the sliding card uncovers it. Every layer stays mounted for the
 * row's whole lifetime, so nothing mounts, unmounts or re-styles from React
 * state while the finger is down.
 */
export default function SwipeToDeleteRow({
  children,
  onDelete,
  enabled = true,
  open,
  onOpenChange,
  rowBottomGap = DEFAULT_ROW_BOTTOM_GAP,
}: SwipeToDeleteRowProps) {
  const colors = useColors();
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const ref = useRef<Swipeable>(null);
  const revealedRef = useRef(false);
  /** Only gates touches; flipped after the settle animation, never mid-drag. */
  const [locked, setLocked] = useState(false);
  const wash = useRef(new Animated.Value(0)).current;
  const rtl = isRTL;

  const fadeWash = useCallback(
    (to: number) => {
      Animated.timing(wash, {
        toValue: to,
        duration: 160,
        useNativeDriver: true,
      }).start();
    },
    [wash],
  );

  const washOpacity = wash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DISABLED_BG_OPACITY],
  });

  useEffect(() => {
    if (open === false) {
      ref.current?.close();
    }
  }, [open]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!revealedRef.current) return false;
      ref.current?.close();
      return true;
    });
    return () => sub.remove();
  }, []);

  const renderActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>) => (
      <Animated.View
        style={[
          styles.actions,
          {
            paddingBottom: rowBottomGap,
            alignItems: rtl ? 'flex-start' : 'flex-end',
            // Painted only once the card has fully cleared the trash column, so
            // it can never be seen through the card nor as a clipped sliver.
            opacity: progress.interpolate({
              inputRange: [0, TRASH_CLEARED_AT, TRASH_CLEARED_AT + 0.0001, 1],
              outputRange: [0, 0, 1, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <Pressable
          style={styles.trashColumn}
          onPress={() => {
            ref.current?.close();
            onDelete();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.delete')}
        >
          <View style={[styles.trashButton, { backgroundColor: colors.error }]}>
            <Trash2
              size={TRASH_BUTTON.iconSize}
              color="#FFFFFF"
              strokeWidth={TRASH_BUTTON.iconStroke}
            />
          </View>
          <Text style={[styles.deleteLabel, { color: colors.error }]} numberOfLines={1}>
            {t('common.delete')}
          </Text>
        </Pressable>
      </Animated.View>
    ),
    [colors.error, onDelete, rowBottomGap, rtl, styles],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.clip}>
      <Swipeable
        ref={ref}
        friction={2}
        overshootFriction={8}
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={rtl ? 40 : undefined}
        rightThreshold={rtl ? undefined : 40}
        renderLeftActions={rtl ? renderActions : undefined}
        renderRightActions={rtl ? undefined : renderActions}
        onSwipeableWillOpen={() => {
          revealedRef.current = true;
          fadeWash(1);
          onOpenChange?.(true);
        }}
        onSwipeableOpen={() => setLocked(true)}
        onSwipeableWillClose={() => {
          setLocked(false);
          fadeWash(0);
        }}
        onSwipeableClose={() => {
          revealedRef.current = false;
          onOpenChange?.(false);
        }}
      >
        <View style={styles.content}>
          {children}
          <Animated.View
            pointerEvents={locked ? 'auto' : 'none'}
            style={[
              styles.wash,
              { bottom: rowBottomGap, opacity: washOpacity },
              isDark ? styles.washDark : styles.washLight,
            ]}
          />
        </View>
      </Swipeable>
    </View>
  );
}

const makeStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    /** Static window: the card slides inside it, overflow is clipped. */
    clip: {
      width: '100%',
      overflow: 'hidden',
    },
    content: {
      position: 'relative',
      zIndex: 1,
    },
    wash: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      borderRadius: 12,
    },
    washLight: {
      backgroundColor: DISABLED_BG_LIGHT,
    },
    washDark: {
      backgroundColor: DISABLED_BG_DARK,
    },
    actions: {
      width: ACTION_WIDTH,
      justifyContent: 'center',
    },
    trashColumn: {
      width: TRASH_COLUMN_WIDTH,
      height: TRASH_COLUMN_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    trashButton: {
      width: TRASH_BUTTON.size,
      height: TRASH_BUTTON.size,
      borderRadius: TRASH_BUTTON.radius,
      alignItems: 'center',
      justifyContent: 'center',
      // iOS-only shadow on purpose: an Android `elevation` here would lift the
      // trash above the card (cards use elevation 3), letting it show through
      // before the card has actually slid away.
      ...Platform.select({
        ios: {
          shadowColor: '#2D2D2A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
        },
        default: {},
      }),
    },
    deleteLabel: {
      width: TRASH_COLUMN_WIDTH,
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 20,
      textAlign: 'center',
    },
  });
