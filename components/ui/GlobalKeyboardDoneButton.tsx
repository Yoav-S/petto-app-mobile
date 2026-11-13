import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { dismissKeyboard } from '@/components/ui/keyboardUtils';
import { useColors } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { t } from '@/i18n';

/**
 * Done pill above the keyboard.
 * Position follows animated keyboard height; visibility trusts Keyboard
 * show/hide events so it never sticks after dismiss.
 */
export default function GlobalKeyboardDoneButton() {
  const { locale } = useLocale();
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const keyboard = useAnimatedKeyboard({
    isStatusBarTranslucentAndroid: true,
    isNavigationBarTranslucentAndroid: true,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const hostStyle = useAnimatedStyle(() => ({
    bottom: Math.max(0, keyboard.height.value),
  }));

  // Pass locale so React Compiler / memoization cannot keep a stale label.
  const label = t('pickers.done', locale);

  return (
    <Animated.View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        pointerEvents={visible ? 'box-none' : 'none'}
        style={[styles.host, hostStyle, { opacity: visible ? 1 : 0 }]}
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
