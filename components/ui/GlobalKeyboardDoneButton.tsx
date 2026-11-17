import React, { useEffect, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  KeyboardState,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { dismissKeyboard, KEYBOARD_DONE_ACCESSORY_ID } from '@/components/ui/keyboardUtils';
import { useActiveKeyboardSave } from '@/components/ui/keyboardSaveAction';
import { useColors } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { t } from '@/i18n';

const CLOSE_FADE_MS = 120;
const DISABLED_OPACITY = 0.45;

function DonePill({ onPressed }: { onPressed?: () => void }) {
  const { locale } = useLocale();
  const colors = useColors();
  const activeSave = useActiveKeyboardSave();
  // After Save the screen closes while the keyboard is still sliding away —
  // keep showing Save until it's gone instead of flipping to Done.
  const [savedWhileOpen, setSavedWhileOpen] = useState(false);

  useEffect(() => {
    if (!savedWhileOpen) return;
    const sub = Keyboard.addListener('keyboardDidHide', () => setSavedWhileOpen(false));
    return () => sub.remove();
  }, [savedWhileOpen]);

  if (activeSave || savedWhileOpen) {
    const disabled = activeSave ? activeSave.disabled : true;
    const label = t('common.save', locale);
    return (
      <Pressable
        style={[
          styles.doneBtn,
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
          if (!activeSave || activeSave.disabled) return;
          setSavedWhileOpen(true);
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
            styles.doneLabel,
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
        styles.doneBtn,
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
      <Text style={[styles.doneLabel, { color: colors.primaryText }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * iOS: native input accessory — part of the keyboard itself, so it opens,
 * closes and slides in with a pushed screen in lockstep. Inputs opt in via
 * KEYBOARD_DONE_ACCESSORY_ID.
 */
function IosDoneAccessory() {
  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ACCESSORY_ID} backgroundColor="transparent">
      <View style={styles.accessoryRow} pointerEvents="box-none">
        <DonePill />
      </View>
    </InputAccessoryView>
  );
}

/** Android: overlay that rides the animated IME height. */
function AndroidDoneOverlay() {
  const [interactive, setInteractive] = useState(false);
  const keyboard = useAnimatedKeyboard();
  // Hidden from a tap (or a JS hide) until the IME starts opening again, so a
  // stale animated height can't leave the pill floating mid-screen.
  const suppressed = useSharedValue(false);

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
    (active, prev) => {
      if (active !== prev) runOnJS(setInteractive)(active);
    },
  );

  const hostStyle = useAnimatedStyle(() => {
    const height = keyboard.height.value;
    const state = keyboard.state.value;
    if (suppressed.value) return { bottom: Math.max(0, height), opacity: 0 };
    const visible =
      height > 0 && (state === KeyboardState.OPENING || state === KeyboardState.OPEN);
    return {
      bottom: Math.max(0, height),
      // Show on the same frame as the IME; fade only when closing starts.
      opacity: visible ? 1 : withTiming(0, { duration: CLOSE_FADE_MS }),
    };
  });

  return (
    <Animated.View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        pointerEvents={interactive ? 'box-none' : 'none'}
        style={[styles.host, hostStyle]}
      >
        <DonePill
          onPressed={() => {
            suppressed.value = true;
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export default function GlobalKeyboardDoneButton() {
  return Platform.OS === 'ios' ? <IosDoneAccessory /> : <AndroidDoneOverlay />;
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
  accessoryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
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
