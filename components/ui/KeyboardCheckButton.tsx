import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  KeyboardState,
  useAnimatedKeyboard,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/context/ThemeContext';
import { t } from '@/i18n';
import {
  useHasLocalKeyboardBar,
  useLocalKeyboardBarHost,
} from '@/components/ui/keyboardSaveAction';

const SIZE = 34;
const GAP = 8;

/** Green check above the keyboard that closes it. Hidden whenever the keyboard is closed or closing. */
export function KeyboardCheckOverlay() {
  const colors = useColors();
  const keyboard = useAnimatedKeyboard();
  const [shown, setShown] = useState(() => Keyboard.isVisible());

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setShown(true));
    const hide = Keyboard.addListener(hideEvent, () => setShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const style = useAnimatedStyle(() => {
    const state = keyboard.state.value;
    const height = keyboard.height.value;
    const open = (state === KeyboardState.OPEN || state === KeyboardState.OPENING) && height > 0;
    return {
      bottom: height + GAP,
      opacity: withTiming(open ? 1 : 0, { duration: open ? 160 : 100 }),
      transform: [{ scale: withTiming(open ? 1 : 0.85, { duration: 160 }) }],
    };
  });

  return (
    <Animated.View style={[styles.host, style]} pointerEvents={shown ? 'box-none' : 'none'}>
      <Pressable
        onPress={() => Keyboard.dismiss()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('pickers.done')}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.brand, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Ionicons name="checkmark" size={20} color={colors.button.primaryText} />
      </Pressable>
    </Animated.View>
  );
}

/** App-wide instance; steps aside while a create screen hosts its own (iOS modals sit above the root). */
export default function KeyboardCheckButton() {
  const hasLocal = useHasLocalKeyboardBar();
  if (hasLocal) return null;
  return <KeyboardCheckOverlay />;
}

/** Use inside screens presented as native modals. */
export function LocalKeyboardCheckButton() {
  useLocalKeyboardBarHost();
  return <KeyboardCheckOverlay />;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    right: 20,
    opacity: 0,
  },
  button: {
    minWidth: 76,
    height: SIZE,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
