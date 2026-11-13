import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  KeyboardState,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { dismissKeyboard } from '@/components/ui/keyboardUtils';
import { useColors } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { t } from '@/i18n';

/**
 * Done pill above the keyboard — rides the keyboard height so open/close
 * stays smooth (no late mount jump after keyboardDidShow).
 */
export default function GlobalKeyboardDoneButton() {
  // Re-evaluate `t()` when the in-app language changes.
  useLocale();
  const colors = useColors();
  const [interactive, setInteractive] = useState(false);
  const keyboard = useAnimatedKeyboard({
    isStatusBarTranslucentAndroid: true,
    isNavigationBarTranslucentAndroid: true,
  });

  useAnimatedReaction(
    () => {
      const height = keyboard.height.value;
      const state = keyboard.state.value;
      return (
        height > 8 &&
        (state === KeyboardState.OPENING ||
          state === KeyboardState.OPEN ||
          state === KeyboardState.CLOSING)
      );
    },
    (active, prev) => {
      if (active !== prev) runOnJS(setInteractive)(active);
    },
  );

  const hostStyle = useAnimatedStyle(() => {
    const height = keyboard.height.value;
    const state = keyboard.state.value;
    const active =
      height > 0 &&
      (state === KeyboardState.OPENING ||
        state === KeyboardState.OPEN ||
        state === KeyboardState.CLOSING);
    return {
      bottom: height,
      opacity: active ? 1 : 0,
    };
  });

  return (
    <Animated.View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        pointerEvents={interactive ? 'box-none' : 'none'}
        style={[styles.host, hostStyle]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.doneBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={dismissKeyboard}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('pickers.done')}
        >
          <Text style={[styles.doneLabel, { color: colors.primaryText }]}>
            {t('pickers.done')}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  host: {
    position: 'absolute',
    right: 20,
    paddingVertical: 8,
  },
  doneBtn: {
    minWidth: 100,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  doneLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
  },
});
