import { useCallback, useRef } from 'react';
import { InteractionManager, type TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Focus a TextInput after the navigation transition finishes.
 * Native `autoFocus` races the push animation and makes the keyboard
 * appear to jump in from off-screen (FAB → create flows).
 */
export function useDeferredFocus(enabled: boolean, afterMs = 80) {
  const ref = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      let cancelled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const task = InteractionManager.runAfterInteractions(() => {
        timeout = setTimeout(() => {
          if (!cancelled) ref.current?.focus();
        }, afterMs);
      });

      return () => {
        cancelled = true;
        if (timeout) clearTimeout(timeout);
        // RN returns a cancelable promise-like / handle depending on version.
        const maybe = task as { cancel?: () => void };
        maybe.cancel?.();
      };
    }, [afterMs, enabled]),
  );

  return ref;
}
