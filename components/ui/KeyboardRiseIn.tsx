import React, { useEffect } from 'react';
import { Dimensions, Keyboard, StyleSheet, View } from 'react-native';
import Animated, {
  KeyboardState,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/context/ThemeContext';
import { KeyboardBarOverlay } from '@/components/ui/GlobalKeyboardDoneButton';
import { useLocalKeyboardBarHost } from '@/components/ui/keyboardSaveAction';

/** Last real keyboard height, so the next create screen knows how far to travel. */
let lastKeyboardHeight = 0;
Keyboard.addListener('keyboardDidShow', (e) => {
  const h = Math.round(e.endCoordinates?.height ?? 0);
  if (h > 0) lastKeyboardHeight = h;
});

function expectedKeyboardHeight(): number {
  return lastKeyboardHeight > 0
    ? lastKeyboardHeight
    : Math.round(Dimensions.get('window').height * 0.38);
}

/** If the keyboard hasn't started rising by then (hardware keyboard, failed focus). */
const FALLBACK_AFTER_MS = 450;
const FALLBACK_SLIDE_MS = 260;
const SETTLE_MS = 120;

/**
 * Create screens: instead of timing the keyboard to the screen, the screen
 * follows the keyboard frame by frame. While the keyboard rises, the screen
 * rises by the same distance and fades in, so the keyboard looks like part of
 * the incoming screen on both platforms. Once arrived, the screen stays put
 * even if the user closes the keyboard.
 *
 * Pair with CREATE_SCREEN_OPTIONS (transparent modal) so the previous screen
 * shows behind while this one rises.
 */
export default function KeyboardRiseIn({
  enabled = true,
  children,
}: {
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const colors = useColors();
  useLocalKeyboardBarHost();
  const keyboard = useAnimatedKeyboard();
  const travel = useSharedValue(expectedKeyboardHeight());
  /** Keyboard height when this screen mounted (non-zero if one was already up). */
  const startHeight = useSharedValue(-1);
  const arrived = useSharedValue(!enabled);
  const settle = useSharedValue(0);

  useAnimatedReaction(
    () => keyboard.height.value,
    (height) => {
      if (startHeight.value < 0) startHeight.value = height;
    },
  );

  useAnimatedReaction(
    () => keyboard.state.value,
    (state) => {
      if (arrived.value || startHeight.value < 0) return;
      if (state !== KeyboardState.OPEN) return;
      const distance = Math.max(1, travel.value - startHeight.value);
      const risen = Math.max(0, keyboard.height.value - startHeight.value);
      settle.value = Math.max(0, distance - risen);
      arrived.value = true;
      settle.value = withTiming(0, { duration: SETTLE_MS });
    },
  );

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      if (arrived.value) return;
      const state = keyboard.state.value;
      if (state === KeyboardState.OPENING || state === KeyboardState.OPEN) return;
      settle.value = Math.max(1, travel.value);
      arrived.value = true;
      settle.value = withTiming(0, { duration: FALLBACK_SLIDE_MS });
    }, FALLBACK_AFTER_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const style = useAnimatedStyle(() => {
    const start = Math.max(0, startHeight.value);
    const distance = Math.max(1, travel.value - start);
    if (arrived.value) {
      return {
        opacity: 1 - Math.min(1, settle.value / distance),
        transform: [{ translateY: settle.value }],
      };
    }
    const risen = Math.max(0, keyboard.height.value - start);
    return {
      opacity: Math.min(1, risen / distance),
      transform: [{ translateY: Math.max(0, distance - risen) }],
    };
  });

  const barStyle = useAnimatedStyle(() => {
    if (arrived.value) return { opacity: 1 };
    const start = Math.max(0, startHeight.value);
    const distance = Math.max(1, travel.value - start);
    const risen = Math.max(0, keyboard.height.value - start);
    return { opacity: Math.min(1, risen / distance) };
  });

  return (
    <View style={styles.fill}>
      <Animated.View style={[styles.fill, { backgroundColor: colors.background }, style]}>
        {children}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, barStyle]} pointerEvents="box-none">
        <KeyboardBarOverlay />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
