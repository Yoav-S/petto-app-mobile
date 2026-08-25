import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  UIManager,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ScrollView,
  type TextInputFocusEventData,
} from 'react-native';
import { useKeyboardBottomOffset } from '@/components/ui/GlobalKeyboardDoneButton';

/** Done chip (40) + vertical padding around it — keep focused fields clear of it. */
const DONE_CHIP_CLEARANCE = 56;
/** Small breathing room above the keyboard / Done chip. */
const FOCUS_GAP = 12;

/**
 * Exact keyboard-aware scroll helpers:
 * - paddingBottom grows by the measured keyboard height (+ Done chip when open)
 * - on focus, scrolls only as far as needed so the field sits in the visible area
 */
export function useKeyboardAwareScroll(basePaddingBottom = 24) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const keyboardOffset = useKeyboardBottomOffset();
  const [paddingBottom, setPaddingBottom] = useState(basePaddingBottom);

  useEffect(() => {
    // Parent views should absorb the keyboard height; we only reserve Done-chip clearance.
    const extra = keyboardOffset > 0 ? DONE_CHIP_CLEARANCE : 0;
    setPaddingBottom(basePaddingBottom + extra);
  }, [basePaddingBottom, keyboardOffset]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const onInputFocus = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const target = e.nativeEvent.target;
      if (target == null || !scrollRef.current) return;

      const run = () => {
        UIManager.measureInWindow(target as number, (_x, inputY, _w, inputH) => {
          if (!Number.isFinite(inputY) || !Number.isFinite(inputH)) return;
          const winH = Dimensions.get('window').height;
          const keyboard = keyboardOffset > 0 ? keyboardOffset : 0;
          const visibleBottom =
            winH - keyboard - (keyboard > 0 ? DONE_CHIP_CLEARANCE : 0) - FOCUS_GAP;
          const fieldBottom = inputY + inputH;

          if (fieldBottom <= visibleBottom && inputY >= FOCUS_GAP) return;

          const delta = fieldBottom - visibleBottom;
          const nextY = Math.max(0, scrollYRef.current + delta);
          scrollRef.current?.scrollTo({ y: nextY, animated: true });
        });
      };

      requestAnimationFrame(() => {
        setTimeout(run, 60);
      });
    },
    [keyboardOffset],
  );

  return {
    scrollRef,
    keyboardOffset,
    paddingBottom,
    onScroll,
    onInputFocus,
  };
}
