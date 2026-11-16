import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  KeyboardState,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { dismissKeyboard } from '@/components/ui/keyboardUtils';
import { useColors } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { t } from '@/i18n';

const CLOSE_FADE_MS = 120;

/**
 * Done pill above the keyboard — rides animated height + KeyboardState so
 * open/close stays smooth (no event-fade / translateY flicker).
 */
export default function GlobalKeyboardDoneButton() {
  const { locale } = useLocale();
  const colors = useColors();
  const [interactive, setInteractive] = useState(false);
  // Edge-to-edge already owns Android bar translucency; those options warn if set.
  const keyboard = useAnimatedKeyboard();

  useAnimatedReaction(
    () => {
      const height = keyboard.height.value;
      const state = keyboard.state.value;
      return (
        height > 8 &&
        (state === KeyboardState.OPENING || state === KeyboardState.OPEN)
      );
    },
    (active, prev) => {
      if (active !== prev) runOnJS(setInteractive)(active);
    },
  );

  const hostStyle = useAnimatedStyle(() => {
    const height = keyboard.height.value;
    const state = keyboard.state.value;
    // Fade out as soon as closing starts: the reported height can trail the
    // real keyboard, which left the pill hanging after the keyboard was gone.
    const visible =
      height > 0 &&
      (state === KeyboardState.OPENING || state === KeyboardState.OPEN);
    return {
      bottom: Math.max(0, height),
      opacity: withTiming(visible ? 1 : 0, { duration: visible ? 0 : CLOSE_FADE_MS }),
    };
  });

  const label = t('pickers.done', locale);

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
          accessibilityLabel={label}
        >
          <Text style={[styles.doneLabel, { color: colors.primaryText }]}>
            {label}
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
