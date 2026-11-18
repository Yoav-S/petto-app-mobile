import { useEffect, useRef } from 'react';
import { Keyboard, Platform, type TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type TransitionEvent = {
  data?: { closing?: boolean };
};

/** iOS: frames to wait for keyboardWillShow before treating a focus as dropped. */
const IOS_CONFIRM_FRAMES = 3;
const IOS_MAX_ATTEMPTS = 6;
/** Hard stop (~1s) in case the input never mounts. */
const IOS_MAX_FRAMES = 60;

/**
 * Android: slide_from_bottom runs 500ms (plugins/withCreateScreenAnimDuration)
 * while the IME rises faster. Starting the IME this much later makes both
 * land together.
 */
const ANDROID_FOCUS_DELAY_MS = 250;

/**
 * Focus a create-flow TextInput as the screen slides up, so the keyboard
 * arrives with it.
 *
 * An early focus can be dropped natively while the screen is still being
 * attached, yet RN then believes the input is focused and ignores further
 * focus() calls — the keyboard only appeared later, or not at all. So:
 * - iOS: focus on mount — while the modal presents, so UIKit animates the
 *   keyboard with it — and confirm via keyboardWillShow; if it never comes,
 *   blur + refocus a few frames later.
 * - Android: focus ANDROID_FOCUS_DELAY_MS after transitionStart; retry once on
 *   transitionEnd if the input lost focus.
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
      tick();

      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        showSub.remove();
      };
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const focusInput = () => {
      if (cancelled) return;
      const input = ref.current;
      if (!input || input.isFocused()) return;
      input.focus();
    };
    const scheduleFocus = (delay: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(focusInput, delay);
    };

    // Fallback if transitionStart already fired before this effect subscribed.
    scheduleFocus(ANDROID_FOCUS_DELAY_MS + 16);
    let started = false;
    const unsubStart = navigation.addListener(
      'transitionStart' as never,
      ((e: TransitionEvent) => {
        if (e.data?.closing || started) return;
        started = true;
        scheduleFocus(ANDROID_FOCUS_DELAY_MS);
      }) as never,
    );
    const unsubEnd = navigation.addListener(
      'transitionEnd' as never,
      ((e: TransitionEvent) => {
        if (e.data?.closing) return;
        raf = requestAnimationFrame(focusInput);
      }) as never,
    );

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(raf);
      unsubStart();
      unsubEnd();
    };
    // Once per mount: arriving from outside, not on every refocus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return ref;
}
