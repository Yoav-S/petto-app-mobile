import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Longer than the slide/fade transitions, so a refresh never re-renders mid-animation. */
const AFTER_TRANSITION_MS = 450;

/**
 * Background refresh when the user comes back to a screen. Skips the first
 * focus (the mount already loads) and waits for the transition to finish.
 * `refresh` should be cheap when nothing is stale.
 */
export function useFocusRefresh(refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const firstFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return;
      }
      const timer = setTimeout(() => refreshRef.current(), AFTER_TRANSITION_MS);
      return () => clearTimeout(timer);
    }, []),
  );
}
