import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  KeyboardState,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dismissKeyboard } from '@/components/ui/keyboardUtils';
import {
  useActiveKeyboardSave,
  useHasLocalKeyboardBar,
} from '@/components/ui/keyboardSaveAction';
import { useColors } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { t } from '@/i18n';

const CLOSE_FADE_MS = 120;
const DISABLED_OPACITY = 0.45;

function KeyboardBarPill({ onPressed }: { onPressed?: () => void }) {
  const { locale } = useLocale();
  const colors = useColors();
  const activeSave = useActiveKeyboardSave();

  if (activeSave) {
    const disabled = activeSave.disabled;
    const label = t('common.save', locale);
    return (
      <Pressable
        style={[
          styles.pill,
          disabled
            ? {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: DISABLED_OPACITY,
              }
            : { backgroundColor: colors.brand, borderColor: colors.brand },
        ]}
        disabled={disabled}
        onPress={() => {
          if (activeSave.disabled) return;
          onPressed?.();
          dismissKeyboard();
          activeSave.press();
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        <Text
          style={[
            styles.label,
            { color: disabled ? colors.secondaryText : colors.button.primaryText },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  const label = t('pickers.done', locale);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={() => {
        onPressed?.();
        dismissKeyboard();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.label, { color: colors.primaryText }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * One overlay for iOS and Android that rides the animated keyboard height
 * frame by frame. (A global InputAccessoryView never attaches to inputs
 * mounted later on the new architecture, so it is not used.)
 *
 * - Done: visible only while the keyboard is up.
 * - Save (create screens): rides the keyboard up and down, and rests at the
 *   bottom-right in the same spot when the keyboard is closed.
 */
export default function GlobalKeyboardDoneButton() {
  const hasLocalBar = useHasLocalKeyboardBar();
  if (hasLocalBar) return null;
  return <KeyboardBarOverlay />;
}

export function KeyboardBarOverlay() {
  const insets = useSafeAreaInsets();
  const activeSave = useActiveKeyboardSave();
  const [keyboardUp, setKeyboardUp] = useState(false);
  const keyboard = useAnimatedKeyboard();
  const hasSave = useSharedValue(false);
  const restBottom = useSharedValue(insets.bottom);
  // Done is hidden from a tap (or a JS hide) until the keyboard starts opening
  // again, so a stale animated height can't leave it floating mid-screen.
  const suppressed = useSharedValue(false);

  useEffect(() => {
    hasSave.value = activeSave != null;
  }, [activeSave, hasSave]);

  useEffect(() => {
    restBottom.value = insets.bottom;
  }, [insets.bottom, restBottom]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      suppressed.value = true;
    });
    return () => sub.remove();
  }, [suppressed]);

  useAnimatedReaction(
    () => keyboard.state.value,
    (state, prev) => {
      if (state === KeyboardState.OPENING && prev !== KeyboardState.OPENING) {
        suppressed.value = false;
      }
    },
  );

  useAnimatedReaction(
    () => {
      const state = keyboard.state.value;
      return (
        !suppressed.value &&
        keyboard.height.value > 8 &&
        (state === KeyboardState.OPENING || state === KeyboardState.OPEN)
      );
    },
    (up, prev) => {
      if (up !== prev) runOnJS(setKeyboardUp)(up);
    },
  );

  const hostStyle = useAnimatedStyle(() => {
    const height = Math.max(0, keyboard.height.value);
    if (hasSave.value) {
      return { bottom: Math.max(height, restBottom.value), opacity: 1 };
    }
    if (suppressed.value) return { bottom: height, opacity: 0 };
    const state = keyboard.state.value;
    const visible =
      height > 0 && (state === KeyboardState.OPENING || state === KeyboardState.OPEN);
    return {
      bottom: height,
      // Show on the same frame as the keyboard; fade only when closing starts.
      opacity: visible ? 1 : withTiming(0, { duration: CLOSE_FADE_MS }),
    };
  });

  const interactive = activeSave != null || keyboardUp;

  return (
    <Animated.View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        pointerEvents={interactive ? 'box-none' : 'none'}
        style={[styles.host, hostStyle]}
      >
        <KeyboardBarPill
          onPressed={() => {
            suppressed.value = true;
          }}
        />
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
  pill: {
    minWidth: 100,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
  },
});
