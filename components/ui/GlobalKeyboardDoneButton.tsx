import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { dismissKeyboard } from '@/components/ui/keyboardUtils';
import { useColors } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { t } from '@/i18n';

const FADE_MS = 200;

/**
 * Done pill above the keyboard.
 * Fades with keyboard show/hide; rides animated height so it does not
 * pop or jump during FAB → create navigation races.
 */
export default function GlobalKeyboardDoneButton() {
  const { locale } = useLocale();
  const colors = useColors();
  const [interactive, setInteractive] = useState(false);
  const fade = useSharedValue(0);
  const keyboard = useAnimatedKeyboard({
    isStatusBarTranslucentAndroid: true,
    isNavigationBarTranslucentAndroid: true,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      fade.value = withTiming(1, { duration: FADE_MS });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      fade.value = withTiming(0, { duration: FADE_MS });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [fade]);

  useAnimatedReaction(
    () => fade.value > 0.04,
    (active, prev) => {
      if (active !== prev) runOnJS(setInteractive)(active);
    },
  );

  const hostStyle = useAnimatedStyle(() => {
    const h = Math.max(0, keyboard.height.value);
    return {
      bottom: h,
      opacity: fade.value,
      transform: [
        {
          translateY: interpolate(fade.value, [0, 1], [8, 0], Extrapolation.CLAMP),
        },
      ],
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
