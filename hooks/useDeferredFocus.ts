import { useCallback, useRef } from 'react';
import { Platform, type TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';

type TransitionEvent = {
  data?: { closing?: boolean };
};

/**
 * Focus a create-flow TextInput in sync with the native stack transition.
 *
 * - iOS: focus as the push starts (screen mounts mid-transition) so the
 *   keyboard rises with the slide — not after it.
 * - Android: focus on transitionEnd (+ rAF) so the IME shows without fighting
 *   the layout animation; 50ms fallback if there is no transition event.
 *
 * Do not use TextInput `autoFocus` with a push — it races the transition.
 */
export function useDeferredFocus(enabled: boolean) {
  const ref = useRef<TextInput>(null);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      let cancelled = false;
      let focused = false;

      const focusInput = () => {
        if (cancelled || focused) return;
        focused = true;
        ref.current?.focus();
      };

      if (Platform.OS === 'ios') {
        // Prefer transitionStart; mount often lands after it has fired, so also
        // focus on the next frame while the push is still running.
        const unsub = navigation.addListener(
          'transitionStart' as never,
          ((e: TransitionEvent) => {
            if (!e.data?.closing) focusInput();
          }) as never,
        );
        const raf = requestAnimationFrame(focusInput);
        return () => {
          cancelled = true;
          cancelAnimationFrame(raf);
          unsub();
        };
      }

      // Android: wait for the transition to finish, then focus.
      const unsub = navigation.addListener(
        'transitionEnd' as never,
        ((e: TransitionEvent) => {
          if (e.data?.closing) return;
          requestAnimationFrame(focusInput);
        }) as never,
      );
      // replace / no animation — still show the IME.
      const fallback = setTimeout(() => {
        requestAnimationFrame(focusInput);
      }, 50);

      return () => {
        cancelled = true;
        clearTimeout(fallback);
        unsub();
      };
    }, [enabled, navigation]),
  );

  return ref;
}
