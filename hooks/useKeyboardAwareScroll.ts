import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  Dimensions,
  Keyboard,
  UIManager,
  type EmitterSubscription,
  type KeyboardEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ScrollView,
  type TextInputFocusEventData,
  type TextInputProps,
  type View,
} from 'react-native';
import {
  KEYBOARD_DONE_BAR_HEIGHT,
  useKeyboardBottomOffset,
} from '@/components/ui/keyboardUtils';

/** Shared TextInput onFocus handler for keyboard-aware screens. */
export type TextFieldFocusHandler = NonNullable<TextInputProps['onFocus']>;

const FOCUS_CLEARANCE = KEYBOARD_DONE_BAR_HEIGHT;
const FOCUS_GAP = 12;
const FOCUS_SCROLL_DELAY_MS = 80;

interface UseKeyboardAwareScrollOptions {
  /** Bottom control (e.g. delete) — adds invisible trailing scroll room when keyboard is open. */
  bottomAnchorRef?: RefObject<View | null>;
  /** When false, focus does not auto-scroll (layout stays put; user scrolls manually). */
  autoScrollOnFocus?: boolean;
}

function focusEventTarget(
  e: Parameters<NonNullable<TextInputProps['onFocus']>>[0],
): number | null {
  if (e && typeof e === 'object' && 'nativeEvent' in e) {
    const native = (e as NativeSyntheticEvent<TextInputFocusEventData>).nativeEvent;
    return native?.target ?? null;
  }
  if (e && typeof e === 'object' && 'target' in e) {
    const target = (e as { target?: number }).target;
    return typeof target === 'number' ? target : null;
  }
  return null;
}

function keyboardHeightFromEvent(e: KeyboardEvent): number {
  const winH = Dimensions.get('window').height;
  const screenY = e.endCoordinates?.screenY;
  if (typeof screenY === 'number') {
    return Math.max(0, Math.round(winH - screenY));
  }
  return Math.max(0, Math.round(e.endCoordinates?.height ?? 0));
}

/**
 * Keyboard-aware scroll helpers for plain ScrollView screens.
 * Layout padding stays constant; extra scroll extent is added only as a
 * trailing spacer when the keyboard is open (no visible gap under content).
 */
export function useKeyboardAwareScroll(
  basePaddingBottom = 24,
  options: UseKeyboardAwareScrollOptions = {},
): {
  scrollRef: RefObject<ScrollView | null>;
  keyboardOffset: number;
  contentPaddingBottom: number;
  keyboardScrollRoom: number;
  paddingBottom: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onInputFocus: TextFieldFocusHandler;
} {
  const { bottomAnchorRef, autoScrollOnFocus = true } = options;
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const keyboardOffset = useKeyboardBottomOffset();
  const keyboardShowSub = useRef<EmitterSubscription | null>(null);
  const [keyboardScrollRoom, setKeyboardScrollRoom] = useState(0);

  const contentPaddingBottom = basePaddingBottom;

  useEffect(() => {
    return () => {
      keyboardShowSub.current?.remove();
      keyboardShowSub.current = null;
    };
  }, []);

  useEffect(() => {
    if (keyboardOffset <= 0 || !bottomAnchorRef?.current) {
      setKeyboardScrollRoom(0);
      return;
    }

    let cancelled = false;
    const measure = () => {
      bottomAnchorRef.current?.measureInWindow((_x, y, _w, h) => {
        if (cancelled || !Number.isFinite(y) || !Number.isFinite(h) || h <= 0) return;
        const winH = Dimensions.get('window').height;
        const keyboardTop = winH - keyboardOffset;
        const doneTop = keyboardTop - KEYBOARD_DONE_BAR_HEIGHT;
        const anchorBottom = y + h;
        const needed = Math.max(0, Math.round(anchorBottom - doneTop + scrollYRef.current));
        setKeyboardScrollRoom(needed);
      });
    };

    const t = setTimeout(measure, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [bottomAnchorRef, keyboardOffset]);

  const scrollFocusedIntoView = useCallback((target: number, keyboard: number) => {
    if (!scrollRef.current) return;
    UIManager.measureInWindow(target, (_x, inputY, _w, inputH) => {
      if (!Number.isFinite(inputY) || !Number.isFinite(inputH)) return;
      const winH = Dimensions.get('window').height;
      const visibleBottom =
        winH - keyboard - (keyboard > 0 ? FOCUS_CLEARANCE : 0) - FOCUS_GAP;
      const fieldBottom = inputY + inputH;

      if (fieldBottom <= visibleBottom && inputY >= FOCUS_GAP) return;

      const delta = fieldBottom - visibleBottom;
      const nextY = Math.max(0, scrollYRef.current + delta);
      scrollRef.current?.scrollTo({ y: nextY, animated: true });
    });
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const onInputFocus: TextFieldFocusHandler = useCallback(
    (e) => {
      if (!autoScrollOnFocus) return;

      const target = focusEventTarget(e);
      if (target == null) return;

      keyboardShowSub.current?.remove();
      keyboardShowSub.current = null;

      const runScroll = (keyboard: number) => {
        setTimeout(() => scrollFocusedIntoView(target, keyboard), FOCUS_SCROLL_DELAY_MS);
      };

      if (keyboardOffset > 0) {
        runScroll(keyboardOffset);
        return;
      }

      keyboardShowSub.current = Keyboard.addListener('keyboardDidShow', (ev) => {
        keyboardShowSub.current?.remove();
        keyboardShowSub.current = null;
        runScroll(keyboardHeightFromEvent(ev));
      });
    },
    [autoScrollOnFocus, keyboardOffset, scrollFocusedIntoView],
  );

  return {
    scrollRef,
    keyboardOffset,
    contentPaddingBottom,
    keyboardScrollRoom,
    /** @deprecated Use contentPaddingBottom */
    paddingBottom: contentPaddingBottom,
    onScroll,
    onInputFocus,
  };
}
