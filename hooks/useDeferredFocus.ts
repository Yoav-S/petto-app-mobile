import { useCallback, useRef } from 'react';
import { type TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';

type TransitionEvent = {
  data?: { closing?: boolean };
};

/**
 * Focus a create-flow TextInput while the push is still running, so the
 * keyboard arrives with the screen.
 *
 * - iOS attaches the keyboard to the push and slides it in with the screen.
 * - Android's IME is a separate window and always rises from the bottom; it
 *   starts rising alongside the slide. An early focus can be dropped there
 *   (cursor, no keyboard), so focus is retried on transitionEnd.
 *
 * Do not use TextInput `autoFocus` with a push — it fires before the input
 * is attached and is unreliable.
 */
export function useDeferredFocus(enabled: boolean) {
  const ref = useRef<TextInput>(null);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      let cancelled = false;
      let endRaf = 0;

      const focusInput = () => {
        if (cancelled) return;
        if (ref.current?.isFocused()) return;
        ref.current?.focus();
      };

      const unsubStart = navigation.addListener(
        'transitionStart' as never,
        ((e: TransitionEvent) => {
          if (!e.data?.closing) focusInput();
        }) as never,
      );
      const unsubEnd = navigation.addListener(
        'transitionEnd' as never,
        ((e: TransitionEvent) => {
          if (e.data?.closing) return;
          endRaf = requestAnimationFrame(focusInput);
        }) as never,
      );
      // The screen usually mounts after transitionStart has already fired.
      const startRaf = requestAnimationFrame(focusInput);

      return () => {
        cancelled = true;
        cancelAnimationFrame(startRaf);
        cancelAnimationFrame(endRaf);
        unsubStart();
        unsubEnd();
      };
    }, [enabled, navigation]),
  );

  return ref;
}
