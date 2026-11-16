import { useCallback, useRef } from 'react';
import { type TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';

type TransitionEvent = {
  data?: { closing?: boolean };
};

/** Longer than a native push, so the fallback never focuses mid-slide. */
const NO_TRANSITION_FALLBACK_MS = 600;

/**
 * Focus a create-flow TextInput once the native stack push has finished.
 *
 * Focusing while a horizontal push is still running makes iOS attach the
 * keyboard to the transition, so it slides in from the side with the screen
 * and lands late. After transitionEnd it rises from the bottom as usual.
 * Do not use TextInput `autoFocus` with a push for the same reason.
 */
export function useDeferredFocus(enabled: boolean) {
  const ref = useRef<TextInput>(null);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      let cancelled = false;
      let focused = false;
      let raf = 0;

      const focusInput = () => {
        if (cancelled || focused) return;
        focused = true;
        ref.current?.focus();
      };

      const unsub = navigation.addListener(
        'transitionEnd' as never,
        ((e: TransitionEvent) => {
          if (e.data?.closing) return;
          raf = requestAnimationFrame(focusInput);
        }) as never,
      );
      // replace / no animation: transitionEnd may never fire.
      const fallback = setTimeout(focusInput, NO_TRANSITION_FALLBACK_MS);

      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        clearTimeout(fallback);
        unsub();
      };
    }, [enabled, navigation]),
  );

  return ref;
}
