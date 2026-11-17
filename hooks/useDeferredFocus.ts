import { useEffect, useRef } from 'react';
import { Keyboard, Platform, type TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type TransitionEvent = {
  data?: { closing?: boolean };
};

/** iOS: frames to wait for keyboardWillShow before treating a focus as dropped. */
const IOS_CONFIRM_FRAMES = 6;
const IOS_MAX_ATTEMPTS = 4;
/** Hard stop (~1s) in case the input never mounts. */
const IOS_MAX_FRAMES = 60;

/**
 * Focus a create-flow TextInput on the first frame of the push. Create
 * screens slide up from the bottom, so the keyboard rises with the screen.
 *
 * An early focus can be dropped natively while the screen is still being
 * attached, yet RN then believes the input is focused and ignores further
 * focus() calls — the keyboard only appeared later, or not at all. So:
 * - iOS: confirm via keyboardWillShow; if it never comes, blur + refocus.
 * - Android: retry once on transitionEnd if the input lost focus.
 *
 * Runs once per mount (arriving from outside), not when returning to the
 * screen. Do not use TextInput `autoFocus` with a push.
 */
export function useDeferredFocus(enabled: boolean) {
  const ref = useRef<TextInput>(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let raf = 0;

    if (Platform.OS === 'ios') {
      let shown = false;
      let attempts = 0;
      let wait = 0;
      let frames = 0;
      const showSub = Keyboard.addListener('keyboardWillShow', () => {
        shown = true;
      });

      const tick = () => {
        if (cancelled || shown || frames >= IOS_MAX_FRAMES) return;
        frames += 1;
        const input = ref.current;
        if (wait > 0) {
          wait -= 1;
        } else if (input) {
          if (attempts >= IOS_MAX_ATTEMPTS) return;
          if (input.isFocused()) input.blur();
          input.focus();
          attempts += 1;
          wait = IOS_CONFIRM_FRAMES;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        showSub.remove();
      };
    }

    const focusInput = () => {
      if (cancelled) return;
      const input = ref.current;
      if (!input || input.isFocused()) return;
      input.focus();
    };
    raf = requestAnimationFrame(focusInput);
    const unsubEnd = navigation.addListener(
      'transitionEnd' as never,
      ((e: TransitionEvent) => {
        if (e.data?.closing) return;
        raf = requestAnimationFrame(focusInput);
      }) as never,
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      unsubEnd();
    };
    // Once per mount: arriving from outside, not on every refocus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return ref;
}
